from __future__ import annotations

import time
from collections.abc import Iterator
from typing import Any

import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from jwt.algorithms import RSAAlgorithm

from app.core.clerk_jwt import (
    ClerkJwtVerifier,
    JwksCache,
    reset_clerk_jwt_verifier_for_tests,
)
from app.core.config import settings
from tests.jwt_helpers import TEST_AUDIENCE, TEST_ISSUER, TEST_JWKS_URL, TEST_KID


@pytest.fixture
def rsa_keypair() -> tuple[rsa.RSAPrivateKey, dict[str, Any]]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_numbers = private_key.public_key().public_numbers()

    def _b64int(value: int) -> str:
        import jwt as pyjwt

        length = (value.bit_length() + 7) // 8
        return pyjwt.utils.base64url_encode(value.to_bytes(length, "big")).decode(
            "ascii"
        )

    jwk = {
        "kty": "RSA",
        "kid": TEST_KID,
        "use": "sig",
        "alg": "RS256",
        "n": _b64int(public_numbers.n),
        "e": _b64int(public_numbers.e),
    }
    return private_key, jwk


@pytest.fixture
def clerk_settings(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    monkeypatch.setattr(settings, "CLERK_ISSUER", TEST_ISSUER)
    monkeypatch.setattr(settings, "CLERK_AUDIENCE", TEST_AUDIENCE)
    monkeypatch.setattr(settings, "CLERK_JWKS_URL", TEST_JWKS_URL)
    monkeypatch.setattr(settings, "CLERK_JWKS_CACHE_TTL_SECONDS", 3600)
    monkeypatch.setattr(settings, "CLERK_JWT_CLOCK_SKEW_SECONDS", 0)
    yield


@pytest.fixture
def configured_verifier(
    rsa_keypair: tuple[rsa.RSAPrivateKey, dict[str, Any]],
    clerk_settings: None,
    monkeypatch: pytest.MonkeyPatch,
) -> Iterator[tuple[ClerkJwtVerifier, rsa.RSAPrivateKey]]:
    _private_key, jwk = rsa_keypair
    cache = JwksCache(ttl_seconds=3600)

    async def fake_refresh(jwks_url: str, *, force: bool = False) -> None:
        assert jwks_url == TEST_JWKS_URL
        if cache.is_fresh and not force:
            return
        cache._keys_by_kid = {TEST_KID: RSAAlgorithm.from_jwk(jwk)}
        cache._fetched_at = time.monotonic()

    monkeypatch.setattr(cache, "refresh", fake_refresh)
    verifier = ClerkJwtVerifier(app_settings=settings, cache=cache)
    reset_clerk_jwt_verifier_for_tests(verifier)
    yield verifier, rsa_keypair[0]
    reset_clerk_jwt_verifier_for_tests()
