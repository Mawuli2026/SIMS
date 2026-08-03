import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CartItem, Sale, SaleProduct, calculateLineTotal, calculateSaleTotal } from "../../../types/sale.types";
import { UserProfile } from "../../../types/dashboard.types";
import { formatCurrency } from "../../../utils/currency";
import { getAuthToken } from "../../../utils/authSession";
import { completeSale as submitSale, getSaleProducts } from "../../../services/saleApi";

interface SalesCartProps { user: UserProfile; }

const SalesCart = ({ user }: SalesCartProps) => {
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState("");
  const [productError, setProductError] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const loadProducts = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setProductError("Your session is no longer available. Please sign in again.");
      setIsLoadingProducts(false);
      return;
    }

    setIsLoadingProducts(true);
    setProductError("");
    try {
      const response = await getSaleProducts(token);
      setProducts(response.products);
    } catch (requestError) {
      setProductError(requestError instanceof Error ? requestError.message : "Unable to load active products.");
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

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
    setSelectedProductId(""); setQuantity(1); setError(""); setCompletedSale(null);
  };

  const updateQuantity = (productId: number, nextQuantity: number) => {
    const item = cart.find((entry) => entry.productId === productId);
    if (!item) return;
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) return setError("Quantity must be at least 1.");
    if (nextQuantity > item.availableStock) return setError(`Insufficient stock for ${item.productName}. Only ${item.availableStock} available.`);
    setCart(cart.map((entry) => entry.productId === productId ? { ...entry, quantity: nextQuantity } : entry));
    setError("");
  };

  const completeSale = async () => {
    if (cart.length === 0) return setError("Add at least one product before completing the sale.");
    const token = getAuthToken();
    if (!token) return setError("Your session is no longer available. Please sign in again.");

    setIsCompleting(true);
    setError("");
    try {
      const response = await submitSale(token, {
        items: cart.map(({ productId, quantity: itemQuantity }) => ({ productId, quantity: itemQuantity })),
      });

      setCompletedSale(response.sale);
      setProducts((current) => current.map((product) => {
        const soldItem = response.sale.items.find((item) => item.productId === product.id);
        return soldItem ? {
          ...product,
          quantityInStock: soldItem.remainingStock ?? Math.max(0, product.quantityInStock - soldItem.quantity),
        } : product;
      }));
      setCart([]); setSelectedProductId(""); setQuantity(1);

    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to complete the sale.");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Record Sale</h1><p>Select products, enter quantities, and review the automatically calculated total. Signed in as {user.fullName}.</p></div>

      {completedSale && <div className="sale-success" role="status">
        <div><strong>Sale completed successfully</strong><span>Receipt {completedSale.receiptNumber} · {formatCurrency(completedSale.totalAmount)}</span></div>
        <Link to={`/dashboard/receipts/${completedSale.id}`}>View Receipt</Link>
      </div>}

      <div className="sales-layout">
        <section className="dashboard-panel sale-entry-panel">
          <h2>Add Product</h2>
          {productError && <div className="product-request-error" role="alert"><span>{productError}</span>
            <button className="secondary-button" type="button" onClick={() => void loadProducts()}>Retry</button></div>}
          <div className="sale-entry-form">
            <label>Product
              <select aria-label="Product" disabled={isLoadingProducts || isCompleting} value={selectedProductId} onChange={(event) => { setSelectedProductId(event.target.value); setError(""); }}>
                <option value="">{isLoadingProducts ? "Loading active products..." : "Select an active product"}</option>
                {products.map((product) => <option key={product.id} value={product.id} disabled={product.quantityInStock < 1}>{product.name} — {formatCurrency(product.sellingPrice)} ({product.quantityInStock} in stock)</option>)}
              </select>
            </label>
            <label>Quantity<input aria-label="Quantity" type="number" min="1" max={selectedProduct?.quantityInStock} disabled={isCompleting} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
            {selectedProduct && <div className="stock-note"><span>Available stock</span><strong>{selectedProduct.quantityInStock}</strong></div>}
            <button type="button" className="primary-button" disabled={isLoadingProducts || isCompleting} onClick={addToCart}>Add to Sale</button>
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
                <td><input className="cart-quantity" aria-label={`Quantity for ${item.productName}`} type="number" min="1" max={item.availableStock} disabled={isCompleting} value={item.quantity} onChange={(event) => updateQuantity(item.productId, Number(event.target.value))} /></td>
                <td><strong>{formatCurrency(calculateLineTotal(item))}</strong></td>
                <td><button className="remove-item" type="button" disabled={isCompleting} onClick={() => { setCart(cart.filter((entry) => entry.productId !== item.productId)); setError(""); }} aria-label={`Remove ${item.productName}`}>Remove</button></td>
              </tr>)}
              {cart.length === 0 && <tr><td colSpan={5} className="empty-table">No products have been added to this sale.</td></tr>}
            </tbody>
          </table></div>
          <div className="sale-summary"><span>Sale Total</span><strong>{formatCurrency(total)}</strong></div>
          <button type="button" className="complete-sale-button" disabled={cart.length === 0 || isCompleting} onClick={() => void completeSale()}>{isCompleting ? "Completing Sale..." : "Complete Sale"}</button>
        </section>
      </div>
    </div>
  );
};

export default SalesCart;
