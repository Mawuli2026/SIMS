import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiArrowLeft,
  HiPencil,
  HiTrash,
} from "react-icons/hi";

import productService from "../../services/productService";
import DeleteConfirmationModal from "../../common/DeleteConfirmationModal";

const statusStyles: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-700",
  "Low Stock": "bg-orange-100 text-orange-700",
  "Out of Stock": "bg-red-100 text-red-700",
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const product = id ? productService.getById(id) : undefined;

  if (!product) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow">
        <h1 className="mb-4 text-2xl font-bold">
          Product Not Found
        </h1>

        <Link
          to="/products"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const inventoryValue =
    product.quantity * product.costPrice;

  const handleDelete = () => {
    productService.delete(product.id);
    navigate("/products");
  };

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-4">

          <Link
            to="/products"
            className="rounded-lg border p-2 hover:bg-gray-100"
          >
            <HiArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-3xl font-bold">
              {product.name}
            </h1>

            <p className="text-gray-500">
              Product Details
            </p>
          </div>

        </div>

        <div className="flex gap-3">

          <Link
            to={`/products/edit/${product.id}`}
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-yellow-500
              px-5
              py-2
              text-white
              hover:bg-yellow-600
            "
          >
            <HiPencil />
            Edit
          </Link>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-red-600
              px-5
              py-2
              text-white
              hover:bg-red-700
            "
          >
            <HiTrash />
            Delete
          </button>

        </div>

      </div>

      {/* Card */}

      <div className="rounded-xl border bg-white shadow-sm">

        <div className="grid gap-8 p-8 lg:grid-cols-3">

          {/* Image */}

          <div>

            <img
              src={
                product.image ||
                "https://placehold.co/500x500?text=Product"
              }
              alt={product.name}
              className="
                h-80
                w-full
                rounded-xl
                border
                object-cover
              "
            />

          </div>

          {/* Information */}

          <div className="space-y-4 lg:col-span-2">

            <div className="grid gap-4 md:grid-cols-2">

              <Info
                label="Product Name"
                value={product.name}
              />

              <Info
                label="Barcode"
                value={product.barcode}
              />

              <Info
                label="SKU"
                value={product.sku}
              />

              <Info
                label="Brand"
                value={product.brand}
              />

              <Info
                label="Category"
                value={product.category}
              />

              <Info
                label="Quantity"
                value={product.quantity}
              />

              <Info
                label="Cost Price"
                value={`$${product.costPrice.toFixed(2)}`}
              />

              <Info
                label="Selling Price"
                value={`$${product.sellingPrice.toFixed(2)}`}
              />

              <Info
                label="Reorder Level"
                value={product.reorderLevel}
              />

              <Info
                label="Inventory Value"
                value={`$${inventoryValue.toFixed(2)}`}
              />

            </div>

            <div>

              <h3 className="mb-2 font-semibold">
                Description
              </h3>

              <p className="rounded-lg bg-gray-50 p-4">
                {product.description || "No description."}
              </p>

            </div>

            <div>

              <h3 className="mb-2 font-semibold">
                Status
              </h3>

              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyles[product.status]}`}
              >
                {product.status}
              </span>

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <Info
                label="Created"
                value={new Date(
                  product.createdAt
                ).toLocaleString()}
              />

              <Info
                label="Updated"
                value={new Date(
                  product.updatedAt
                ).toLocaleString()}
              />

            </div>

          </div>

        </div>

      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Product"
        message="This action cannot be undone."
        itemName={product.name}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />

    </div>
  );
};

interface InfoProps {
  label: string;
  value: string | number;
}

const Info = ({ label, value }: InfoProps) => (
  <div>
    <p className="text-sm text-gray-500">
      {label}
    </p>

    <p className="mt-1 font-semibold">
      {value}
    </p>
  </div>
);

export default ProductDetails;