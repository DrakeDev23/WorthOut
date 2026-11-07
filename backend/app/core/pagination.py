from __future__ import annotations

import base64
import json
from typing import Any

from app.core.errors import ApiError


def encode_cursor(data: dict[str, Any]) -> str:
    raw = json.dumps(data, default=str)
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("utf-8")


def decode_cursor(cursor_str: str | None) -> dict[str, Any] | None:
    if not cursor_str:
        return None
    try:
        raw = base64.urlsafe_b64decode(cursor_str.encode("utf-8")).decode("utf-8")
        return json.loads(raw)
    except Exception as exc:
        raise ApiError(
            status_code=422,
            code="validation_error",
            message="Invalid pagination cursor.",
        ) from exc
