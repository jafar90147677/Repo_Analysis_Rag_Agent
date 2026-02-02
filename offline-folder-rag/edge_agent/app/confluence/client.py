"""ConfluenceClient using requests (auth: Bearer or Basic)."""
from __future__ import annotations

import base64
from typing import Any

from ..config.confluence_config import ConfluenceSettings


class ConfluenceClient:
    def __init__(self, settings: ConfluenceSettings):
        self.settings = settings
        self._session = None

    def _get_session(self):
        if self._session is None:
            import requests
            self._session = requests.Session()
            self._session.verify = self.settings.CONFLUENCE_VERIFY_SSL
            if self.settings.CONFLUENCE_BEARER_TOKEN:
                self._session.headers["Authorization"] = f"Bearer {self.settings.CONFLUENCE_BEARER_TOKEN}"
            elif self.settings.CONFLUENCE_USER_EMAIL and self.settings.CONFLUENCE_API_TOKEN:
                raw = f"{self.settings.CONFLUENCE_USER_EMAIL}:{self.settings.CONFLUENCE_API_TOKEN}"
                self._session.headers["Authorization"] = "Basic " + base64.b64encode(raw.encode()).decode()
        return self._session

    def _url(self, path: str) -> str:
        base = self.settings.CONFLUENCE_BASE_URL.rstrip("/")
        return f"{base}{path if path.startswith('/') else '/' + path}"

    def health_check(self) -> dict[str, Any]:
        try:
            s = self._get_session()
            r = s.get(self._url("/rest/api/status"), timeout=self.settings.CONFLUENCE_TIMEOUT_SECONDS)
            if r.status_code == 200:
                return {"ok": True, "status": r.json().get("state", "unknown")}
            return {"ok": False, "error": f"HTTP {r.status_code}"}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    def list_spaces(self) -> list[dict]:
        try:
            s = self._get_session()
            r = s.get(
                self._url("/rest/api/space"),
                params={"limit": 50},
                timeout=self.settings.CONFLUENCE_TIMEOUT_SECONDS,
            )
            if r.status_code != 200:
                return []
            data = r.json()
            return data.get("results", [])
        except Exception:
            return []

    def get_page(self, page_id: str) -> dict[str, Any] | None:
        try:
            s = self._get_session()
            r = s.get(
                self._url(f"/rest/api/content/{page_id}"),
                params={"expand": "body.storage,version"},
                timeout=self.settings.CONFLUENCE_TIMEOUT_SECONDS,
            )
            if r.status_code == 200:
                return r.json()
            return None
        except Exception:
            return None

    def create_page(
        self,
        space_key: str,
        title: str,
        storage_value: str,
        parent_page_id: str | None = None,
    ) -> dict[str, Any] | dict[str, str]:
        payload = {
            "type": "page",
            "title": title,
            "space": {"key": space_key},
            "body": {"storage": {"value": storage_value, "representation": "storage"}},
        }
        if parent_page_id:
            payload["ancestors"] = [{"id": parent_page_id}]
        try:
            s = self._get_session()
            r = s.post(
                self._url("/rest/api/content"),
                json=payload,
                timeout=self.settings.CONFLUENCE_TIMEOUT_SECONDS,
            )
            if r.status_code in (200, 201):
                return r.json()
            return {"error": f"HTTP {r.status_code}", "body": r.text}
        except Exception as e:
            return {"error": str(e)}

    def update_page(
        self,
        page_id: str,
        title: str,
        storage_value: str,
        version_number: int,
    ) -> dict[str, Any] | dict[str, str]:
        payload = {
            "id": page_id,
            "type": "page",
            "title": title,
            "body": {"storage": {"value": storage_value, "representation": "storage"}},
            "version": {"number": version_number + 1},
        }
        try:
            s = self._get_session()
            r = s.put(
                self._url(f"/rest/api/content/{page_id}"),
                json=payload,
                timeout=self.settings.CONFLUENCE_TIMEOUT_SECONDS,
            )
            if r.status_code == 200:
                return r.json()
            return {"error": f"HTTP {r.status_code}", "body": r.text}
        except Exception as e:
            return {"error": str(e)}

    def find_page_by_title(self, space_key: str, title: str) -> dict[str, Any] | None:
        try:
            s = self._get_session()
            r = s.get(
                self._url("/rest/api/content"),
                params={"spaceKey": space_key, "title": title, "expand": "version"},
                timeout=self.settings.CONFLUENCE_TIMEOUT_SECONDS,
            )
            if r.status_code != 200:
                return None
            data = r.json()
            results = data.get("results", [])
            return results[0] if results else None
        except Exception:
            return None
