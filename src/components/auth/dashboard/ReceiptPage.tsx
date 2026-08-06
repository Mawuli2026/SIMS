import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSale } from "../../../services/saleApi";
import { Sale } from "../../../types/sale.types";
import { getAuthToken } from "../../../utils/authSession";
import { formatCurrency } from "../../../utils/currency";

interface ReceiptPageProps { saleId: number; }

const formatDate = (value: string) => new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium", timeStyle: "short",
}).format(new Date(value));

const ReceiptPage = ({ saleId }: ReceiptPageProps) => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReceipt = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError("Your session is no longer available. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await getSale(token, saleId);
      setSale(response.sale);
    } catch (requestError) {
      setSale(null);
      setError(requestError instanceof Error ? requestError.message : "Unable to load this receipt.");
    } finally {
      setIsLoading(false);
    }
  }, [saleId]);

  useEffect(() => { void loadReceipt(); }, [loadReceipt]);

  if (isLoading) return <section className="dashboard-panel receipt-not-found">
    <p className="eyebrow">Receipt</p>
    <h1>Loading receipt...</h1>
  </section>;

  if (!sale) return <section className="dashboard-panel receipt-not-found">
    <p className="eyebrow">Receipt unavailable</p>
    <h1>Sale not found</h1>
    <p role="alert">{error || "The requested receipt does not exist or is not available to your account."}</p>
    <div className="receipt-actions">
      <button type="button" className="secondary-button" onClick={() => void loadReceipt()}>Retry</button>
      <Link className="primary-action" to="/dashboard/sales-history">View Sales History</Link>
    </div>
  </section>;

  return (
    <div className="receipt-page">
      <div className="receipt-actions no-print">
        <Link className="secondary-button receipt-back" to="/dashboard/sales">Back to Sales</Link>
        <button type="button" className="primary-button" onClick={() => window.print()}>Print Receipt</button>
      </div>

      <article className="receipt-container" aria-label={`Receipt ${sale.receiptNumber}`}>
        <header className="receipt-header">
          <picture>
            <source srcSet="/assets/media/sims-logo-v1.webp" type="image/webp" />
            <img src="/sims-logo.png" alt="SIMS logo" width="58" height="29" />
          </picture>
          <div><h1>Sales Receipt</h1><p>Sales &amp; Inventory Management System</p></div>
        </header>

        <div className="receipt-meta">
          <div><span>Receipt number</span><strong>{sale.receiptNumber}</strong></div>
          <div><span>Date and time</span><strong>{formatDate(sale.createdAt)}</strong></div>
          <div><span>Cashier</span><strong>{sale.cashierName}</strong></div>
          <div><span>Cashier email</span><strong>{sale.cashierEmail}</strong></div>
        </div>

        <div className="table-scroll"><table className="dashboard-table receipt-table">
          <thead><tr><th>Item</th><th>Unit Price</th><th>Quantity</th><th>Total</th></tr></thead>
          <tbody>{sale.items.map((item) => <tr key={item.productId}>
            <td>{item.productName}</td><td>{formatCurrency(item.unitPrice)}</td><td>{item.quantity}</td><td>{formatCurrency(item.lineTotal)}</td>
          </tr>)}</tbody>
        </table></div>

        <div className="receipt-total"><span>Total Amount</span><strong>{formatCurrency(sale.totalAmount)}</strong></div>
        <footer className="receipt-footer"><strong>Thank you for your business.</strong><span>This receipt was generated from sale #{sale.id}.</span></footer>
      </article>
    </div>
  );
};

export default ReceiptPage;
