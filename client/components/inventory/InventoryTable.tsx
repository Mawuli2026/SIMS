import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiSearch,
  HiEye,
  HiAdjustments,
} from "react-icons/hi";

import inventoryService from "../../services/inventoryService";
import { InventoryItem } from "../../types/inventory";

const InventoryTable = () => {

  const [search, setSearch] = useState("");

  const inventory = useMemo(() => {

    if (!search.trim()) {
      return inventoryService.getAll();
    }

    return inventoryService.search(search);

  }, [search]);

  const getStatus = (
    item: InventoryItem
  ) => {

    if (item.quantity <= 0) {
      return {
        text: "Out of Stock",
        className: "bg-red-100 text-red-700",
      };
    }

    if (item.quantity <= item.reorderLevel) {
      return {
        text: "Low Stock",
        className: "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      text: "In Stock",
      className: "bg-green-100 text-green-700",
    };
  };

  return (

    <div className="rounded-xl border bg-white shadow">

      {/* Header */}

      <div className="flex items-center justify-between border-b p-6">

        <div>

          <h2 className="text-xl font-semibold">
            Inventory
          </h2>

          <p className="text-gray-500">
            Current stock levels
          </p>

        </div>

      </div>

      {/* Search */}

      <div className="p-6">

        <div className="relative max-w-md">

          <HiSearch className="absolute left-3 top-3 text-gray-400" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search inventory..."
            className="w-full rounded-lg border py-2 pl-10 pr-4"
          />

        </div>

      </div>

      {/* Table */}

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-5 py-3 text-left">
                Product
              </th>

              <th className="px-5 py-3">
                SKU
              </th>

              <th className="px-5 py-3">
                Category
              </th>

              <th className="px-5 py-3">
                Supplier
              </th>

              <th className="px-5 py-3 text-center">
                Quantity
              </th>

              <th className="px-5 py-3 text-center">
                Reorder
              </th>

              <th className="px-5 py-3 text-right">
                Value
              </th>

              <th className="px-5 py-3 text-center">
                Status
              </th>

              <th className="px-5 py-3 text-center">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {inventory.map((item) => {

              const status = getStatus(item);

              return (

                <tr
                  key={item.id}
                  className="border-t hover:bg-gray-50"
                >

                  <td className="px-5 py-4 font-semibold">
                    {item.productName}
                  </td>

                  <td className="px-5 py-4">
                    {item.sku}
                  </td>

                  <td className="px-5 py-4">
                    {item.category}
                  </td>

                  <td className="px-5 py-4">
                    {item.supplier}
                  </td>

                  <td className="px-5 py-4 text-center font-semibold">
                    {item.quantity}
                  </td>

                  <td className="px-5 py-4 text-center">
                    {item.reorderLevel}
                  </td>

                  <td className="px-5 py-4 text-right">
                    ${item.inventoryValue.toFixed(2)}
                  </td>

                  <td className="px-5 py-4 text-center">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                    >
                      {status.text}
                    </span>

                  </td>

                  <td className="px-5 py-4">

                    <div className="flex justify-center gap-2">

                      <Link
                        to={`/inventory/${item.id}`}
                        className="rounded bg-blue-100 p-2 text-blue-700"
                      >
                        <HiEye />
                      </Link>

                      <Link
                        to={`/inventory/adjustment/${item.id}`}
                        className="rounded bg-green-100 p-2 text-green-700"
                      >
                        <HiAdjustments />
                      </Link>

                    </div>

                  </td>

                </tr>

              );

            })}

            {inventory.length === 0 && (

              <tr>

                <td
                  colSpan={9}
                  className="py-10 text-center text-gray-500"
                >
                  No inventory records found.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default InventoryTable;