import { Link } from "react-router-dom";
import {
  HiCube,
  HiExclamationCircle,
  HiCash,
  HiCollection,
} from "react-icons/hi";

import inventoryService from "../../services/inventoryService";
import InventoryCard from "../../components/inventory/InventoryCard";
import InventoryTable from "../../components/inventory/InventoryTable";

const Inventory = () => {

  const totalProducts =
    inventoryService.totalProducts();

  const totalQuantity =
    inventoryService.totalQuantity();

  const totalValue =
    inventoryService.getInventoryValue();

  const lowStock =
    inventoryService.getLowStock();

  const recentMovements =
    inventoryService
      .getMovements()
      .slice(0, 5);

  return (

    <div className="space-y-8">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Inventory Dashboard
          </h1>

          <p className="text-gray-500">
            Monitor stock levels and inventory.
          </p>

        </div>

        <div className="flex gap-3">

          <Link
            to="/inventory/adjustment"
            className="rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            Stock Adjustment
          </Link>

          <Link
            to="/inventory/movements"
            className="rounded-lg bg-green-600 px-5 py-2 text-white"
          >
            Stock History
          </Link>

        </div>

      </div>

      {/* Summary Cards */}

      <div className="grid gap-6 md:grid-cols-4">

        <InventoryCard
          title="Products"
          value={totalProducts}
          color="bg-blue-600"
        />

        <InventoryCard
          title="Stock Quantity"
          value={totalQuantity}
          color="bg-green-600"
        />

        <InventoryCard
          title="Inventory Value"
          value={`$${totalValue.toFixed(2)}`}
          color="bg-purple-600"
        />

        <InventoryCard
          title="Low Stock"
          value={lowStock.length}
          color="bg-red-600"
        />

      </div>

      {/* Quick Actions */}

      <div className="rounded-xl border bg-white p-6 shadow">

        <h2 className="mb-6 text-xl font-semibold">
          Quick Actions
        </h2>

        <div className="grid gap-4 md:grid-cols-4">

          <Link
            to="/products"
            className="rounded-lg border p-5 hover:bg-gray-50"
          >
            <HiCube className="mb-3 text-3xl text-blue-600" />
            Products
          </Link>

          <Link
            to="/inventory/movements"
            className="rounded-lg border p-5 hover:bg-gray-50"
          >
            <HiCollection className="mb-3 text-3xl text-green-600" />
            Movements
          </Link>

          <Link
            to="/inventory/adjustment"
            className="rounded-lg border p-5 hover:bg-gray-50"
          >
            <HiCash className="mb-3 text-3xl text-purple-600" />
            Adjustment
          </Link>

          <Link
            to="/inventory/low-stock"
            className="rounded-lg border p-5 hover:bg-gray-50"
          >
            <HiExclamationCircle className="mb-3 text-3xl text-red-600" />
            Low Stock
          </Link>

        </div>

      </div>

      {/* Recent Movements */}

      <div className="rounded-xl border bg-white shadow">

        <div className="border-b p-6">

          <h2 className="text-xl font-semibold">
            Recent Stock Movements
          </h2>

        </div>

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-6 py-3 text-left">
                Product
              </th>

              <th className="px-6 py-3 text-center">
                Type
              </th>

              <th className="px-6 py-3 text-center">
                Qty
              </th>

              <th className="px-6 py-3 text-center">
                Previous
              </th>

              <th className="px-6 py-3 text-center">
                Current
              </th>

            </tr>

          </thead>

          <tbody>

            {recentMovements.map((movement) => (

              <tr
                key={movement.id}
                className="border-t"
              >

                <td className="px-6 py-4">
                  {movement.productName}
                </td>

                <td className="px-6 py-4 text-center">
                  {movement.type}
                </td>

                <td className="px-6 py-4 text-center">
                  {movement.quantity}
                </td>

                <td className="px-6 py-4 text-center">
                  {movement.previousStock}
                </td>

                <td className="px-6 py-4 text-center font-semibold">
                  {movement.newStock}
                </td>

              </tr>

            ))}

            {recentMovements.length === 0 && (

              <tr>

                <td
                  colSpan={5}
                  className="py-10 text-center text-gray-500"
                >
                  No stock movements available.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* Inventory Table */}
      <div className="mt-8">
        <InventoryTable />
      </div>

    </div>

  );
};

export default Inventory;