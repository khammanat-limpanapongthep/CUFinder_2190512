# CUFinder — API Contract (v1)

REST + JSON. The frontend builds against this; the backend implements against this. Changes require both sides to agree.

Base URL: `/api`

---

## Conventions

- **Content type:** `application/json` unless explicitly multipart.
- **Auth:** signed session cookie set on login (HttpOnly, SameSite=Lax). No Authorization header.
- **Timestamps:** ISO-8601 UTC strings (`2026-04-25T10:00:00Z`).
- **IDs:** MongoDB ObjectId strings (24 hex chars).
- **Error response shape** (all non-2xx):
  ```json
  { "error": { "code": "string", "message": "human readable" } }
  ```
- **Standard error codes:** `unauthenticated`, `forbidden`, `not_found`, `validation_failed`, `conflict`, `internal_error`.

## CU email regex (locked)

```
^[^@\s]+@(student\.)?chula\.ac\.th$
```

Backend enforces this regex against the email returned by Google OAuth. The `hd=chula.ac.th` domain hint sent to Google is not trusted on its own.

## Categories (frontend constant, not from API)

`ID Cards`, `Electronics`, `Wallet & Cards`, `Keys`, `Bags & Backpacks`, `Books & Stationery`, `Clothing & Accessories`, `Water Bottles`, `Other`

---

## Resource shapes

### User
```json
{
  "id": "string",
  "email": "string",
  "display_name": "string",
  "role": "user" | "location_admin" | "web_admin",
  "admin_location_id": "string | null"
}
```

`admin_location_id` is set only for `location_admin` users (the location they admin). For `user` and `web_admin` it is always `null`.

#### Roles
- **`user`** — regular CU member. Can post lost/found items and browse.
- **`location_admin`** — admin of a single physical drop-off location. Can moderate `found` items held at their location (status changes, delete). Cannot manage locations.
- **`web_admin`** — site-wide admin. Manages campus locations (add/edit/remove, toggle drop-off) and can moderate any listing on the site.

### Location
```json
{
  "id": "string",
  "name": "string",
  "is_dropoff": true,
  "is_active": true,
  "created_at": "ISO-8601"
}
```

### Item

Common fields:
```json
{
  "id": "string",
  "type": "lost" | "found",
  "title": "string",
  "description": "string",
  "category": "string (one of the category constants)",
  "image_id": "string | null",
  "status": "open" | "claimed" | "disposed",
  "posted_by": { "id": "string", "display_name": "string" },
  "posted_at": "ISO-8601"
}
```

When `type = "lost"`, additional fields:
```json
{
  "last_seen_location_id": "string | null",
  "last_seen_location_text": "string | null",
  "last_seen_date": "ISO-8601 (date only ok)",
  "contact_info": "string | null"
}
```
Exactly one of `last_seen_location_id` or `last_seen_location_text` must be set. `contact_info` is poster-controlled freetext (e.g. "DM @handle on IG"). Email is never auto-included.

When `type = "found"`, additional fields:
```json
{
  "found_location_id": "string | null",
  "found_location_text": "string | null",
  "found_date": "ISO-8601 (date only ok)",
  "held_admin_location_id": "string | null",
  "held_freetext": "string | null"
}
```
Exactly one of `found_location_id` or `found_location_text` must be set. Same rule for the `held_*` pair.

---

## Endpoints

### Auth

Login is **Google OAuth** restricted to the CU email domain. The browser drives the flow via two redirects; the backend sets the session cookie on the callback and bounces back to the frontend.

#### `GET /api/auth/google`
Starts the OAuth flow. Generates a CSRF `state`, stashes it in the session, and `302`-redirects to Google's authorization URL with `scope=openid email profile` and `hd=chula.ac.th` as a domain hint.

#### `GET /api/auth/callback`
Google redirects here with `?code=...&state=...`. Backend:
1. Verifies `state` matches the session value (CSRF guard).
2. Exchanges the code for an access token (server-to-server call to Google).
3. Fetches the userinfo and matches the email against the CU regex.
4. Upserts the user by email (`$setOnInsert` so seeded admin roles survive re-login).
5. Sets `session["user_id"]` and `302`-redirects to `FRONTEND_ORIGIN`.

On any failure, redirects to `FRONTEND_ORIGIN/login?error=<code>` where `<code>` is one of `invalid_state`, `access_denied`, `no_code`, `token_failed`, `userinfo_failed`, `not_cu_email`.

#### `POST /api/auth/logout`
Clears the session cookie. Always `204 No Content`.

#### `GET /api/auth/me`
Returns the current `User`, or `401 unauthenticated` if no session.

---

### Items

#### `GET /api/items`
List items with optional filters.

Query parameters (all optional):
| param | type | notes |
|---|---|---|
| `type` | `lost` \| `found` | filter by type |
| `category` | string | one of the category constants |
| `location_id` | string | matches `last_seen_location_id` or `found_location_id` |
| `q` | string | substring match on `title` + `description` |
| `date_from` | ISO date | inclusive |
| `date_to` | ISO date | inclusive |
| `status` | `open` \| `claimed` \| `disposed` | default `open` |
| `limit` | int | default 30, max 100 |
| `skip` | int | for pagination |

Response `200 OK`:
```json
{
  "items": [Item, ...],
  "total": 42
}
```

#### `GET /api/items/:id`
Returns a single `Item`. `404 not_found` if missing.

#### `POST /api/items`
Create a lost or found item. Requires authenticated user.

Request body matches the `Item` shape minus server-set fields (`id`, `posted_by`, `posted_at`, `status`). `image_id` should reference a previously uploaded image.

Responses:
- `201 Created` → returns the created `Item`.
- `400 validation_failed` → bad shape.
- `401 unauthenticated`.

#### `PATCH /api/items/:id/status`
Admin only. Updates item status.

Authorization:
- `web_admin` may update any item.
- `location_admin` may only update `found` items whose `held_admin_location_id` matches their `admin_location_id`.

Request:
```json
{ "status": "claimed" | "disposed" | "open" }
```

Responses:
- `200 OK` → returns updated `Item`.
- `403 forbidden` → caller is not an admin, or is a `location_admin` whose location does not match the item.
- `404 not_found`.

#### `DELETE /api/items/:id`
Admin only. Soft-deletes (moderation). Returns `204 No Content`. Same authorization rules as `PATCH /api/items/:id/status`.

---

### Images (GridFS)

#### `POST /api/images`
Upload a single image. Multipart form data, field name `file`. Requires authenticated user.

Constraints:
- Max size: 5 MB
- Allowed mime types: `image/jpeg`, `image/png`, `image/webp`

Response `201 Created`:
```json
{ "id": "string" }
```

Errors:
- `400 validation_failed` → bad mime type or oversized.
- `401 unauthenticated`.

#### `GET /api/images/:id`
Streams the image bytes with appropriate `Content-Type`. `404 not_found` if missing. Public — no auth required (so listings can render).

---

### Locations

#### `GET /api/locations`
Public list of active campus locations for dropdowns.

Response `200 OK`:
```json
{ "locations": [Location, ...] }
```

#### `POST /api/locations`
Web admin only. Create a new location.

Request:
```json
{ "name": "string", "is_dropoff": true }
```

Response `201 Created` → returns the new `Location`.

Errors: `403 forbidden` (caller is not `web_admin`), `409 conflict` (duplicate name).

#### `PATCH /api/locations/:id`
Web admin only. Edit name, is_dropoff, or is_active. Body is partial.

Response `200 OK` → updated `Location`. `403 forbidden` if caller is not `web_admin`.

#### `DELETE /api/locations/:id`
Web admin only. Soft-delete (sets `is_active=false`). `204 No Content`. `403 forbidden` if caller is not `web_admin`.

---

## Seed data (initial Locations)

The backend should seed these on first run. Admins can edit/add later.

```
Mahachakri Sirindhorn Building
Maha Vajiravudh Building
Boromratchakumari Building
Chamchuri 5
Chamchuri 9
Chaloem Rajakumari 60 Building
Mahitaladhibesra Building
Office of Academic Resources (Central Library)
Faculty of Commerce & Accountancy
Faculty of Engineering
Faculty of Science
Faculty of Arts
Faculty of Law
Faculty of Medicine
Sala Phra Kiao
MBK Center
Siam Square
CU Sports Complex
Cafeteria (Sasa Patasala)
CU Dorm
```

All seeded with `is_dropoff = true` initially. Admins can flip the flag.

## Seed data (initial Admins)

Seed admin emails for development:

**Location admins** (`role = "location_admin"`):
- `library.admin@chula.ac.th` → admin at "Office of Academic Resources (Central Library)"
- `eng.admin@chula.ac.th` → admin at "Faculty of Engineering"

**Web admin** (`role = "web_admin"`, `admin_location_id = null`):
- `web.admin@chula.ac.th`

These accounts need to be real CU Google accounts to actually log in. Swap any placeholder for a team member's real `@chula.ac.th` email before demo so admin roles can be exercised.
