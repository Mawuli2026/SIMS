import { useMemo, useState } from "react";
import {
  HiPrinter,
  HiDownload,
  HiCalendar,
  HiCash,
} from "react-icons/hi";

import salesService from "../../services/salesService";

const SalesReport = () => {

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const sales = salesService.getAll();

  const filteredSales = useMemo(() => {

    return sales.filter((sale) => {

      const saleDate = new Date(sale.createdAt);

      if (fromDate) {

        if (saleDate < new Date(fromDate)) {
          return false;
        }

      }

      if (toDate) {

        const end = new Date(toDate);

        end.setHours(23,59,59,999);

        if (saleDate > end) {
          return false;
        }

      }

      return true;

    });

  }, [sales, fromDate, toDate]);

  const totalSales = filteredSales.reduce(

    (sum, sale) => sum + sale.grandTotal,

    0

  );

  const totalProfit = filteredSales.reduce(

    (sum, sale) => sum + (sale.profit ?? 0),

    0

  );

  const averageSale =

    filteredSales.length === 0

      ? 0

      : totalSales / filteredSales.length;

  const cashSales = filteredSales
    .filter(sale => sale.paymentMethod === "Cash")
    .reduce((sum, sale) => sum + sale.grandTotal, 0);

  const cardSales = filteredSales
    .filter(sale => sale.paymentMethod !== "Cash")
    .reduce((sum, sale) => sum + sale.grandTotal, 0);

  const exportCSV = () => {

    const rows = [

      [
        "Receipt",
        "Customer",
        "Cashier",
        "Payment",
        "Profit",
        "Total",
        "Date",
      ],

      ...filteredSales.map(sale => [

        sale.saleNumber,

        sale.customerName,

        sale.cashierName,

        sale.paymentMethod,

        sale.profit ?? 0,

        sale.grandTotal,

        new Date(sale.createdAt).toLocaleString(),

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

    link.download = "sales-report.csv";

    link.click();

    URL.revokeObjectURL(url);

  };

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">

            Sales Report

          </h1>

          <p className="text-gray-500">

            Sales analysis and reporting

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

      {/* Date Filter */}

      <div className="rounded-xl border bg-white p-6 shadow">

        <div className="grid gap-6 md:grid-cols-2">

          <div>

            <label className="mb-2 block font-medium">

              From

            </label>

            <div className="relative">

              <HiCalendar className="absolute left-3 top-3 text-gray-400"/>

              <input

                type="date"

                value={fromDate}

                onChange={(e)=>setFromDate(e.target.value)}

                className="w-full rounded-lg border py-2 pl-10"

              />

            </div>

          </div>

          <div>

            <label className="mb-2 block font-medium">

              To

            </label>

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

      </div>

      {/* Summary Cards */}

      <div className="grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiCash className="mb-3 text-4xl text-green-600"/>

          <p>Total Sales</p>

          <h2 className="text-3xl font-bold">

            ${totalSales.toFixed(2)}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <p>Total Transactions</p>

          <h2 className="text-3xl font-bold">

            {filteredSales.length}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <p>Average Sale</p>

          <h2 className="text-3xl font-bold">

            ${averageSale.toFixed(2)}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <p>Total Profit</p>

          <h2 className="text-3xl font-bold">

            ${totalProfit.toFixed(2)}

          </h2>

        </div>

      </div>

      {/* Payment Summary */}

      <div className="grid gap-6 md:grid-cols-2">

        <div className="rounded-xl border bg-white p-6 shadow">

          <h2 className="mb-2 text-xl font-semibold">

            Cash Sales

          </h2>

          <p className="text-3xl font-bold text-green-600">

            ${cashSales.toFixed(2)}

          </p>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <h2 className="mb-2 text-xl font-semibold">

            Card / Other Payments

          </h2>

          <p className="text-3xl font-bold text-blue-600">

            ${cardSales.toFixed(2)}

          </p>

        </div>

      </div>

      {/* Sales Table */}

      <div className="overflow-x-auto rounded-xl border bg-white shadow">

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-5 py-3 text-left">Receipt</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Cashier</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3">Profit</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Date</th>

            </tr>

          </thead>

          <tbody>

            {filteredSales.map((sale) => (

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

                <td className="px-5 py-4">

                  {sale.paymentMethod}

                </td>

                <td className="px-5 py-4 text-right">

                  ${(sale.profit ?? 0).toFixed(2)}

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

            {filteredSales.length === 0 && (

              <tr>

                <td
                  colSpan={7}
                  className="py-10 text-center text-gray-500"
                >

                  No sales found for the selected period.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default SalesReport;