import re
from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, jsonify, request

from ..auth.guards import require_web_admin
from ..db import get_db
from ..errors import Conflict, NotFound
from .schemas import LocationCreate, LocationPatch

locations_bp = Blueprint("locations", __name__, url_prefix="/api/locations")


def _fmt_dt(dt) -> str | None:
    if dt is None:
        return None
    s = dt.isoformat()
    if s.endswith("+00:00"):
        s = s[:-6] + "Z"
    return s


def _serialize_location(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "is_dropoff": bool(doc.get("is_dropoff", True)),
        "is_active": bool(doc.get("is_active", True)),
        "created_at": _fmt_dt(doc.get("created_at")),
    }


def _name_exists(name: str, exclude_id: ObjectId | None = None) -> bool:
    query: dict = {"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}
    if exclude_id is not None:
        query["_id"] = {"$ne": exclude_id}
    return get_db().locations.find_one(query) is not None


def _parse_oid(location_id: str) -> ObjectId:
    try:
        return ObjectId(location_id)
    except Exception:
        raise NotFound("Location not found.")


@locations_bp.get("")
def list_locations():
    cursor = get_db().locations.find({"is_active": True}).sort("name", 1)
    return jsonify({"locations": [_serialize_location(d) for d in cursor]}), 200


@locations_bp.post("")
def create_location():
    require_web_admin()
    body = LocationCreate.model_validate(request.get_json(force=True) or {})
    if _name_exists(body.name):
        raise Conflict("A location with that name already exists.")
    doc = {
        "name": body.name,
        "is_dropoff": body.is_dropoff,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }
    result = get_db().locations.insert_one(doc)
    inserted = get_db().locations.find_one({"_id": result.inserted_id})
    return jsonify(_serialize_location(inserted)), 201


@locations_bp.patch("/<location_id>")
def patch_location(location_id: str):
    require_web_admin()
    oid = _parse_oid(location_id)
    db = get_db()
    if db.locations.find_one({"_id": oid}) is None:
        raise NotFound("Location not found.")

    body = LocationPatch.model_validate(request.get_json(force=True) or {})
    updates = {
        k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None
    }
    if not updates:
        updated = db.locations.find_one({"_id": oid})
        return jsonify(_serialize_location(updated)), 200

    if "name" in updates and _name_exists(updates["name"], exclude_id=oid):
        raise Conflict("A location with that name already exists.")

    db.locations.update_one({"_id": oid}, {"$set": updates})
    updated = db.locations.find_one({"_id": oid})
    return jsonify(_serialize_location(updated)), 200


@locations_bp.delete("/<location_id>")
def delete_location(location_id: str):
    require_web_admin()
    oid = _parse_oid(location_id)
    db = get_db()
    if db.locations.find_one({"_id": oid}) is None:
        raise NotFound("Location not found.")
    db.locations.update_one({"_id": oid}, {"$set": {"is_active": False}})
    return "", 204
