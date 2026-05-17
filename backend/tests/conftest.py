"""Shared pytest fixtures.

Boots the Flask app with the image GridFS bucket replaced by an in-memory
stub and `require_user` stubbed to a no-op, so route tests don't need Mongo
or a real session.
"""

import pytest
from bson import ObjectId
from gridfs.errors import NoFile

from app import create_app


class _FakeGridOut:
    def __init__(self, data: bytes, metadata: dict | None) -> None:
        self._data = data
        self.metadata = metadata or {}

    def read(self) -> bytes:
        return self._data


class _FakeGridFSBucket:
    """In-memory stand-in for `gridfs.GridFSBucket`."""

    def __init__(self) -> None:
        self._files: dict[ObjectId, tuple[bytes, dict]] = {}

    def upload_from_stream(self, filename, source, metadata=None) -> ObjectId:
        data = source.read() if hasattr(source, "read") else bytes(source)
        oid = ObjectId()
        self._files[oid] = (data, dict(metadata or {}))
        return oid

    def open_download_stream(self, file_id) -> _FakeGridOut:
        entry = self._files.get(file_id)
        if entry is None:
            raise NoFile(f"no file with id {file_id}")
        data, metadata = entry
        return _FakeGridOut(data, metadata)


@pytest.fixture
def app(monkeypatch):
    flask_app = create_app()
    flask_app.config.update(TESTING=True)

    fake_bucket = _FakeGridFSBucket()
    monkeypatch.setattr("app.images.routes.get_gridfs_bucket", lambda: fake_bucket)
    monkeypatch.setattr("app.images.routes.require_user", lambda: None)

    return flask_app


@pytest.fixture
def client(app):
    return app.test_client()
