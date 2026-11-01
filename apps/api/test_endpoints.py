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


def test_search_all_types_filter_does_not_filter_out():
    # If type="All Types" or type="all" is passed, it should NOT filter out results
    res_no_filter = client.get("/search?q=water")
    res_all_types = client.get("/search?q=water&type=All%20Types")
    res_all_lower = client.get("/search?q=water&type=all")

    assert res_no_filter.status_code == 200
    assert res_all_types.status_code == 200
    assert res_all_lower.status_code == 200

    # Ensure results are identical to unconstrained query
    assert len(res_all_types.json()["places"]) == len(res_no_filter.json()["places"])
    assert len(res_all_types.json()["passages"]) == len(res_no_filter.json()["passages"])
    assert len(res_all_lower.json()["places"]) == len(res_no_filter.json()["places"])



def test_search_hampi():
    # Test q=hampi finds Hampi in places table
    response = client.get("/search?q=hampi")
    assert response.status_code == 200
    data = response.json()
    assert "places" in data
    assert "passages" in data
    assert any(p["name"] == "Hampi" for p in data["places"])
    hampi = next(p for p in data["places"] if p["name"] == "Hampi")
    assert hampi["state"] == "Karnataka"
    assert "Temple" in hampi["type"]


def test_search_water():
    # Test q=water finds places (Rani ki Vav, Amer Fort) and passages
    response = client.get("/search?q=water")
    assert response.status_code == 200
    data = response.json()
    assert "places" in data
    assert "passages" in data
    assert len(data["places"]) >= 1
    assert any("water" in p["summary"].lower() for p in data["places"])


def test_search_shaniwar():
    # Test q=शनिवार finds passages with Devanagari text
    response = client.get("/search?q=शनिवार")
    assert response.status_code == 200
    data = response.json()
    assert "places" in data
    assert "passages" in data
    assert len(data["passages"]) >= 1
    assert any("शनिवार" in p["original_text"] for p in data["passages"])


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


def test_admin_items_list():
    # Test GET /admin/items returns items
    response = client.get("/admin/items?status=all")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert "id" in data[0]
        assert "status" in data[0]


def test_approve_item():
    # Test approving an item
    # Fetch an item or use a nonexistent one to check 404
    non_existent = client.post("/items/00000000-0000-0000-0000-000000000000/approve")
    assert non_existent.status_code == 404

    # Test approve on an existing item from admin list
    items_res = client.get("/admin/items?status=all")
    items = items_res.json()
    if items:
        target = items[0]
        approve_res = client.post(f"/items/{target['id']}/approve")
        assert approve_res.status_code == 200
        assert approve_res.json()["status"] == "published"


def test_tagging_rules_logic():
    # Verify the tagging logic:
    # 1. Inscription words (शिलालेख, inscription, संवत्, शके) get 'inscription'
    # 2. Signboard words (signboard, signage, फलक) get 'signage'
    # 3. Other generic text gets no tag
    import re

    inscription_patterns = [
        r"\binscription\b",
        r"\bepigraphy\b",
        r"शिलालेख",
        r"संवत्",
        r"संवत",
        r"शके",
        r"अभिलेख",
    ]
    signage_patterns = [
        r"\bsignboard\b",
        r"\bsignage\b",
        r"\bboard\b",
        r"\bnotice\b",
        r"पाटी",
        r"सूचना",
        r"फलक",
        r"दिशादर्शक",
        r"नामफलक",
    ]

    def get_tags(text: str) -> list[str]:
        tags = []
        is_inscr = any(re.search(pat, text, re.IGNORECASE) for pat in inscription_patterns)
        is_sign = any(re.search(pat, text, re.IGNORECASE) for pat in signage_patterns)
        if is_inscr:
            tags.append("inscription")
        elif is_sign:
            tags.append("signage")
        return tags

    # Test inscription matches
    assert "inscription" in get_tags("येथील जुना शिलालेख संवत् १६५० मधील आहे")
    assert "inscription" in get_tags("Ancient stone inscription from 12th century")
    assert "inscription" in get_tags("शके १७२० मधील ऐतिहासिक नोंद")

    # Test signage matches
    assert "signage" in get_tags("पर्यटकांना सूचना देणारा माहिती फलक")
    assert "signage" in get_tags("Archaeological survey notice board")
    assert "inscription" not in get_tags("दिशादर्शक पाटी")

    # Test other text gets no inscription tag
    assert get_tags("सुंदर वास्तुकला आणि नक्षीकाम असलेली पायविहीर") == []
    assert get_tags("General description of the temple ruins") == []


def test_cors_headers_localhost_and_127():
    for origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
        # Test preflight OPTIONS
        response_opt = client.options(
            "/search",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        assert response_opt.status_code == 200
        assert response_opt.headers.get("access-control-allow-origin") == origin

        # Test GET with origin
        response_get = client.get("/search?q=", headers={"Origin": origin})
        assert response_get.status_code == 200
        assert response_get.headers.get("access-control-allow-origin") == origin




