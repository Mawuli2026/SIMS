import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Product, ProductFormValues } from "../../../types/product.types";
import { formatCurrency } from "../../../utils/currency";
import { getAuthToken } from "../../../utils/authSession";
import {
  createProduct,
  getLowStockProducts,
  getProducts,
  updateProduct,
  updateProductStatus,
} from "../../../services/productApi";
import { PaginationMeta } from "../../../types/pagination.types";
import PaginationControls from "./PaginationControls";

interface ProductManagementProps { lowStockOnly?: boolean; }

const emptyForm: ProductFormValues = {
  name: "", category: "", costPrice: 0, sellingPrice: 0, quantityInStock: 0, reorderLevel: 0,
};

const isLowStock = (product: Product) =>
  product.status === "Active" && product.quantityInStock <= product.reorderLevel;

const sortProducts = (products: Product[]) => [...products].sort((first, second) =>
  first.name.localeCompare(second.name) || first.id - second.id);

const PAGE_SIZE = 20;
const initialPagination: PaginationMeta = { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 0 };

const ProductManagement = ({ lowStockOnly = false }: ProductManagementProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductFormValues>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination);
  const [formError, setFormError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<number | null>(null);

  const loadProductData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setRequestError("Your session is no longer available. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setRequestError("");
    try {
      const options = { page, pageSize: PAGE_SIZE, query: debouncedQuery };
      const response = lowStockOnly ? await getLowStockProducts(token, options) : await getProducts(token, options);
      setProducts(response.products);
      setPagination(response.pagination ?? {
        page,
        pageSize: PAGE_SIZE,
        totalItems: response.products.length,
        totalPages: response.products.length ? 1 : 0,
      });
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to load products.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, lowStockOnly, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => { void loadProductData(); }, [loadProductData]);

  const visibleProducts = useMemo(() => products.filter((product) =>
    `${product.name} ${product.category}`.toLowerCase().includes(query.trim().toLowerCase())), [products, query]);

  const openAddForm = () => {
    setForm(emptyForm); setEditingId(null); setFormError(""); setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    const { id, status, ...values } = product;
    void status;
    setForm(values); setEditingId(id); setFormError(""); setShowForm(true);
  };

  const validateForm = () => {
    if (!form.name.trim() || !form.category.trim()) return "Product name and category are required.";
    if (form.costPrice < 0 || form.sellingPrice <= 0 || form.quantityInStock < 0 || form.reorderLevel < 0) {
      return "Prices and stock values must be valid positive numbers.";
    }
    if (!Number.isInteger(form.quantityInStock) || !Number.isInteger(form.reorderLevel)) {
      return "Stock quantity and reorder level must be whole numbers.";
    }
    return "";
  };

  const mergeSavedProduct = (savedProduct: Product) => {
    setProducts((current) => {
      const withoutSavedProduct = current.filter((product) => product.id !== savedProduct.id);
      if (lowStockOnly && !isLowStock(savedProduct)) return withoutSavedProduct;
      return sortProducts([...withoutSavedProduct, savedProduct]);
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setFormError("Your session is no longer available. Please sign in again.");
      return;
    }

    const values = { ...form, name: form.name.trim(), category: form.category.trim() };
    setIsSaving(true);
    setFormError("");
    try {
      const response = editingId === null
        ? await createProduct(token, values)
        : await updateProduct(token, editingId, values);
      mergeSavedProduct(response.product);
      if (editingId === null) {
        setPagination((current) => {
          const totalItems = current.totalItems + 1;
          return { ...current, totalItems, totalPages: Math.ceil(totalItems / current.pageSize) };
        });
      }
      setShowForm(false); setForm(emptyForm); setEditingId(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save the product.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (product: Product) => {
    const token = getAuthToken();
    if (!token) {
      setRequestError("Your session is no longer available. Please sign in again.");
      return;
    }

    const nextStatus = product.status === "Active" ? "Inactive" : "Active";
    setPendingProductId(product.id);
    setRequestError("");
    try {
      const response = await updateProductStatus(token, product.id, nextStatus);
      mergeSavedProduct(response.product);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to update the product status.");
    } finally {
      setPendingProductId(null);
    }
  };

  const setNumber = (field: keyof ProductFormValues, value: string) =>
    setForm({ ...form, [field]: Number(value) });

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
          <span className="product-count">{pagination.totalItems} product{pagination.totalItems === 1 ? "" : "s"}</span>
        </div>

        {requestError && <div className="product-request-error" role="alert"><span>{requestError}</span>
          <button className="secondary-button" type="button" onClick={() => void loadProductData()}>Retry</button></div>}
        {isLoading ? <p className="product-loading" role="status">Loading products...</p> : <div className="table-scroll">
          <table className="dashboard-table">
            <thead><tr><th>Product</th><th>Category</th><th>Cost</th><th>Selling</th><th>Stock</th><th>Reorder</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visibleProducts.map((product) => {
                const lowStock = isLowStock(product);
                const isPending = pendingProductId === product.id;
                return <tr key={product.id} className={lowStock ? "low-stock-row" : ""}>
                  <td><strong>{product.name}</strong></td><td>{product.category}</td><td>{formatCurrency(product.costPrice)}</td>
                  <td>{formatCurrency(product.sellingPrice)}</td><td>{product.quantityInStock}</td><td>{product.reorderLevel}</td>
                  <td><span className={product.status === "Active" ? "badge-success" : "badge-muted"}>{product.status}</span>{lowStock && <span className="badge-warning">Low stock</span>}</td>
                  <td><div className="table-actions"><button type="button" disabled={isPending} onClick={() => openEditForm(product)}>Edit</button>
                    <button className={product.status === "Active" ? "danger-action" : "success-action"} type="button" disabled={isPending}
                      onClick={() => void toggleStatus(product)}>{isPending ? "Updating..." : product.status === "Active" ? "Deactivate" : "Activate"}</button></div></td>
                </tr>;
              })}
              {visibleProducts.length === 0 && <tr><td colSpan={8} className="empty-table">No matching products found.</td></tr>}
            </tbody>
          </table>
        </div>}
        {!isLoading && !requestError && <PaginationControls pagination={pagination} itemLabel="product"
          onPageChange={(nextPage) => { setPage(nextPage); setPendingProductId(null); }} />}
      </section>

      {showForm && <div className="modal-backdrop" role="presentation">
        <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
          <div className="modal-header"><h2 id="product-form-title">{editingId === null ? "Add Product" : "Edit Product"}</h2><button type="button" disabled={isSaving} onClick={() => setShowForm(false)} aria-label="Close product form">&times;</button></div>
          <form onSubmit={(event) => void handleSubmit(event)} className="product-form">
            <label>Product name<input value={form.name} maxLength={150} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Category<input value={form.category} maxLength={100} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
            <div className="form-grid">
              <label>Cost price<input type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => setNumber("costPrice", event.target.value)} /></label>
              <label>Selling price<input type="number" min="0.01" step="0.01" value={form.sellingPrice} onChange={(event) => setNumber("sellingPrice", event.target.value)} /></label>
              <label>Quantity in stock<input type="number" min="0" step="1" value={form.quantityInStock} onChange={(event) => setNumber("quantityInStock", event.target.value)} /></label>
              <label>Reorder level<input type="number" min="0" step="1" value={form.reorderLevel} onChange={(event) => setNumber("reorderLevel", event.target.value)} /></label>
            </div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="form-actions"><button type="button" className="secondary-button" disabled={isSaving} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? "Saving..." : editingId === null ? "Save Product" : "Save Changes"}</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
};

export default ProductManagement;
