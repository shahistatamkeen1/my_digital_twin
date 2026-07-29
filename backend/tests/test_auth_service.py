from __future__ import annotations

import pytest

from app.services.auth_service import (
    AuthTokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


@pytest.mark.unit
def test_password_hash_round_trip() -> None:
    password = "test-password-test-password"
    password_hash = hash_password(password)

    assert password_hash != password
    assert verify_password(password, password_hash) is True
    assert verify_password("incorrect-password", password_hash) is False


@pytest.mark.unit
def test_access_and_refresh_tokens_are_type_scoped() -> None:
    access_token = create_access_token(42)
    refresh_token = create_refresh_token(42)

    access_payload = decode_token(access_token, expected_type="access")
    refresh_payload = decode_token(refresh_token, expected_type="refresh")

    assert access_payload.sub == "42"
    assert refresh_payload.sub == "42"
    assert access_payload.type == "access"
    assert refresh_payload.type == "refresh"

    with pytest.raises(AuthTokenError):
        decode_token(access_token, expected_type="refresh")
