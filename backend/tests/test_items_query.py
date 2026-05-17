"""Unit tests for the real `_build_filter` used by GET /api/items.

Imports the production builder so regressions in filter construction are caught.
A plain dict suffices because the builder only calls `.get(key, default)`.
"""

import re

from app.items.routes import _build_filter


def test_default_only_status_open():
    f = _build_filter({})
    assert f == {"status": "open"}


def test_status_passthrough_when_valid():
    assert _build_filter({"status": "claimed"}) == {"status": "claimed"}
    assert _build_filter({"status": "disposed"}) == {"status": "disposed"}


def test_invalid_status_falls_back_to_open():
    assert _build_filter({"status": "bogus"}) == {"status": "open"}


def test_type_filter_added():
    f = _build_filter({"type": "lost"})
    assert {"type": "lost"} in f["$and"]
    assert {"status": "open"} in f["$and"]


def test_invalid_type_is_dropped():
    # Anything other than "lost"/"found" should not appear in the filter
    f = _build_filter({"type": "garbage"})
    assert f == {"status": "open"}


def test_category_filter_added():
    f = _build_filter({"category": "Electronics"})
    assert {"category": "Electronics"} in f["$and"]


def test_location_filter_matches_lost_or_found():
    f = _build_filter({"location_id": "loc123"})
    or_clause = next(c for c in f["$and"] if "$or" in c)
    assert {"last_seen_location_id": "loc123"} in or_clause["$or"]
    assert {"found_location_id": "loc123"} in or_clause["$or"]


def test_search_q_is_regex_escaped():
    # Regex metachars in user input must not act as regex
    f = _build_filter({"q": "wallet.+"})
    or_clause = next(c for c in f["$and"] if "$or" in c)
    title_clause = next(c for c in or_clause["$or"] if "title" in c)
    assert title_clause["title"]["$regex"] == re.escape("wallet.+")
    assert title_clause["title"]["$options"] == "i"


def test_date_from_applies_to_both_date_fields():
    f = _build_filter({"date_from": "2026-05-01"})
    or_clause = next(c for c in f["$and"] if "$or" in c)
    assert {"last_seen_date": {"$gte": "2026-05-01"}} in or_clause["$or"]
    assert {"found_date": {"$gte": "2026-05-01"}} in or_clause["$or"]


def test_date_to_applies_to_both_date_fields():
    f = _build_filter({"date_to": "2026-05-31"})
    or_clause = next(c for c in f["$and"] if "$or" in c)
    assert {"last_seen_date": {"$lte": "2026-05-31"}} in or_clause["$or"]
    assert {"found_date": {"$lte": "2026-05-31"}} in or_clause["$or"]


def test_combined_filters_all_appear():
    f = _build_filter(
        {
            "type": "found",
            "category": "Keys",
            "status": "open",
            "q": "blue",
        }
    )
    assert {"type": "found"} in f["$and"]
    assert {"category": "Keys"} in f["$and"]
    assert {"status": "open"} in f["$and"]
    assert any("$or" in c for c in f["$and"])
