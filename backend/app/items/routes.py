import re
from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, jsonify, request
from pydantic import TypeAdapter

from ..auth.guards import require_any_admin, require_user
from ..db import get_db
from ..errors import Forbidden, NotFound
from .schemas import ItemCreate, StatusUpdate

items_bp = Blueprint("items", __name__, url_prefix="/api/items")

_item_adapter = TypeAdapter(ItemCreate)


def _fmt_dt(dt) -> str | None:
    if dt is None:
        return None
    s = dt.isoformat()
    if s.endswith("+00:00"):
        s = s[:-6] + "Z"
    return s


def _serialize_item(doc: dict) -> dict:
    result = {
        "id": str(doc["_id"]),
        "type": doc["type"],
        "title": doc["title"],
        "description": doc.get("description", ""),
        "category": doc["category"],
        "image_id": doc.get("image_id"),
        "status": doc["status"],
        "posted_by": doc["posted_by"],
        "posted_at": _fmt_dt(doc.get("posted_at")),
    }
    if doc["type"] == "lost":
        result.update(
            {
                "last_seen_location_id": doc.get("last_seen_location_id"),
                "last_seen_location_text": doc.get("last_seen_location_text"),
                "last_seen_date": doc.get("last_seen_date"),
                "contact_info": doc.get("contact_info"),
            }
        )
    else:
        result.update(
            {
                "found_location_id": doc.get("found_location_id"),
                "found_location_text": doc.get("found_location_text"),
                "found_date": doc.get("found_date"),
                "held_admin_location_id": doc.get("held_admin_location_id"),
                "held_freetext": doc.get("held_freetext"),
            }
        )
    return result


def _build_filter(args) -> dict:
    conditions: list[dict] = []

    item_type = args.get("type")
    if item_type in ("lost", "found"):
        conditions.append({"type": item_type})

    category = args.get("category", "").strip()
    if category:
        conditions.append({"category": category})

    location_id = args.get("location_id", "").strip()
    if location_id:
        conditions.append(
            {
                "$or": [
                    {"last_seen_location_id": location_id},
                    {"found_location_id": location_id},
                ]
            }
        )

    q = args.get("q", "").strip()
    if q:
        pattern = {"$regex": re.escape(q), "$options": "i"}
        conditions.append({"$or": [{"title": pattern}, {"description": pattern}]})

    date_from = args.get("date_from", "").strip()
    if date_from:
        conditions.append(
            {
                "$or": [
                    {"last_seen_date": {"$gte": date_from}},
                    {"found_date": {"$gte": date_from}},
                ]
            }
        )

    date_to = args.get("date_to", "").strip()
    if date_to:
        conditions.append(
            {
                "$or": [
                    {"last_seen_date": {"$lte": date_to}},
                    {"found_date": {"$lte": date_to}},
                ]
            }
        )

    # status always applied; default to "open"
    raw_status = args.get("status", "open")
    status = raw_status if raw_status in ("open", "claimed", "disposed") else "open"
    conditions.append({"status": status})

    if len(conditions) == 1:
        return conditions[0]
    return {"$and": conditions}


def _check_admin_authz(user: dict, item: dict) -> None:
    if user["role"] == "web_admin":
        return
    if item["type"] != "found":
        raise Forbidden("Location admins may only moderate found items.")
    item_held = item.get("held_admin_location_id")
    user_loc = user.get("admin_location_id")
    if not item_held or not user_loc or str(item_held) != str(user_loc):
        raise Forbidden("This item is not held at your location.")


@items_bp.get("")
def list_items():
    args = request.args
    try:
        limit = min(int(args.get("limit", 30)), 100)
        skip = int(args.get("skip", 0))
    except (ValueError, TypeError):
        limit, skip = 30, 0
    limit = max(limit, 1)
    skip = max(skip, 0)

    mongo_filter = _build_filter(args)
    db = get_db()
    total = db.items.count_documents(mongo_filter)
    cursor = db.items.find(mongo_filter).skip(skip).limit(limit).sort("posted_at", -1)
    return jsonify({"items": [_serialize_item(d) for d in cursor], "total": total}), 200


@items_bp.get("/<item_id>")
def get_item(item_id: str):
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise NotFound("Item not found.")
    doc = get_db().items.find_one({"_id": oid})
    if doc is None:
        raise NotFound("Item not found.")
    return jsonify(_serialize_item(doc)), 200


@items_bp.post("")
def create_item():
    user = require_user()
    body = _item_adapter.validate_python(request.get_json(force=True) or {})
    doc = body.model_dump()
    doc.update(
        {
            "status": "open",
            "posted_by": {
                "id": str(user["_id"]),
                "display_name": user["display_name"],
            },
            "posted_at": datetime.now(timezone.utc),
        }
    )
    db = get_db()
    result = db.items.insert_one(doc)
    inserted = db.items.find_one({"_id": result.inserted_id})
    return jsonify(_serialize_item(inserted)), 201


@items_bp.patch("/<item_id>/status")
def update_status(item_id: str):
    user = require_user()
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise NotFound("Item not found.")
    db = get_db()
    item = db.items.find_one({"_id": oid})
    if item is None:
        raise NotFound("Item not found.")
    body = StatusUpdate.model_validate(request.get_json(force=True) or {})
    is_owner = item.get("posted_by", {}).get("id") == str(user["_id"])
    is_admin = user["role"] in ("web_admin", "location_admin")
    if is_owner and not is_admin:
        if body.status != "claimed":
            raise Forbidden("You can only mark your own post as claimed.")
    elif is_admin:
        _check_admin_authz(user, item)
    else:
        raise Forbidden("You do not have permission to change this item's status.")
    db.items.update_one({"_id": oid}, {"$set": {"status": body.status}})
    updated = db.items.find_one({"_id": oid})
    return jsonify(_serialize_item(updated)), 200


@items_bp.delete("/<item_id>")
def delete_item(item_id: str):
    user = require_user()
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise NotFound("Item not found.")
    db = get_db()
    item = db.items.find_one({"_id": oid})
    if item is None:
        raise NotFound("Item not found.")
    is_owner = item.get("posted_by", {}).get("id") == str(user["_id"])
    is_admin = user["role"] in ("web_admin", "location_admin")
    if not is_owner and not is_admin:
        raise Forbidden("You can only delete your own posts.")
    if is_admin and not is_owner:
        _check_admin_authz(user, item)
    db.items.delete_one({"_id": oid})
    # TODO: orphaned GridFS image not cleaned up here — defer to v2
    return "", 204
