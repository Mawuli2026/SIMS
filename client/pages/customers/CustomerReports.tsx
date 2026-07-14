import { useMemo, useState } from "react";
import {
  HiDownload,
  HiPrinter,
  HiSearch,
  HiUsers,
  HiCash,
} from "react-icons/hi";

import customerService from "../../services/customerService";

const CustomerReports = () => {

  const customers = customerService.getAll();

  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {

    if (!search.trim()) return customers;

    const keyword = search.toLowerCase();

    return customers.filter(customer =>
      `${customer.firstName} ${customer.lastName}`
        .toLowerCase()
        .includes(keyword) ||
      customer.phone.toLowerCase().includes(keyword) ||
      customer.email.toLowerCase().includes(keyword)
    );

  }, [customers, search]);

  const totalCustomers = filteredCustomers.length;

  const activeCustomers = filteredCustomers.filter(
    customer => customer.status === "Active"
  ).length;

  const totalRevenue = filteredCustomers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  );

  const averageSpent =
    totalCustomers === 0
      ? 0
      : totalRevenue / totalCustomers;

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {

    const rows = [

      [
        "Customer No",
        "Customer",
        "Phone",
        "Email",
        "Purchases",
        "Total Spent",
        "Status",
      ],

      ...filteredCustomers.map(customer => [

        customer.customerNumber,

        `${customer.firstName} ${customer.lastName}`,

        customer.phone,

        customer.email,

        customer.totalPurchases,

        customer.totalSpent,

        customer.status,

      ]),

    ];

    const csv = rows
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob(
      [csv],
      { type: "text/csv" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "customer-report.csv";

    link.click();

    URL.revokeObjectURL(url);

  };

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between print:hidden">

        <div>

          <h1 className="text-3xl font-bold">

            Customer Reports

          </h1>

          <p className="text-gray-500">

            Customer analytics and reports

          </p>

        </div>

        <div className="flex gap-3">

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white"
          >
            <HiDownload />
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            <HiPrinter />
            Print
          </button>

        </div>

      </div>

      {/* Summary */}

      <div className="grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiUsers className="mb-3 text-4xl text-blue-600"/>

          <p className="text-gray-500">

            Total Customers

          </p>

          <h2 className="text-3xl font-bold">

            {totalCustomers}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiUsers className="mb-3 text-4xl text-green-600"/>

          <p className="text-gray-500">

            Active Customers

          </p>

          <h2 className="text-3xl font-bold">

            {activeCustomers}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiCash className="mb-3 text-4xl text-orange-600"/>

          <p className="text-gray-500">

            Customer Revenue

          </p>

          <h2 className="text-3xl font-bold">

            ${totalRevenue.toFixed(2)}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiCash className="mb-3 text-4xl text-purple-600"/>

          <p className="text-gray-500">

            Average Spending

          </p>

          <h2 className="text-3xl font-bold">

            ${averageSpent.toFixed(2)}

          </h2>

        </div>

      </div>

      {/* Search */}

      <div className="relative max-w-md print:hidden">

        <HiSearch className="absolute left-3 top-3 text-gray-400"/>

        <input
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full rounded-lg border py-2 pl-10 pr-4"
        />

      </div>

      {/* Report Table */}

      <div className="overflow-x-auto rounded-xl border bg-white shadow">

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

                Purchases

              </th>

              <th className="px-5 py-3">

                Total Spent

              </th>

              <th className="px-5 py-3">

                Status

              </th>

            </tr>

          </thead>

          <tbody>

            {filteredCustomers.map(customer => (

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

                <td className="px-5 py-4 text-center">

                  {customer.totalPurchases}

                </td>

                <td className="px-5 py-4 text-right">

                  ${customer.totalSpent.toFixed(2)}

                </td>

                <td className="px-5 py-4 text-center">

                  {customer.status}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default CustomerReports;