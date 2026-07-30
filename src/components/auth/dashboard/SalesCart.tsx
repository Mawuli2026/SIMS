import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CartItem, Sale, calculateLineTotal, calculateSaleTotal } from "../../../types/sale.types";
import { UserProfile } from "../../../types/dashboard.types";
import { loadProducts, saveProducts } from "../../../utils/productStorage";
import { createReceiptNumber, saveSale } from "../../../utils/saleStorage";
import { formatCurrency } from "../../../utils/currency";

interface SalesCartProps { user: UserProfile; }

const SalesCart = ({ user }: SalesCartProps) => {
  const products = useMemo(() => loadProducts().filter((product) => product.status === "Active"), []);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState("");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const selectedProduct = products.find((product) => product.id === Number(selectedProductId));
  const total = calculateSaleTotal(cart);

  const addToCart = () => {
    if (!selectedProduct) return setError("Select a product before adding it to the sale.");
    if (!Number.isInteger(quantity) || quantity < 1) return setError("Quantity must be at least 1.");

    const existing = cart.find((item) => item.productId === selectedProduct.id);
    const nextQuantity = quantity + (existing?.quantity ?? 0);
    if (nextQuantity > selectedProduct.quantityInStock) {
      return setError(`Insufficient stock for ${selectedProduct.name}. Only ${selectedProduct.quantityInStock} available.`);
    }

    const nextItem: CartItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      unitPrice: selectedProduct.sellingPrice,
      quantity: nextQuantity,
      availableStock: selectedProduct.quantityInStock,
    };
    setCart(existing ? cart.map((item) => item.productId === nextItem.productId ? nextItem : item) : [...cart, nextItem]);
    setSelectedProductId(""); setQuantity(1); setError("");
  };

  const updateQuantity = (productId: number, nextQuantity: number) => {
    const item = cart.find((entry) => entry.productId === productId);
    if (!item) return;
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) return setError("Quantity must be at least 1.");
    if (nextQuantity > item.availableStock) return setError(`Insufficient stock for ${item.productName}. Only ${item.availableStock} available.`);
    setCart(cart.map((entry) => entry.productId === productId ? { ...entry, quantity: nextQuantity } : entry));
    setError("");
  };

  const completeSale = () => {
    if (cart.length === 0) return setError("Add at least one product before completing the sale.");

    const currentProducts = loadProducts();
    for (const item of cart) {
      const product = currentProducts.find((entry) => entry.id === item.productId);
      if (!product || product.status !== "Active") return setError(`${item.productName} is no longer available for sale.`);
      if (item.quantity > product.quantityInStock) return setError(`Insufficient stock for ${item.productName}. Only ${product.quantityInStock} available.`);
    }

    const saleId = Date.now();
    const sale: Sale = {
      id: saleId,
      receiptNumber: createReceiptNumber(saleId),
      createdAt: new Date().toISOString(),
      cashierName: user.fullName,
      cashierEmail: user.email,
      items: cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: calculateLineTotal(item),
      })),
      totalAmount: total,
    };

    const updatedProducts = currentProducts.map((product) => {
      const soldItem = cart.find((item) => item.productId === product.id);
      return soldItem ? { ...product, quantityInStock: product.quantityInStock - soldItem.quantity } : product;
    });

    saveProducts(updatedProducts);
    saveSale(sale);
    setCompletedSale(sale);
    setCart([]);
    setError("");
    setSelectedProductId("");
    setQuantity(1);
  };

  return (
    <div>
      <div className="page-header"><h1>Record Sale</h1><p>Select products, enter quantities, and review the automatically calculated total.</p></div>

      {completedSale && <div className="sale-success" role="status">
        <div><strong>Sale completed successfully</strong><span>Receipt {completedSale.receiptNumber} · {formatCurrency(completedSale.totalAmount)}</span></div>
        <Link to={`/dashboard/receipts/${completedSale.id}`}>View Receipt</Link>
      </div>}

      <div className="sales-layout">
        <section className="dashboard-panel sale-entry-panel">
          <h2>Add Product</h2>
          <div className="sale-entry-form">
            <label>Product
              <select aria-label="Product" value={selectedProductId} onChange={(event) => { setSelectedProductId(event.target.value); setError(""); }}>
                <option value="">Select an active product</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name} — {formatCurrency(product.sellingPrice)} ({product.quantityInStock} in stock)</option>)}
              </select>
            </label>
            <label>Quantity<input aria-label="Quantity" type="number" min="1" max={selectedProduct?.quantityInStock} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
            {selectedProduct && <div className="stock-note"><span>Available stock</span><strong>{selectedProduct.quantityInStock}</strong></div>}
            <button type="button" className="primary-button" onClick={addToCart}>Add to Sale</button>
          </div>
          {error && <p className="form-error sale-error" role="alert">{error}</p>}
        </section>

        <section className="dashboard-panel cart-panel">
          <div className="cart-heading"><h2>Current Sale</h2><span>{cart.length} item{cart.length === 1 ? "" : "s"}</span></div>
          <div className="table-scroll"><table className="dashboard-table">
            <thead><tr><th>Product</th><th>Unit Price</th><th>Quantity</th><th>Line Total</th><th></th></tr></thead>
            <tbody>
              {cart.map((item) => <tr key={item.productId}>
                <td><strong>{item.productName}</strong><small className="stock-available">{item.availableStock} available</small></td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td><input className="cart-quantity" aria-label={`Quantity for ${item.productName}`} type="number" min="1" max={item.availableStock} value={item.quantity} onChange={(event) => updateQuantity(item.productId, Number(event.target.value))} /></td>
                <td><strong>{formatCurrency(calculateLineTotal(item))}</strong></td>
                <td><button className="remove-item" type="button" onClick={() => { setCart(cart.filter((entry) => entry.productId !== item.productId)); setError(""); }} aria-label={`Remove ${item.productName}`}>Remove</button></td>
              </tr>)}
              {cart.length === 0 && <tr><td colSpan={5} className="empty-table">No products have been added to this sale.</td></tr>}
            </tbody>
          </table></div>
          <div className="sale-summary"><span>Sale Total</span><strong>{formatCurrency(total)}</strong></div>
          <button type="button" className="complete-sale-button" disabled={cart.length === 0} onClick={completeSale}>Complete Sale</button>
        </section>
      </div>
    </div>
  );
};

export default SalesCart;
