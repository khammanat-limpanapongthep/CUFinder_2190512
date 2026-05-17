from urllib.parse import urlparse

from flask import current_app
from gridfs import GridFSBucket
from pymongo import MongoClient
from pymongo.database import Database

_DEFAULT_DB_NAME = "cufinder"

_client: MongoClient | None = None


def _resolve_db_name(uri: str) -> str:
    path = urlparse(uri).path.lstrip("/")
    return path or _DEFAULT_DB_NAME


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(current_app.config["MONGODB_URI"])
    return _client


def get_db() -> Database:
    uri = current_app.config["MONGODB_URI"]
    return get_client()[_resolve_db_name(uri)]


def get_gridfs_bucket() -> GridFSBucket:
    return GridFSBucket(get_db())


def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
