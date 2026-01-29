import pytest
import requests

API_URL = "http://localhost:8000"


def test_health_endpoint_invalid_token():
    response = requests.get(f"{API_URL}/health")
    assert response.status_code == 401
    assert response.json() == {
        "error_code": "INVALID_TOKEN",
        "message": "The provided token is missing or invalid.",
        "remediation": "Please provide a valid X-LOCAL-TOKEN in the request headers.",
    }


def test_ask_endpoint_invalid_token():
    data = {"query": "What is the repo status?"}
    response = requests.post(f"{API_URL}/ask", json=data)
    assert response.status_code == 401
    assert response.json() == {
        "error_code": "INVALID_TOKEN",
        "message": "The provided token is missing or invalid.",
        "remediation": "Please provide a valid X-LOCAL-TOKEN in the request headers.",
    }
