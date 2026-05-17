import secrets
from datetime import datetime, timezone
from urllib.parse import urlencode

import requests as http
from flask import Blueprint, current_app, jsonify, redirect, request, session

from ..db import get_db
from .guards import require_user
from .schemas import CU_EMAIL_REGEX

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def _serialize_user(user: dict) -> dict:
    loc_id = user.get("admin_location_id")
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "display_name": user["display_name"],
        "role": user["role"],
        "admin_location_id": str(loc_id) if loc_id else None,
    }


def _frontend(path: str = "") -> str:
    return current_app.config["FRONTEND_ORIGIN"] + path


@auth_bp.get("/google")
def google_login():
    state = secrets.token_urlsafe(16)
    session["oauth_state"] = state
    params = {
        "client_id": current_app.config["GOOGLE_CLIENT_ID"],
        "redirect_uri": current_app.config["GOOGLE_REDIRECT_URI"],
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        # Domain hint — shows CU accounts first. Validated strictly on the backend.
        "hd": "chula.ac.th",
        "access_type": "online",
        "prompt": "select_account",
    }
    return redirect(_GOOGLE_AUTH_URL + "?" + urlencode(params))


@auth_bp.get("/callback")
def google_callback():
    # CSRF guard — both must be non-empty AND match (an attacker hitting
    # /callback directly would otherwise pass with state="" on both sides).
    state = request.args.get("state", "")
    stored = session.pop("oauth_state", "")
    if not stored or state != stored:
        return redirect(_frontend("/login?error=invalid_state"))

    if request.args.get("error"):
        return redirect(_frontend("/login?error=access_denied"))

    code = request.args.get("code")
    if not code:
        return redirect(_frontend("/login?error=no_code"))

    # Exchange authorisation code for access token
    token_res = http.post(
        _GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": current_app.config["GOOGLE_CLIENT_ID"],
            "client_secret": current_app.config["GOOGLE_CLIENT_SECRET"],
            "redirect_uri": current_app.config["GOOGLE_REDIRECT_URI"],
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    if not token_res.ok:
        return redirect(_frontend("/login?error=token_failed"))

    access_token = token_res.json().get("access_token")

    # Fetch Google profile
    userinfo_res = http.get(
        _GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if not userinfo_res.ok:
        return redirect(_frontend("/login?error=userinfo_failed"))

    userinfo = userinfo_res.json()
    email = userinfo.get("email", "").lower()

    # Enforce CU domain — hd hint is not enough, must validate here
    if not CU_EMAIL_REGEX.match(email):
        return redirect(_frontend("/login?error=not_cu_email"))

    # Upsert — preserve existing role so seeded admins keep their role
    db = get_db()
    db.users.update_one(
        {"email": email},
        {
            "$setOnInsert": {
                "email": email,
                "display_name": userinfo.get("name", email.split("@")[0]),
                "role": "user",
                "admin_location_id": None,
                "created_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )
    user = db.users.find_one({"email": email})
    session["user_id"] = str(user["_id"])
    return redirect(_frontend())


@auth_bp.post("/logout")
def logout():
    session.clear()
    return "", 204


@auth_bp.get("/me")
def me():
    user = require_user()
    return jsonify(_serialize_user(user)), 200
