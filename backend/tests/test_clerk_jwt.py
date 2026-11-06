from __future__ import annotations

import time
from typing import Any
import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from jwt.algorithms import RSAAlgorithm

from app.core.clerk_jwt import (
    ALLOWED_ALGORITHMS,
    ClerkJwksError,
    ClerkJwtVerifier,
    ClerkTokenError,
    JwksCache,
)
from app.core.config import settings
from tests.jwt_helpers import (
    TEST_AUDIENCE,
    TEST_ISSUER,
    TEST_JWKS_URL,
    TEST_KID,
    mint_token,
)


@pytest.mark.asyncio
async def test_valid_token_verifies(
    configured_verifier: tuple[ClerkJwtVerifier, rsa.RSAPrivateKey],
) -> None:
    verifier, private_key = configured_verifier
    token = mint_token(
        private_key,
        sub="user_abc",
        extra_claims={"email": "a@example.com", "name": "Alex"},
    )
    claims = await verifier.verify(token)
    assert claims.sub == "user_abc"
    assert claims.email == "a@example.com"
    assert claims.display_name == "Alex"


@pytest.mark.asyncio
async def test_expired_token_rejected(
    configured_verifier: tuple[ClerkJwtVerifier, rsa.RSAPrivateKey],
) -> None:
    verifier, private_key = configured_verifier
    token = mint_token(private_key, exp_delta=-10)
    with pytest.raises(ClerkTokenError, match="expired"):
        await verifier.verify(token)


@pytest.mark.asyncio
async def test_invalid_issuer_rejected(
    configured_verifier: tuple[ClerkJwtVerifier, rsa.RSAPrivateKey],
) -> None:
    verifier, private_key = configured_verifier
    token = mint_token(private_key, issuer="https://evil.example")
    with pytest.raises(ClerkTokenError, match="issuer"):
        await verifier.verify(token)


@pytest.mark.asyncio
async def test_invalid_audience_rejected(
    configured_verifier: tuple[ClerkJwtVerifier, rsa.RSAPrivateKey],
) -> None:
    verifier, private_key = configured_verifier
    token = mint_token(private_key, audience="other-api")
    with pytest.raises(ClerkTokenError, match="audience"):
        await verifier.verify(token)


@pytest.mark.asyncio
async def test_invalid_signature_rejected(
    configured_verifier: tuple[ClerkJwtVerifier, rsa.RSAPrivateKey],
    rsa_keypair: tuple[rsa.RSAPrivateKey, dict[str, Any]],
) -> None:
    verifier, _ = configured_verifier
    other_key, _ = rsa_keypair
    attacker_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    token = mint_token(attacker_key)
    with pytest.raises(ClerkTokenError):
        await verifier.verify(token)
    del other_key


@pytest.mark.asyncio
async def test_disallowed_algorithm_rejected(
    configured_verifier: tuple[ClerkJwtVerifier, rsa.RSAPrivateKey],
) -> None:
    verifier, private_key = configured_verifier
    token = mint_token(private_key)
    header_alg_token = jwt.encode(
        {
            "sub": "user_test_sub",
            "iss": TEST_ISSUER,
            "aud": TEST_AUDIENCE,
            "iat": int(time.time()) - 30,
            "nbf": int(time.time()) - 30,
            "exp": int(time.time()) + 300,
        },
        key="not-a-real-hmac-secret-key!!!!!!!!",
        algorithm="HS256",
        headers={"kid": TEST_KID},
    )
    assert "HS256" not in ALLOWED_ALGORITHMS
    with pytest.raises(ClerkTokenError, match="algorithm"):
        await verifier.verify(header_alg_token)
    del token
    del private_key


@pytest.mark.asyncio
async def test_missing_configuration_fails_closed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "CLERK_ISSUER", "")
    monkeypatch.setattr(settings, "CLERK_AUDIENCE", "")
    monkeypatch.setattr(settings, "CLERK_JWKS_URL", "")
    verifier = ClerkJwtVerifier(app_settings=settings, cache=JwksCache(ttl_seconds=60))
    with pytest.raises(ClerkJwksError, match="not configured"):
        await verifier.verify("a.b.c")


@pytest.mark.asyncio
async def test_jwks_network_failure_fails_closed(
    rsa_keypair: tuple[rsa.RSAPrivateKey, dict[str, Any]],
    clerk_settings: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    private_key, _ = rsa_keypair
    cache = JwksCache(ttl_seconds=60)

    async def boom(jwks_url: str, *, force: bool = False) -> None:
        raise ClerkJwksError("Unable to fetch Clerk JWKS.")

    monkeypatch.setattr(cache, "refresh", boom)
    verifier = ClerkJwtVerifier(app_settings=settings, cache=cache)
    token = mint_token(private_key)
    with pytest.raises(ClerkJwksError):
        await verifier.verify(token)


@pytest.mark.asyncio
async def test_unknown_kid_triggers_jwks_refresh(
    rsa_keypair: tuple[rsa.RSAPrivateKey, dict[str, Any]],
    clerk_settings: None,
) -> None:
    private_key, jwk = rsa_keypair
    cache = JwksCache(ttl_seconds=3600)
    cache._keys_by_kid = {"other-kid": RSAAlgorithm.from_jwk(jwk)}
    cache._fetched_at = time.monotonic()

    refresh_calls: list[bool] = []

    async def controlled_refresh(jwks_url: str, *, force: bool = False) -> None:
        refresh_calls.append(force)
        if force:
            cache._keys_by_kid = {TEST_KID: RSAAlgorithm.from_jwk(jwk)}
            cache._fetched_at = time.monotonic()

    cache.refresh = controlled_refresh  
    verifier = ClerkJwtVerifier(app_settings=settings, cache=cache)
    token = mint_token(private_key, kid=TEST_KID)
    claims = await verifier.verify(token)
    assert claims.sub == "user_test_sub"
    assert refresh_calls == [True]


@pytest.mark.asyncio
async def test_jwks_http_fetch_parses_keys(
    rsa_keypair: tuple[rsa.RSAPrivateKey, dict[str, Any]],
    clerk_settings: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _private_key, jwk = rsa_keypair
    cache = JwksCache(ttl_seconds=60)

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, Any]:
            return {"keys": [jwk]}

    class FakeClient:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def __aenter__(self) -> FakeClient:
            return self

        async def __aexit__(self, *args: Any) -> None:
            return None

        async def get(self, url: str) -> FakeResponse:
            assert url == TEST_JWKS_URL
            return FakeResponse()

    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)
    await cache.refresh(TEST_JWKS_URL)
    assert cache.get_key(TEST_KID) is not None


@pytest.mark.asyncio
async def test_jwks_http_error_is_fail_closed(
    clerk_settings: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    cache = JwksCache(ttl_seconds=60)

    class FakeClient:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def __aenter__(self) -> FakeClient:
            return self

        async def __aexit__(self, *args: Any) -> None:
            return None

        async def get(self, url: str) -> Any:
            raise httpx.ConnectError("network down")

    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)
    with pytest.raises(ClerkJwksError, match="Unable to fetch"):
        await cache.refresh(TEST_JWKS_URL)
