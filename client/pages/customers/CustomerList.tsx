import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  HiSearch,
  HiPlus,
  HiEye,
  HiPencil,
  HiTrash,
} from "react-icons/hi";

import customerService from "../../services/customerService";

const CustomerList = () => {

  const [search, setSearch] = useState("");

  const customers = useMemo(() => {

    if (!search.trim()) {
      return customerService.getAll();
    }

    return customerService.search(search);

  }, [search]);

  const handleDelete = (id: string) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) return;

    customerService.remove(id);

    window.location.reload();

  };

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <h1 className="text-3xl font-bold">

            Customers

          </h1>

          <p className="text-gray-500">

            Manage customers

          </p>

        </div>

        <Link
          to="/customers/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >

          <HiPlus />

          Add Customer

        </Link>

      </div>

      {/* Search */}

      <div className="rounded-xl border bg-white p-5 shadow">

        <div className="relative max-w-md">

          <HiSearch className="absolute left-3 top-3 text-gray-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer..."
            className="w-full rounded-lg border py-2 pl-10 pr-4"
          />

        </div>

      </div>

      {/* Table */}

      <div className="overflow-x-auto rounded-xl border bg-white shadow">

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-5 py-3 text-left">

                Customer #

              </th>

              <th className="px-5 py-3 text-left">

                Name

              </th>

              <th className="px-5 py-3">

                Phone

              </th>

              <th className="px-5 py-3">

                Email

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

              <th className="px-5 py-3">

                Actions

              </th>

            </tr>

          </thead>

          <tbody>

            {customers.map((customer) => (

              <tr
                key={customer.id}
                className="border-t hover:bg-gray-50"
              >

                <td className="px-5 py-4 font-semibold">

                  {customer.customerNumber}

                </td>

                <td className="px-5 py-4">

                  {customer.firstName} {customer.lastName}

                </td>

                <td className="px-5 py-4">

                  {customer.phone}

                </td>

                <td className="px-5 py-4">

                  {customer.email}

                </td>

                <td className="px-5 py-4 text-center">

                  {customer.totalPurchases}

                </td>

                <td className="px-5 py-4 text-right">

                  ${customer.totalSpent.toFixed(2)}

                </td>

                <td className="px-5 py-4 text-center">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      customer.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {customer.status}
                  </span>

                </td>

                <td className="px-5 py-4">

                  <div className="flex justify-center gap-2">

                    <Link
                      to={`/customers/${customer.id}`}
                      className="rounded bg-blue-100 p-2 text-blue-600"
                    >
                      <HiEye />
                    </Link>

                    <Link
                      to={`/customers/edit/${customer.id}`}
                      className="rounded bg-yellow-100 p-2 text-yellow-600"
                    >
                      <HiPencil />
                    </Link>

                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="rounded bg-red-100 p-2 text-red-600"
                    >
                      <HiTrash />
                    </button>

                  </div>

                </td>

              </tr>

            ))}

            {customers.length === 0 && (

              <tr>

                <td
                  colSpan={8}
                  className="py-10 text-center text-gray-500"
                >

                  No customers found.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default CustomerList;