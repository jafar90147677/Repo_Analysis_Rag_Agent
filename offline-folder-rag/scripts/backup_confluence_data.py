"""Zip confluence_data/ to a timestamped archive (safe, no destructive ops)."""
from __future__ import annotations

import zipfile
from pathlib import Path
from datetime import datetime

REPO_ROOT = Path(__file__).resolve().parents[2]
CONFLUENCE_DATA = REPO_ROOT / "confluence_data"
BACKUP_DIR = REPO_ROOT / "confluence_data" / "backups"


def main() -> None:
    if not CONFLUENCE_DATA.exists():
        return
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_path = BACKUP_DIR / f"confluence_data_{ts}.zip"
    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in CONFLUENCE_DATA.rglob("*"):
            if f.is_file() and "backups" not in f.parts:
                zf.write(f, f.relative_to(CONFLUENCE_DATA.parent))
    print("Backup written:", archive_path)


if __name__ == "__main__":
    main()
