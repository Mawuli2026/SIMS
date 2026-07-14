import {
  HiCash,
  HiCube,
  HiShoppingCart,
  HiUsers,
  HiExclamationCircle,
} from "react-icons/hi";

import SalesTrendChart from "../../components/charts/SalesTrendChart";
import RevenuePieChart from "../../components/charts/RevenuePieChart";
import TopProductsChart from "../../components/charts/TopProductsChart";
import ProfitTrendChart from "../../components/charts/ProfitTrendChart";
import InventoryStatusChart from "../../components/charts/InventoryStatusChart";

import salesService from "../../services/salesService";
import inventoryService from "../../services/inventoryService";
import customerService from "../../services/customerService";

const ExecutiveDashboard = () => {

  const sales = salesService.getAll();
  const inventory = inventoryService.getAll();
  const customers = customerService.getAll();

  /* ---------------- KPIs ---------------- */

  const totalSales = sales.reduce(
    (sum, sale) => sum + sale.grandTotal,
    0
  );

  const totalProfit = sales.reduce((sum, sale) => {

    let profit = 0;

    sale.items.forEach(item => {

      profit +=
        item.lineTotal -
        item.costPrice * item.quantity;

    });

    return sum + profit;

  }, 0);

  const inventoryValue = inventory.reduce(
    (sum, item) =>
      sum +
      item.quantity *
      item.costPrice,
    0
  );

  /* ---------------- Sales Trend ---------------- */

  const salesTrend = Object.values(

    sales.reduce((acc, sale) => {

      const day = new Date(
        sale.createdAt
      ).toLocaleDateString();

      if (!acc[day]) {

        acc[day] = {
          period: day,
          sales: 0,
        };

      }

      acc[day].sales += sale.grandTotal;

      return acc;

    }, {} as Record<
      string,
      {
        period: string;
        sales: number;
      }
    >)

  );

  /* ---------------- Revenue by Category ---------------- */

  const revenueByCategory = Object.values(

    sales.reduce((acc, sale) => {

      sale.items.forEach(item => {

        if (!acc[item.category]) {

          acc[item.category] = {
            category: item.category,
            revenue: 0,
          };

        }

        acc[item.category].revenue +=
          item.lineTotal;

      });

      return acc;

    }, {} as Record<
      string,
      {
        category: string;
        revenue: number;
      }
    >)

  );

  /* ---------------- Top Products ---------------- */

  const topProducts = Object.values(

    sales.reduce((acc, sale) => {

      sale.items.forEach(item => {

        if (!acc[item.productId]) {

          acc[item.productId] = {

            productName: item.productName,

            unitsSold: 0,

            revenue: 0,

          };

        }

        acc[item.productId].unitsSold +=
          item.quantity;

        acc[item.productId].revenue +=
          item.lineTotal;

      });

      return acc;

    }, {} as Record<
      string,
      {
        productName: string;
        unitsSold: number;
        revenue: number;
      }
    >)

  );

  /* ---------------- Profit Trend ---------------- */

  const profitTrend = Object.values(

    sales.reduce((acc, sale) => {

      const day = new Date(
        sale.createdAt
      ).toLocaleDateString();

      if (!acc[day]) {

        acc[day] = {

          period: day,

          revenue: 0,

          cost: 0,

          profit: 0,

        };

      }

      acc[day].revenue += sale.grandTotal;

      sale.items.forEach(item => {

        const cost =
          item.costPrice *
          item.quantity;

        acc[day].cost += cost;

        acc[day].profit +=
          item.lineTotal - cost;

      });

      return acc;

    }, {} as Record<
      string,
      {
        period: string;
        revenue: number;
        cost: number;
        profit: number;
      }
    >)

  );

  /* ---------------- Inventory Status ---------------- */

  const inventoryStatus = [

    {
      status: "In Stock",
      value: inventory.filter(
        item =>
          item.quantity >
          item.reorderLevel
      ).length,
    },

    {
      status: "Low Stock",
      value: inventory.filter(
        item =>
          item.quantity > 0 &&
          item.quantity <=
          item.reorderLevel
      ).length,
    },

    {
      status: "Out of Stock",
      value: inventory.filter(
        item =>
          item.quantity === 0
      ).length,
    },

  ];

  const lowStockProducts = inventory.filter(
    item =>
      item.quantity <=
      item.reorderLevel
  );

  const recentSales = [...sales]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold">

          Executive Dashboard

        </h1>

        <p className="text-gray-500">

          Business performance overview

        </p>

      </div>

      {/* KPI Cards */}

      <div className="grid gap-6 md:grid-cols-4">

        <KPI
          title="Total Sales"
          value={`$${totalSales.toFixed(2)}`}
          icon={<HiCash />}
          color="text-green-600"
        />

        <KPI
          title="Total Profit"
          value={`$${totalProfit.toFixed(2)}`}
          icon={<HiShoppingCart />}
          color="text-blue-600"
        />

        <KPI
          title="Customers"
          value={customers.length}
          icon={<HiUsers />}
          color="text-purple-600"
        />

        <KPI
          title="Inventory Value"
          value={`$${inventoryValue.toFixed(2)}`}
          icon={<HiCube />}
          color="text-orange-600"
        />

      </div>

      {/* Charts */}

      <div className="grid gap-6 lg:grid-cols-2">

        <SalesTrendChart
          data={salesTrend}
        />

        <RevenuePieChart
          data={revenueByCategory}
        />

      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <TopProductsChart
          data={topProducts}
        />

        <ProfitTrendChart
          data={profitTrend}
        />

      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <InventoryStatusChart
          data={inventoryStatus}
        />

        {/* Low Stock */}

        <div className="rounded-xl border bg-white p-6 shadow">

          <h2 className="mb-4 text-xl font-semibold">

            Low Stock Alerts

          </h2>

          {lowStockProducts.length === 0 ? (

            <p className="text-green-600">

              All products are sufficiently stocked.

            </p>

          ) : (

            <div className="space-y-3">

              {lowStockProducts.map(product => (

                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >

                  <div>

                    <p className="font-semibold">

                      {product.productName}

                    </p>

                    <p className="text-sm text-gray-500">

                      Remaining: {product.quantity}

                    </p>

                  </div>

                  <HiExclamationCircle className="text-2xl text-red-500" />

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

      {/* Recent Sales */}

      <div className="rounded-xl border bg-white shadow">

        <div className="border-b p-5">

          <h2 className="text-xl font-semibold">

            Recent Sales

          </h2>

        </div>

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-5 py-3 text-left">Invoice</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Cashier</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Date</th>

            </tr>

          </thead>

          <tbody>

            {recentSales.map(sale => (

              <tr
                key={sale.id}
                className="border-t"
              >

                <td className="px-5 py-4">

                  {sale.saleNumber}

                </td>

                <td className="px-5 py-4">

                  {sale.customerName}

                </td>

                <td className="px-5 py-4">

                  {sale.cashierName}

                </td>

                <td className="px-5 py-4 text-right">

                  ${sale.grandTotal.toFixed(2)}

                </td>

                <td className="px-5 py-4">

                  {new Date(
                    sale.createdAt
                  ).toLocaleString()}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};

interface KPIProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const KPI = ({
  title,
  value,
  icon,
  color,
}: KPIProps) => (

  <div className="rounded-xl border bg-white p-6 shadow">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-gray-500">

          {title}

        </p>

        <h2 className="mt-2 text-3xl font-bold">

          {value}

        </h2>

      </div>

      <div className={`text-4xl ${color}`}>

        {icon}

      </div>

    </div>

  </div>

);

export default ExecutiveDashboard;