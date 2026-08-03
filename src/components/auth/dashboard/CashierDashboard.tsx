import DashboardCard from "./DashboardCard";
import { Link } from "react-router-dom";
import { UserProfile } from "../../../types/dashboard.types";
import { formatCurrency } from "../../../utils/currency";
import useDashboardData from "./useDashboardData";

interface CashierDashboardProps { user: UserProfile; }

const CashierDashboard = ({ user }: CashierDashboardProps) => {
  const { data, error, isLoading, reload } = useDashboardData();

  if (isLoading) {
    return <section className="dashboard-panel dashboard-api-state" role="status">Loading your sales summary...</section>;
  }

  if (error || !data) {
    return <section className="dashboard-panel dashboard-api-state" role="alert">
      <h1>Unable to load your dashboard</h1>
      <p>{error || "The dashboard response was empty."}</p>
      <button type="button" className="primary-button" onClick={() => void reload()}>Retry</button>
    </section>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Cashier Dashboard</h1>
        <p>Welcome, {user.firstName}. Record sales, view receipts, and track your sales history.</p>
      </div>

      <div className="dashboard-grid cashier-grid">
        <DashboardCard title="My Sales Today" value={formatCurrency(data.summary.mySalesToday ?? 0)} subtitle="Your total sales today" type="primary" />
        <DashboardCard title="My Sales Count" value={data.summary.mySalesCountToday ?? 0} subtitle="Sales you completed today" type="success" />
        <div className="quick-action-card">
          <h3>Start New Sale</h3><p>Record a new customer purchase.</p>
          <Link className="primary-action" to="/dashboard/sales">Record Sale</Link>
        </div>
      </div>

      <section className="dashboard-panel">
        <h2>My Recent Sales</h2>
        <table className="dashboard-table">
          <thead><tr><th>Sale ID</th><th>Total</th><th>Date</th><th>Receipt</th></tr></thead>
          <tbody>
            {data.recentSales.map((sale) => <tr key={sale.saleId}>
              <td>#{sale.saleId}</td><td>{formatCurrency(sale.totalAmount)}</td>
              <td>{new Date(sale.createdAt).toLocaleString()}</td>
              <td><Link className="table-link" to={`/dashboard/receipts/${sale.saleId}`}>View Receipt</Link></td>
            </tr>)}
            {data.recentSales.length === 0 && <tr><td colSpan={4} className="empty-table">No database sales have been recorded yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default CashierDashboard;
