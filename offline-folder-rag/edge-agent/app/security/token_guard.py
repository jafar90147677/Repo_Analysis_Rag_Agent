from fastapi import Header, HTTPException
from app.security.token_store import get_or_create_token

TOKEN_HEADER = "X-LOCAL-TOKEN"

async def verify_token(x_local_token: str | None = Header(default=None, alias=TOKEN_HEADER)):
    expected = get_or_create_token()
    if not x_local_token or x_local_token != expected:
        raise HTTPException(
            status_code=401,
            detail={
                "error_code": "INVALID_TOKEN",
                "message": "Invalid or missing token.",
                "remediation": "Ensure X-LOCAL-TOKEN matches agent_token.txt.",
            },
        )
    return x_local_token
