# CUFinder Backend

Flask + MongoDB API for the CUFinder lost-and-found app. See `../docs/api.md` for the API contract.

## Prerequisites

- Python 3.11+
- A local MongoDB (default `mongodb://localhost:27017/cufinder`) **or** a MongoDB Atlas connection string
- Google OAuth credentials (Client ID, Client Secret) — create at Google Cloud Console

## Setup

```bash
# from backend/
python -m venv .venv

# activate the venv:
#   PowerShell:   .venv\Scripts\Activate.ps1
#   cmd:          .venv\Scripts\activate.bat
#   Git Bash/sh:  source .venv/Scripts/activate
#   macOS/Linux:  source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env       # then edit .env with your real values
```

`.env` is gitignored. At minimum fill in `MONGODB_URI`, `SESSION_SECRET`, and the three `GOOGLE_*` values.

## Run the dev server

```bash
flask --app app run --debug --port 5001
```

Port **5001** is required — the Google OAuth redirect URI and the Vite dev proxy both expect it.

Smoke-test it:

```bash
curl http://localhost:5001/api/health
# → {"status":"ok"}
```

## Seed data

Populates the 20 default locations and the seed admin accounts. Idempotent — safe to re-run.

```bash
python seed.py
```

Admin emails (override in `seed.py` before demo so you can actually log in):

- `library.admin@chula.ac.th` — location admin for the central library
- `eng.admin@chula.ac.th` — location admin for the engineering faculty
- `web.admin@chula.ac.th` — global web admin

## Tests

```bash
pytest                 # from backend/
pytest tests/test_email_regex.py -v     # single file
```

Tests use an in-memory GridFS stub (`tests/conftest.py`) and don't require a running Mongo or real auth session.

## Project layout

```
backend/
├── app/
│   ├── __init__.py        # create_app() factory
│   ├── config.py          # Dev/Prod config classes
│   ├── db.py              # MongoClient + GridFSBucket helpers
│   ├── errors.py          # AppError hierarchy + global handlers
│   ├── auth/              # Google OAuth, session, guards
│   ├── items/             # lost/found item CRUD
│   ├── locations/         # location admin CRUD
│   └── images/            # GridFS upload + download
├── tests/                 # pytest suite
├── seed.py                # idempotent data seed
├── requirements.txt
└── .env.example
```

## Conventions

- Format with `black`; lint with `ruff`.
- Error responses always follow `{"error": {"code": "...", "message": "..."}}` (see `app/errors.py`).
- Never bypass `app/auth/guards.py` — every protected route uses `require_user()`, `require_web_admin()`, or `require_any_admin()`.
