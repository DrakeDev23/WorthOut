from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import (
    ApiError,
    api_error_handler,
    validation_error_handler,
)
from app.routers import exercises, health, routines, users, workouts
from app.services.ownership import OwnershipViolation, ownership_violation_handler


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        debug=settings.DEBUG,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(ApiError, api_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(OwnershipViolation, ownership_violation_handler)

    app.include_router(health.router)
    app.include_router(users.router)
    app.include_router(exercises.router)
    app.include_router(routines.router)
    app.include_router(workouts.router)

    return app


app = create_app()
