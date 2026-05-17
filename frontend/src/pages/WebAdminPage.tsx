import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { itemsApi } from "../api/items";
import { locationsApi } from "../api/locations";
import { ApiError } from "../api/client-error";
import { useAuth } from "../auth/useAuth";
import type { Item, ItemStatus, Location } from "../types";
import { imageUrl } from "../api/client";
import styles from "./WebAdminPage.module.css";

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "claimed", label: "Claimed" },
  { value: "disposed", label: "Disposed" },
];

export default function WebAdminPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusFilter, setStatusFilter] = useState<ItemStatus>("open");
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [errorItems, setErrorItems] = useState<string | null>(null);

  const [newLocation, setNewLocation] = useState("");
  const [newLocationDropoff, setNewLocationDropoff] = useState(true);
  const [creatingLoc, setCreatingLoc] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const locationById = useMemo(() => {
    const map = new Map<string, Location>();
    for (const l of locations) map.set(l.id, l);
    return map;
  }, [locations]);

  const refreshLocations = () => {
    setLoadingLocations(true);
    locationsApi
      .list()
      .then(setLocations)
      .catch(() => setLocations([]))
      .finally(() => setLoadingLocations(false));
  };

  const refreshItems = () => {
    setLoadingItems(true);
    setErrorItems(null);
    itemsApi
      .list({ status: statusFilter, limit: 100 })
      .then((res) => setItems(res.items))
      .catch(() => setErrorItems("Could not load items."))
      .finally(() => setLoadingItems(false));
  };

  useEffect(() => {
    refreshLocations();
  }, []);

  useEffect(() => {
    refreshItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleStatus = async (id: string, status: ItemStatus) => {
    try {
      await itemsApi.setStatus(id, status);
      refreshItems();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    try {
      await itemsApi.remove(id);
      refreshItems();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  const handleCreateLocation = async (e: FormEvent) => {
    e.preventDefault();
    setLocError(null);
    if (!newLocation.trim()) {
      setLocError("Name is required");
      return;
    }
    setCreatingLoc(true);
    try {
      await locationsApi.create(newLocation.trim(), newLocationDropoff);
      setNewLocation("");
      setNewLocationDropoff(true);
      refreshLocations();
    } catch (err) {
      setLocError(err instanceof ApiError ? err.message : "Could not create location");
    } finally {
      setCreatingLoc(false);
    }
  };

  const toggleDropoff = async (loc: Location) => {
    try {
      await locationsApi.update(loc.id, { is_dropoff: !loc.is_dropoff });
      refreshLocations();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Update failed");
    }
  };

  const removeLocation = async (loc: Location) => {
    if (!confirm(`Remove "${loc.name}"? It will no longer appear in dropdowns.`)) return;
    try {
      await locationsApi.remove(loc.id);
      refreshLocations();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  const itemContext = (item: Item): string => {
    if (item.type === "lost") {
      const locName = item.last_seen_location_id
        ? locationById.get(item.last_seen_location_id)?.name
        : item.last_seen_location_text;
      return `Lost · last seen at ${locName ?? "unknown"}`;
    }
    const heldName = item.held_admin_location_id
      ? locationById.get(item.held_admin_location_id)?.name
      : item.held_freetext;
    return `Found · held at ${heldName ?? "unknown"}`;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Site admin</h1>
        <p className={styles.subtitle}>
          Welcome, {user?.display_name}. You can manage campus locations and moderate any
          listing on the site.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Campus locations</h2>
        </div>
        <p className={styles.hint}>
          Locations appear in the dropdowns when posting. Drop-off locations are listed
          when a finder picks where to leave the item.
        </p>

        <form onSubmit={handleCreateLocation} className={styles.locForm}>
          <input
            className={styles.locInput}
            placeholder="New location name"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={newLocationDropoff}
              onChange={(e) => setNewLocationDropoff(e.target.checked)}
            />
            <span>Drop-off point</span>
          </label>
          <button type="submit" className={styles.btnPrimary} disabled={creatingLoc}>
            {creatingLoc ? "Adding…" : "Add"}
          </button>
        </form>
        {locError && <p className={styles.error}>{locError}</p>}

        {loadingLocations ? (
          <p className={styles.placeholder}>Loading locations…</p>
        ) : (
          <ul className={styles.locList}>
            {locations.map((loc) => (
              <li key={loc.id} className={styles.locRow}>
                <span className={styles.locName}>{loc.name}</span>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={loc.is_dropoff}
                    onChange={() => toggleDropoff(loc)}
                  />
                  <span className={styles.checkboxLabel}>Drop-off</span>
                </label>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={() => removeLocation(loc)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>All listings</h2>
          <select
            className={styles.statusSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ItemStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <p className={styles.hint}>
          Site admin can moderate any listing across all locations.
        </p>

        {loadingItems ? (
          <p className={styles.placeholder}>Loading…</p>
        ) : errorItems ? (
          <p className={styles.error}>{errorItems}</p>
        ) : items.length === 0 ? (
          <p className={styles.empty}>No {statusFilter} items.</p>
        ) : (
          <ul className={styles.itemList}>
            {items.map((item) => (
              <li key={item.id} className={styles.itemRow}>
                <Link to={`/items/${item.id}`} className={styles.itemThumbWrap}>
                  {imageUrl(item.image_id) ? (
                    <img
                      src={imageUrl(item.image_id)}
                      alt=""
                      className={styles.itemThumb}
                    />
                  ) : (
                    <div className={styles.itemThumbPlaceholder}>
                      {item.category[0] ?? "?"}
                    </div>
                  )}
                </Link>
                <div className={styles.itemInfo}>
                  <Link to={`/items/${item.id}`} className={styles.itemTitle}>
                    {item.title}
                  </Link>
                  <p className={styles.itemMeta}>
                    {itemContext(item)} &middot; {item.category} &middot; Posted by{" "}
                    {item.posted_by.display_name}
                  </p>
                </div>
                <div className={styles.itemActions}>
                  {statusFilter === "open" && (
                    <>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => handleStatus(item.id, "claimed")}
                      >
                        Claimed
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => handleStatus(item.id, "disposed")}
                      >
                        Disposed
                      </button>
                    </>
                  )}
                  {statusFilter !== "open" && (
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => handleStatus(item.id, "open")}
                    >
                      Reopen
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
