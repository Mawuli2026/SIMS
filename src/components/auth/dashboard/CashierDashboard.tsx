import DashboardCard from "./DashboardCard";
import { Link } from "react-router-dom";
import { UserProfile } from "../../../types/dashboard.types";
import { formatCurrency } from "../../../utils/currency";
import { loadSales } from "../../../utils/saleStorage";

interface CashierDashboardProps { user: UserProfile; }

const CashierDashboard = ({ user }: CashierDashboardProps) => {
  const mySales = loadSales().filter((sale) => sale.cashierEmail.toLowerCase() === user.email.toLowerCase());
  const today = new Date().toDateString();
  const todaysSales = mySales.filter((sale) => new Date(sale.createdAt).toDateString() === today);
  const mySalesToday = todaysSales.reduce((total, sale) => total + sale.totalAmount, 0);
  const recentSales = mySales.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <h1>Cashier Dashboard</h1>
        <p>Record sales, view receipts, and track your sales history.</p>
      </div>

      <div className="dashboard-grid cashier-grid">
        <DashboardCard
          title="My Sales Today"
          value={formatCurrency(mySalesToday)}
          subtitle="Your total sales today"
          type="primary"
        />

        <DashboardCard
          title="My Sales Count"
          value={todaysSales.length}
          subtitle="Sales you completed today"
          type="success"
        />

        <div className="quick-action-card">
          <h3>Start New Sale</h3>
          <p>Record a new customer purchase.</p>
          <Link className="primary-action" to="/dashboard/sales">Record Sale</Link>
        </div>
      </div>

      <section className="dashboard-panel">
        <h2>My Recent Sales</h2>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Total</th>
              <th>Date</th>
              <th>Receipt</th>
            </tr>
          </thead>

          <tbody>
              {recentSales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.receiptNumber}</td>
                <td>{formatCurrency(sale.totalAmount)}</td>
                <td>{new Date(sale.createdAt).toLocaleString()}</td>
                <td>
                  <Link className="table-link" to={`/dashboard/receipts/${sale.id}`}>
                    View Receipt
                  </Link>
                </td>
              </tr>
            ))}
            {recentSales.length === 0 && (
              <tr><td colSpan={4} className="empty-table">No completed sales yet. Record a sale to see it here.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default CashierDashboard;
