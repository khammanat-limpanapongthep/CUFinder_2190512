import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: "center", padding: "var(--sp-7) 0" }}>
      <h1>Page not found</h1>
      <p style={{ color: "var(--color-text-muted)", marginTop: "var(--sp-3)" }}>
        We couldn't find what you were looking for.
      </p>
      <p style={{ marginTop: "var(--sp-5)" }}>
        <Link to="/">Back to browse</Link>
      </p>
    </div>
  );
}
