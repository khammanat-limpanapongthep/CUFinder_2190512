import { Link, useSearchParams } from "react-router-dom";
import { apiUrl } from "../api/client";
import styles from "./LoginPage.module.css";

const ERROR_MESSAGES: Record<string, string> = {
  not_cu_email: "Only Chulalongkorn University accounts (@chula.ac.th / @student.chula.ac.th) are allowed.",
  invalid_state: "Login failed due to a security check. Please try again.",
  access_denied: "Login was cancelled.",
  token_failed: "Could not complete login. Please try again.",
  userinfo_failed: "Could not retrieve your Google profile. Please try again.",
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error");
  const error = errorCode
    ? (ERROR_MESSAGES[errorCode] ?? "Login failed. Please try again.")
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark}>CU</span>Finder
        </Link>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>
          Use your Chulalongkorn University Google account to continue.
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <a href={apiUrl("/api/auth/google")} className={styles.googleBtn}>
          <GoogleIcon />
          Sign in with Google
        </a>

        <p className={styles.backLink}>
          <Link to="/">&larr; Back to browse</Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
