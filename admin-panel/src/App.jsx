import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Layout from "./components/Layout.jsx";
import ApplicationsPage from "./pages/ApplicationsPage.jsx";
import ComplaintsPage from "./pages/ComplaintsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

function ProtectedRoute({ children }) {
  const { authed } = useAuth();
  return authed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"    element={<DashboardPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="complaints"   element={<ComplaintsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
