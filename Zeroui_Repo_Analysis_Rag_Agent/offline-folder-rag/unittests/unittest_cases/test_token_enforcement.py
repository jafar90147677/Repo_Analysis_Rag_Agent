import pytest
import requests

API_URL = "http://localhost:8000"


def test_health_endpoint_invalid_token():
    response = requests.get(f"{API_URL}/health")
    assert response.status_code == 401
    assert response.json() == {"detail": "INVALID_TOKEN"}


def test_ask_endpoint_invalid_token():
    data = {"query": "What is the repo status?"}
    response = requests.post(f"{API_URL}/ask", json=data)
    assert response.status_code == 401
    assert response.json() == {"detail": "INVALID_TOKEN"}
