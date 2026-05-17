import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { itemsApi } from "../api/items";
import { locationsApi } from "../api/locations";
import { ApiError } from "../api/client-error";
import { CATEGORIES, type Location } from "../types";
import ImageUpload from "../components/ImageUpload/ImageUpload";
import styles from "./FormPage.module.css";

const OTHER_LOC = "__other__";

export default function PostLostPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [imageId, setImageId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [locId, setLocId] = useState<string>("");
  const [locText, setLocText] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [contactInfo, setContactInfo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    locationsApi.list().then(setLocations).catch(() => setLocations([]));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim() || !category || !date) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!locId && !locText.trim()) {
      setError("Please pick a last seen location or specify one.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await itemsApi.create({
        type: "lost",
        title: title.trim(),
        description: description.trim(),
        category,
        image_id: imageId,
        last_seen_location_id: locId && locId !== OTHER_LOC ? locId : null,
        last_seen_location_text: locId && locId !== OTHER_LOC ? null : locText.trim() || null,
        last_seen_date: date,
        contact_info: contactInfo.trim() || null,
      });
      navigate(`/items/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Could not post the item. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Report a lost item</h1>
        <p className={styles.subtitle}>
          Share details so anyone who finds it knows it's yours.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.field}>
          <label className={styles.label}>Photo (optional)</label>
          <ImageUpload imageId={imageId} onChange={setImageId} />
        </div>

        <div className={styles.field}>
          <label htmlFor="title" className={styles.label}>
            Title <span className={styles.required}>*</span>
          </label>
          <input
            id="title"
            className={styles.input}
            placeholder="e.g. Black AirPods Pro case"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="description" className={styles.label}>
            Description <span className={styles.required}>*</span>
          </label>
          <textarea
            id="description"
            className={styles.textarea}
            placeholder="Distinguishing features, last known state, anything that helps identify it…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="category" className={styles.label}>
              Category <span className={styles.required}>*</span>
            </label>
            <select
              id="category"
              className={styles.input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="date" className={styles.label}>
              Last seen date <span className={styles.required}>*</span>
            </label>
            <input
              id="date"
              type="date"
              className={styles.input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="loc" className={styles.label}>
            Last seen location <span className={styles.required}>*</span>
          </label>
          <select
            id="loc"
            className={styles.input}
            value={locId}
            onChange={(e) => setLocId(e.target.value)}
            required
          >
            <option value="" disabled>
              Pick a place on campus
            </option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
            <option value={OTHER_LOC}>Other (specify)</option>
          </select>
          {locId === OTHER_LOC && (
            <input
              className={`${styles.input} ${styles.inputBelow}`}
              placeholder="Where exactly did you last see it?"
              value={locText}
              onChange={(e) => setLocText(e.target.value)}
              required
            />
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact" className={styles.label}>
            How to reach you <span className={styles.optional}>(optional)</span>
          </label>
          <p className={styles.hint}>
            Anything you're comfortable sharing — e.g. an Instagram handle or LINE ID. Your email
            is never shown publicly.
          </p>
          <input
            id="contact"
            className={styles.input}
            placeholder="e.g. DM @yourhandle on IG"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            maxLength={200}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Posting…" : "Post lost item"}
          </button>
        </div>
      </form>
    </div>
  );
}
