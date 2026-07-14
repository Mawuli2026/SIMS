import { useMemo, useState } from "react";
import {
  HiDownload,
  HiPrinter,
  HiTrendingUp,
  HiCash,
  HiCalendar,
} from "react-icons/hi";

import salesService from "../../services/salesService";

const ProfitReport = () => {

  const sales = salesService.getAll();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredSales = useMemo(() => {

    return sales.filter((sale) => {

      const date = new Date(sale.createdAt);

      if (fromDate && date < new Date(fromDate))
        return false;

      if (toDate) {

        const end = new Date(toDate);

        end.setHours(23,59,59,999);

        if (date > end)
          return false;

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

  const totalCost = totalSales - totalProfit;

  const margin =

    totalSales === 0

      ? 0

      : (totalProfit / totalSales) * 100;

  const exportCSV = () => {

    const rows = [

      [
        "Receipt",
        "Customer",
        "Sales",
        "Profit",
        "Margin %",
        "Date"
      ],

      ...filteredSales.map(sale => [

        sale.saleNumber,

        sale.customerName,

        sale.grandTotal,

        sale.profit ?? 0,

        sale.grandTotal === 0
          ? 0
          : (
              ((sale.profit ?? 0) /
                sale.grandTotal) *
              100
            ).toFixed(2),

        new Date(
          sale.createdAt
        ).toLocaleString()

      ])

    ];

    const csv = rows
      .map(r => r.join(","))
      .join("\n");

    const blob = new Blob(
      [csv],
      { type: "text/csv" }
    );

    const url = URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = "profit-report.csv";

    link.click();

    URL.revokeObjectURL(url);

  };

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">

            Profit Report

          </h1>

          <p className="text-gray-500">

            Analyze business profitability

          </p>

        </div>

        <div className="flex gap-3">

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white"
          >

            <HiDownload/>

            Export CSV

          </button>

          <button
            onClick={()=>window.print()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >

            <HiPrinter/>

            Print

          </button>

        </div>

      </div>

      {/* Date Filters */}

      <div className="rounded-xl border bg-white p-6 shadow">

        <div className="grid gap-6 md:grid-cols-2">

          <div>

            <label className="mb-2 block">

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

            <label className="mb-2 block">

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

      {/* Summary */}

      <div className="grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiCash className="mb-3 text-4xl text-green-600"/>

          <p>Total Sales</p>

          <h2 className="text-3xl font-bold">

            ${totalSales.toFixed(2)}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiTrendingUp className="mb-3 text-4xl text-blue-600"/>

          <p>Total Profit</p>

          <h2 className="text-3xl font-bold">

            ${totalProfit.toFixed(2)}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <p>Total Cost</p>

          <h2 className="text-3xl font-bold">

            ${totalCost.toFixed(2)}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <p>Profit Margin</p>

          <h2 className="text-3xl font-bold">

            {margin.toFixed(2)}%

          </h2>

        </div>

      </div>

      {/* Profit Table */}

      <div className="overflow-x-auto rounded-xl border bg-white shadow">

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-5 py-3 text-left">

                Receipt

              </th>

              <th className="px-5 py-3">

                Customer

              </th>

              <th className="px-5 py-3">

                Sales

              </th>

              <th className="px-5 py-3">

                Profit

              </th>

              <th className="px-5 py-3">

                Margin %

              </th>

              <th className="px-5 py-3">

                Date

              </th>

            </tr>

          </thead>

          <tbody>

            {filteredSales.map((sale)=>(

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

                <td className="px-5 py-4 text-right">

                  ${sale.grandTotal.toFixed(2)}

                </td>

                <td className="px-5 py-4 text-right">

                  ${(sale.profit ?? 0).toFixed(2)}

                </td>

                <td className="px-5 py-4 text-right">

                  {sale.grandTotal === 0
                    ? "0%"
                    : `${(
                        ((sale.profit ?? 0) /
                          sale.grandTotal) *
                        100
                      ).toFixed(2)}%`}

                </td>

                <td className="px-5 py-4">

                  {new Date(
                    sale.createdAt
                  ).toLocaleDateString()}

                </td>

              </tr>

            ))}

            {filteredSales.length===0 && (

              <tr>

                <td
                  colSpan={6}
                  className="py-10 text-center text-gray-500"
                >

                  No profit data available.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default ProfitReport;