import DashboardCard from "./DashboardCard";
import {
  DashboardSummary,
  LowStockProduct,
  RecentSale,
} from "../../../types/dashboard.types";

const AdminDashboard = () => {
  const summary: DashboardSummary = {
    todaySales: 1450,
    salesCountToday: 25,
    totalProducts: 120,
    lowStockCount: 8,
  };

  const recentSales: RecentSale[] = [
    {
      saleId: 1001,
      cashierName: "Ama Mensah",
      totalAmount: 120,
      createdAt: "Today, 9:20 AM",
    },
    {
      saleId: 1002,
      cashierName: "Kofi Mensah",
      totalAmount: 85,
      createdAt: "Today, 10:05 AM",
    },
  ];

  const lowStockProducts: LowStockProduct[] = [
    {
      productId: 1,
      name: "Sugar",
      quantityInStock: 3,
      reorderLevel: 5,
    },
    {
      productId: 2,
      name: "Milk",
      quantityInStock: 2,
      reorderLevel: 4,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Monitor sales, inventory, reports, and low-stock products.</p>
      </div>

      <div className="dashboard-grid">
        <DashboardCard
          title="Today's Sales"
          value={`GHS ${summary.todaySales?.toFixed(2)}`}
          subtitle="Total revenue today"
          type="primary"
        />

        <DashboardCard
          title="Sales Today"
          value={summary.salesCountToday || 0}
          subtitle="Completed sales"
          type="success"
        />

        <DashboardCard
          title="Total Products"
          value={summary.totalProducts || 0}
          subtitle="Active inventory"
          type="info"
        />

        <DashboardCard
          title="Low Stock"
          value={summary.lowStockCount || 0}
          subtitle="Need restocking"
          type="warning"
        />
      </div>

      <div className="dashboard-sections">
        <section className="dashboard-panel">
          <h2>Recent Sales</h2>

          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Cashier</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.saleId}>
                  <td>#{sale.saleId}</td>
                  <td>{sale.cashierName}</td>
                  <td>GHS {sale.totalAmount.toFixed(2)}</td>
                  <td>{sale.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="dashboard-panel">
          <h2>Low-Stock Products</h2>

          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
                <th>Reorder Level</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {lowStockProducts.map((product) => (
                <tr key={product.productId}>
                  <td>{product.name}</td>
                  <td>{product.quantityInStock}</td>
                  <td>{product.reorderLevel}</td>
                  <td>
                    <span className="badge-warning">Low Stock</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard; 
