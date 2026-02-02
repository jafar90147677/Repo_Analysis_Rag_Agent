import logging
import re
from ..security.token_store import get_or_create_token

class TokenFilter(logging.Filter):
    def filter(self, record):
        token = get_or_create_token()
        if isinstance(record.msg, str):
            record.msg = record.msg.replace(token, "[REDACTED_TOKEN]")
        return True

def setup_logger():
    logger = logging.getLogger("edge_agent")
    logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    
    logger.addFilter(TokenFilter())
    logger.addHandler(handler)
    
    return logger

logger = setup_logger()


def get_component_logger(component: str):
    """Return a logger for the given component (backwards-compatible; same as main logger if component is 'edge_agent')."""
    if component == "edge_agent":
        return logger
    return logging.getLogger(f"edge_agent.{component}")
