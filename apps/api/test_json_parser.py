import sys
from pathlib import Path

# Add current directory to path so test runs smoothly from both repo root and apps/api
sys.path.insert(0, str(Path(__file__).parent))

import pytest
from json_parser import parse_json_from_response


def test_parse_json_from_response_code_fence():
    """Test parsing Gemini response wrapped in markdown code fence with json language tag."""
    raw_response = """```json
[
  {"text": "श्री सोलंकी कुलभूषण भीमदेव प्रथम", "confidence": 0.98},
  {"text": "राणी की वाव पाटन", "confidence": 0.95}
]
```"""
    data = parse_json_from_response(raw_response)
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["text"] == "श्री सोलंकी कुलभूषण भीमदेव प्रथम"
    assert data[0]["confidence"] == 0.98
    assert data[1]["text"] == "राणी की वाव पाटन"


def test_parse_json_from_response_plain_fence():
    """Test parsing Gemini response wrapped in plain code fence without language tag."""
    raw_response = """```
[
  {"text": "आमेर दुर्ग", "confidence": 0.92}
]
```"""
    data = parse_json_from_response(raw_response)
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["text"] == "आमेर दुर्ग"


def test_parse_json_with_conversational_wrapper():
    """Test parsing when LLM includes conversational prose around the code fence."""
    raw_response = """Certainly! Here is the extracted text:
```json
[
  {"text": "हंपी विठ्ठल मंदिर", "confidence": 0.99}
]
```
Hope this is helpful!"""
    data = parse_json_from_response(raw_response)
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["text"] == "हंपी विठ्ठल मंदिर"


def test_parse_json_invalid():
    """Test that invalid non-JSON text raises a ValueError or JSONDecodeError."""
    with pytest.raises(Exception):
        parse_json_from_response("Not a JSON string at all")
