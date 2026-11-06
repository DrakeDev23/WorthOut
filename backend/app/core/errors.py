from typing import Any
from uuid import uuid4

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


def new_request_id() -> str:
    return f"req_{uuid4().hex}"


def error_body(
    *,
    code: str,
    message: str,
    request_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "request_id": request_id or new_request_id(),
            "details": details or {},
        }
    }


class ApiError(HTTPException):
    def __init__(
        self,
        status_code: int,
        *,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(status_code=status_code, detail=message, headers=headers)


async def api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
    request_id = new_request_id()
    return JSONResponse(
        status_code=exc.status_code,
        content=error_body(
            code=exc.code,
            message=exc.message,
            request_id=request_id,
            details=exc.details,
        ),
        headers=exc.headers,
    )


def unauthorized(
    message: str = "Missing or invalid authentication credentials.",
) -> ApiError:
    return ApiError(
        status.HTTP_401_UNAUTHORIZED,
        code="unauthorized",
        message=message,
        headers={"WWW-Authenticate": "Bearer"},
    )


def service_unavailable(
    message: str = "Authentication dependency is temporarily unavailable.",
) -> ApiError:
    return ApiError(
        status.HTTP_503_SERVICE_UNAVAILABLE,
        code="service_unavailable",
        message=message,
    )
