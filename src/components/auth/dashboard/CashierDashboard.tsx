import DashboardCard from "./DashboardCard";
import { Link } from "react-router-dom";
import { DashboardSummary, RecentSale } from "../../../types/dashboard.types";
import { formatCurrency } from "../../../utils/currency";

const CashierDashboard = () => {
  const summary: DashboardSummary = {
    mySalesToday: 600,
    mySalesCountToday: 10,
  };

  const recentSales: RecentSale[] = [
    {
      saleId: 2001,
      totalAmount: 75,
      createdAt: "Today, 10:30 AM",
    },
    {
      saleId: 2002,
      totalAmount: 55,
      createdAt: "Today, 11:10 AM",
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Cashier Dashboard</h1>
        <p>Record sales, view receipts, and track your sales history.</p>
      </div>

      <div className="dashboard-grid cashier-grid">
        <DashboardCard
          title="My Sales Today"
          value={formatCurrency(summary.mySalesToday ?? 0)}
          subtitle="Your total sales today"
          type="primary"
        />

        <DashboardCard
          title="My Sales Count"
          value={summary.mySalesCountToday || 0}
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
              <tr key={sale.saleId}>
                <td>#{sale.saleId}</td>
                <td>{formatCurrency(sale.totalAmount)}</td>
                <td>{sale.createdAt}</td>
                <td>
                  <Link className="table-link" to={`/dashboard/receipts/${sale.saleId}`}>
                    View Receipt
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default CashierDashboard;
