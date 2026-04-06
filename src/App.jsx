import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/AdminPages/LoginPage";
import DashboardPage from "./pages/AdminPages/DashboardPage";
import StudentDashboardPage from "./pages/StudentPages/Dashboard";
import { getAuthUserFromStorage } from "./utils/authToken";

function hasAccessToken() {
  return Boolean(localStorage.getItem("crm_access_token"));
}

function getCurrentRole() {
  return String(getAuthUserFromStorage()?.role || "").toUpperCase();
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
    return (
      <Navigate
        to={
          getCurrentRole() === "STUDENT" ? "/student/dashboard" : "/dashboard"
        }
        replace
      />
    );
  }

  return children;
}

function RequireStudent({ children }) {
  const location = useLocation();

  if (!hasAccessToken()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (getCurrentRole() !== "STUDENT") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RequireNonStudent({ children }) {
  const location = useLocation();

  if (!hasAccessToken()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (getCurrentRole() === "STUDENT") {
    return <Navigate to="/student/dashboard" replace />;
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
          <RequireNonStudent>
            <DashboardPage />
          </RequireNonStudent>
        }
      />
      <Route
        path="/dashboard/teacher"
        element={
          <RequireNonStudent>
            <DashboardPage initialMenu="teachers" />
          </RequireNonStudent>
        }
      />
      <Route
        path="/dashboard/taecher"
        element={
          <RequireNonStudent>
            <DashboardPage initialMenu="teachers" />
          </RequireNonStudent>
        }
      />
      <Route
        path="/dashboard/group"
        element={
          <RequireNonStudent>
            <DashboardPage initialMenu="groups" />
          </RequireNonStudent>
        }
      />
      <Route
        path="/dashboard/student"
        element={
          <RequireNonStudent>
            <DashboardPage initialMenu="students" />
          </RequireNonStudent>
        }
      />
      <Route
        path="/dashboard/payments"
        element={
          <RequireNonStudent>
            <DashboardPage initialMenu="payments" />
          </RequireNonStudent>
        }
      />
      <Route
        path="/dashboard/room"
        element={
          <RequireNonStudent>
            <DashboardPage initialMenu="management" initialManagement="rooms" />
          </RequireNonStudent>
        }
      />
      <Route
        path="/dashboard/course"
        element={
          <RequireNonStudent>
            <DashboardPage
              initialMenu="management"
              initialManagement="courses"
            />
          </RequireNonStudent>
        }
      />
      <Route
        path="/dashboard/courses"
        element={
          <RequireNonStudent>
            <DashboardPage
              initialMenu="management"
              initialManagement="courses"
            />
          </RequireNonStudent>
        }
      />

      <Route
        path="/dashboard/teachers"
        element={
          <RequireNonStudent>
            <DashboardPage initialMenu="teachers" />
          </RequireNonStudent>
        }
      />
      <Route
        path="/dashboard/groups"
        element={
          <RequireNonStudent>
            <DashboardPage initialMenu="groups" />
          </RequireNonStudent>
        }
      />
      <Route
        path="/dashboard/students"
        element={
          <RequireNonStudent>
            <DashboardPage initialMenu="students" />
          </RequireNonStudent>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <RequireStudent>
            <StudentDashboardPage initialMenu="home" />
          </RequireStudent>
        }
      />
      <Route
        path="/student/groups"
        element={
          <RequireStudent>
            <StudentDashboardPage initialMenu="groups" />
          </RequireStudent>
        }
      />
      <Route
        path="/student/settings"
        element={
          <RequireStudent>
            <StudentDashboardPage initialMenu="settings" />
          </RequireStudent>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
