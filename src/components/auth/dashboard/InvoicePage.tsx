import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createInvoice, getInvoice, getInvoices } from "../../../services/invoiceApi";
import { getSaleProducts } from "../../../services/saleApi";
import { Invoice, InvoiceSummary } from "../../../types/invoice.types";
import { SaleProduct } from "../../../types/sale.types";
import { formatCurrency } from "../../../utils/currency";
import { getAuthToken } from "../../../utils/authSession";
import "../../../styles/invoice.css";
import "../../../styles/print.css";

interface InvoicePageProps {
  invoiceId?: number;
}

interface InvoiceDraftItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

const formatDate = (value: string) => new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium", timeStyle: "short",
}).format(new Date(value));

const InvoicePage = ({ invoiceId }: InvoicePageProps) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<InvoiceDraftItem[]>([]);
  const [requestError, setRequestError] = useState("");
  const [productsError, setProductsError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPageData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setRequestError("Your session is no longer available. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setRequestError("");
    setProductsError("");
    setHistoryError("");
    try {
      if (invoiceId !== undefined) {
        const response = await getInvoice(token, invoiceId);
        setInvoice(response.invoice);
      } else {
        const [invoiceResult, productResult] = await Promise.allSettled([
          getInvoices(token),
          getSaleProducts(token),
        ]);
        if (invoiceResult.status === "fulfilled") {
          setInvoices(invoiceResult.value.invoices);
        } else {
          setHistoryError(invoiceResult.reason instanceof Error
            ? invoiceResult.reason.message : "Unable to load recent invoices.");
        }
        if (productResult.status === "fulfilled") {
          setProducts(productResult.value.products);
        } else {
          setProductsError(productResult.reason instanceof Error
            ? productResult.reason.message : "Unable to load active products.");
        }
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to load invoices.");
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => { void loadPageData(); }, [loadPageData]);

  const selectedProduct = products.find((product) => product.id === Number(selectedProductId));
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const addItem = () => {
    if (!selectedProduct) {
      setFormError("Select a product before adding it to the invoice.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      setFormError("Quantity must be at least 1.");
      return;
    }
    const existing = items.find((item) => item.productId === selectedProduct.id);
    const nextItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      unitPrice: selectedProduct.sellingPrice,
      quantity: quantity + (existing?.quantity ?? 0),
    };
    setItems(existing
      ? items.map((item) => item.productId === nextItem.productId ? nextItem : item)
      : [...items, nextItem]);
    setSelectedProductId("");
    setQuantity(1);
    setFormError("");
  };

  const updateQuantity = (productId: number, nextQuantity: number) => {
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
      setFormError("Quantity must be at least 1.");
      return;
    }
    setItems((current) => current.map((item) => item.productId === productId ? { ...item, quantity: nextQuantity } : item));
    setFormError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (customerName.trim().length === 0) {
      setFormError("Customer name is required.");
      return;
    }
    if (items.length === 0) {
      setFormError("Add at least one product before generating an invoice.");
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setFormError("Your session is no longer available. Please sign in again.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      const response = await createInvoice(token, {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        items: items.map(({ productId, quantity: itemQuantity }) => ({ productId, quantity: itemQuantity })),
      });
      navigate(`/dashboard/invoices/${response.invoice.id}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to generate the invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  if (invoiceId !== undefined) {
    if (isLoading) return <section className="dashboard-panel receipt-not-found" role="status"><h1>Loading invoice...</h1></section>;
    if (requestError || !invoice) return <section className="dashboard-panel receipt-not-found">
      <p className="eyebrow">Invoice unavailable</p>
      <h1>Invoice not found</h1>
      <p role="alert">{requestError || "The requested invoice could not be found."}</p>
      <div className="receipt-actions">
        <button type="button" className="secondary-button" onClick={() => void loadPageData()}>Retry</button>
        <Link className="primary-action" to="/dashboard/invoices">Back to Invoices</Link>
      </div>
    </section>;

    return <div className="receipt-page">
      <div className="receipt-actions no-print">
        <Link className="secondary-button receipt-back" to="/dashboard/invoices">Back to Invoices</Link>
        <button type="button" className="primary-button" onClick={() => window.print()}>Print / Save PDF</button>
      </div>
      <p className="no-print invoice-print-hint">To download a PDF, choose <strong>Save as PDF</strong> in your browser's print dialog.</p>
      <article className="receipt-container" aria-label={`Pro forma invoice ${invoice.invoiceNumber}`}>
        <header className="receipt-header">
          <picture>
            <source srcSet="/assets/media/sims-logo-v1.webp" type="image/webp" />
            <img src="/sims-logo.png" alt="SIMS logo" width="58" height="29" />
          </picture>
          <div><h1>Pro Forma Invoice</h1><p>Sales &amp; Inventory Management System</p></div>
        </header>
        <div className="receipt-meta">
          <div><span>Invoice number</span><strong>{invoice.invoiceNumber}</strong></div>
          <div><span>Date and time</span><strong>{formatDate(invoice.createdAt)}</strong></div>
          <div><span>Prepared by</span><strong>{invoice.createdByName}</strong></div>
          <div><span>Customer</span><strong>{invoice.customerName}</strong></div>
          {invoice.customerEmail && <div><span>Customer email</span><strong>{invoice.customerEmail}</strong></div>}
          {invoice.customerPhone && <div><span>Customer phone</span><strong>{invoice.customerPhone}</strong></div>}
        </div>
        <div className="table-scroll"><table className="dashboard-table receipt-table">
          <thead><tr><th>Item</th><th>Unit Price</th><th>Quantity</th><th>Total</th></tr></thead>
          <tbody>{invoice.items.map((item) => <tr key={item.productId}>
            <td>{item.productName}</td><td>{formatCurrency(item.unitPrice)}</td><td>{item.quantity}</td><td>{formatCurrency(item.lineTotal)}</td>
          </tr>)}</tbody>
        </table></div>
        <div className="receipt-total"><span>Total Amount</span><strong>{formatCurrency(invoice.totalAmount)}</strong></div>
        <footer className="receipt-footer">
          <strong>Pro forma only — this document is not a completed sale.</strong>
          <span>Stock is not reserved and inventory has not been changed.</span>
        </footer>
      </article>
    </div>;
  }

  return <div>
    <div className="page-header"><h1>Generate Invoice</h1><p>Create a printable pro forma invoice for a potential customer. This will not complete a sale or change stock.</p></div>
    {requestError && <div className="product-request-error" role="alert"><span>{requestError}</span>
      <button className="secondary-button" type="button" onClick={() => void loadPageData()}>Retry</button></div>}

    <form className="invoice-layout" onSubmit={(event) => void handleSubmit(event)}>
      <section className="dashboard-panel">
        <h2>Customer Details</h2>
        <div className="invoice-customer-fields">
          <label>Customer name<input aria-label="Customer name" required maxLength={150} value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label>
          <label>Email address <span>(optional)</span><input aria-label="Customer email" type="email" maxLength={150} value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} /></label>
          <label>Phone number <span>(optional)</span><input aria-label="Customer phone" type="tel" maxLength={50} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} /></label>
        </div>
      </section>

      <section className="dashboard-panel">
        <h2>Add Products</h2>
        {productsError && <div className="product-request-error" role="alert"><span>{productsError}</span>
          <button className="secondary-button" type="button" onClick={() => void loadPageData()}>Retry</button></div>}
        <div className="sale-entry-form invoice-product-form">
          <label>Product<select aria-label="Invoice product" disabled={isLoading || isSaving} value={selectedProductId} onChange={(event) => { setSelectedProductId(event.target.value); setFormError(""); }}>
            <option value="">{isLoading ? "Loading active products..." : products.length > 0 ? "Select an active product" : "No active products available to invoice"}</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name} — {formatCurrency(product.sellingPrice)} ({product.quantityInStock} in stock)</option>)}
          </select></label>
          <label>Quantity<input aria-label="Invoice quantity" type="number" min="1" disabled={isSaving} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
          <button type="button" className="primary-button" disabled={isLoading || isSaving} onClick={addItem}>Add to Invoice</button>
        </div>
        <p className="invoice-stock-note">Invoice quantities do not reserve or deduct stock.</p>
      </section>

      <section className="dashboard-panel invoice-items-panel">
        <h2>Invoice Items</h2>
        <div className="table-scroll"><table className="dashboard-table">
          <thead><tr><th>Product</th><th>Unit Price</th><th>Quantity</th><th>Line Total</th><th></th></tr></thead>
          <tbody>
            {items.map((item) => <tr key={item.productId}>
              <td><strong>{item.productName}</strong></td>
              <td>{formatCurrency(item.unitPrice)}</td>
              <td><input className="cart-quantity" aria-label={`Invoice quantity for ${item.productName}`} type="number" min="1" disabled={isSaving} value={item.quantity} onChange={(event) => updateQuantity(item.productId, Number(event.target.value))} /></td>
              <td><strong>{formatCurrency(item.unitPrice * item.quantity)}</strong></td>
              <td><button className="remove-item" type="button" disabled={isSaving} onClick={() => setItems((current) => current.filter((entry) => entry.productId !== item.productId))}>Remove</button></td>
            </tr>)}
            {items.length === 0 && <tr><td colSpan={5} className="empty-table">Add products to prepare this invoice.</td></tr>}
          </tbody>
        </table></div>
        <div className="sale-summary"><span>Invoice Total</span><strong>{formatCurrency(total)}</strong></div>
        {formError && <p className="form-error sale-error" role="alert">{formError}</p>}
        <button type="submit" className="complete-sale-button" disabled={isSaving || isLoading || items.length === 0}>{isSaving ? "Generating Invoice..." : "Generate Pro Forma Invoice"}</button>
      </section>
    </form>

    <section className="dashboard-panel invoice-history-panel">
      <div className="cart-heading"><h2>Recent Invoices</h2><span>Up to 50 most recent</span></div>
      {historyError && <div className="product-request-error" role="alert"><span>{historyError}</span>
        <button className="secondary-button" type="button" onClick={() => void loadPageData()}>Retry</button></div>}
      <div className="table-scroll"><table className="dashboard-table">
        <thead><tr><th>Invoice</th><th>Customer</th><th>Prepared by</th><th>Date</th><th>Lines</th><th>Total</th><th></th></tr></thead>
        <tbody>
          {invoices.map((savedInvoice) => <tr key={savedInvoice.id}>
            <td><strong>{savedInvoice.invoiceNumber}</strong></td>
            <td>{savedInvoice.customerName}</td>
            <td>{savedInvoice.createdByName}</td>
            <td>{formatDate(savedInvoice.createdAt)}</td>
            <td>{savedInvoice.itemCount}</td>
            <td><strong>{formatCurrency(savedInvoice.totalAmount)}</strong></td>
            <td><Link className="table-link" to={`/dashboard/invoices/${savedInvoice.id}`}>View / Print</Link></td>
          </tr>)}
          {!isLoading && !historyError && invoices.length === 0 && <tr><td colSpan={7} className="empty-table">No invoices have been generated yet.</td></tr>}
          {isLoading && <tr><td colSpan={7} className="empty-table">Loading invoices...</td></tr>}
        </tbody>
      </table></div>
    </section>
  </div>;
};

export default InvoicePage;
