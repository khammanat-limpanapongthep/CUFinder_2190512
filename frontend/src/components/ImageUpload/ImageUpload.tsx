import { useRef, useState, type ChangeEvent } from "react";
import { uploadImage, imageUrl } from "../../api/client";
import { ApiError } from "../../api/client-error";
import styles from "./ImageUpload.module.css";

interface Props {
  imageId: string | null;
  onChange: (imageId: string | null) => void;
}

export default function ImageUpload({ imageId, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    imageId ? imageUrl(imageId) : undefined,
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    try {
      const { id } = await uploadImage(file);
      onChange(id);
      setPreviewUrl(imageUrl(id) ?? localUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Upload failed");
      }
      setPreviewUrl(undefined);
      onChange(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleClear = () => {
    setPreviewUrl(undefined);
    onChange(null);
    setError(null);
  };

  return (
    <div className={styles.wrap}>
      {previewUrl ? (
        <div className={styles.previewBox}>
          <img src={previewUrl} alt="Preview" className={styles.preview} />
          <div className={styles.previewActions}>
            <button type="button" onClick={handlePick} className={styles.swapBtn} disabled={uploading}>
              {uploading ? "Uploading…" : "Replace"}
            </button>
            <button type="button" onClick={handleClear} className={styles.removeBtn} disabled={uploading}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={styles.picker}
          onClick={handlePick}
          disabled={uploading}
        >
          <span className={styles.pickerIcon}>📷</span>
          <span>{uploading ? "Uploading…" : "Add a photo"}</span>
          <span className={styles.pickerHint}>JPG, PNG, or WebP &middot; up to 5 MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className={styles.hiddenInput}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
