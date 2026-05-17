import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PostLostPage from "./pages/PostLostPage";
import PostFoundPage from "./pages/PostFoundPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import LocationAdminPage from "./pages/LocationAdminPage";
import WebAdminPage from "./pages/WebAdminPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="items/:id" element={<ItemDetailPage />} />
        <Route
          path="post/lost"
          element={
            <ProtectedRoute>
              <PostLostPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="post/found"
          element={
            <ProtectedRoute>
              <PostFoundPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="location-admin"
          element={
            <ProtectedRoute requireRole="location_admin">
              <LocationAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="web-admin"
          element={
            <ProtectedRoute requireRole="web_admin">
              <WebAdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
