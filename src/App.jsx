import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/AdminPages/LoginPage";
import DashboardPage from "./pages/AdminPages/DashboardPage";

function hasAccessToken() {
  return Boolean(localStorage.getItem("crm_access_token"));
}

function RequireAuth({ children }) {
  const location = useLocation();

  if (!hasAccessToken()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}

function GuestOnly({ children }) {
  if (hasAccessToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/teacher"
        element={
          <RequireAuth>
            <DashboardPage initialMenu="teachers" />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/taecher"
        element={
          <RequireAuth>
            <DashboardPage initialMenu="teachers" />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/group"
        element={
          <RequireAuth>
            <DashboardPage initialMenu="groups" />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/student"
        element={
          <RequireAuth>
            <DashboardPage initialMenu="students" />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/room"
        element={
          <RequireAuth>
            <DashboardPage initialMenu="management" initialManagement="rooms" />
          </RequireAuth>
        }
      />

      <Route
        path="/dashboard/teachers"
        element={
          <RequireAuth>
            <DashboardPage initialMenu="teachers" />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/groups"
        element={
          <RequireAuth>
            <DashboardPage initialMenu="groups" />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/students"
        element={
          <RequireAuth>
            <DashboardPage initialMenu="students" />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
