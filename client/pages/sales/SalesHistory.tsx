import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiSearch,
  HiEye,
  HiPrinter,
} from "react-icons/hi";

import salesService from "../../services/salesService";

const SalesHistory = () => {

  const [search, setSearch] = useState("");

  const sales = useMemo(() => {

    if (!search.trim()) {
      return salesService.getAll();
    }

    return salesService.search(search);

  }, [search]);

  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">

            Sales History

          </h1>

          <p className="text-gray-500">

            View completed sales

          </p>

        </div>

        <Link
          to="/sales/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          + New Sale
        </Link>

      </div>

      <div className="rounded-xl border bg-white shadow">

        <div className="border-b p-5">

          <div className="relative max-w-md">

            <HiSearch className="absolute left-3 top-3 text-gray-400"/>

            <input
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              placeholder="Search receipt, customer or cashier..."
              className="w-full rounded-lg border py-2 pl-10 pr-4"
            />

          </div>

        </div>

        <div className="overflow-x-auto">

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

                  Cashier

                </th>

                <th className="px-5 py-3">

                  Payment

                </th>

                <th className="px-5 py-3">

                  Total

                </th>

                <th className="px-5 py-3">

                  Date

                </th>

                <th className="px-5 py-3">

                  Actions

                </th>

              </tr>

            </thead>

            <tbody>

              {sales.map((sale)=>(

                <tr
                  key={sale.id}
                  className="border-t hover:bg-gray-50"
                >

                  <td className="px-5 py-4 font-semibold">

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

                  <td className="px-5 py-4">

                    ${sale.grandTotal.toFixed(2)}

                  </td>

                  <td className="px-5 py-4">

                    {new Date(
                      sale.createdAt
                    ).toLocaleString()}

                  </td>

                  <td className="px-5 py-4">

                    <div className="flex justify-center gap-2">

                      <Link
                        to={`/sales/${sale.id}`}
                        className="rounded bg-blue-100 p-2 text-blue-600"
                      >

                        <HiEye/>

                      </Link>

                      <Link
                        to={`/receipt/${sale.id}`}
                        className="rounded bg-green-100 p-2 text-green-600"
                      >

                        <HiPrinter/>

                      </Link>

                    </div>

                  </td>

                </tr>

              ))}

              {sales.length===0 && (

                <tr>

                  <td
                    colSpan={7}
                    className="py-10 text-center text-gray-500"
                  >

                    No sales found.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

};

export default SalesHistory;