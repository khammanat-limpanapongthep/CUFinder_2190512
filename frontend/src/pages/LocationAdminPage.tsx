import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { itemsApi } from "../api/items";
import { locationsApi } from "../api/locations";
import { ApiError } from "../api/client-error";
import { useAuth } from "../auth/useAuth";
import type { Item, ItemStatus, Location } from "../types";
import { imageUrl } from "../api/client";
import styles from "./LocationAdminPage.module.css";

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "claimed", label: "Claimed" },
  { value: "disposed", label: "Disposed" },
];

export default function LocationAdminPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusFilter, setStatusFilter] = useState<ItemStatus>("open");
  const [loadingItems, setLoadingItems] = useState(true);
  const [errorItems, setErrorItems] = useState<string | null>(null);

  const myLocation = user?.admin_location_id
    ? locations.find((l) => l.id === user.admin_location_id)
    : undefined;

  const refreshItems = () => {
    setLoadingItems(true);
    setErrorItems(null);
    itemsApi
      .list({ status: statusFilter })
      .then((res) => {
        const mine = res.items.filter(
          (i) =>
            i.type === "found" && i.held_admin_location_id === user?.admin_location_id,
        );
        setItems(mine);
      })
      .catch(() => setErrorItems("Could not load items."))
      .finally(() => setLoadingItems(false));
  };

  useEffect(() => {
    locationsApi
      .list()
      .then(setLocations)
      .catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    refreshItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, user?.admin_location_id]);

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Location admin</h1>
        <p className={styles.subtitle}>
          Welcome, {user?.display_name}. Your location:{" "}
          <strong>{myLocation?.name ?? "Unassigned"}</strong>
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Items at your location</h2>
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

        {loadingItems ? (
          <p className={styles.placeholder}>Loading…</p>
        ) : errorItems ? (
          <p className={styles.error}>{errorItems}</p>
        ) : items.length === 0 ? (
          <p className={styles.empty}>No {statusFilter} items at your location.</p>
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
                    {item.category} &middot; Posted by {item.posted_by.display_name}
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
