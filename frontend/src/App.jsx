import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import SystemAdminDashboard from "./pages/SystemAdminDashboard";
import HospitalAdmin from "./pages/HospitalAdmin";

function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/system-admin-dashboard" element={<SystemAdminDashboard />} />
      <Route path="/hospital-admin-dashboard" element={<HospitalAdmin />} />

      {/* 404 fallback */}
      <Route path="*" element={<h2 style={{ padding: 20 }}>404 - Page Not Found</h2>} />
    </Routes>
  );
}

export default App;