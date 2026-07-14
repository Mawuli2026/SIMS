import { useState } from "react";
import { useNavigate } from "react-router-dom";
import productService from "../../services/productService";
import { ProductFormData } from "../../types/product";

const AddProduct = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<ProductFormData>({
    barcode: "",
    name: "",
    description: "",
    category: "",
    brand: "",
    sku: "",
    costPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    reorderLevel: 0,
    image: null,
  });

  const [preview, setPreview] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "costPrice" ||
        name === "sellingPrice" ||
        name === "quantity" ||
        name === "reorderLevel"
          ? Number(value)
          : value,
    }));
  };

  const handleImage = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setForm((prev) => ({
      ...prev,
      image: file,
    }));

    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    productService.create(form);

    navigate("/products");
  };

  return (
    <div className="max-w-5xl mx-auto">

      <div className="bg-white rounded-xl shadow border border-gray-200 p-8">

        <h1 className="text-3xl font-bold mb-2">
          Add Product
        </h1>

        <p className="text-gray-500 mb-8">
          Register a new inventory product.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <div className="grid md:grid-cols-2 gap-6">

            <div>
              <label className="font-medium">
                Product Name
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="font-medium">
                Barcode
              </label>

              <input
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="font-medium">
                SKU
              </label>

              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="font-medium">
                Brand
              </label>

              <input
                name="brand"
                value={form.brand}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="font-medium">
                Category
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border p-3"
              >
                <option value="">Select Category</option>
                <option>Food</option>
                <option>Drinks</option>
                <option>Dairy</option>
                <option>Electronics</option>
                <option>Cosmetics</option>
                <option>Stationery</option>
              </select>
            </div>

            <div>
              <label className="font-medium">
                Quantity
              </label>

              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="font-medium">
                Cost Price
              </label>

              <input
                type="number"
                step="0.01"
                name="costPrice"
                value={form.costPrice}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="font-medium">
                Selling Price
              </label>

              <input
                type="number"
                step="0.01"
                name="sellingPrice"
                value={form.sellingPrice}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="font-medium">
                Reorder Level
              </label>

              <input
                type="number"
                name="reorderLevel"
                value={form.reorderLevel}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

          </div>

          <div>
            <label className="font-medium">
              Description
            </label>

            <textarea
              rows={4}
              name="description"
              value={form.description}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="font-medium">
              Product Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="mt-3"
            />

            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-4 h-40 rounded-lg border object-cover"
              />
            )}
          </div>

          <div className="flex justify-end gap-4">

            <button
              type="button"
              onClick={() => navigate("/products")}
              className="rounded-lg border px-6 py-3"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Save Product
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AddProduct;