import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "online"
    assert "Virasat" in data.get("name", "")


def test_get_nonexistent_item():
    response = client.get("/items/00000000-0000-0000-0000-000000000000")
    # Should return 404 because item does not exist
    assert response.status_code == 404
    assert response.json()["detail"] == "Heritage item not found."


def test_retry_nonexistent_item():
    response = client.post("/items/00000000-0000-0000-0000-000000000000/retry")
    # Should return 404 because item does not exist
    assert response.status_code == 404
    assert response.json()["detail"] == "Heritage item not found."


def test_create_item_missing_place_id():
    files = {"image": ("test.jpg", b"fake-bytes", "image/jpeg")}
    data = {"title": "Test Heritage Record"}
    response = client.post("/items", data=data, files=files)
    assert response.status_code == 422 or response.status_code == 400


def test_create_item_invalid_place_id():
    files = {"image": ("test.jpg", b"fake-bytes", "image/jpeg")}
    data = {
        "title": "Test Heritage Record",
        "place_id": "00000000-0000-0000-0000-000000000000"
    }
    response = client.post("/items", data=data, files=files)
    assert response.status_code == 400
    assert "Invalid place_id" in response.json().get("detail", "")


def test_search_empty_query():
    # Empty query should return empty places and passages arrays
    response = client.get("/search?q=")
    assert response.status_code == 200
    data = response.json()
    assert data == {"places": [], "passages": []}

    # Whitespace only should also return empty results
    response_ws = client.get("/search?q=   ")
    assert response_ws.status_code == 200
    assert response_ws.json() == {"places": [], "passages": []}


def test_search_places_and_passages():
    # Search for "water" which exists in place summaries and translated passages
    response = client.get("/search?q=water")
    assert response.status_code == 200
    data = response.json()
    assert "places" in data
    assert "passages" in data
    assert isinstance(data["places"], list)
    assert isinstance(data["passages"], list)

    # Check place schema if places matched
    if data["places"]:
        p = data["places"][0]
        for key in ["id", "name", "state", "period", "type", "summary"]:
            assert key in p

    # Check passage schema if passages matched
    if data["passages"]:
        passage = data["passages"][0]
        for key in [
            "ocr_id",
            "place_id",
            "place_name",
            "item_title",
            "original_text",
            "translation_text",
            "matched_field",
        ]:
            assert key in passage
            assert passage["matched_field"] in ["original_text", "translation_text"]


def test_search_with_type_and_state_filters():
    # Search with type filter "Stepwell" and state filter "Gujarat"
    response = client.get("/search?q=water&type=Stepwell&state=Gujarat")
    assert response.status_code == 200
    data = response.json()
    for place in data["places"]:
        assert "Stepwell" in place.get("type", "") or place.get("type") == ""
        assert "Gujarat" in place.get("state", "")

    for passage in data["passages"]:
        # Verify passage belongs to Gujarat/Stepwell
        assert passage["place_name"] in ["Rani ki Vav", "Adalaj Stepwell"]


def test_search_devanagari_query():
    # Case-insensitive / unicode ilike search for Devanagari text
    response = client.get("/search?q=पायविहीर")
    assert response.status_code == 200
    data = response.json()
    assert "passages" in data
    assert len(data["passages"]) >= 1
    match = data["passages"][0]
    assert "पायविहीर" in match["original_text"]
    assert match["matched_field"] == "original_text"


