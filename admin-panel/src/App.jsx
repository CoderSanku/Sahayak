// src/App.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./lib/auth.jsx";
import { AnimatePresence } from "framer-motion";

// Pages
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ApplicationsPage from "./pages/ApplicationsPage.jsx";
import ComplaintsPage from "./pages/ComplaintsPage.jsx";

// Components
import Layout from "./components/Layout.jsx";

/**
 * Higher-order component to restrict access to authenticated users.
 * Redirects to /login if the user is not authed.
 */
function ProtectedRoute({ children }) {
  const { authed } = useAuth();
  return authed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Default Redirect to Dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route path="dashboard"    element={<DashboardPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="complaints"   element={<ComplaintsPage />} />
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}