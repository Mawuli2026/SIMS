import { HiExclamationCircle, HiRefresh } from "react-icons/hi";

type StockStatus = "Critical" | "Low" | "OK";

interface LowStockProduct {
  id: number;
  product: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  status: StockStatus;
}

const lowStockProducts: LowStockProduct[] = [
  {
    id: 1,
    product: "Milk",
    category: "Dairy",
    quantity: 2,
    reorderLevel: 10,
    status: "Critical",
  },
  {
    id: 2,
    product: "Sugar",
    category: "Food",
    quantity: 5,
    reorderLevel: 15,
    status: "Low",
  },
  {
    id: 3,
    product: "Rice",
    category: "Food",
    quantity: 8,
    reorderLevel: 20,
    status: "Low",
  },
  {
    id: 4,
    product: "Cooking Oil",
    category: "Food",
    quantity: 18,
    reorderLevel: 20,
    status: "OK",
  },
];

const badgeStyles: Record<StockStatus, string> = {
  Critical: "bg-red-100 text-red-700",
  Low: "bg-orange-100 text-orange-700",
  OK: "bg-green-100 text-green-700",
};

const getProgressWidth = (
  quantity: number,
  reorderLevel: number
): number => {
  return Math.min((quantity / reorderLevel) * 100, 100);
};

const getProgressColor = (status: StockStatus): string => {
  switch (status) {
    case "Critical":
      return "bg-red-500";
    case "Low":
      return "bg-orange-500";
    default:
      return "bg-green-500";
  }
};

const LowStockTable = () => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Low Stock Products
          </h2>

          <p className="text-sm text-gray-500">
            Products that need restocking
          </p>
        </div>

        <button
          className="
            rounded-lg
            bg-orange-500
            px-4
            py-2
            text-sm
            font-medium
            text-white
            transition
            hover:bg-orange-600
          "
        >
          View Inventory
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                Product
              </th>

              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                Category
              </th>

              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                Quantity
              </th>

              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                Reorder
              </th>

              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                Remaining
              </th>

              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                Status
              </th>

              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {lowStockProducts.map((product) => (
              <tr
                key={product.id}
                className="border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-6 py-4 font-medium">
                  {product.product}
                </td>

                <td className="px-6 py-4">
                  {product.category}
                </td>

                <td className="px-6 py-4 text-center">
                  {product.quantity}
                </td>

                <td className="px-6 py-4 text-center">
                  {product.reorderLevel}
                </td>

                <td className="px-6 py-4">
                  <div className="w-full rounded-full bg-gray-200 h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(
                        product.status
                      )}`}
                      style={{
                        width: `${getProgressWidth(
                          product.quantity,
                          product.reorderLevel
                        )}%`,
                      }}
                    />
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[product.status]}`}
                  >
                    {product.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-lg
                      bg-blue-600
                      px-3
                      py-2
                      text-sm
                      text-white
                      hover:bg-blue-700
                    "
                  >
                    <HiRefresh className="h-4 w-4" />
                    Restock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 p-4 md:hidden">
        {lowStockProducts.map((product) => (
          <div
            key={product.id}
            className="rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {product.product}
              </h3>

              <HiExclamationCircle
                className={`h-6 w-6 ${
                  product.status === "Critical"
                    ? "text-red-500"
                    : product.status === "Low"
                    ? "text-orange-500"
                    : "text-green-500"
                }`}
              />
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <p>
                <strong>Category:</strong> {product.category}
              </p>

              <p>
                <strong>Quantity:</strong> {product.quantity}
              </p>

              <p>
                <strong>Reorder Level:</strong>{" "}
                {product.reorderLevel}
              </p>

              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[product.status]}`}
              >
                {product.status}
              </span>
            </div>

            <button
              className="
                mt-4
                w-full
                rounded-lg
                bg-blue-600
                py-2
                text-white
                hover:bg-blue-700
              "
            >
              Restock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LowStockTable;