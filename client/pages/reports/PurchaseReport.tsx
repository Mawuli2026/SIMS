import { useMemo, useState } from "react";
import {
  HiCalendar,
  HiDownload,
  HiPrinter,
  HiSearch,
  HiTruck,
  HiCash,
} from "react-icons/hi";

import purchaseOrderService from "../../services/purchaseOrderService";

const PurchaseReport = () => {

  const purchases = purchaseOrderService.getAll();

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredPurchases = useMemo(() => {

    return purchases.filter((purchase) => {

      const keyword = search.toLowerCase();

      const matchesSearch =
        purchase.orderNumber.toLowerCase().includes(keyword) ||
        purchase.supplierName.toLowerCase().includes(keyword);

      const purchaseDate = new Date(purchase.createdAt);

      if (fromDate && purchaseDate < new Date(fromDate))
        return false;

      if (toDate) {

        const end = new Date(toDate);

        end.setHours(23, 59, 59, 999);

        if (purchaseDate > end)
          return false;

      }

      return matchesSearch;

    });

  }, [purchases, search, fromDate, toDate]);

  const totalPurchases = filteredPurchases.reduce(
    (sum, purchase) => sum + purchase.grandTotal,
    0
  );

  const received = filteredPurchases.filter(
    purchase => purchase.status === "Received"
  );

  const pending = filteredPurchases.filter(
    purchase => purchase.status === "Pending"
  );

  const cancelled = filteredPurchases.filter(
    purchase => purchase.status === "Cancelled"
  );

  const averagePurchase =
    filteredPurchases.length === 0
      ? 0
      : totalPurchases / filteredPurchases.length;

  const exportCSV = () => {

    const rows = [

      [
        "Purchase No",
        "Supplier",
        "Status",
        "Total",
        "Date",
      ],

      ...filteredPurchases.map(purchase => [

        purchase.orderNumber,
        purchase.supplierName,
        purchase.status,
        purchase.grandTotal,
        new Date(purchase.createdAt).toLocaleString(),

      ])

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

    link.download = "purchase-report.csv";

    link.click();

    URL.revokeObjectURL(url);

  };

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">

            Purchase Report

          </h1>

          <p className="text-gray-500">

            Purchase history and supplier spending

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
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            <HiPrinter />
            Print
          </button>

        </div>

      </div>

      {/* Filters */}

      <div className="rounded-xl border bg-white p-6 shadow">

        <div className="grid gap-4 lg:grid-cols-4">

          <div className="relative">

            <HiSearch className="absolute left-3 top-3 text-gray-400"/>

            <input
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              placeholder="Search purchase..."
              className="w-full rounded-lg border py-2 pl-10"
            />

          </div>

          <div className="relative">

            <HiCalendar className="absolute left-3 top-3 text-gray-400"/>

            <input
              type="date"
              value={fromDate}
              onChange={(e)=>setFromDate(e.target.value)}
              className="w-full rounded-lg border py-2 pl-10"
            />

          </div>

          <div className="relative">

            <HiCalendar className="absolute left-3 top-3 text-gray-400"/>

            <input
              type="date"
              value={toDate}
              onChange={(e)=>setToDate(e.target.value)}
              className="w-full rounded-lg border py-2 pl-10"
            />

          </div>

        </div>

      </div>

      {/* Summary */}

      <div className="grid gap-6 md:grid-cols-5">

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiCash className="mb-3 text-4xl text-green-600"/>

          <p>Total Purchases</p>

          <h2 className="text-2xl font-bold">

            ${totalPurchases.toFixed(2)}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiTruck className="mb-3 text-4xl text-blue-600"/>

          <p>Received</p>

          <h2 className="text-2xl font-bold">

            {received.length}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <p>Pending</p>

          <h2 className="text-2xl font-bold">

            {pending.length}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <p>Cancelled</p>

          <h2 className="text-2xl font-bold">

            {cancelled.length}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <p>Average Purchase</p>

          <h2 className="text-2xl font-bold">

            ${averagePurchase.toFixed(2)}

          </h2>

        </div>

      </div>

      {/* Purchase Table */}

      <div className="overflow-x-auto rounded-xl border bg-white shadow">

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-5 py-3 text-left">Purchase No</th>
              <th className="px-5 py-3">Supplier</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Date</th>

            </tr>

          </thead>

          <tbody>

            {filteredPurchases.map((purchase) => (

              <tr
                key={purchase.id}
                className="border-t"
              >

                <td className="px-5 py-4">

                  {purchase.orderNumber}

                </td>

                <td className="px-5 py-4">

                  {purchase.supplierName}

                </td>

                <td className="px-5 py-4">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      purchase.status === "Received"
                        ? "bg-green-100 text-green-700"
                        : purchase.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {purchase.status}
                  </span>

                </td>

                <td className="px-5 py-4 text-right">

                  ${purchase.grandTotal.toFixed(2)}

                </td>

                <td className="px-5 py-4">

                  {new Date(
                    purchase.createdAt
                  ).toLocaleDateString()}

                </td>

              </tr>

            ))}

            {filteredPurchases.length === 0 && (

              <tr>

                <td
                  colSpan={5}
                  className="py-10 text-center text-gray-500"
                >

                  No purchase records found.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default PurchaseReport;