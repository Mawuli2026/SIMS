import { useMemo, useState } from "react";
import DashboardCard from "./DashboardCard";
import { loadSales } from "../../../utils/saleStorage";
import { formatCurrency } from "../../../utils/currency";

interface ProductPerformance { productId: number; name: string; unitsSold: number; revenue: number; transactions: number; }
interface CashierPerformance { email: string; name: string; transactions: number; itemsSold: number; revenue: number; }

const ReportsPage = () => {
  const sales = useMemo(() => loadSales(), []);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredSales = useMemo(() => sales.filter((sale) => {
    const saleDate = sale.createdAt.slice(0, 10);
    return (!fromDate || saleDate >= fromDate) && (!toDate || saleDate <= toDate);
  }), [sales, fromDate, toDate]);

  const report = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const itemsSold = filteredSales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const products = new Map<number, ProductPerformance>();
    const cashiers = new Map<string, CashierPerformance>();

    filteredSales.forEach((sale) => {
      const cashier = cashiers.get(sale.cashierEmail) ?? { email: sale.cashierEmail, name: sale.cashierName, transactions: 0, itemsSold: 0, revenue: 0 };
      cashier.transactions += 1;
      cashier.revenue += sale.totalAmount;
      sale.items.forEach((item) => {
        cashier.itemsSold += item.quantity;
        const product = products.get(item.productId) ?? { productId: item.productId, name: item.productName, unitsSold: 0, revenue: 0, transactions: 0 };
        product.unitsSold += item.quantity;
        product.revenue += item.lineTotal;
        product.transactions += 1;
        products.set(item.productId, product);
      });
      cashiers.set(sale.cashierEmail, cashier);
    });

    return {
      totalRevenue,
      itemsSold,
      averageSale: filteredSales.length ? totalRevenue / filteredSales.length : 0,
      products: [...products.values()].sort((a, b) => b.revenue - a.revenue),
      cashiers: [...cashiers.values()].sort((a, b) => b.revenue - a.revenue),
    };
  }, [filteredSales]);

  const maxProductRevenue = Math.max(...report.products.map((product) => product.revenue), 1);
  const invalidRange = Boolean(fromDate && toDate && fromDate > toDate);

  return (
    <div>
      <div className="page-header reports-header"><div><h1>Reports</h1><p>Analyze sales performance using completed transactions.</p></div>
        <div className="report-range">
          <label>From<input aria-label="From date" type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} /></label>
          <label>To<input aria-label="To date" type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} /></label>
          {(fromDate || toDate) && <button type="button" className="secondary-button" onClick={() => { setFromDate(""); setToDate(""); }}>All Time</button>}
        </div>
      </div>

      {invalidRange && <p className="form-error report-error" role="alert">The start date must not be later than the end date.</p>}

      <div className="dashboard-grid report-grid">
        <DashboardCard title="Revenue" value={formatCurrency(invalidRange ? 0 : report.totalRevenue)} subtitle="Sales in selected period" type="primary" />
        <DashboardCard title="Transactions" value={invalidRange ? 0 : filteredSales.length} subtitle="Completed sales" type="success" />
        <DashboardCard title="Items Sold" value={invalidRange ? 0 : report.itemsSold} subtitle="Total units sold" type="info" />
        <DashboardCard title="Average Sale" value={formatCurrency(invalidRange ? 0 : report.averageSale)} subtitle="Revenue per transaction" type="warning" />
      </div>

      <div className="report-sections">
        <section className="dashboard-panel">
          <h2>Product Performance</h2>
          {!invalidRange && report.products.length > 0 ? <div className="performance-list">{report.products.map((product, index) => <div className="performance-item" key={product.productId}>
            <div className="performance-rank">{index + 1}</div><div className="performance-info"><div><strong>{product.name}</strong><span>{product.unitsSold} units · {product.transactions} transaction{product.transactions === 1 ? "" : "s"}</span></div>
              <div className="performance-bar"><span style={{ width: `${(product.revenue / maxProductRevenue) * 100}%` }} /></div></div><strong>{formatCurrency(product.revenue)}</strong>
          </div>)}</div> : <p className="report-empty">No product sales are available for this date range.</p>}
        </section>

        <section className="dashboard-panel">
          <h2>Cashier Performance</h2>
          <div className="table-scroll"><table className="dashboard-table">
            <thead><tr><th>Cashier</th><th>Sales</th><th>Items</th><th>Revenue</th></tr></thead>
            <tbody>{!invalidRange && report.cashiers.map((cashier) => <tr key={cashier.email}><td><strong>{cashier.name}</strong><small className="stock-available">{cashier.email}</small></td><td>{cashier.transactions}</td><td>{cashier.itemsSold}</td><td><strong>{formatCurrency(cashier.revenue)}</strong></td></tr>)}
              {(invalidRange || report.cashiers.length === 0) && <tr><td colSpan={4} className="empty-table">No cashier sales are available for this date range.</td></tr>}
            </tbody>
          </table></div>
        </section>
      </div>
    </div>
  );
};

export default ReportsPage;
