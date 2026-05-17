"""Tests for the auth guards.

Patches `session` and `get_db` inside `app.auth.guards`. `user_id` must be a
valid 24-char hex string because `require_user` parses it as `ObjectId`.
"""

import pytest
from bson import ObjectId
from unittest.mock import patch

from app.errors import Forbidden, Unauthenticated

VALID_OID = "507f1f77bcf86cd799439011"


def test_require_user_no_session():
    from app.auth.guards import require_user
    with patch("app.auth.guards.session", {}):
        with pytest.raises(Unauthenticated):
            require_user()


def test_require_user_invalid_oid_in_session():
    from app.auth.guards import require_user
    with patch("app.auth.guards.session", {"user_id": "not-an-oid"}):
        with pytest.raises(Unauthenticated):
            require_user()


def test_require_user_user_missing_in_db():
    from app.auth.guards import require_user
    with patch("app.auth.guards.session", {"user_id": VALID_OID}):
        with patch("app.auth.guards.get_db") as mock_db:
            mock_db.return_value.users.find_one.return_value = None
            with pytest.raises(Unauthenticated):
                require_user()


def test_require_user_happy_path():
    from app.auth.guards import require_user
    mock_user = {"_id": ObjectId(VALID_OID), "email": "a@chula.ac.th", "role": "user"}
    with patch("app.auth.guards.session", {"user_id": VALID_OID}):
        with patch("app.auth.guards.get_db") as mock_db:
            mock_db.return_value.users.find_one.return_value = mock_user
            user = require_user()
            assert user["email"] == "a@chula.ac.th"


def test_require_web_admin_wrong_role():
    from app.auth.guards import require_web_admin
    mock_user = {"_id": ObjectId(VALID_OID), "role": "location_admin"}
    with patch("app.auth.guards.require_user", return_value=mock_user):
        with pytest.raises(Forbidden):
            require_web_admin()


def test_require_web_admin_happy():
    from app.auth.guards import require_web_admin
    mock_user = {"_id": ObjectId(VALID_OID), "role": "web_admin"}
    with patch("app.auth.guards.require_user", return_value=mock_user):
        assert require_web_admin()["role"] == "web_admin"


def test_require_any_admin_accepts_web_admin():
    from app.auth.guards import require_any_admin
    mock_user = {"_id": ObjectId(VALID_OID), "role": "web_admin"}
    with patch("app.auth.guards.require_user", return_value=mock_user):
        assert require_any_admin() is mock_user


def test_require_any_admin_accepts_location_admin():
    from app.auth.guards import require_any_admin
    mock_user = {"_id": ObjectId(VALID_OID), "role": "location_admin"}
    with patch("app.auth.guards.require_user", return_value=mock_user):
        assert require_any_admin() is mock_user


def test_require_any_admin_rejects_regular_user():
    from app.auth.guards import require_any_admin
    mock_user = {"_id": ObjectId(VALID_OID), "role": "user"}
    with patch("app.auth.guards.require_user", return_value=mock_user):
        with pytest.raises(Forbidden):
            require_any_admin()
