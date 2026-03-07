import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import AppLayout from "@/components/layout/AppLayout";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Unauthorized from "@/pages/Unauthorized";

import CensusEntry from "@/pages/CensusEntry";
import CensusSubmissions from "@/pages/CensusSubmissions";

import Calculations from "@/pages/Calculations";
import CalculationResults from "@/pages/CalculationResults";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";

import Approvals from "@/pages/Approvals";
import ApprovalDetail from "@/pages/ApprovalDetail";
import Invoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import AccountantPriceManagement from "@/pages/AccountantPriceManagement";
import FinancialReports from "@/pages/FinancialReports";

import CookSheet from "@/pages/CookSheet";
import DeliveryReceiving from "@/pages/DeliveryReceiving";
import IssueReports from "@/pages/IssueReports";

import AdminDailyCycle from "@/pages/AdminDailyCycle";
import AdminWards from "@/pages/AdminWards";
import AdminDietTypes from "@/pages/AdminDietTypes";
import AdminItems from "@/pages/AdminItems";
import NormWeights from "@/pages/NormWeights";
import AdminDietCycles from "@/pages/AdminDietCycles";
import AdminRecipes from "@/pages/AdminRecipes";
import AdminNotifications from "@/pages/AdminNotifications";

import SystemUsers from "@/pages/SystemUsers";
import AuditLogs from "@/pages/AuditLogs";
import Backups from "@/pages/Backups";
import SystemSettings from "@/pages/SystemSettings";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              <Route
                path="/dashboard"
                element={
                 
                    <Dashboard />
                  
                }
              />

              {/* Diet Clerk */}
              <Route
                path="/census"
                element={
                  <AppLayout>
                    <CensusEntry />
                  </AppLayout>
                }
              />
              <Route
                path="/census/submissions"
                element={
                  <AppLayout>
                    <CensusSubmissions />
                  </AppLayout>
                }
              />

              {/* Subject Clerk */}
              <Route
                path="/calculations"
                element={
                  <AppLayout>
                    <Calculations />
                  </AppLayout>
                }
              />
              <Route
                path="/calculations/results"
                element={
                  <AppLayout>
                    <CalculationResults />
                  </AppLayout>
                }
              />
              <Route
                path="/orders"
                element={
                  <AppLayout>
                    <Orders />
                  </AppLayout>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <AppLayout>
                    <OrderDetail />
                  </AppLayout>
                }
              />

              {/* Accountant */}
              <Route
                path="/approvals"
                element={
                  <AppLayout>
                    <Approvals />
                  </AppLayout>
                }
              />
              <Route
                path="/approvals/:id"
                element={
                  <AppLayout>
                    <ApprovalDetail />
                  </AppLayout>
                }
              />
              <Route
                path="/invoices"
                element={
                  <AppLayout>
                    <Invoices />
                  </AppLayout>
                }
              />
              <Route
                path="/invoices/:id"
                element={
                  <AppLayout>
                    <InvoiceDetail />
                  </AppLayout>
                }
              />
              <Route
                path="/accountant/prices"
                element={
                  <AppLayout>
                    <AccountantPriceManagement />
                  </AppLayout>
                }
              />
              <Route
                path="/reports"
                element={
                  <AppLayout>
                    <FinancialReports />
                  </AppLayout>
                }
              />

              {/* Kitchen */}
              <Route
                path="/kitchen"
                element={
                  <AppLayout>
                    <CookSheet />
                  </AppLayout>
                }
              />
              <Route
                path="/kitchen/receiving"
                element={
                  <AppLayout>
                    <DeliveryReceiving />
                  </AppLayout>
                }
              />
              <Route
                path="/kitchen/reports"
                element={
                  <AppLayout>
                    <IssueReports />
                  </AppLayout>
                }
              />

              {/* Hospital Admin */}
              <Route
                path="/admin/daily-cycle"
                element={
                  <AppLayout>
                    <AdminDailyCycle />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/wards"
                element={
                  <AppLayout>
                    <AdminWards />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/diet-types"
                element={
                  <AppLayout>
                    <AdminDietTypes />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/items"
                element={
                  <AppLayout>
                    <AdminItems />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/norm-weights"
                element={
                  <AppLayout>
                    <NormWeights />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/diet-cycles"
                element={
                  <AppLayout>
                    <AdminDietCycles />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/recipes"
                element={
                  <AppLayout>
                    <AdminRecipes />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <AppLayout>
                    <AdminNotifications />
                  </AppLayout>
                }
              />

              {/* System Admin */}
              <Route
                path="/system/users"
                element={
                  <AppLayout>
                    <SystemUsers />
                  </AppLayout>
                }
              />
              <Route
                path="/system/audit"
                element={
                  <AppLayout>
                    <AuditLogs />
                  </AppLayout>
                }
              />
              <Route
                path="/system/backups"
                element={
                  <AppLayout>
                    <Backups />
                  </AppLayout>
                }
              />
              <Route
                path="/system/settings"
                element={
                  <AppLayout>
                    <SystemSettings />
                  </AppLayout>
                }
              />

              {/* Legacy redirect */}
              <Route path="/prices" element={<Navigate to="/dashboard" replace />} />

              <Route
                path="*"
                element={<NotFound />}
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;