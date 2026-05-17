"""Tests for the image upload + download routes.

`require_user` and the GridFS bucket are stubbed in `conftest.py`, so these
tests focus on payload validation + the upload/read-back round-trip.
"""

from io import BytesIO


def test_upload_wrong_mime(client):
    data = {"file": (BytesIO(b"fake content"), "test.txt")}
    res = client.post("/api/images", data=data, content_type="multipart/form-data")
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "validation_failed"


def test_upload_too_large(client):
    big = BytesIO(b"x" * (5 * 1024 * 1024 + 1))
    data = {"file": (big, "big.jpg")}
    res = client.post("/api/images", data=data, content_type="multipart/form-data")
    assert res.status_code == 400


def test_upload_no_file(client):
    res = client.post("/api/images", data={}, content_type="multipart/form-data")
    assert res.status_code == 400


def test_upload_no_extension(client):
    data = {"file": (BytesIO(b"fake"), "noextension")}
    res = client.post("/api/images", data=data, content_type="multipart/form-data")
    assert res.status_code == 400


def test_upload_empty_file(client):
    data = {"file": (BytesIO(b""), "empty.jpg")}
    res = client.post("/api/images", data=data, content_type="multipart/form-data")
    assert res.status_code == 400


def test_upload_and_readback_jpeg(client):
    content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01" + b"a" * 256
    data = {"file": (BytesIO(content), "photo.jpg")}
    res = client.post("/api/images", data=data, content_type="multipart/form-data")
    assert res.status_code == 201
    body = res.get_json()
    assert "id" in body
    image_id = body["id"]

    get_res = client.get(f"/api/images/{image_id}")
    assert get_res.status_code == 200
    assert get_res.mimetype == "image/jpeg"
    assert get_res.data == content


def test_get_image_invalid_id(client):
    res = client.get("/api/images/not-an-oid")
    assert res.status_code == 404
    assert res.get_json()["error"]["code"] == "not_found"


def test_get_image_missing(client):
    # Well-formed ObjectId that doesn't exist in the bucket.
    res = client.get("/api/images/507f1f77bcf86cd799439011")
    assert res.status_code == 404
