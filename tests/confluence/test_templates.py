"""Template loader tests (no network)."""
import pytest


def test_list_templates():
    from edge_agent.app.confluence.templates import list_templates
    names = list_templates()
    assert isinstance(names, list)
    # May be empty if confluence_data not at expected path relative to test run
    for n in names:
        assert isinstance(n, str)


def test_get_template_and_select():
    from edge_agent.app.confluence.templates import get_template, select_template
    t = get_template("python_api_template")
    if t is not None:
        assert "name" in t
        assert "sections" in t
    out = select_template({"kind": "python"})
    assert out is None or isinstance(out, str)
