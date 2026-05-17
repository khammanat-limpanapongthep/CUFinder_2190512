"""Idempotent seed for locations + admin users.

Run: `python -m backend.seed` from the repo root, or `python seed.py` from `backend/`.
Re-runs are safe — keyed on `name` (locations) and `email` (admins) with `$setOnInsert`,
so existing rows are never overwritten.
"""

from datetime import datetime, timezone

from app import create_app
from app.db import get_db

LOCATIONS = [
    "Mahachakri Sirindhorn Building",
    "Maha Vajiravudh Building",
    "Boromratchakumari Building",
    "Chamchuri 5",
    "Chamchuri 9",
    "Chaloem Rajakumari 60 Building",
    "Mahitaladhibesra Building",
    "Office of Academic Resources (Central Library)",
    "Faculty of Commerce & Accountancy",
    "Faculty of Engineering",
    "Faculty of Science",
    "Faculty of Arts",
    "Faculty of Law",
    "Faculty of Medicine",
    "Sala Phra Kiao",
    "MBK Center",
    "Siam Square",
    "CU Sports Complex",
    "Cafeteria (Sasa Patasala)",
    "CU Dorm",
]

ADMINS = [
    {
        "email": "library.admin@chula.ac.th",
        "display_name": "Library Admin",
        "role": "location_admin",
        "admin_location_name": "Office of Academic Resources (Central Library)",
    },
    {
        "email": "eng.admin@chula.ac.th",
        "display_name": "Engineering Admin",
        "role": "location_admin",
        "admin_location_name": "Faculty of Engineering",
    },
    {
        "email": "web.admin@chula.ac.th",
        "display_name": "Web Admin",
        "role": "web_admin",
        "admin_location_name": None,
    },
]


def seed_locations(db) -> None:
    now = datetime.now(timezone.utc)
    inserted = 0
    for name in LOCATIONS:
        result = db.locations.update_one(
            {"name": name},
            {
                "$setOnInsert": {
                    "name": name,
                    "is_dropoff": True,
                    "is_active": True,
                    "created_at": now,
                }
            },
            upsert=True,
        )
        if result.upserted_id is not None:
            inserted += 1
    print(f"Locations: {inserted} inserted, {len(LOCATIONS) - inserted} already present.")


def seed_admins(db) -> None:
    now = datetime.now(timezone.utc)
    inserted = 0
    for admin in ADMINS:
        loc_name = admin["admin_location_name"]
        if loc_name is None:
            admin_location_id = None
        else:
            loc = db.locations.find_one({"name": loc_name})
            if loc is None:
                raise RuntimeError(
                    f"Cannot seed admin {admin['email']}: location {loc_name!r} "
                    "missing. Run seed_locations first."
                )
            admin_location_id = loc["_id"]

        result = db.users.update_one(
            {"email": admin["email"]},
            {
                "$setOnInsert": {
                    "email": admin["email"],
                    "display_name": admin["display_name"],
                    "role": admin["role"],
                    "admin_location_id": admin_location_id,
                    "created_at": now,
                }
            },
            upsert=True,
        )
        if result.upserted_id is not None:
            inserted += 1
    print(f"Admins: {inserted} inserted, {len(ADMINS) - inserted} already present.")


def main() -> None:
    app = create_app()
    with app.app_context():
        db = get_db()
        seed_locations(db)
        seed_admins(db)
    print("Done.")


if __name__ == "__main__":
    main()
