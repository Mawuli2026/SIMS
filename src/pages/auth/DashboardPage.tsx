import { Navigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/auth/dashboard/DashboardLayout";
import AdminDashboard from "../../components/auth/dashboard/AdminDashboard";
import CashierDashboard from "../../components/auth/dashboard/CashierDashboard";
import ProductManagement from "../../components/auth/dashboard/ProductManagement";
import SalesCart from "../../components/auth/dashboard/SalesCart";
import ReceiptPage from "../../components/auth/dashboard/ReceiptPage";
import SalesHistory from "../../components/auth/dashboard/SalesHistory";
import ReportsPage from "../../components/auth/dashboard/ReportsPage";
import { UserProfile } from "../../types/dashboard.types";

const getStoredUser = (): UserProfile | null => {
  try {
    const storedUser = localStorage.getItem("sims-auth-user");
    if (!storedUser) return null;
    const user = JSON.parse(storedUser) as Partial<UserProfile>;
    if (!user.fullName || !user.email || (user.role !== "Admin" && user.role !== "Cashier")) return null;
    const names = user.fullName.trim().split(/\s+/);

    return {
      id: user.id ?? 1,
      firstName: user.firstName ?? names[0],
      lastName: user.lastName ?? names.slice(1).join(" "),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      dateJoined: user.dateJoined ?? new Date().toLocaleDateString(),
      initial: user.initial ?? user.fullName.charAt(0).toUpperCase(),
    };
  } catch {
    return null;
  }
};

const DashboardPage = () => {
  const user = getStoredUser();
  const location = useLocation();

  if (!user) return <Navigate replace to="/login" />;

  const isDashboardHome = location.pathname === "/dashboard" || location.pathname === "/dashboard/";
  const cashierRoutes = ["/dashboard/sales", "/dashboard/sales-history", "/dashboard/receipts"];
  const canAccessRoute = user.role === "Admin" || isDashboardHome || cashierRoutes.some((route) => location.pathname.startsWith(route));

  if (!canAccessRoute) return <Navigate replace to="/dashboard" />;

  const renderContent = () => {
    if (isDashboardHome) return user.role === "Admin" ? <AdminDashboard /> : <CashierDashboard />;
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
