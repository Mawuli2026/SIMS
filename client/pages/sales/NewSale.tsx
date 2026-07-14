import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiSearch, HiTrash, HiPlus, HiMinus } from "react-icons/hi";

import customerService from "../../services/customerService";
import productService from "../../services/productService";
import salesService, { Sale, SaleItem } from "../../services/salesService";

// productService's Product type currently lives in an empty types file,
// so we describe the shape we actually use here to keep this page typed.
interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  status: string;
}

interface CartLine extends SaleItem {}

const NewSale = () => {
  const navigate = useNavigate();

  // ----------------------------------------
  // Customer selection (Step 5 / Step 6)
  // ----------------------------------------
  const customers = customerService.getAll();

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("Walk-in Customer");

  // ----------------------------------------
  // Product search + cart
  // ----------------------------------------
  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);

  const products: Product[] = productService.getAll() as unknown as Product[];

  const filteredProducts = useMemo(() => {
    if (!productQuery.trim()) return products;
    return productService.search(productQuery) as unknown as Product[];
  }, [productQuery, products]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);

      if (existing) {
        const nextQuantity = existing.quantity + 1;

        if (nextQuantity > product.quantity) {
          alert(`Only ${product.quantity} in stock for ${product.name}.`);
          return prev;
        }

        return prev.map((line) =>
          line.productId === product.id
            ? {
                ...line,
                quantity: nextQuantity,
                total: nextQuantity * line.unitPrice - line.discount + line.tax,
              }
            : line
        );
      }

      if (product.quantity <= 0) {
        alert(`${product.name} is out of stock.`);
        return prev;
      }

      const newLine: CartLine = {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        discount: 0,
        tax: 0,
        total: product.sellingPrice,
      };

      return [...prev, newLine];
    });
  };

  const updateQuantity = (lineId: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.id !== lineId) return line;

          const product = products.find((p) => p.id === line.productId);
          const maxStock = product ? product.quantity : quantity;

          const safeQuantity = Math.min(Math.max(quantity, 1), maxStock);

          return {
            ...line,
            quantity: safeQuantity,
            total: safeQuantity * line.unitPrice - line.discount + line.tax,
          };
        })
        .filter((line) => line.quantity > 0)
    );
  };

  const removeFromCart = (lineId: string) => {
    setCart((prev) => prev.filter((line) => line.id !== lineId));
  };

  // ----------------------------------------
  // Totals
  // ----------------------------------------
  const subtotal = salesService.calculateSubtotal(cart);
  const discount = salesService.calculateDiscount(cart);
  const tax = salesService.calculateTax(cart);
  const grandTotal = subtotal - discount + tax;
  const profit = salesService.calculateProfit(cart);

  // ----------------------------------------
  // Payment
  // ----------------------------------------
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash" | "Card" | "Mobile Money"
  >("Cash");
  const [amountPaid, setAmountPaid] = useState(0);
  const [loading, setLoading] = useState(false);

  const change = amountPaid - grandTotal;

  const completeSale = () => {
    if (cart.length === 0) {
      alert("Add at least one product to the cart.");
      return;
    }

    if (paymentMethod === "Cash" && amountPaid < grandTotal) {
      alert("Amount paid is less than the total due.");
      return;
    }

    setLoading(true);

    try {
      const sale: Sale = {
        id: crypto.randomUUID(),
        saleNumber: salesService.getNextInvoiceNumber(),
        customerId: customerId || undefined,
        customerName,
        cashierId: "ADMIN",
        cashierName: "Administrator",
        paymentMethod,
        subtotal,
        discount,
        tax,
        grandTotal,
        amountPaid: paymentMethod === "Cash" ? amountPaid : grandTotal,
        change: paymentMethod === "Cash" ? Math.max(change, 0) : 0,
        profit,
        status: "Completed",
        createdAt: new Date().toISOString(),
        items: cart,
      };

      salesService.create(sale);

      // Deduct sold quantities from stock.
      cart.forEach((line) => {
        const product = products.find((p) => p.id === line.productId);
        if (product) {
          productService.updateStock(
            product.id,
            Math.max(product.quantity - line.quantity, 0)
          );
        }
      });

      // Track the purchase against the customer, if one was selected.
      if (customerId) {
        customerService.updatePurchaseHistory(customerId, grandTotal);
      }

      navigate(`/receipt/${sale.id}`);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Unable to complete the sale.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Sale</h1>
        <p className="text-gray-500">Create a new sale transaction</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left column: products + cart */}
        <div className="col-span-8 space-y-6">
          {/* Product search */}
          <div className="rounded-xl border bg-white shadow">
            <div className="border-b p-5">
              <h2 className="text-xl font-semibold">Products</h2>
            </div>

            <div className="space-y-4 p-5">
              <div className="relative">
                <HiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search by name, category, brand or barcode..."
                  className="w-full rounded-lg border py-2 pl-10 pr-4"
                />
              </div>

              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2">Product</th>
                      <th>Price</th>
                      <th>In Stock</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b">
                        <td className="py-2">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {product.sku}
                          </div>
                        </td>
                        <td>${product.sellingPrice.toFixed(2)}</td>
                        <td>
                          <span
                            className={
                              product.quantity <= 0
                                ? "text-red-600"
                                : "text-gray-700"
                            }
                          >
                            {product.quantity}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.quantity <= 0}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-white disabled:opacity-40"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-400">
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="rounded-xl border bg-white shadow">
            <div className="border-b p-5">
              <h2 className="text-xl font-semibold">Cart</h2>
            </div>

            <div className="p-5">
              {cart.length === 0 ? (
                <p className="py-6 text-center text-gray-400">
                  Cart is empty. Add products above.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2">Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th className="text-right">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((line) => (
                      <tr key={line.id} className="border-b">
                        <td className="py-2">{line.productName}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(line.id, line.quantity - 1)
                              }
                              className="rounded border p-1"
                            >
                              <HiMinus size={14} />
                            </button>
                            <span className="w-6 text-center">
                              {line.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(line.id, line.quantity + 1)
                              }
                              className="rounded border p-1"
                            >
                              <HiPlus size={14} />
                            </button>
                          </div>
                        </td>
                        <td>${line.unitPrice.toFixed(2)}</td>
                        <td className="text-right">
                          ${line.total.toFixed(2)}
                        </td>
                        <td className="pl-3 text-right">
                          <button
                            onClick={() => removeFromCart(line.id)}
                            className="text-red-600"
                          >
                            <HiTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right column: customer + payment */}
        <div className="col-span-4 space-y-6">
          {/* Customer dropdown (Step 5 / 6) */}
          <div className="rounded-xl border bg-white shadow">
            <div className="border-b p-5">
              <h2 className="text-xl font-semibold">Customer</h2>
            </div>

            <div className="p-5">
              <select
                value={customerId}
                onChange={(e) => {
                  const customer = customerService.getById(e.target.value);

                  setCustomerId(e.target.value);

                  if (customer) {
                    setCustomerName(
                      customer.firstName + " " + customer.lastName
                    );
                  } else {
                    setCustomerName("Walk-in Customer");
                  }
                }}
                className="w-full rounded-lg border p-3"
              >
                <option value="">Walk-in Customer</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border bg-white shadow">
            <div className="border-b p-5">
              <h2 className="text-xl font-semibold">Summary</h2>
            </div>

            <div className="space-y-2 p-5 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border bg-white shadow">
            <div className="border-b p-5">
              <h2 className="text-xl font-semibold">Payment</h2>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block font-medium">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Mobile Money">Mobile Money</option>
                </select>
              </div>

              {paymentMethod === "Cash" && (
                <div>
                  <label className="mb-2 block font-medium">
                    Amount Received
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>
              )}

              {paymentMethod === "Cash" && (
                <div className="flex justify-between rounded-lg bg-gray-50 p-3">
                  <span>Change</span>
                  <strong className="text-green-600">
                    ${Math.max(change, 0).toFixed(2)}
                  </strong>
                </div>
              )}

              <button
                onClick={completeSale}
                disabled={loading}
                className="w-full rounded-lg bg-green-600 py-3 text-lg font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSale;