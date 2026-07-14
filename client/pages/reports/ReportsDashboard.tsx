import { Link } from "react-router-dom";
import {
  HiChartBar,
  HiCash,
  HiCube,
  HiUsers,
  HiShoppingCart,
  HiTrendingUp,
} from "react-icons/hi";

import salesService from "../../services/salesService";
import inventoryService from "../../services/inventoryService";
import customerService from "../../services/customerService";

const ReportsDashboard = () => {

  const sales = salesService.getAll();

  const customers = customerService.getAll();

  const inventory = inventoryService.getAll();

  const totalSales = sales.reduce(
    (sum, sale) => sum + sale.grandTotal,
    0
  );

  const totalProfit = sales.reduce(
    (sum, sale) => sum + (sale.profit ?? 0),
    0
  );

  const totalProducts = inventory.length;

  const totalCustomers = customers.length;

  const totalOrders = sales.length;

  const lowStock = inventory.filter(
    item => item.quantity <= item.reorderLevel
  ).length;

  const cards = [

    {
      title: "Sales Report",
      value: `$${totalSales.toFixed(2)}`,
      icon: <HiCash className="text-4xl text-green-600"/>,
      path: "/reports/sales",
    },

    {
      title: "Profit Report",
      value: `$${totalProfit.toFixed(2)}`,
      icon: <HiTrendingUp className="text-4xl text-blue-600"/>,
      path: "/reports/profit",
    },

    {
      title: "Inventory",
      value: totalProducts,
      icon: <HiCube className="text-4xl text-orange-600"/>,
      path: "/reports/inventory",
    },

    {
      title: "Customers",
      value: totalCustomers,
      icon: <HiUsers className="text-4xl text-purple-600"/>,
      path: "/customers/reports",
    },

    {
      title: "Orders",
      value: totalOrders,
      icon: <HiShoppingCart className="text-4xl text-red-600"/>,
      path: "/sales/history",
    },

    {
      title: "Low Stock",
      value: lowStock,
      icon: <HiChartBar className="text-4xl text-yellow-600"/>,
      path: "/reports/inventory",
    },

  ];

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold">

          Reports Dashboard

        </h1>

        <p className="text-gray-500">

          Business analytics and reporting center

        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        {cards.map(card => (

          <Link

            key={card.title}

            to={card.path}

            className="rounded-xl border bg-white p-6 shadow transition hover:shadow-lg"

          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-500">

                  {card.title}

                </p>

                <h2 className="mt-2 text-3xl font-bold">

                  {card.value}

                </h2>

              </div>

              {card.icon}

            </div>

          </Link>

        ))}

      </div>

      <div className="rounded-xl border bg-white p-6 shadow">

        <h2 className="mb-4 text-xl font-semibold">

          Reports Available

        </h2>

        <div className="grid gap-4 md:grid-cols-2">

          <Link
            to="/reports/sales"
            className="rounded-lg border p-4 hover:bg-gray-50"
          >
            Daily / Weekly / Monthly Sales Report
          </Link>

          <Link
            to="/reports/profit"
            className="rounded-lg border p-4 hover:bg-gray-50"
          >
            Profit Analysis
          </Link>

          <Link
            to="/reports/inventory"
            className="rounded-lg border p-4 hover:bg-gray-50"
          >
            Inventory Report
          </Link>

          <Link
            to="/reports/products"
            className="rounded-lg border p-4 hover:bg-gray-50"
          >
            Best Selling Products
          </Link>

          <Link
            to="/customers/reports"
            className="rounded-lg border p-4 hover:bg-gray-50"
          >
            Customer Report
          </Link>

          <Link
            to="/reports/purchases"
            className="rounded-lg border p-4 hover:bg-gray-50"
          >
            Purchase Report
          </Link>

        </div>

      </div>

    </div>

  );

};

export default ReportsDashboard;