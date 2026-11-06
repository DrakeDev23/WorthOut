"""Clerk JWT verification with JWKS caching and key-rotation handling."""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Any

import httpx
import jwt
from jwt.algorithms import RSAAlgorithm

from app.core.config import Settings, settings
from app.core.errors import service_unavailable, unauthorized

logger = logging.getLogger(__name__)

ALLOWED_ALGORITHMS = ("RS256",)


class ClerkTokenError(Exception):
    """Raised when a presented token fails authentication checks."""


class ClerkJwksError(Exception):
    """Raised when JWKS cannot be fetched or used for verification."""


@dataclass(frozen=True)
class VerifiedClerkClaims:
    sub: str
    email: str | None = None
    display_name: str | None = None
    raw: dict[str, Any] | None = None


class JwksCache:
    """In-memory JWKS cache with TTL and forced refresh on unknown kid."""

    def __init__(self, *, ttl_seconds: int) -> None:
        self._ttl_seconds = ttl_seconds
        self._keys_by_kid: dict[str, Any] = {}
        self._fetched_at: float | None = None
        self._lock = asyncio.Lock()

    @property
    def is_fresh(self) -> bool:
        if self._fetched_at is None:
            return False
        return (time.monotonic() - self._fetched_at) < self._ttl_seconds

    def get_key(self, kid: str) -> Any | None:
        return self._keys_by_kid.get(kid)

    async def refresh(self, jwks_url: str, *, force: bool = False) -> None:
        async with self._lock:
            if self.is_fresh and not force:
                return
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(jwks_url)
                    response.raise_for_status()
                    payload = response.json()
            except (httpx.HTTPError, ValueError, TypeError) as exc:
                raise ClerkJwksError("Unable to fetch Clerk JWKS.") from exc

            keys = payload.get("keys")
            if not isinstance(keys, list) or not keys:
                raise ClerkJwksError("Clerk JWKS payload did not contain keys.")

            parsed: dict[str, Any] = {}
            for jwk in keys:
                if not isinstance(jwk, dict):
                    continue
                kid = jwk.get("kid")
                kty = jwk.get("kty")
                alg = jwk.get("alg", "RS256")
                if not kid or kty != "RSA" or alg not in ALLOWED_ALGORITHMS:
                    continue
                try:
                    parsed[str(kid)] = RSAAlgorithm.from_jwk(jwk)
                except (ValueError, TypeError, jwt.InvalidKeyError):
                    logger.warning("Skipping unusable JWKS key kid=%s", kid)
                    continue

            if not parsed:
                raise ClerkJwksError("Clerk JWKS contained no usable RSA keys.")

            self._keys_by_kid = parsed
            self._fetched_at = time.monotonic()


class ClerkJwtVerifier:
    def __init__(
        self, app_settings: Settings | None = None, cache: JwksCache | None = None
    ) -> None:
        self.settings = app_settings or settings
        self.cache = cache or JwksCache(
            ttl_seconds=self.settings.CLERK_JWKS_CACHE_TTL_SECONDS
        )

    def _require_config(self) -> tuple[str, str, str]:
        issuer = self.settings.CLERK_ISSUER.strip()
        audience = self.settings.CLERK_AUDIENCE.strip()
        jwks_url = self.settings.clerk_jwks_url.strip()
        if not issuer or not audience or not jwks_url:
            raise ClerkJwksError("Clerk JWT verification is not configured.")
        return issuer, audience, jwks_url

    async def _resolve_signing_key(self, token: str, jwks_url: str) -> Any:
        try:
            header = jwt.get_unverified_header(token)
        except jwt.exceptions.DecodeError as exc:
            raise ClerkTokenError("Malformed JWT header.") from exc

        alg = header.get("alg")
        if alg not in ALLOWED_ALGORITHMS:
            raise ClerkTokenError("JWT signing algorithm is not allowed.")

        kid = header.get("kid")
        if not kid or not isinstance(kid, str):
            raise ClerkTokenError("JWT header is missing kid.")

        if not self.cache.is_fresh:
            await self.cache.refresh(jwks_url)

        key = self.cache.get_key(kid)
        if key is not None:
            return key

        # Key rotation: force a JWKS refresh once for an unknown kid.
        await self.cache.refresh(jwks_url, force=True)
        key = self.cache.get_key(kid)
        if key is None:
            raise ClerkTokenError("JWT signing key was not found in JWKS.")
        return key

    async def verify(self, token: str) -> VerifiedClerkClaims:
        try:
            issuer, audience, jwks_url = self._require_config()
            signing_key = await self._resolve_signing_key(token, jwks_url)
            claims = jwt.decode(
                token,
                signing_key,
                algorithms=list(ALLOWED_ALGORITHMS),
                issuer=issuer,
                audience=audience,
                leeway=self.settings.CLERK_JWT_CLOCK_SKEW_SECONDS,
                options={
                    "require": ["exp", "iat", "nbf", "sub", "iss", "aud"],
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_nbf": True,
                    "verify_iat": True,
                    "verify_aud": True,
                    "verify_iss": True,
                },
            )
        except ClerkJwksError:
            raise
        except ClerkTokenError:
            raise
        except jwt.ExpiredSignatureError as exc:
            raise ClerkTokenError("JWT has expired.") from exc
        except jwt.InvalidAudienceError as exc:
            raise ClerkTokenError("JWT audience is invalid.") from exc
        except jwt.InvalidIssuerError as exc:
            raise ClerkTokenError("JWT issuer is invalid.") from exc
        except jwt.InvalidTokenError as exc:
            raise ClerkTokenError("JWT verification failed.") from exc

        sub = claims.get("sub")
        if not isinstance(sub, str) or not sub.strip():
            raise ClerkTokenError("JWT subject claim is missing.")

        email = claims.get("email")
        display_name = claims.get("name") or claims.get("full_name")
        return VerifiedClerkClaims(
            sub=sub.strip(),
            email=email.strip() if isinstance(email, str) and email.strip() else None,
            display_name=(
                display_name.strip()
                if isinstance(display_name, str) and display_name.strip()
                else None
            ),
            raw=claims,
        )


_verifier = ClerkJwtVerifier()


def get_clerk_jwt_verifier() -> ClerkJwtVerifier:
    return _verifier


def reset_clerk_jwt_verifier_for_tests(
    verifier: ClerkJwtVerifier | None = None,
) -> ClerkJwtVerifier:
    global _verifier
    _verifier = verifier or ClerkJwtVerifier()
    return _verifier


async def verify_clerk_bearer_token(token: str) -> VerifiedClerkClaims:
    try:
        return await get_clerk_jwt_verifier().verify(token)
    except ClerkJwksError as exc:
        logger.warning("Clerk JWKS verification unavailable: %s", exc)
        raise service_unavailable(str(exc)) from exc
    except ClerkTokenError as exc:
        raise unauthorized(str(exc)) from exc
