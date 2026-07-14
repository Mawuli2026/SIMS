import DashboardCards from "../../components/dashboard/DashboardCards";
import SalesChart from "../../components/dashboard/SalesChart";
import InventoryChart from "../../components/dashboard/InventoryChart";
import RecentSales from "../../components/dashboard/RecentSales";
import LowStockTable from "../../components/dashboard/LowStockTable";

const Dashboard = () => {
  return (
    <div className="space-y-8">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Dashboard
          </h1>

          <p className="mt-1 text-gray-500">
            Welcome back! Here's what's happening today.
          </p>
        </div>

        <div className="flex items-center gap-3">

          <button
            className="
              rounded-lg
              border
              border-gray-300
              bg-white
              px-5
              py-2
              text-sm
              font-medium
              text-gray-700
              hover:bg-gray-100
            "
          >
            Export Report
          </button>

          <button
            className="
              rounded-lg
              bg-blue-600
              px-5
              py-2
              text-sm
              font-medium
              text-white
              hover:bg-blue-700
            "
          >
            New Sale
          </button>

        </div>

      </div>

      {/* Statistics Cards */}
      <DashboardCards />

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-3">

        <div className="xl:col-span-2">
          <SalesChart />
        </div>

        <div>
          <InventoryChart />
        </div>

      </div>

      {/* Recent Sales */}
      <RecentSales />

      {/* Low Stock */}
      <LowStockTable />

    </div>
  );
};

export default Dashboard;