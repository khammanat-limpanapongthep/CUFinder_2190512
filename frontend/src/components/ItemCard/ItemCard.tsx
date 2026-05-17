import { Link } from "react-router-dom";
import { imageUrl } from "../../api/client";
import type { Item, Location } from "../../types";
import styles from "./ItemCard.module.css";

interface Props {
  item: Item;
  locationLookup: Map<string, Location>;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function getLocationName(item: Item, lookup: Map<string, Location>): string {
  if (item.type === "lost") {
    return item.last_seen_location_id
      ? lookup.get(item.last_seen_location_id)?.name ?? "—"
      : item.last_seen_location_text ?? "—";
  }
  return item.found_location_id
    ? lookup.get(item.found_location_id)?.name ?? "—"
    : item.found_location_text ?? "—";
}

function getDate(item: Item): string {
  return item.type === "lost" ? item.last_seen_date : item.found_date;
}

export default function ItemCard({ item, locationLookup }: Props) {
  const photo = imageUrl(item.image_id);
  const locationName = getLocationName(item, locationLookup);
  const dateLabel = item.type === "lost" ? "Last seen" : "Found";

  return (
    <Link to={`/items/${item.id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        {photo ? (
          <img src={photo} alt={item.title} className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true">
            <span>{item.category[0] ?? "?"}</span>
          </div>
        )}
        <span
          className={`${styles.badge} ${
            item.type === "lost" ? styles.badgeLost : styles.badgeFound
          }`}
        >
          {item.type === "lost" ? "Lost" : "Found"}
        </span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.meta}>
          <span className={styles.category}>{item.category}</span>
        </p>
        <p className={styles.meta}>
          <span className={styles.metaLabel}>{dateLabel}:</span> {locationName}
        </p>
        <p className={styles.meta}>
          <span className={styles.metaLabel}>Date:</span> {formatDate(getDate(item))}
        </p>
      </div>
    </Link>
  );
}
