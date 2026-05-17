import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../auth/useAuth";
import styles from "./Header.module.css";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const handleLogout = async () => {
    await logout();
    close();
    navigate("/");
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link to="/" className={styles.brand} onClick={close}>
          <span className={styles.brandMark}>CU</span>Finder
        </Link>

        <button
          className={styles.toggle}
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`${styles.nav} ${open ? styles.navOpen : ""}`}>
          <NavLink
            to="/"
            end
            onClick={close}
            className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
          >
            Browse
          </NavLink>
          <NavLink
            to="/post/lost"
            onClick={close}
            className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
          >
            Post Lost
          </NavLink>
          <NavLink
            to="/post/found"
            onClick={close}
            className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
          >
            Post Found
          </NavLink>
          {user?.role === "location_admin" && (
            <NavLink
              to="/location-admin"
              onClick={close}
              className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
            >
              Admin
            </NavLink>
          )}
          {user?.role === "web_admin" && (
            <NavLink
              to="/web-admin"
              onClick={close}
              className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
            >
              Site Admin
            </NavLink>
          )}

          <div className={styles.spacer} />

          {user ? (
            <div className={styles.userBlock}>
              <span className={styles.userName} title={user.email}>
                {user.display_name}
              </span>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={close} className={styles.loginBtn}>
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
