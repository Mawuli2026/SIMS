import { useMemo, useState } from "react";
import {
  HiSearch,
  HiDownload,
  HiPrinter,
  HiCube,
  HiExclamation,
} from "react-icons/hi";

import inventoryService from "../../services/inventoryService";

const InventoryReport = () => {

  const inventory = inventoryService.getAll();

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("All");

  const categories = [

    "All",

    ...new Set(

      inventory.map(

        item => item.category

      )

    )

  ];

  const filteredInventory = useMemo(() => {

    return inventory.filter(item => {

      const matchesSearch =

        item.productName
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =

        category === "All" ||

        item.category === category;

      return matchesSearch && matchesCategory;

    });

  }, [inventory, search, category]);

  const inventoryValue = filteredInventory.reduce(

    (sum, item) =>

      sum +

      item.quantity *

      item.costPrice,

    0

  );

  const totalItems = filteredInventory.length;

  const lowStockItems = filteredInventory.filter(

    item =>

      item.quantity <= item.reorderLevel

  );

  const outOfStockItems = filteredInventory.filter(

    item =>

      item.quantity === 0

  );

  const exportCSV = () => {

    const rows = [

      [

        "Product",

        "Category",

        "Stock",

        "Cost",

        "Selling",

        "Inventory Value"

      ],

      ...filteredInventory.map(item => [

        item.productName,

        item.category,

        item.quantity,

        item.costPrice,

        item.sellingPrice,

        item.quantity * item.costPrice

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

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "inventory-report.csv";

    link.click();

    URL.revokeObjectURL(url);

  };

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">

            Inventory Report

          </h1>

          <p className="text-gray-500">

            Inventory valuation and stock analysis

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

      {/* Filters */}

      <div className="rounded-xl border bg-white p-6 shadow">

        <div className="grid gap-4 md:grid-cols-2">

          <div className="relative">

            <HiSearch className="absolute left-3 top-3 text-gray-400"/>

            <input
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              placeholder="Search product..."
              className="w-full rounded-lg border py-2 pl-10"
            />

          </div>

          <select
            value={category}
            onChange={(e)=>setCategory(e.target.value)}
            className="rounded-lg border p-2"
          >

            {categories.map(cat => (

              <option
                key={cat}
                value={cat}
              >

                {cat}

              </option>

            ))}

          </select>

        </div>

      </div>

      {/* Summary */}

      <div className="grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiCube className="mb-3 text-4xl text-blue-600"/>

          <p>Total Products</p>

          <h2 className="text-3xl font-bold">

            {totalItems}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiCube className="mb-3 text-4xl text-green-600"/>

          <p>Inventory Value</p>

          <h2 className="text-3xl font-bold">

            ${inventoryValue.toFixed(2)}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiExclamation className="mb-3 text-4xl text-yellow-500"/>

          <p>Low Stock</p>

          <h2 className="text-3xl font-bold">

            {lowStockItems.length}

          </h2>

        </div>

        <div className="rounded-xl border bg-white p-6 shadow">

          <HiExclamation className="mb-3 text-4xl text-red-600"/>

          <p>Out of Stock</p>

          <h2 className="text-3xl font-bold">

            {outOfStockItems.length}

          </h2>

        </div>

      </div>

      {/* Inventory Table */}

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

                Stock

              </th>

              <th className="px-5 py-3">

                Cost

              </th>

              <th className="px-5 py-3">

                Selling

              </th>

              <th className="px-5 py-3">

                Value

              </th>

              <th className="px-5 py-3">

                Status

              </th>

            </tr>

          </thead>

          <tbody>

            {filteredInventory.map(item => {

              const value =
                item.quantity *
                item.costPrice;

              let status = "In Stock";
              let statusClass =
                "bg-green-100 text-green-700";

              if (item.quantity === 0) {

                status = "Out of Stock";

                statusClass =
                  "bg-red-100 text-red-700";

              } else if (
                item.quantity <= item.reorderLevel
              ) {

                status = "Low Stock";

                statusClass =
                  "bg-yellow-100 text-yellow-700";

              }

              return (

                <tr
                  key={item.id}
                  className="border-t"
                >

                  <td className="px-5 py-4">

                    {item.productName}

                  </td>

                  <td className="px-5 py-4">

                    {item.category}

                  </td>

                  <td className="px-5 py-4 text-center">

                    {item.quantity}

                  </td>

                  <td className="px-5 py-4 text-right">

                    ${item.costPrice.toFixed(2)}

                  </td>

                  <td className="px-5 py-4 text-right">

                    ${item.sellingPrice.toFixed(2)}

                  </td>

                  <td className="px-5 py-4 text-right">

                    ${value.toFixed(2)}

                  </td>

                  <td className="px-5 py-4 text-center">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                    >
                      {status}
                    </span>

                  </td>

                </tr>

              );

            })}

            {filteredInventory.length === 0 && (

              <tr>

                <td
                  colSpan={7}
                  className="py-10 text-center text-gray-500"
                >

                  No inventory records found.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default InventoryReport;