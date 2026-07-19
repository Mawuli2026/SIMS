import { Link } from "react-router-dom";
import { findSaleById } from "../../../utils/saleStorage";
import { formatCurrency } from "../../../utils/currency";

interface ReceiptPageProps { saleId: number; }

const formatDate = (value: string) => new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium", timeStyle: "short",
}).format(new Date(value));

const ReceiptPage = ({ saleId }: ReceiptPageProps) => {
  const sale = findSaleById(saleId);

  if (!sale) return <section className="dashboard-panel receipt-not-found">
    <p className="eyebrow">Receipt unavailable</p>
    <h1>Sale not found</h1>
    <p>The requested receipt does not exist in this browser’s saved sales.</p>
    <Link className="primary-action" to="/dashboard/sales-history">View Sales History</Link>
  </section>;

  return (
    <div className="receipt-page">
      <div className="receipt-actions no-print">
        <Link className="secondary-button receipt-back" to="/dashboard/sales">Back to Sales</Link>
        <button type="button" className="primary-button" onClick={() => window.print()}>Print Receipt</button>
      </div>

      <article className="receipt-container" aria-label={`Receipt ${sale.receiptNumber}`}>
        <header className="receipt-header">
          <img src="/sims-logo.png" alt="SIMS logo" />
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
        <footer className="receipt-footer"><strong>Thank you for your business.</strong><span>This receipt was generated from saved sale #{sale.id}.</span></footer>
      </article>
    </div>
  );
};

export default ReceiptPage;
