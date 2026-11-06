from __future__ import annotations

import time
from typing import Any

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa

TEST_ISSUER = "https://worthout-test.clerk.accounts.dev"
TEST_AUDIENCE = "worthout-api"
TEST_JWKS_URL = "https://worthout-test.clerk.accounts.dev/.well-known/jwks.json"
TEST_KID = "test-key-1"


def mint_token(
    private_key: rsa.RSAPrivateKey,
    *,
    sub: str = "user_test_sub",
    issuer: str = TEST_ISSUER,
    audience: str = TEST_AUDIENCE,
    exp_delta: int = 300,
    nbf_delta: int = -30,
    iat_delta: int = -30,
    kid: str = TEST_KID,
    algorithm: str = "RS256",
    extra_claims: dict[str, Any] | None = None,
) -> str:
    now = int(time.time())
    payload: dict[str, Any] = {
        "sub": sub,
        "iss": issuer,
        "aud": audience,
        "iat": now + iat_delta,
        "nbf": now + nbf_delta,
        "exp": now + exp_delta,
    }
    if extra_claims:
        payload.update(extra_claims)
    headers = {"kid": kid, "alg": algorithm}
    return jwt.encode(payload, private_key, algorithm=algorithm, headers=headers)
