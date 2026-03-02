import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import SystemAdminDashboard from "./pages/SystemAdminDashboard";
import HospitalAdmin from "./pages/HospitalAdmin";

import WardManagement from "./pages/WardManagement";
import DietPlans from "./pages/DietPlans";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/hospital-admin"
        element={
          <AppLayout>
            <HospitalAdmin />
          </AppLayout>
        }
      />

      <Route
        path="/system-admin"
        element={
          <AppLayout>
            <SystemAdminDashboard />
          </AppLayout>
        }
      />

      <Route
        path="/hospital-admin/wards"
        element={
          <AppLayout>
            <WardManagement />
          </AppLayout>
        }
      />

      <Route
        path="/hospital-admin/diet-plans"
        element={
          <AppLayout>
            <DietPlans />
          </AppLayout>
        }
      />

      <Route path="*" element={<h2 style={{ padding: 20 }}>404 - Page Not Found</h2>} />
    </Routes>
  );
}

export default App;