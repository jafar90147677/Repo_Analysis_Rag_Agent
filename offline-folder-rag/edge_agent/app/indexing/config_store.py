import os
from typing import Dict, Any

class ConfigStore:
    """Store for indexing configuration."""
    
    DEFAULT_CONFIG = {
        "max_file_size_mb": 5,
        "chunk_size": 1000,
        "chunk_overlap": 200,
    }

    ALLOWED_MAX_FILE_SIZE_MB = {5, 10, 20}

    def __init__(self, config: Dict[str, Any] = None):
        self._config = self.DEFAULT_CONFIG.copy()
        if config:
            if "max_file_size_mb" in config:
                val = config["max_file_size_mb"]
                if val not in self.ALLOWED_MAX_FILE_SIZE_MB:
                    raise ValueError(f"max_file_size_mb must be one of {self.ALLOWED_MAX_FILE_SIZE_MB}")
            self._config.update(config)

    @property
    def max_file_size_mb(self) -> int:
        return self._config.get("max_file_size_mb", 5)

    @property
    def chunk_size(self) -> int:
        return self._config.get("chunk_size", 1000)

    @property
    def chunk_overlap(self) -> int:
        return self._config.get("chunk_overlap", 200)
