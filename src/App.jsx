import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/groups" element={<DashboardPage initialMenu="groups" />} />
      <Route path="/dashboard/students" element={<DashboardPage initialMenu="students" />} />
    </Routes>
  );
}