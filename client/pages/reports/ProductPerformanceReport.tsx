import { useMemo, useState } from "react";
import {
  HiSearch,
  HiDownload,
  HiPrinter,
  HiTrendingUp,
  HiCube,
} from "react-icons/hi";

import salesService from "../../services/salesService";

const ProductPerformanceReport = () => {

  const sales = salesService.getAll();

  const [search, setSearch] = useState("");

  const productMap = new Map();

  sales.forEach((sale) => {

    sale.items.forEach((item) => {

      if (!productMap.has(item.productId)) {

        productMap.set(item.productId, {

          id: item.productId,

          productName: item.productName,

          category: item.category,

          unitsSold: 0,

          revenue: 0,

          cost: 0,

          profit: 0,

        });

      }

      const product = productMap.get(item.productId);

      product.unitsSold += item.quantity;

      product.revenue += item.lineTotal;

      product.cost += item.quantity * item.costPrice;

      product.profit +=

        item.lineTotal -

        item.quantity * item.costPrice;

    });

  });

  const products = Array.from(productMap.values());

  const filteredProducts = useMemo(() => {

    return products

      .filter((product) =>

        product.productName

          .toLowerCase()

          .includes(search.toLowerCase())

      )

      .sort(

        (a, b) =>

          b.unitsSold - a.unitsSold

      );

  }, [search]);

  const totalRevenue = filteredProducts.reduce(

    (sum, product) =>

      sum + product.revenue,

    0

  );

  const totalProfit = filteredProducts.reduce(

    (sum, product) =>

      sum + product.profit,

    0

  );

  const totalUnits = filteredProducts.reduce(

    (sum, product) =>

      sum + product.unitsSold,

    0

  );

  const exportCSV = () => {

    const rows = [

      [

        "Product",

        "Category",

        "Units Sold",

        "Revenue",

        "Profit",

      ],

      ...filteredProducts.map(product => [

        product.productName,

        product.category,

        product.unitsSold,

        product.revenue,

        product.profit,

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

    link.download = "product-performance.csv";

    link.click();

    URL.revokeObjectURL(url);

  };

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">

            Product Performance

          </h1>

          <p className="text-gray-500">

            Analyze sales performance by product

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
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            <HiPrinter/>
            Print
          </button>

        </div>

      </div>

      {/* Search */}

      <div className="relative max-w-md">

        <HiSearch className="absolute left-3 top-3 text-gray-400"/>

        <input
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          placeholder="Search product..."
          className="w-full rounded-lg border py-2 pl-10"
        />

      </div>

      {/* Summary */}

      <div className="grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiCube className="mb-3 text-4xl text-blue-600"/>

          <p>Products Sold</p>

          <h2 className="text-3xl font-bold">

            {filteredProducts.length}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiTrendingUp className="mb-3 text-4xl text-green-600"/>

          <p>Total Revenue</p>

          <h2 className="text-3xl font-bold">

            ${totalRevenue.toFixed(2)}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiTrendingUp className="mb-3 text-4xl text-purple-600"/>

          <p>Total Profit</p>

          <h2 className="text-3xl font-bold">

            ${totalProfit.toFixed(2)}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiCube className="mb-3 text-4xl text-orange-600"/>

          <p>Units Sold</p>

          <h2 className="text-3xl font-bold">

            {totalUnits}

          </h2>

        </div>

      </div>

      {/* Product Performance Table */}

      <div className="overflow-x-auto rounded-xl border bg-white shadow">

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-5 py-3 text-left">

                Product

              </th>

              <th className="px-5 py-3">

                Category

              </th>

              <th className="px-5 py-3">

                Units Sold

              </th>

              <th className="px-5 py-3">

                Revenue

              </th>

              <th className="px-5 py-3">

                Profit

              </th>

              <th className="px-5 py-3">

                Margin %

              </th>

            </tr>

          </thead>

          <tbody>

            {filteredProducts.map((product) => {

              const margin =

                product.revenue === 0

                  ? 0

                  : (product.profit /

                      product.revenue) * 100;

              return (

                <tr
                  key={product.id}
                  className="border-t"
                >

                  <td className="px-5 py-4">

                    {product.productName}

                  </td>

                  <td className="px-5 py-4">

                    {product.category}

                  </td>

                  <td className="px-5 py-4 text-center">

                    {product.unitsSold}

                  </td>

                  <td className="px-5 py-4 text-right">

                    ${product.revenue.toFixed(2)}

                  </td>

                  <td className="px-5 py-4 text-right">

                    ${product.profit.toFixed(2)}

                  </td>

                  <td className="px-5 py-4 text-right">

                    {margin.toFixed(2)}%

                  </td>

                </tr>

              );

            })}

            {filteredProducts.length === 0 && (

              <tr>

                <td
                  colSpan={6}
                  className="py-10 text-center text-gray-500"
                >

                  No product performance data found.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default ProductPerformanceReport;