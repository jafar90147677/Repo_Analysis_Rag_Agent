from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse

from .api import routes as api_routes
from .security import TOKEN_HEADER, verify_token


def _error_response(error_code: str, message: str, remediation: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error_code": error_code,
            "message": message,
            "remediation": remediation,
        },
    )


def create_app() -> FastAPI:
    app = FastAPI()

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_, exc: HTTPException):
        if isinstance(exc.detail, dict) and "error_code" in exc.detail:
            return _error_response(
                exc.detail["error_code"],
                exc.detail["message"],
                exc.detail["remediation"],
                exc.status_code,
            )
        return _error_response(
            "UNKNOWN_ERROR",
            "Unhandled error.",
            "Retry the request.",
            exc.status_code,
        )

    app.include_router(api_routes.router)

    @app.get("/health")
    async def health(x_local_token: str | None = Header(default=None, alias=TOKEN_HEADER)):
        verify_token(x_local_token)
        return {"status": "ok"}

    return app


app = create_app()
