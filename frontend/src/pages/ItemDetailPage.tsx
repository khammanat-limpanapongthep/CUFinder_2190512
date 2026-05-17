import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { itemsApi } from "../api/items";
import { locationsApi } from "../api/locations";
import { imageUrl } from "../api/client";
import { ApiError } from "../api/client-error";
import { useAuth } from "../auth/useAuth";
import type { Item, ItemStatus, Location } from "../types";
import styles from "./ItemDetailPage.module.css";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatRelative(iso: string): string {
  try {
    const date = new Date(iso);
    const days = Math.floor((Date.now() - date.getTime()) / (24 * 3600 * 1000));
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    return formatDate(iso);
  } catch {
    return iso;
  }
}

const STATUS_LABELS: Record<ItemStatus, string> = {
  open: "Open",
  claimed: "Claimed",
  disposed: "Disposed",
};

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [locations, setLocations] = useState<Map<string, Location>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([itemsApi.get(id), locationsApi.list()])
      .then(([fetchedItem, locs]) => {
        if (cancelled) return;
        setItem(fetchedItem);
        const m = new Map<string, Location>();
        for (const l of locs) m.set(l.id, l);
        setLocations(m);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setError("This item was not found. It may have been removed.");
        } else {
          setError("Could not load item.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const setStatus = async (status: ItemStatus) => {
    if (!item) return;
    setActioning(true);
    try {
      const updated = await itemsApi.setStatus(item.id, status);
      setItem(updated);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not update status.");
    } finally {
      setActioning(false);
    }
  };

  const remove = async () => {
    if (!item) return;
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setActioning(true);
    try {
      await itemsApi.remove(item.id);
      navigate("/");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not delete item.");
      setActioning(false);
    }
  };

  if (loading) {
    return <p className={styles.placeholder}>Loading…</p>;
  }
  if (error || !item) {
    return (
      <div className={styles.errorState}>
        <h2>Couldn't load item</h2>
        <p>{error ?? "Unknown error."}</p>
        <Link to="/" className={styles.backLink}>
          &larr; Back to browse
        </Link>
      </div>
    );
  }

  const photo = imageUrl(item.image_id);

  const isOwner = user?.id === item.posted_by.id;
  const isLocationAdminForItem =
    user?.role === "location_admin" &&
    item.type === "found" &&
    item.held_admin_location_id === user.admin_location_id;
  const isWebAdmin = user?.role === "web_admin";
  const canModerate = isWebAdmin || isLocationAdminForItem;

  let primaryLocation = "—";
  let primaryLocationLabel = "";
  let secondaryRow: { label: string; value: string } | null = null;

  if (item.type === "lost") {
    primaryLocationLabel = "Last seen at";
    primaryLocation = item.last_seen_location_id
      ? locations.get(item.last_seen_location_id)?.name ?? "—"
      : item.last_seen_location_text ?? "—";
  } else {
    primaryLocationLabel = "Found at";
    primaryLocation = item.found_location_id
      ? locations.get(item.found_location_id)?.name ?? "—"
      : item.found_location_text ?? "—";
    const heldName = item.held_admin_location_id
      ? locations.get(item.held_admin_location_id)?.name ?? "—"
      : item.held_freetext ?? "—";
    secondaryRow = { label: "Currently held at", value: heldName };
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>
        &larr; Back to browse
      </Link>

      <div className={styles.layout}>
        <div className={styles.media}>
          {photo ? (
            <img src={photo} alt={item.title} className={styles.image} />
          ) : (
            <div className={styles.imagePlaceholder}>
              <span>{item.category[0] ?? "?"}</span>
            </div>
          )}
        </div>

        <div className={styles.info}>
          <div className={styles.badges}>
            <span
              className={`${styles.badge} ${
                item.type === "lost" ? styles.badgeLost : styles.badgeFound
              }`}
            >
              {item.type === "lost" ? "Lost" : "Found"}
            </span>
            <span className={`${styles.badge} ${styles.statusBadge}`}>
              {STATUS_LABELS[item.status]}
            </span>
            <span className={styles.categoryChip}>{item.category}</span>
          </div>

          <h1 className={styles.title}>{item.title}</h1>
          <p className={styles.posted}>
            Posted by {item.posted_by.display_name} &middot; {formatRelative(item.posted_at)}
          </p>

          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Description</h2>
            <p className={styles.description}>{item.description}</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Details</h2>
            <dl className={styles.dl}>
              <div className={styles.dlRow}>
                <dt>{primaryLocationLabel}</dt>
                <dd>{primaryLocation}</dd>
              </div>
              {secondaryRow && (
                <div className={styles.dlRow}>
                  <dt>{secondaryRow.label}</dt>
                  <dd>
                    <span className={styles.heldHighlight}>{secondaryRow.value}</span>
                  </dd>
                </div>
              )}
              <div className={styles.dlRow}>
                <dt>{item.type === "lost" ? "Last seen on" : "Found on"}</dt>
                <dd>
                  {formatDate(
                    item.type === "lost" ? item.last_seen_date : item.found_date,
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {item.type === "lost" && item.contact_info && (
            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>How to reach the owner</h2>
              <p className={styles.contactBlock}>{item.contact_info}</p>
              <p className={styles.privacyNote}>
                Posted by the owner. Email addresses are never shown.
              </p>
            </section>
          )}

          {item.type === "found" && (
            <section className={styles.tipBox}>
              <strong>If this is yours:</strong> visit the location above to retrieve it. Bring
              your CU ID for verification.
            </section>
          )}

          {canModerate && item.status === "open" && (
            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>Admin actions</h2>
              <p className={styles.hint}>
                {isWebAdmin
                  ? "Site admin can moderate any listing."
                  : "You manage items held at your assigned location."}
              </p>
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.actionBtnPrimary}
                  disabled={actioning}
                  onClick={() => setStatus("claimed")}
                >
                  Mark as claimed
                </button>
                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  disabled={actioning}
                  onClick={() => setStatus("disposed")}
                >
                  Mark as disposed
                </button>
                <button
                  type="button"
                  className={styles.actionBtnDanger}
                  disabled={actioning}
                  onClick={remove}
                >
                  Delete
                </button>
              </div>
            </section>
          )}

          {isOwner && !canModerate && item.status === "open" && (
            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>My post</h2>
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.actionBtnPrimary}
                  disabled={actioning}
                  onClick={() => setStatus("claimed")}
                >
                  Mark as claimed
                </button>
                <button
                  type="button"
                  className={styles.actionBtnDanger}
                  disabled={actioning}
                  onClick={remove}
                >
                  Delete my post
                </button>
              </div>
            </section>
          )}

          {isOwner && !canModerate && item.status !== "open" && (
            <section className={styles.section}>
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.actionBtnDanger}
                  disabled={actioning}
                  onClick={remove}
                >
                  Delete my post
                </button>
              </div>
            </section>
          )}

          {user?.role === "location_admin" &&
            item.type === "found" &&
            !isLocationAdminForItem &&
            item.held_admin_location_id && (
              <p className={styles.adminHint}>
                This item is held at a different location. Only that location's admin or the
                site admin can change its status.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
