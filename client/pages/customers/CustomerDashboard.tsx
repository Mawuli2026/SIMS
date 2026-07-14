import { Link } from "react-router-dom";
import {
  HiUsers,
  HiUserAdd,
  HiUserGroup,
  HiCash,
} from "react-icons/hi";

import customerService from "../../services/customerService";

const CustomerDashboard = () => {

  const customers = customerService.getAll();

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    customer => customer.status === "Active"
  ).length;

  const inactiveCustomers = customers.filter(
    customer => customer.status === "Inactive"
  ).length;

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const newCustomers = customers.filter(customer => {
    const created = new Date(customer.createdAt);

    return (
      created.getMonth() === currentMonth &&
      created.getFullYear() === currentYear
    );
  }).length;

  const topCustomers = [...customers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  const recentCustomers = [...customers]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">

            Customer Dashboard

          </h1>

          <p className="text-gray-500">

            Customer analytics and overview

          </p>

        </div>

        <Link
          to="/customers"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          View Customers
        </Link>

      </div>

      {/* Summary Cards */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl bg-white p-6 shadow border">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500">

                Total Customers

              </p>

              <h2 className="text-3xl font-bold">

                {totalCustomers}

              </h2>

            </div>

            <HiUsers className="text-4xl text-blue-600" />

          </div>

        </div>

        <div className="rounded-xl bg-white p-6 shadow border">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500">

                Active Customers

              </p>

              <h2 className="text-3xl font-bold">

                {activeCustomers}

              </h2>

            </div>

            <HiUserGroup className="text-4xl text-green-600" />

          </div>

        </div>

        <div className="rounded-xl bg-white p-6 shadow border">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500">

                New This Month

              </p>

              <h2 className="text-3xl font-bold">

                {newCustomers}

              </h2>

            </div>

            <HiUserAdd className="text-4xl text-purple-600" />

          </div>

        </div>

        <div className="rounded-xl bg-white p-6 shadow border">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500">

                Customer Revenue

              </p>

              <h2 className="text-3xl font-bold">

                ${totalRevenue.toFixed(2)}

              </h2>

            </div>

            <HiCash className="text-4xl text-orange-600" />

          </div>

        </div>

      </div>

      {/* Top Customers */}

      <div className="rounded-xl border bg-white shadow">

        <div className="border-b p-5">

          <h2 className="text-xl font-semibold">

            Top Customers

          </h2>

        </div>

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-5 py-3 text-left">

                Customer

              </th>

              <th className="px-5 py-3">

                Purchases

              </th>

              <th className="px-5 py-3">

                Total Spent

              </th>

            </tr>

          </thead>

          <tbody>

            {topCustomers.map(customer => (

              <tr
                key={customer.id}
                className="border-t"
              >

                <td className="px-5 py-4">

                  {customer.firstName} {customer.lastName}

                </td>

                <td className="px-5 py-4 text-center">

                  {customer.totalPurchases}

                </td>

                <td className="px-5 py-4 text-right">

                  ${customer.totalSpent.toFixed(2)}

                </td>

              </tr>

            ))}

            {topCustomers.length === 0 && (

              <tr>

                <td
                  colSpan={3}
                  className="py-10 text-center text-gray-500"
                >

                  No customer data available.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* Recent Customers */}

      <div className="rounded-xl border bg-white shadow">

        <div className="border-b p-5">

          <h2 className="text-xl font-semibold">

            Recent Customers

          </h2>

        </div>

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-5 py-3 text-left">

                Customer

              </th>

              <th className="px-5 py-3">

                Phone

              </th>

              <th className="px-5 py-3">

                Date Added

              </th>

            </tr>

          </thead>

          <tbody>

            {recentCustomers.map(customer => (

              <tr
                key={customer.id}
                className="border-t"
              >

                <td className="px-5 py-4">

                  {customer.firstName} {customer.lastName}

                </td>

                <td className="px-5 py-4">

                  {customer.phone}

                </td>

                <td className="px-5 py-4">

                  {new Date(
                    customer.createdAt
                  ).toLocaleDateString()}

                </td>

              </tr>

            ))}

            {recentCustomers.length === 0 && (

              <tr>

                <td
                  colSpan={3}
                  className="py-10 text-center text-gray-500"
                >

                  No recent customers.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default CustomerDashboard;