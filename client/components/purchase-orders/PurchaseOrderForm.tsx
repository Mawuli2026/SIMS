import { useEffect, useMemo, useState } from "react";
import { HiPlus, HiTrash } from "react-icons/hi";
import supplierService from "../../services/supplierService";
import productService from "../../services/productService";
import {
  PurchaseOrderFormData,
  PurchaseOrderItem,
} from "../../types/purchaseOrder";

interface PurchaseOrderFormProps {
  initialData: PurchaseOrderFormData;
  onSubmit: (data: PurchaseOrderFormData) => void;
  submitLabel?: string;
}

const PurchaseOrderForm = ({
  initialData,
  onSubmit,
  submitLabel = "Save Purchase Order",
}: PurchaseOrderFormProps) => {
  // --- Part 1: State & Initialization ---
  const suppliers = supplierService.getActive();
  const products = productService.getAll();

  const [form, setForm] = useState<PurchaseOrderFormData>(initialData);

  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  const subtotal = useMemo(() => {
    return form.items.reduce((sum, item) => sum + item.total, 0);
  }, [form.items]);

  const grandTotal = useMemo(() => {
    return (
      subtotal + 
      Number(form.tax) - 
      Number(form.discount)
    );
  }, [subtotal, form.tax, form.discount]);

  // --- Part 2: General Field Change Handler ---
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "tax" || name === "discount" 
          ? Number(value) 
          : value,
    }));
  };

  // --- Part 3: Add Product ---
  const addProduct = () => {
    if (products.length === 0) return;

    const product = products[0];
    const item: PurchaseOrderItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      quantity: 1,
      costPrice: product.costPrice,
      total: product.costPrice,
    };

    setForm((prev) => ({
      ...prev,
      items: [...prev.items, item],
    }));
  };

  // --- Part 4: Remove Product ---
  const removeProduct = (id: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  // --- Part 5: Update Item ---
  const updateItem = (
    id: string,
    field: keyof PurchaseOrderItem,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;

        const updated = {
          ...item,
          [field]: value,
        };

        updated.total = updated.quantity * updated.costPrice;
        return updated;
      }),
    }));
  };

  // --- Part 6: Form Submission Handling ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      ...form,
      tax: Number(form.tax),
      discount: Number(form.discount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Supplier & Dates */}
      <div className="rounded-xl border bg-white p-6 shadow">
        <h2 className="mb-6 text-xl font-semibold">
          Purchase Order Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Supplier</label>
            <select
              required
              name="supplierId"
              value={form.supplierId}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            >
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Order Date</label>
            <input
              type="date"
              required
              name="orderDate"
              value={form.orderDate}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Expected Date</label>
            <input
              type="date"
              name="expectedDate"
              value={form.expectedDate}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="rounded-xl border bg-white p-6 shadow">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Products</h2>
          <button
            type="button"
            onClick={addProduct}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <HiPlus />
            Add Product
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">{item.productName}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", Number(e.target.value))
                      }
                      className="w-24 rounded border p-2"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.costPrice}
                      onChange={(e) =>
                        updateItem(item.id, "costPrice", Number(e.target.value))
                      }
                      className="w-28 rounded border p-2"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    ${item.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeProduct(item.id)}
                      className="rounded bg-red-100 p-2 text-red-700 hover:bg-red-200"
                    >
                      <HiTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part 7: Notes & Totals */}
      <div className="rounded-xl border bg-white p-6 shadow">
        <label className="mb-2 block font-medium">Notes</label>
        <textarea
          rows={4}
          name="notes"
          value={form.notes}
          onChange={handleChange}
          className="w-full rounded-lg border p-3"
        />
      </div>

      {/* Totals Calculation */}
      <div className="rounded-xl border bg-white p-6 shadow">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Tax</label>
            <input
              type="number"
              step="0.01"
              name="tax"
              value={form.tax}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Discount</label>
            <input
              type="number"
              step="0.01"
              name="discount"
              value={form.discount}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>

        <div className="mt-8 space-y-3 rounded-lg bg-gray-50 p-6">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <strong>${Number(form.tax).toFixed(2)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <strong>${Number(form.discount).toFixed(2)}</strong>
          </div>
          <hr />
          <div className="flex justify-between text-xl font-bold">
            <span>Grand Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700 transitions-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default PurchaseOrderForm;