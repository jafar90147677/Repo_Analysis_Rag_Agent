from fastapi import Header, HTTPException
from .token_store import get_or_create_token

async def verify_token(x_local_token: str = Header(None, alias="X-LOCAL-TOKEN")):
    valid_token = get_or_create_token()
    if not x_local_token or x_local_token != valid_token:
    raise HTTPException(
        status_code=401,
        detail={
            "error_code": "INVALID_TOKEN",
            "message": "The provided token is missing or invalid.",
            "remediation": "Please provide a valid X-LOCAL-TOKEN in the request headers.",
        }
    )
    return x_local_token
