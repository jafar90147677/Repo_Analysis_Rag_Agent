"""Agents: content_analysis, pattern_matching, formatting, integration, learning, analytics, feedback."""
from __future__ import annotations

from .analytics_agent import log_operation
from .content_analysis_agent import analyse_blocks
from .feedback_processor import process_feedback
from .formatting_agent import format_blocks
from .integration_agent import create_or_update
from .learning_agent import record_successful_template
from .pattern_matching_agent import match_template

__all__ = [
    "analyse_blocks",
    "match_template",
    "format_blocks",
    "create_or_update",
    "record_successful_template",
    "log_operation",
    "process_feedback",
]
