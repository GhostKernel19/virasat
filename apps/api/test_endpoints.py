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

