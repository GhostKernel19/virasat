import json
import re
from typing import Any


def parse_json_from_response(raw_text: str) -> Any:
    """
    Parses JSON data returned by an LLM (such as Gemini), cleanly stripping
    markdown code fences (e.g. ```json ... ``` or ``` ... ```) and leading/trailing
    conversational text.
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("Empty response text cannot be parsed as JSON.")

    text = raw_text.strip()

    # Match triple backticks with optional language identifier (e.g. ```json ... ```)
    code_fence_pattern = re.compile(r"```(?:json)?\s*([\s\S]*?)\s*```", re.IGNORECASE)
    match = code_fence_pattern.search(text)
    if match:
        text = match.group(1).strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # If direct parse failed, attempt to find the outermost JSON array or object
    array_match = re.search(r"(\[[\s\S]*\])", text)
    if array_match:
        try:
            return json.loads(array_match.group(1))
        except json.JSONDecodeError:
            pass

    object_match = re.search(r"(\{[\s\S]*\})", text)
    if object_match:
        try:
            return json.loads(object_match.group(1))
        except json.JSONDecodeError:
            pass

    # Fall back to trying json.loads on stripped text to raise standard JSONDecodeError
    return json.loads(text)

