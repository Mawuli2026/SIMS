import { FormEvent, useMemo, useState } from "react";
import { Product, ProductFormValues } from "../../../types/product.types";
import { loadProducts, saveProducts } from "../../../utils/productStorage";
import { formatCurrency } from "../../../utils/currency";

interface ProductManagementProps { lowStockOnly?: boolean; }

const emptyForm: ProductFormValues = {
  name: "", category: "", costPrice: 0, sellingPrice: 0, quantityInStock: 0, reorderLevel: 0,
};

const ProductManagement = ({ lowStockOnly = false }: ProductManagementProps) => {
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [form, setForm] = useState<ProductFormValues>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesStock = !lowStockOnly || (product.status === "Active" && product.quantityInStock <= product.reorderLevel);
    return matchesQuery && matchesStock;
  }), [products, query, lowStockOnly]);

  const updateProducts = (next: Product[]) => { setProducts(next); saveProducts(next); };

  const openAddForm = () => { setForm(emptyForm); setEditingId(null); setError(""); setShowForm(true); };
  const openEditForm = (product: Product) => {
    const { id, status, ...values } = product;
    void status;
    setForm(values); setEditingId(id); setError(""); setShowForm(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.category.trim()) return setError("Product name and category are required.");
    if (form.costPrice < 0 || form.sellingPrice <= 0 || form.quantityInStock < 0 || form.reorderLevel < 0) {
      return setError("Prices and stock values must be valid positive numbers.");
    }

    if (editingId !== null) {
      updateProducts(products.map((product) => product.id === editingId ? { ...product, ...form, name: form.name.trim(), category: form.category.trim() } : product));
    } else {
      updateProducts([...products, { ...form, id: Date.now(), name: form.name.trim(), category: form.category.trim(), status: "Active" }]);
    }
    setShowForm(false); setForm(emptyForm); setEditingId(null);
  };

  const toggleStatus = (id: number) => updateProducts(products.map((product) =>
    product.id === id ? { ...product, status: product.status === "Active" ? "Inactive" : "Active" } : product
  ));

  const setNumber = (field: keyof ProductFormValues, value: string) => setForm({ ...form, [field]: Number(value) });

  return (
    <div>
      <div className="page-header product-page-header">
        <div><h1>{lowStockOnly ? "Low-Stock Products" : "Products & Inventory"}</h1>
          <p>{lowStockOnly ? "Products at or below their reorder level." : "Add products and maintain accurate inventory information."}</p></div>
        {!lowStockOnly && <button className="primary-button" type="button" onClick={openAddForm}>+ Add Product</button>}
      </div>

      <section className="dashboard-panel">
        <div className="product-toolbar">
          <input aria-label="Search products" placeholder="Search by product or category..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <span className="product-count">{visibleProducts.length} product{visibleProducts.length === 1 ? "" : "s"}</span>
        </div>
        <div className="table-scroll">
          <table className="dashboard-table">
            <thead><tr><th>Product</th><th>Category</th><th>Cost</th><th>Selling</th><th>Stock</th><th>Reorder</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visibleProducts.map((product) => {
                const isLow = product.status === "Active" && product.quantityInStock <= product.reorderLevel;
                return <tr key={product.id} className={isLow ? "low-stock-row" : ""}>
                  <td><strong>{product.name}</strong></td><td>{product.category}</td><td>{formatCurrency(product.costPrice)}</td>
                  <td>{formatCurrency(product.sellingPrice)}</td><td>{product.quantityInStock}</td><td>{product.reorderLevel}</td>
                  <td><span className={product.status === "Active" ? "badge-success" : "badge-muted"}>{product.status}</span>{isLow && <span className="badge-warning">Low stock</span>}</td>
                  <td><div className="table-actions"><button type="button" onClick={() => openEditForm(product)}>Edit</button><button className={product.status === "Active" ? "danger-action" : "success-action"} type="button" onClick={() => toggleStatus(product.id)}>{product.status === "Active" ? "Deactivate" : "Activate"}</button></div></td>
                </tr>;
              })}
              {visibleProducts.length === 0 && <tr><td colSpan={8} className="empty-table">No matching products found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && <div className="modal-backdrop" role="presentation">
        <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
          <div className="modal-header"><h2 id="product-form-title">{editingId === null ? "Add Product" : "Edit Product"}</h2><button type="button" onClick={() => setShowForm(false)} aria-label="Close product form">&times;</button></div>
          <form onSubmit={handleSubmit} className="product-form">
            <label>Product name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
            <div className="form-grid">
              <label>Cost price<input type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setNumber("costPrice", e.target.value)} /></label>
              <label>Selling price<input type="number" min="0.01" step="0.01" value={form.sellingPrice} onChange={(e) => setNumber("sellingPrice", e.target.value)} /></label>
              <label>Quantity in stock<input type="number" min="0" value={form.quantityInStock} onChange={(e) => setNumber("quantityInStock", e.target.value)} /></label>
              <label>Reorder level<input type="number" min="0" value={form.reorderLevel} onChange={(e) => setNumber("reorderLevel", e.target.value)} /></label>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-button">{editingId === null ? "Save Product" : "Save Changes"}</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
};

export default ProductManagement;
