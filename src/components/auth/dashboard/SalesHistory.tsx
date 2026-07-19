import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UserProfile } from "../../../types/dashboard.types";
import { loadSales } from "../../../utils/saleStorage";
import { formatCurrency } from "../../../utils/currency";

interface SalesHistoryProps { user: UserProfile; }

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium", timeStyle: "short",
}).format(new Date(value));

const SalesHistory = ({ user }: SalesHistoryProps) => {
  const sales = useMemo(() => loadSales(), []);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const visibleSales = useMemo(() => sales.filter((sale) => {
    const allowedForRole = user.role === "Admin" || sale.cashierEmail.toLowerCase() === user.email.toLowerCase();
    const searchable = `${sale.receiptNumber} ${sale.cashierName} ${sale.cashierEmail} ${sale.items.map((item) => item.productName).join(" ")}`.toLowerCase();
    const matchesQuery = searchable.includes(query.trim().toLowerCase());
    const matchesDate = !date || sale.createdAt.slice(0, 10) === date;
    return allowedForRole && matchesQuery && matchesDate;
  }), [sales, user, query, date]);

  const totalValue = visibleSales.reduce((total, sale) => total + sale.totalAmount, 0);

  return (
    <div>
      <div className="page-header"><h1>Sales History</h1><p>{user.role === "Admin" ? "Review all completed business transactions." : "Review the sales completed under your account."}</p></div>

      <div className="history-summary">
        <div><span>Transactions</span><strong>{visibleSales.length}</strong></div>
        <div><span>Total value</span><strong>{formatCurrency(totalValue)}</strong></div>
      </div>

      <section className="dashboard-panel">
        <div className="history-filters">
          <label>Search sales<input aria-label="Search sales" placeholder="Receipt, cashier, or product..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label>Sale date<input aria-label="Sale date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          {(query || date) && <button type="button" className="secondary-button" onClick={() => { setQuery(""); setDate(""); }}>Clear Filters</button>}
        </div>

        <div className="table-scroll"><table className="dashboard-table history-table">
          <thead><tr><th>Receipt</th><th>Date</th>{user.role === "Admin" && <th>Cashier</th>}<th>Items</th><th>Total</th><th>Actions</th></tr></thead>
          <tbody>
            {visibleSales.map((sale) => <Fragment key={sale.id}>
              <tr key={sale.id}>
                <td><strong>{sale.receiptNumber}</strong></td><td>{formatDate(sale.createdAt)}</td>
                {user.role === "Admin" && <td>{sale.cashierName}</td>}<td>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td><strong>{formatCurrency(sale.totalAmount)}</strong></td>
                <td><div className="history-actions"><button type="button" onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}>{expandedId === sale.id ? "Hide Details" : "View Details"}</button><Link to={`/dashboard/receipts/${sale.id}`}>Receipt</Link></div></td>
              </tr>
              {expandedId === sale.id && <tr key={`${sale.id}-details`} className="sale-detail-row"><td colSpan={user.role === "Admin" ? 6 : 5}>
                <div className="sale-detail-content"><h3>Transaction details</h3>
                  <table><thead><tr><th>Product</th><th>Unit price</th><th>Qty</th><th>Line total</th></tr></thead>
                    <tbody>{sale.items.map((item) => <tr key={item.productId}><td>{item.productName}</td><td>{formatCurrency(item.unitPrice)}</td><td>{item.quantity}</td><td>{formatCurrency(item.lineTotal)}</td></tr>)}</tbody>
                  </table>
                </div>
              </td></tr>}
            </Fragment>)}
            {visibleSales.length === 0 && <tr><td colSpan={user.role === "Admin" ? 6 : 5} className="empty-table">No saved sales match your filters.</td></tr>}
          </tbody>
        </table></div>
      </section>
    </div>
  );
};

export default SalesHistory;
