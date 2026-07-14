import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiPencil,
  HiTrash,
  HiSearch,
  HiEye,
} from "react-icons/hi";

import productService from "../../services/productService";
import { Product } from "../../types/product";

const statusStyles: Record<Product["status"], string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-700",
  "Low Stock": "bg-orange-100 text-orange-700",
  "Out of Stock": "bg-red-100 text-red-700",
};

const ProductTable = () => {
  const [search, setSearch] = useState("");

  const products = useMemo(() => {
    if (!search.trim()) {
      return productService.getAll();
    }

    return productService.search(search);
  }, [search]);

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      "Delete this product?"
    );

    if (!confirmed) return;

    productService.delete(id);

    window.location.reload();
  };

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm">

      {/* Header */}

      <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">

        <div>

          <h2 className="text-xl font-semibold">
            Products
          </h2>

          <p className="text-sm text-gray-500">
            Manage inventory products
          </p>

        </div>

        <Link
          to="/products/new"
          className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          Add Product
        </Link>

      </div>

      {/* Search */}

      <div className="p-6">

        <div className="relative max-w-md">

          <HiSearch
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              py-2
              pl-10
              pr-4
              outline-none
              focus:border-blue-500
            "
          />

        </div>

      </div>

      {/* Table */}

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-6 py-3 text-left">
                Product
              </th>

              <th className="px-6 py-3 text-left">
                Category
              </th>

              <th className="px-6 py-3 text-right">
                Cost
              </th>

              <th className="px-6 py-3 text-right">
                Selling
              </th>

              <th className="px-6 py-3 text-center">
                Qty
              </th>

              <th className="px-6 py-3 text-center">
                Reorder
              </th>

              <th className="px-6 py-3 text-center">
                Status
              </th>

              <th className="px-6 py-3 text-center">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {products.map((product) => (

              <tr
                key={product.id}
                className="border-t hover:bg-gray-50"
              >

                <td className="px-6 py-4">

                  <div className="flex items-center gap-3">

                    <img
                      src={
                        product.image ||
                        "https://placehold.co/60x60?text=P"
                      }
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />

                    <div>

                      <p className="font-semibold">
                        {product.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {product.sku}
                      </p>

                    </div>

                  </div>

                </td>

                <td className="px-6 py-4">
                  {product.category}
                </td>

                <td className="px-6 py-4 text-right">
                  ${product.costPrice.toFixed(2)}
                </td>

                <td className="px-6 py-4 text-right">
                  ${product.sellingPrice.toFixed(2)}
                </td>

                <td className="px-6 py-4 text-center">
                  {product.quantity}
                </td>

                <td className="px-6 py-4 text-center">
                  {product.reorderLevel}
                </td>

                <td className="px-6 py-4 text-center">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[product.status]}`}
                  >
                    {product.status}
                  </span>

                </td>

                <td className="px-6 py-4">

                  <div className="flex justify-center gap-2">

                    <Link
                      to={`/products/${product.id}`}
                      className="rounded bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                    >
                      <HiEye />
                    </Link>

                    <Link
                      to={`/products/edit/${product.id}`}
                      className="rounded bg-yellow-100 p-2 text-yellow-700 hover:bg-yellow-200"
                    >
                      <HiPencil />
                    </Link>

                    <button
                      onClick={() =>
                        handleDelete(product.id)
                      }
                      className="rounded bg-red-100 p-2 text-red-700 hover:bg-red-200"
                    >
                      <HiTrash />
                    </button>

                  </div>

                </td>

              </tr>

            ))}

            {products.length === 0 && (

              <tr>

                <td
                  colSpan={8}
                  className="py-12 text-center text-gray-500"
                >
                  No products found.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default ProductTable;