import { Outlet } from "react-router-dom";
import Header from "./Header";
import styles from "./Layout.module.css";

export default function Layout() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className={styles.footer}>
        <div className="container">
          <p>CUFinder &middot; Lost & Found at Chulalongkorn University</p>
        </div>
      </footer>
    </div>
  );
}
