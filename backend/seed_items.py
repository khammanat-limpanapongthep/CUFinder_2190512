"""Seed sample lost & found items for demo purposes."""

from datetime import datetime, timezone

from app import create_app
from app.db import get_db

ITEMS = [
    # --- LOST / open ---
    {
        "type": "lost",
        "title": "Black Leather Wallet",
        "description": "Black bifold wallet with student ID and some cash inside. Has a small scratch on the front.",
        "category": "Wallet & Cards",
        "image_id": None,
        "status": "open",
        "last_seen_location_name": "Office of Academic Resources (Central Library)",
        "last_seen_location_text": None,
        "last_seen_date": "2026-05-14",
        "contact_info": "Line: somchai_cu",
        "posted_by": {"id": "000000000000000000000001", "display_name": "Somchai K."},
        "posted_at": datetime(2026, 5, 14, 9, 30, tzinfo=timezone.utc),
    },
    {
        "type": "lost",
        "title": "AirPods Pro (White Case)",
        "description": "Lost somewhere around the engineering building. Case has a small sticker of a cat on it.",
        "category": "Electronics",
        "image_id": None,
        "status": "open",
        "last_seen_location_name": "Faculty of Engineering",
        "last_seen_location_text": None,
        "last_seen_date": "2026-05-15",
        "contact_info": "Tel: 089-123-4567",
        "posted_by": {"id": "000000000000000000000002", "display_name": "Pakin T."},
        "posted_at": datetime(2026, 5, 15, 11, 0, tzinfo=timezone.utc),
    },
    {
        "type": "lost",
        "title": "CU Student ID Card",
        "description": "Lost my student ID. Name: Natthida Sriwan, Faculty of Arts year 2.",
        "category": "ID Cards",
        "image_id": None,
        "status": "open",
        "last_seen_location_name": None,
        "last_seen_location_text": "Somewhere between Faculty of Arts and Sala Phra Kiao",
        "last_seen_date": "2026-05-13",
        "contact_info": "Email: natthida.s@student.chula.ac.th",
        "posted_by": {"id": "000000000000000000000003", "display_name": "Natthida S."},
        "posted_at": datetime(2026, 5, 13, 14, 0, tzinfo=timezone.utc),
    },
    {
        "type": "lost",
        "title": "Blue Water Bottle (Hydro Flask)",
        "description": "Blue 32oz Hydro Flask with faculty stickers. Lost after PE class.",
        "category": "Water Bottles",
        "image_id": None,
        "status": "open",
        "last_seen_location_name": "CU Sports Complex",
        "last_seen_location_text": None,
        "last_seen_date": "2026-05-12",
        "contact_info": "Line: beam_cu55",
        "posted_by": {"id": "000000000000000000000004", "display_name": "Beam P."},
        "posted_at": datetime(2026, 5, 12, 16, 45, tzinfo=timezone.utc),
    },
    # --- FOUND / open ---
    {
        "type": "found",
        "title": "Set of Keys with Rabbit Keychain",
        "description": "Found a set of 3 keys with a white rabbit keychain near the library entrance.",
        "category": "Keys",
        "image_id": None,
        "status": "open",
        "found_location_name": "Office of Academic Resources (Central Library)",
        "found_location_text": None,
        "found_date": "2026-05-15",
        "held_admin_location_name": "Office of Academic Resources (Central Library)",
        "held_freetext": None,
        "posted_by": {"id": "000000000000000000000005", "display_name": "Mink R."},
        "posted_at": datetime(2026, 5, 15, 13, 20, tzinfo=timezone.utc),
    },
    {
        "type": "found",
        "title": "Gray Nike Backpack",
        "description": "Found a gray Nike backpack left unattended for over 2 hours. Contains notebooks and a pencil case.",
        "category": "Bags & Backpacks",
        "image_id": None,
        "status": "open",
        "found_location_name": "Faculty of Science",
        "found_location_text": None,
        "found_date": "2026-05-14",
        "held_admin_location_name": None,
        "held_freetext": "Room 301, Faculty of Science building — ask the secretary",
        "posted_by": {"id": "000000000000000000000006", "display_name": "Fah S."},
        "posted_at": datetime(2026, 5, 14, 15, 0, tzinfo=timezone.utc),
    },
    {
        "type": "found",
        "title": "Prescription Glasses (Black Frame)",
        "description": "Found on a table at the cafeteria. Black rectangular frame, hard case not included.",
        "category": "Other",
        "image_id": None,
        "status": "open",
        "found_location_name": None,
        "found_location_text": "Cafeteria (Sasa Patasala) — 2nd floor seating area",
        "found_date": "2026-05-16",
        "held_admin_location_name": None,
        "held_freetext": "Left at the cafeteria info desk",
        "posted_by": {"id": "000000000000000000000007", "display_name": "Nong W."},
        "posted_at": datetime(2026, 5, 16, 8, 0, tzinfo=timezone.utc),
    },
    # --- LOST / claimed (closed) ---
    {
        "type": "lost",
        "title": "MacBook Pro Charger (USB-C)",
        "description": "96W USB-C charger, white, with CU sticker on the brick. Lost near the reading area.",
        "category": "Electronics",
        "image_id": None,
        "status": "claimed",
        "last_seen_location_name": "Office of Academic Resources (Central Library)",
        "last_seen_location_text": None,
        "last_seen_date": "2026-05-10",
        "contact_info": "Line: arm_chula",
        "posted_by": {"id": "000000000000000000000008", "display_name": "Arm C."},
        "posted_at": datetime(2026, 5, 10, 10, 0, tzinfo=timezone.utc),
    },
    # --- FOUND / claimed (closed) ---
    {
        "type": "found",
        "title": "Student ID Card — Chulalongkorn University",
        "description": "Found a CU student ID on the floor near the Faculty of Commerce entrance. Already returned to owner.",
        "category": "ID Cards",
        "image_id": None,
        "status": "claimed",
        "found_location_name": "Faculty of Commerce & Accountancy",
        "found_location_text": None,
        "found_date": "2026-05-09",
        "held_admin_location_name": None,
        "held_freetext": "Returned directly to owner",
        "posted_by": {"id": "000000000000000000000009", "display_name": "Prae L."},
        "posted_at": datetime(2026, 5, 9, 12, 0, tzinfo=timezone.utc),
    },
    # --- FOUND / disposed ---
    {
        "type": "found",
        "title": "Umbrella (Dark Green)",
        "description": "Dark green compact umbrella left in a lecture hall. Unclaimed after 2 weeks, disposed.",
        "category": "Other",
        "image_id": None,
        "status": "disposed",
        "found_location_name": "Mahachakri Sirindhorn Building",
        "found_location_text": None,
        "found_date": "2026-04-28",
        "held_admin_location_name": None,
        "held_freetext": "Was held at building reception",
        "posted_by": {"id": "000000000000000000000010", "display_name": "Krit M."},
        "posted_at": datetime(2026, 4, 28, 17, 0, tzinfo=timezone.utc),
    },
]


def seed_items(db) -> None:
    loc_cache: dict[str, object] = {}

    def get_loc_id(name: str | None):
        if name is None:
            return None
        if name not in loc_cache:
            doc = db.locations.find_one({"name": name})
            loc_cache[name] = doc["_id"] if doc else None
        return loc_cache[name]

    inserted = 0
    for item in ITEMS:
        doc: dict = {
            "type": item["type"],
            "title": item["title"],
            "description": item["description"],
            "category": item["category"],
            "image_id": item["image_id"],
            "status": item["status"],
            "posted_by": item["posted_by"],
            "posted_at": item["posted_at"],
        }

        if item["type"] == "lost":
            doc["last_seen_location_id"] = str(get_loc_id(item["last_seen_location_name"])) if get_loc_id(item["last_seen_location_name"]) else None
            doc["last_seen_location_text"] = item["last_seen_location_text"]
            doc["last_seen_date"] = item["last_seen_date"]
            doc["contact_info"] = item.get("contact_info")
        else:
            doc["found_location_id"] = str(get_loc_id(item["found_location_name"])) if get_loc_id(item["found_location_name"]) else None
            doc["found_location_text"] = item["found_location_text"]
            doc["found_date"] = item["found_date"]
            doc["held_admin_location_id"] = str(get_loc_id(item["held_admin_location_name"])) if get_loc_id(item["held_admin_location_name"]) else None
            doc["held_freetext"] = item["held_freetext"]

        db.items.insert_one(doc)
        inserted += 1

    print(f"Items: {inserted} inserted.")


def main() -> None:
    app = create_app()
    with app.app_context():
        db = get_db()
        seed_items(db)
    print("Done.")


if __name__ == "__main__":
    main()
