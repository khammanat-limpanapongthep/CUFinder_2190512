from bson import ObjectId
from flask import session

from ..db import get_db
from ..errors import Forbidden, Unauthenticated


def require_user() -> dict:
    user_id = session.get("user_id")
    if not user_id:
        raise Unauthenticated("Authentication required.")
    try:
        oid = ObjectId(user_id)
    except Exception:
        session.clear()
        raise Unauthenticated("Invalid session.")
    user = get_db().users.find_one({"_id": oid})
    if user is None:
        session.clear()
        raise Unauthenticated("User not found.")
    return user


def require_web_admin() -> dict:
    user = require_user()
    if user.get("role") != "web_admin":
        raise Forbidden("Web admin access required.")
    return user


def require_any_admin() -> dict:
    user = require_user()
    if user.get("role") not in ("web_admin", "location_admin"):
        raise Forbidden("Admin access required.")
    return user
