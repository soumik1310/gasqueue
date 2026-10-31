import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";

// Only logged-in suppliers can see the children, everyone else goes to /login
function ProtectedRoute({ children }) {
  const { supplier, loading } = useAuth();
  if (loading) return <p style={{ padding: 24 }}>Loading...</p>;
  return supplier ? children : <Navigate to="/login" replace />;
}

// If you're already logged in, /login sends you to the dashboard
function LoginRoute() {
  const { supplier, loading } = useAuth();
  if (loading) return <p style={{ padding: 24 }}>Loading...</p>;
  return supplier ? <Navigate to="/" replace /> : <AuthPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}