import { Link } from "react-router-dom";

type SaleStatus = "Paid" | "Pending" | "Cancelled";

interface Sale {
  id: number;
  invoice: string;
  customer: string;
  cashier: string;
  amount: number;
  date: string;
  status: SaleStatus;
}

const recentSales: Sale[] = [
  {
    id: 1,
    invoice: "INV-1001",
    customer: "John Doe",
    cashier: "Alice",
    amount: 125.5,
    date: "2026-07-11",
    status: "Paid",
  },
  {
    id: 2,
    invoice: "INV-1002",
    customer: "Mary Smith",
    cashier: "Alice",
    amount: 78.0,
    date: "2026-07-11",
    status: "Paid",
  },
  {
    id: 3,
    invoice: "INV-1003",
    customer: "Peter Brown",
    cashier: "David",
    amount: 45.25,
    date: "2026-07-10",
    status: "Pending",
  },
  {
    id: 4,
    invoice: "INV-1004",
    customer: "Sarah Wilson",
    cashier: "David",
    amount: 210.0,
    date: "2026-07-10",
    status: "Cancelled",
  },
  {
    id: 5,
    invoice: "INV-1005",
    customer: "Michael Lee",
    cashier: "Alice",
    amount: 98.75,
    date: "2026-07-09",
    status: "Paid",
  },
];

const statusClasses: Record<SaleStatus, string> = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-orange-100 text-orange-700",
  Cancelled: "bg-red-100 text-red-700",
};

const RecentSales = () => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Sales
          </h2>

          <p className="text-sm text-gray-500">
            Latest completed transactions
          </p>
        </div>

        <Link
          to="/sales/history"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          View All
        </Link>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                Invoice
              </th>

              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                Customer
              </th>

              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                Cashier
              </th>

              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
                Amount
              </th>

              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                Status
              </th>

              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                Date
              </th>
            </tr>
          </thead>

          <tbody>
            {recentSales.map((sale) => (
              <tr
                key={sale.id}
                className="border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-6 py-4 font-medium text-blue-600">
                  {sale.invoice}
                </td>

                <td className="px-6 py-4">{sale.customer}</td>

                <td className="px-6 py-4">{sale.cashier}</td>

                <td className="px-6 py-4 text-right font-semibold">
                  ${sale.amount.toFixed(2)}
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[sale.status]}`}
                  >
                    {sale.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-center text-gray-500">
                  {sale.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 p-4 md:hidden">
        {recentSales.map((sale) => (
          <div
            key={sale.id}
            className="rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-blue-600">
                {sale.invoice}
              </h3>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[sale.status]}`}
              >
                {sale.status}
              </span>
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <p>
                <strong>Customer:</strong> {sale.customer}
              </p>

              <p>
                <strong>Cashier:</strong> {sale.cashier}
              </p>

              <p>
                <strong>Amount:</strong> ${sale.amount.toFixed(2)}
              </p>

              <p>
                <strong>Date:</strong> {sale.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSales;