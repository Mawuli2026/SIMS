import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UserProfile } from "../../../types/dashboard.types";
import { Sale } from "../../../types/sale.types";
import { formatCurrency } from "../../../utils/currency";
import { getAuthToken } from "../../../utils/authSession";
import { getSales } from "../../../services/saleApi";
import { PaginationMeta } from "../../../types/pagination.types";
import PaginationControls from "./PaginationControls";

interface SalesHistoryProps { user: UserProfile; }

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium", timeStyle: "short",
}).format(new Date(value));

const PAGE_SIZE = 20;
const initialPagination: PaginationMeta = { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 0 };

const SalesHistory = ({ user }: SalesHistoryProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination);
  const [summary, setSummary] = useState({ transactionCount: 0, totalValue: 0 });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const canViewAllSales = user.role !== "Cashier";

  const loadSaleHistory = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setRequestError("Your session is no longer available. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setRequestError("");
    try {
      const response = await getSales(token, { page, pageSize: PAGE_SIZE, query: debouncedQuery, date });
      const allowedSales = response.sales.filter((sale) =>
        canViewAllSales || sale.cashierEmail.toLowerCase() === user.email.toLowerCase());
      setSales(allowedSales);
      setPagination(response.pagination ?? {
        page,
        pageSize: PAGE_SIZE,
        totalItems: allowedSales.length,
        totalPages: allowedSales.length ? 1 : 0,
      });
      setSummary(response.summary ?? {
        transactionCount: allowedSales.length,
        totalValue: allowedSales.reduce((total, sale) => total + sale.totalAmount, 0),
      });
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to load sales history.");
    } finally {
      setIsLoading(false);
    }
  }, [canViewAllSales, date, debouncedQuery, page, user.email]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => { void loadSaleHistory(); }, [loadSaleHistory]);

  const visibleSales = useMemo(() => sales.filter((sale) => {
    const allowedForRole = canViewAllSales || sale.cashierEmail.toLowerCase() === user.email.toLowerCase();
    const searchable = `${sale.receiptNumber} ${sale.cashierName} ${sale.cashierEmail} ${sale.items.map((item) => item.productName).join(" ")}`.toLowerCase();
    const matchesQuery = searchable.includes(query.trim().toLowerCase());
    const matchesDate = !date || sale.createdAt.slice(0, 10) === date;
    return allowedForRole && matchesQuery && matchesDate;
  }), [canViewAllSales, sales, user.email, query, date]);

  return (
    <div>
      <div className="page-header"><h1>Sales History</h1><p>{canViewAllSales ? "Review all completed business transactions." : "Review the sales completed under your account."}</p></div>

      <div className="history-summary">
        <div><span>Transactions</span><strong>{isLoading ? "—" : summary.transactionCount}</strong></div>
        <div><span>Total value</span><strong>{isLoading ? "—" : formatCurrency(summary.totalValue)}</strong></div>
      </div>

      <section className="dashboard-panel">
        {requestError && <div className="product-request-error" role="alert"><span>{requestError}</span>
          <button className="secondary-button" type="button" onClick={() => void loadSaleHistory()}>Retry</button></div>}
        <div className="history-filters">
          <label>Search sales<input aria-label="Search sales" placeholder="Receipt, cashier, or product..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label>Sale date<input aria-label="Sale date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} /></label>
          {(query || date) && <button type="button" className="secondary-button" onClick={() => { setQuery(""); setDate(""); setPage(1); }}>Clear Filters</button>}
        </div>

        <div className="table-scroll"><table className="dashboard-table history-table">
          <thead><tr><th>Receipt</th><th>Date</th>{canViewAllSales && <th>Cashier</th>}<th>Items</th><th>Total</th><th>Actions</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={canViewAllSales ? 6 : 5} className="empty-table">Loading sales history...</td></tr>}
            {!isLoading && !requestError && visibleSales.map((sale) => <Fragment key={sale.id}>
              <tr key={sale.id}>
                <td><strong>{sale.receiptNumber}</strong></td><td>{formatDate(sale.createdAt)}</td>
                {canViewAllSales && <td>{sale.cashierName}</td>}<td>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td><strong>{formatCurrency(sale.totalAmount)}</strong></td>
                <td><div className="history-actions"><button type="button" onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}>{expandedId === sale.id ? "Hide Details" : "View Details"}</button><Link to={`/dashboard/receipts/${sale.id}`}>Receipt</Link></div></td>
              </tr>
              {expandedId === sale.id && <tr key={`${sale.id}-details`} className="sale-detail-row"><td colSpan={canViewAllSales ? 6 : 5}>
                <div className="sale-detail-content"><h3>Transaction details</h3>
                  <table><thead><tr><th>Product</th><th>Unit price</th><th>Qty</th><th>Line total</th></tr></thead>
                    <tbody>{sale.items.map((item) => <tr key={item.productId}><td>{item.productName}</td><td>{formatCurrency(item.unitPrice)}</td><td>{item.quantity}</td><td>{formatCurrency(item.lineTotal)}</td></tr>)}</tbody>
                  </table>
                </div>
              </td></tr>}
            </Fragment>)}
            {!isLoading && !requestError && visibleSales.length === 0 && <tr><td colSpan={canViewAllSales ? 6 : 5} className="empty-table">No sales match your filters.</td></tr>}
          </tbody>
        </table></div>
        {!isLoading && !requestError && <PaginationControls pagination={pagination} itemLabel="sale"
          onPageChange={(nextPage) => { setPage(nextPage); setExpandedId(null); }} />}
      </section>
    </div>
  );
};

export default SalesHistory;
