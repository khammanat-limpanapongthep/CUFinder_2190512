import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { itemsApi } from "../api/items";
import { locationsApi } from "../api/locations";
import { useAuth } from "../auth/useAuth";
import ItemCard from "../components/ItemCard/ItemCard";
import { CATEGORIES, type Item, type ItemListQuery, type ItemType, type Location } from "../types";
import styles from "./HomePage.module.css";

type TypeFilter = "all" | ItemType;

export default function HomePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const typeFilter = (searchParams.get("type") ?? "all") as TypeFilter;
  const category = searchParams.get("category") ?? "";
  const locationId = searchParams.get("location_id") ?? "";
  const q = searchParams.get("q") ?? "";
  const dateFrom = searchParams.get("date_from") ?? "";
  const dateTo = searchParams.get("date_to") ?? "";

  const [searchInput, setSearchInput] = useState(q);

  const locationLookup = useMemo(() => {
    const m = new Map<string, Location>();
    for (const l of locations) m.set(l.id, l);
    return m;
  }, [locations]);

  useEffect(() => {
    locationsApi.list().then(setLocations).catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const query: ItemListQuery = {
      type: typeFilter === "all" ? undefined : typeFilter,
      category: category || undefined,
      location_id: locationId || undefined,
      q: q || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status: "open",
    };
    itemsApi
      .list(query)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Could not load items. Try refreshing.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [typeFilter, category, locationId, q, dateFrom, dateTo]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value && value.length > 0) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setParam("q", searchInput.trim() || null);
  };

  const clearAll = () => {
    setSearchParams({}, { replace: true });
    setSearchInput("");
  };

  const hasFilters = typeFilter !== "all" || category || locationId || q || dateFrom || dateTo;

  return (
    <div>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>Lost something? Found something?</h1>
          <p>Search what's been turned in, or post your own report — all on campus.</p>
        </div>
        <div className={styles.heroActions}>
          <Link to={user ? "/post/lost" : "/login"} className={styles.ctaPrimary}>
            Post lost item
          </Link>
          <Link to={user ? "/post/found" : "/login"} className={styles.ctaSecondary}>
            Post found item
          </Link>
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.typeToggle} role="tablist">
          {(["all", "lost", "found"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={typeFilter === t}
              onClick={() => setParam("type", t === "all" ? null : t)}
              className={`${styles.typeBtn} ${typeFilter === t ? styles.typeActive : ""}`}
            >
              {t === "all" ? "All" : t === "lost" ? "Lost" : "Found"}
            </button>
          ))}
        </div>

        <form className={styles.searchRow} onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Search by keyword…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.search}
          />
          <button type="submit" className={styles.searchBtn}>
            Search
          </button>
        </form>

        <div className={styles.filterRow}>
          <select
            className={styles.filter}
            value={category}
            onChange={(e) => setParam("category", e.target.value || null)}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className={styles.filter}
            value={locationId}
            onChange={(e) => setParam("location_id", e.target.value || null)}
          >
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            className={styles.filter}
            value={dateFrom}
            onChange={(e) => setParam("date_from", e.target.value || null)}
            aria-label="From date"
          />
          <input
            type="date"
            className={styles.filter}
            value={dateTo}
            onChange={(e) => setParam("date_to", e.target.value || null)}
            aria-label="To date"
          />

          {hasFilters && (
            <button type="button" className={styles.clearBtn} onClick={clearAll}>
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className={styles.results}>
        <div className={styles.resultHeader}>
          <p className={styles.resultCount}>
            {loading ? "Loading…" : `${total} item${total === 1 ? "" : "s"}`}
          </p>
        </div>
        {error ? (
          <p className={styles.error}>{error}</p>
        ) : loading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton} aria-hidden="true" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <h2>No items match your filters.</h2>
            <p>Try adjusting your search, or post a new report.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} locationLookup={locationLookup} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
