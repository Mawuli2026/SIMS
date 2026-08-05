import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/auth/dashboard/DashboardLayout";
import ManagerDashboard from "../../components/auth/dashboard/ManagerDashboard";
import EmployeeManagement from "../../components/auth/dashboard/EmployeeManagement";
import CashierDashboard from "../../components/auth/dashboard/CashierDashboard";
import ProductManagement from "../../components/auth/dashboard/ProductManagement";
import SalesCart from "../../components/auth/dashboard/SalesCart";
import ReceiptPage from "../../components/auth/dashboard/ReceiptPage";
import SalesHistory from "../../components/auth/dashboard/SalesHistory";
import ReportsPage from "../../components/auth/dashboard/ReportsPage";
import AuditLogs from "../../components/auth/dashboard/AuditLogs";
import { UserProfile } from "../../types/dashboard.types";
import { ApiError, getCurrentUser } from "../../services/authApi";
import { clearSession, getAuthToken, getStoredUser, saveSession, toUserProfile } from "../../utils/authSession";

const DashboardPage = () => {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser);
  const [sessionState, setSessionState] = useState<"checking" | "ready" | "invalid" | "error">("checking");
  const [retryCount, setRetryCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      clearSession();
      setUser(null);
      setSessionState("invalid");
      return;
    }

    let active = true;
    setSessionState("checking");
    getCurrentUser(token).then(({ user: apiUser }) => {
      if (!active) return;
      saveSession(token, apiUser);
      setUser(toUserProfile(apiUser));
      setSessionState("ready");
    }).catch((error) => {
      if (!active) return;
      if (error instanceof ApiError && (error.status === 0 || error.status >= 500)) {
        setSessionState("error");
        return;
      }
      clearSession();
      setUser(null);
      setSessionState("invalid");
    });

    return () => { active = false; };
  }, [retryCount]);

  if (sessionState === "checking") return <div className="session-screen" role="status"><span className="session-spinner" />Checking your session...</div>;
  if (sessionState === "error") return <div className="session-screen"><h1>Unable to verify your session</h1><p>Check your connection and try again.</p><button className="primary-button" type="button" onClick={() => setRetryCount((count) => count + 1)}>Retry</button></div>;
  if (sessionState === "invalid" || !user) return <Navigate replace to="/login" />;
  if (user.mustChangePassword) return <Navigate replace to="/change-password" />;

  const isDashboardHome = location.pathname === "/dashboard" || location.pathname === "/dashboard/";
  const isEmployeeRoute = location.pathname === "/dashboard/employees";
  const isAuditRoute = location.pathname === "/dashboard/audit-logs";
  const cashierRoutes = ["/dashboard/sales", "/dashboard/sales-history", "/dashboard/receipts"];
  const canAccessRoute = user.role !== "Cashier" || isDashboardHome || cashierRoutes.some((route) => location.pathname.startsWith(route));

  if (!canAccessRoute || ((isEmployeeRoute || isAuditRoute) && user.role !== "SystemAdmin")) return <Navigate replace to="/dashboard" />;

  const renderContent = () => {
    if (isDashboardHome) return user.role === "Cashier" ? <CashierDashboard user={user} /> : <ManagerDashboard role={user.role} />;
    if (isEmployeeRoute) return <EmployeeManagement />;
    if (isAuditRoute) return <AuditLogs />;
    if (location.pathname === "/dashboard/products") return <ProductManagement />;
    if (location.pathname === "/dashboard/low-stock") return <ProductManagement lowStockOnly />;
    if (location.pathname === "/dashboard/sales") return <SalesCart user={user} />;
    if (location.pathname === "/dashboard/sales-history") return <SalesHistory user={user} />;
    if (location.pathname === "/dashboard/reports") return <ReportsPage />;
    if (location.pathname.startsWith("/dashboard/receipts/")) {
      const saleId = Number(location.pathname.split("/").pop());
      return <ReceiptPage saleId={saleId} />;
    }

    return <section className="dashboard-panel module-placeholder">
      <p className="eyebrow">SIMS module</p>
      <h1>{location.pathname.split("/").pop()?.replace(/-/g, " ")}</h1>
      <p>This area is ready for the next SIMS feature implementation.</p>
    </section>;
  };

  return (
    <DashboardLayout user={user} role={user.role}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default DashboardPage;
