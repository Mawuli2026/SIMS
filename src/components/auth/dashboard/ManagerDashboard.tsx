import { UserRole } from "../../../types/dashboard.types";
import { formatCurrency } from "../../../utils/currency";
import DashboardCard from "./DashboardCard";
import useDashboardData from "./useDashboardData";

interface ManagerDashboardProps {
  role: Exclude<UserRole, "Cashier">;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const ManagerDashboard = ({ role }: ManagerDashboardProps) => {
  const { data, error, isLoading, reload } = useDashboardData();

  if (isLoading) {
    return <section className="dashboard-panel dashboard-api-state" role="status">Loading dashboard summaries...</section>;
  }

  if (error || !data) {
    return <section className="dashboard-panel dashboard-api-state" role="alert">
      <h1>Unable to load the dashboard</h1>
      <p>{error || "The dashboard response was empty."}</p>
      <button type="button" className="primary-button" onClick={() => void reload()}>Retry</button>
    </section>;
  }

  const { summary, recentSales, lowStockProducts = [] } = data;

  return (
    <div>
      <div className="page-header">
        <h1>{role === "SystemAdmin" ? "System Admin Dashboard" : "Manager Dashboard"}</h1>
        <p>Monitor sales, inventory, reports, and low-stock products.</p>
      </div>

      <div className="dashboard-grid">
        <DashboardCard title="Today's Sales" value={formatCurrency(summary.todaySales ?? 0)} subtitle="Total revenue today" type="primary" />
        <DashboardCard title="Sales Today" value={summary.salesCountToday ?? 0} subtitle="Completed sales" type="success" />
        <DashboardCard title="Total Products" value={summary.totalProducts ?? 0} subtitle="Active inventory" type="info" />
        <DashboardCard title="Low Stock" value={summary.lowStockCount ?? 0} subtitle="Need restocking" type="warning" />
      </div>

      <div className="dashboard-sections">
        <section className="dashboard-panel">
          <h2>Recent Sales</h2>
          <div className="table-scroll"><table className="dashboard-table">
            <thead><tr><th>Sale ID</th><th>Cashier</th><th>Total</th><th>Date</th></tr></thead>
            <tbody>
              {recentSales.map((sale) => <tr key={sale.saleId}>
                <td>#{sale.saleId}</td><td>{sale.cashierName ?? "Unknown"}</td>
                <td>{formatCurrency(sale.totalAmount)}</td><td>{formatDate(sale.createdAt)}</td>
              </tr>)}
              {recentSales.length === 0 && <tr><td colSpan={4} className="empty-table">No database sales have been recorded yet.</td></tr>}
            </tbody>
          </table></div>
        </section>

        <section className="dashboard-panel">
          <h2>Low-Stock Products</h2>
          <div className="table-scroll"><table className="dashboard-table">
            <thead><tr><th>Product</th><th>Stock</th><th>Reorder Level</th><th>Status</th></tr></thead>
            <tbody>
              {lowStockProducts.map((product) => <tr key={product.productId}>
                <td>{product.name}</td><td>{product.quantityInStock}</td><td>{product.reorderLevel}</td>
                <td><span className="badge-warning">Low Stock</span></td>
              </tr>)}
              {lowStockProducts.length === 0 && <tr><td colSpan={4} className="empty-table">No active products are currently low in stock.</td></tr>}
            </tbody>
          </table></div>
        </section>
      </div>
    </div>
  );
};

export default ManagerDashboard;
