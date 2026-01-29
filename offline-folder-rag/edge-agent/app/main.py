<<<<<<< HEAD
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse

from .api import routes as api_routes
from .security import TOKEN_HEADER, verify_token

=======
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.api.routes import router as api_router
>>>>>>> e448c784905bae6196d3b0129695d7f3ad6d9d5a

def _error_response(error_code: str, message: str, remediation: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error_code": error_code,
            "message": message,
            "remediation": remediation,
        },
    )

<<<<<<< HEAD

=======
>>>>>>> e448c784905bae6196d3b0129695d7f3ad6d9d5a
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

<<<<<<< HEAD
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_, exc: RequestValidationError):
        return _error_response(
            "INVALID_INPUT",
            f"Validation error: {exc.errors()}",
            "Ensure the request body matches the expected schema.",
            400,
        )

=======
<<<<<<< HEAD
    app.include_router(api_routes.router)

    @app.get("/health")
    async def health(x_local_token: str | None = Header(default=None, alias=TOKEN_HEADER)):
        verify_token(x_local_token)
        return {"status": "ok"}
=======
>>>>>>> 7dbddf924de6f1b9609c43aba2d154d30fde5044
    app.include_router(api_router)
>>>>>>> e448c784905bae6196d3b0129695d7f3ad6d9d5a

    return app

app = create_app()
