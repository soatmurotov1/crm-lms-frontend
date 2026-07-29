import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/AdminPages/LoginPage";
import DashboardPage from "./pages/AdminPages/DashboardPage";
import SuperAdminDashboard from "./pages/SuperAdminPages/Dashboard";
import StudentDashboardPage from "./pages/StudentPages/Dashboard";
import TeacherDashboard from "./pages/TeacherPages/Dashboard";
import { getAuthUserFromStorage, hasValidSession } from "./utils/authToken";
import { ThemeProvider } from "./theme/ThemeProvider";

function getCurrentRole() {
  return String(getAuthUserFromStorage()?.role || "").toUpperCase();
}

function getHomePathForRole(role) {
  if (role === "STUDENT") return "/student/dashboard";
  if (role === "TEACHER") return "/teacher";
  if (role === "SUPERADMIN") return "/superadmin";
  return "/dashboard";
}

function GuestOnly({ children }) {
  if (hasValidSession()) {
    return <Navigate to={getHomePathForRole(getCurrentRole())} replace />;
  }

  return children;
}

/**
 * Bitta umumiy qorovul: token bor-yo'qligini VA muddati o'tmaganini
 * tekshiradi, roli mos kelmasa foydalanuvchini o'z paneliga qaytaradi.
 *
 * Muddati tekshirilmasa, eskirgan token bilan ham panel ochilib ketadi:
 * ma'lumot kelmaydi, lekin login sahifasi o'rniga bo'sh dashboard ko'rinadi.
 */
function RequireRole({ allow, children }) {
  const location = useLocation();

  const authUser = getAuthUserFromStorage();

  if (!authUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  const role = String(authUser.role || "").toUpperCase();

  if (!allow.includes(role)) {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return children;
}

const ADMIN_ROLES = ["ADMIN", "SUPERADMIN", "MANAGEMENT", "ADMINSTRATOR"];

function RequireAdmin({ children }) {
  return <RequireRole allow={ADMIN_ROLES}>{children}</RequireRole>;
}

function RequireSuperAdmin({ children }) {
  return <RequireRole allow={["SUPERADMIN"]}>{children}</RequireRole>;
}

function RequireTeacher({ children }) {
  return <RequireRole allow={["TEACHER"]}>{children}</RequireRole>;
}

function RequireStudent({ children }) {
  return <RequireRole allow={["STUDENT"]}>{children}</RequireRole>;
}

const ADMIN_ROUTES = [
  { path: "/dashboard", menu: "dashboard" },
  { path: "/dashboard/student", menu: "students" },
  { path: "/dashboard/students", menu: "students" },
  { path: "/dashboard/group", menu: "groups" },
  { path: "/dashboard/groups", menu: "groups" },
  { path: "/dashboard/teacher", menu: "teachers" },
  { path: "/dashboard/teachers", menu: "teachers" },
  { path: "/dashboard/taecher", menu: "teachers" },
  { path: "/dashboard/attendance", menu: "attendance" },
  { path: "/dashboard/payments", menu: "payments" },
  { path: "/dashboard/reports", menu: "reports" },
  { path: "/dashboard/notifications", menu: "notifications" },
  { path: "/dashboard/settings", menu: "settings" },
  { path: "/dashboard/exams", menu: "exams" },
  { path: "/dashboard/course", menu: "settings", management: "courses" },
  { path: "/dashboard/courses", menu: "settings", management: "courses" },
  { path: "/dashboard/room", menu: "settings", management: "rooms" },
  { path: "/dashboard/rooms", menu: "settings", management: "rooms" },
  { path: "/dashboard/employees", menu: "settings", management: "employees" },
];

const SUPERADMIN_ROUTES = [
  { path: "/superadmin", menu: "dashboard" },
  { path: "/superadmin/organizations", menu: "organizations" },
  { path: "/superadmin/users", menu: "users" },
  { path: "/superadmin/plans", menu: "plans" },
  { path: "/superadmin/payments", menu: "payments" },
  { path: "/superadmin/reports", menu: "reports" },
  { path: "/superadmin/settings", menu: "settings" },
  { path: "/superadmin/notifications", menu: "notifications" },
  { path: "/superadmin/support", menu: "support" },
];

const TEACHER_ROUTES = [
  { path: "/teacher", menu: "dashboard" },
  { path: "/teacher/home", menu: "dashboard" },
  { path: "/teacher/groups", menu: "groups" },
  { path: "/teacher/schedule", menu: "schedule" },
  { path: "/teacher/attendance", menu: "attendance" },
  { path: "/teacher/grades", menu: "grades" },
  { path: "/teacher/homework", menu: "homework" },
  { path: "/teacher/exams", menu: "exams" },
  { path: "/teacher/students", menu: "students" },
  { path: "/teacher/notifications", menu: "notifications" },
  { path: "/teacher/settings", menu: "settings" },
];

const STUDENT_ROUTES = [
  { path: "/student/dashboard", menu: "dashboard" },
  { path: "/student/schedule", menu: "schedule" },
  { path: "/student/lessons", menu: "lessons" },
  { path: "/student/groups", menu: "groups" },
  { path: "/student/homework", menu: "homework" },
  { path: "/student/exams", menu: "exams" },
  { path: "/student/grades", menu: "grades" },
  { path: "/student/attendance", menu: "attendance" },
  { path: "/student/notifications", menu: "notifications" },
  { path: "/student/settings", menu: "profile" },
  { path: "/student/payments", menu: "payments" },
];

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route
          path="/"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />

        {ADMIN_ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <RequireAdmin>
                <DashboardPage
                  initialMenu={route.menu}
                  {...(route.management
                    ? { initialManagement: route.management }
                    : {})}
                />
              </RequireAdmin>
            }
          />
        ))}

        {SUPERADMIN_ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <RequireSuperAdmin>
                <SuperAdminDashboard initialMenu={route.menu} />
              </RequireSuperAdmin>
            }
          />
        ))}

        {TEACHER_ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <RequireTeacher>
                <TeacherDashboard initialMenu={route.menu} />
              </RequireTeacher>
            }
          />
        ))}

        {STUDENT_ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <RequireStudent>
                <StudentDashboardPage initialMenu={route.menu} />
              </RequireStudent>
            }
          />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
