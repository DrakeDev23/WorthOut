from typing import Any
from uuid import uuid4

from fastapi import HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
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


async def validation_error_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    request_id = new_request_id()
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_body(
            code="validation_error",
            message="Request validation failed.",
            request_id=request_id,
            details={"errors": jsonable_encoder(exc.errors())},
        ),
    )


def bad_request(
    message: str = "Bad request.", details: dict[str, Any] | None = None
) -> ApiError:
    return ApiError(
        status.HTTP_400_BAD_REQUEST,
        code="bad_request",
        message=message,
        details=details,
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


def forbidden(
    message: str = "Authenticated but not permitted.",
    details: dict[str, Any] | None = None,
) -> ApiError:
    return ApiError(
        status.HTTP_403_FORBIDDEN,
        code="forbidden",
        message=message,
        details=details,
    )


def not_found(
    message: str = "Resource not found.", details: dict[str, Any] | None = None
) -> ApiError:
    return ApiError(
        status.HTTP_404_NOT_FOUND,
        code="not_found",
        message=message,
        details=details,
    )


def conflict(
    message: str = "Conflict.", details: dict[str, Any] | None = None
) -> ApiError:
    return ApiError(
        status.HTTP_409_CONFLICT,
        code="conflict",
        message=message,
        details=details,
    )


def unprocessable_entity(
    message: str = "Unprocessable entity.", details: dict[str, Any] | None = None
) -> ApiError:
    return ApiError(
        status.HTTP_422_UNPROCESSABLE_ENTITY,
        code="validation_error",
        message=message,
        details=details,
    )


def service_unavailable(
    message: str = "Authentication dependency is temporarily unavailable.",
) -> ApiError:
    return ApiError(
        status.HTTP_503_SERVICE_UNAVAILABLE,
        code="service_unavailable",
        message=message,
    )
