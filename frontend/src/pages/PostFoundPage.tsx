import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { itemsApi } from "../api/items";
import { locationsApi } from "../api/locations";
import { ApiError } from "../api/client-error";
import { CATEGORIES, type Location } from "../types";
import ImageUpload from "../components/ImageUpload/ImageUpload";
import styles from "./FormPage.module.css";

const OTHER_LOC = "__other__";
const HELD_FREETEXT = "__freetext__";

export default function PostFoundPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [imageId, setImageId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [foundLocId, setFoundLocId] = useState<string>("");
  const [foundLocText, setFoundLocText] = useState<string>("");
  const [foundDate, setFoundDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [heldChoice, setHeldChoice] = useState<string>("");
  const [heldFreetext, setHeldFreetext] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    locationsApi.list().then(setLocations).catch(() => setLocations([]));
  }, []);

  const dropoffs = locations.filter((l) => l.is_dropoff);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim() || !category || !foundDate) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!foundLocId && !foundLocText.trim()) {
      setError("Please pick or enter where you found it.");
      return;
    }
    if (!heldChoice || (heldChoice === HELD_FREETEXT && !heldFreetext.trim())) {
      setError("Please tell us where the item is currently held.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await itemsApi.create({
        type: "found",
        title: title.trim(),
        description: description.trim(),
        category,
        image_id: imageId,
        found_location_id: foundLocId && foundLocId !== OTHER_LOC ? foundLocId : null,
        found_location_text:
          foundLocId && foundLocId !== OTHER_LOC ? null : foundLocText.trim() || null,
        found_date: foundDate,
        held_admin_location_id: heldChoice === HELD_FREETEXT ? null : heldChoice,
        held_freetext: heldChoice === HELD_FREETEXT ? heldFreetext.trim() : null,
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
        <h1>Report a found item</h1>
        <p className={styles.subtitle}>
          Help reunite items with their owners. The owner will see where they can pick it up.
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
            placeholder="e.g. Blue water bottle"
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
            placeholder="Describe what it looks like, any markings, the condition…"
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
            <label htmlFor="foundDate" className={styles.label}>
              Found date <span className={styles.required}>*</span>
            </label>
            <input
              id="foundDate"
              type="date"
              className={styles.input}
              value={foundDate}
              onChange={(e) => setFoundDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="foundLoc" className={styles.label}>
            Where did you find it? <span className={styles.required}>*</span>
          </label>
          <select
            id="foundLoc"
            className={styles.input}
            value={foundLocId}
            onChange={(e) => setFoundLocId(e.target.value)}
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
          {foundLocId === OTHER_LOC && (
            <input
              className={`${styles.input} ${styles.inputBelow}`}
              placeholder="Where exactly did you find it?"
              value={foundLocText}
              onChange={(e) => setFoundLocText(e.target.value)}
              required
            />
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="held" className={styles.label}>
            Where is it being held? <span className={styles.required}>*</span>
          </label>
          <p className={styles.hint}>
            Drop it off at a campus admin desk if you can — owners will retrieve it there.
          </p>
          <select
            id="held"
            className={styles.input}
            value={heldChoice}
            onChange={(e) => setHeldChoice(e.target.value)}
            required
          >
            <option value="" disabled>
              Pick an option
            </option>
            <optgroup label="Drop-off locations">
              {dropoffs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </optgroup>
            <option value={HELD_FREETEXT}>I'll hold it / specify another arrangement</option>
          </select>
          {heldChoice === HELD_FREETEXT && (
            <textarea
              className={`${styles.textarea} ${styles.inputBelow}`}
              placeholder="Where & when can the owner retrieve it? e.g. 'I'll bring it to the Engineering security desk Monday 10am.'"
              value={heldFreetext}
              onChange={(e) => setHeldFreetext(e.target.value)}
              rows={3}
              required
            />
          )}
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
            {submitting ? "Posting…" : "Post found item"}
          </button>
        </div>
      </form>
    </div>
  );
}
