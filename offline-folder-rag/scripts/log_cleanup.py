"""Rotate logs in logs/**/archive/ (simple move by date; safe)."""
from __future__ import annotations

import shutil
from pathlib import Path
from datetime import datetime

REPO_ROOT = Path(__file__).resolve().parents[2]
LOGS_DIR = REPO_ROOT / "logs"


def main() -> None:
    if not LOGS_DIR.exists():
        return
    archive_base = LOGS_DIR / "archive"
    archive_base.mkdir(parents=True, exist_ok=True)
    date_suffix = datetime.now().strftime("%Y-%m-%d")
    for log_file in LOGS_DIR.rglob("*.log"):
        if "archive" in log_file.parts:
            continue
        try:
            dest = archive_base / f"{log_file.stem}_{date_suffix}.log"
            shutil.copy2(log_file, dest)
        except OSError:
            pass


if __name__ == "__main__":
    main()
