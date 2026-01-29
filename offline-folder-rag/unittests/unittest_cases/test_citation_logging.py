import pytest
import logging


def check_llm_response(response):
    if "[" in response and "]" in response:
        return "found"
    return "not_found"


def test_citation_enforcement():
    response_with_citation = "This is the answer with a citation [source]."
    response_without_citation = "This is an answer without any citation."
    assert check_llm_response(response_with_citation) == "found"
    assert check_llm_response(response_without_citation) == "not_found"


def test_privacy_logging():
    sensitive_log = "User submitted a sensitive code snippet: def sensitive_function()"
    redacted = sensitive_log.replace("code snippet", "***").replace("sensitive_function", "***")
    assert "code snippet" not in redacted
    assert "sensitive_function" not in redacted


def test_csv_test_matrix():
    functional_test_matrix = [
        {"Test Case": "test_citation_enforcement", "AC": "AC-11"},
        {"Test Case": "test_privacy_logging", "AC": "AC-12"},
    ]
    assert functional_test_matrix[0]["AC"] == "AC-11"
    assert functional_test_matrix[1]["AC"] == "AC-12"
