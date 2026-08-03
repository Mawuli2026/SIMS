import { useCallback, useEffect, useMemo, useState } from "react";
import { getReport } from "../../../services/reportApi";
import { ReportResponse } from "../../../types/report.types";
import { getAuthToken } from "../../../utils/authSession";
import { formatCurrency } from "../../../utils/currency";
import DashboardCard from "./DashboardCard";

const emptyReport: ReportResponse = {
  summary: { totalRevenue: 0, transactions: 0, itemsSold: 0, averageSale: 0 },
  products: [],
  cashiers: [],
};

const ReportsPage = () => {
  const [report, setReport] = useState<ReportResponse>(emptyReport);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const invalidRange = Boolean(fromDate && toDate && fromDate > toDate);

  const loadReport = useCallback(async () => {
    if (invalidRange) return;

    const token = getAuthToken();
    if (!token) {
      setError("Your session is no longer available. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      setReport(await getReport(token, fromDate, toDate));
    } catch (requestError) {
      setReport(emptyReport);
      setError(requestError instanceof Error ? requestError.message : "Unable to load sales reports.");
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, invalidRange, toDate]);

  useEffect(() => { void loadReport(); }, [loadReport]);

  const maxProductRevenue = useMemo(() => Math.max(...report.products.map((product) => product.revenue), 1), [report.products]);
  const summary = report.summary;

  return (
    <div>
      <div className="page-header reports-header"><div><h1>Reports</h1><p>Analyze sales performance using completed PostgreSQL transactions.</p></div>
        <div className="report-range">
          <label>From<input aria-label="From date" type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} /></label>
          <label>To<input aria-label="To date" type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} /></label>
          {(fromDate || toDate) && <button type="button" className="secondary-button" onClick={() => { setFromDate(""); setToDate(""); }}>All Time</button>}
        </div>
      </div>

      {invalidRange && <p className="form-error report-error" role="alert">The start date must not be later than the end date.</p>}
      {error && <div className="product-request-error" role="alert"><span>{error}</span>
        <button className="secondary-button" type="button" onClick={() => void loadReport()}>Retry</button></div>}

      <div className="dashboard-grid report-grid">
        <DashboardCard title="Revenue" value={isLoading ? "—" : formatCurrency(invalidRange ? 0 : summary.totalRevenue)} subtitle="Sales in selected period" type="primary" />
        <DashboardCard title="Transactions" value={isLoading ? "—" : invalidRange ? 0 : summary.transactions} subtitle="Completed sales" type="success" />
        <DashboardCard title="Items Sold" value={isLoading ? "—" : invalidRange ? 0 : summary.itemsSold} subtitle="Total units sold" type="info" />
        <DashboardCard title="Average Sale" value={isLoading ? "—" : formatCurrency(invalidRange ? 0 : summary.averageSale)} subtitle="Revenue per transaction" type="warning" />
      </div>

      <div className="report-sections">
        <section className="dashboard-panel">
          <h2>Product Performance</h2>
          {isLoading ? <p className="report-empty">Loading product performance...</p>
            : !invalidRange && report.products.length > 0 ? <div className="performance-list">{report.products.map((product, index) => <div className="performance-item" key={product.productId}>
              <div className="performance-rank">{index + 1}</div><div className="performance-info"><div><strong>{product.name}</strong><span>{product.unitsSold} units · {product.transactions} transaction{product.transactions === 1 ? "" : "s"}</span></div>
                <div className="performance-bar"><span style={{ width: `${(product.revenue / maxProductRevenue) * 100}%` }} /></div></div><strong>{formatCurrency(product.revenue)}</strong>
            </div>)}</div> : <p className="report-empty">No product sales are available for this date range.</p>}
        </section>

        <section className="dashboard-panel">
          <h2>Cashier Performance</h2>
          <div className="table-scroll"><table className="dashboard-table">
            <thead><tr><th>Cashier</th><th>Sales</th><th>Items</th><th>Revenue</th></tr></thead>
            <tbody>{!isLoading && !invalidRange && report.cashiers.map((cashier) => <tr key={cashier.email}><td><strong>{cashier.name}</strong><small className="stock-available">{cashier.email}</small></td><td>{cashier.transactions}</td><td>{cashier.itemsSold}</td><td><strong>{formatCurrency(cashier.revenue)}</strong></td></tr>)}
              {isLoading && <tr><td colSpan={4} className="empty-table">Loading cashier performance...</td></tr>}
              {!isLoading && (invalidRange || report.cashiers.length === 0) && <tr><td colSpan={4} className="empty-table">No cashier sales are available for this date range.</td></tr>}
            </tbody>
          </table></div>
        </section>
      </div>
    </div>
  );
};

export default ReportsPage;
