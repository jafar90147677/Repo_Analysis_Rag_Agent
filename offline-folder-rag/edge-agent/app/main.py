import hashlib
import os
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse


TOKEN_HEADER = "X-LOCAL-TOKEN"
TOKEN_FILENAME = "agent_token.txt"


def _index_dir() -> Path:
    env_dir = os.environ.get("RAG_INDEX_DIR")
    if env_dir:
        return Path(env_dir)
    user_profile = os.environ.get("USERPROFILE", "")
    return Path(user_profile) / ".offline_rag_index"


def _token_path() -> Path:
    return _index_dir() / TOKEN_FILENAME


def _get_or_create_token() -> str:
    token_file = _token_path()
    token_file.parent.mkdir(parents=True, exist_ok=True)
    if token_file.exists():
        return token_file.read_text(encoding="utf-8").strip()
    token = hashlib.sha256(os.urandom(32)).hexdigest()
    token_file.write_text(token, encoding="utf-8")
    return token


def _error_response(error_code: str, message: str, remediation: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error_code": error_code,
            "message": message,
            "remediation": remediation,
        },
    )


def _verify_token(token: str | None) -> None:
    expected = _get_or_create_token()
    if not token or token != expected:
        raise HTTPException(
            status_code=401,
            detail={
                "error_code": "INVALID_TOKEN",
                "message": "Invalid or missing token.",
                "remediation": "Ensure X-LOCAL-TOKEN matches agent_token.txt.",
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

    @app.get("/health")
    async def health(x_local_token: str | None = Header(default=None, alias=TOKEN_HEADER)):
        _verify_token(x_local_token)
        return {"status": "ok"}

    return app


app = create_app()
