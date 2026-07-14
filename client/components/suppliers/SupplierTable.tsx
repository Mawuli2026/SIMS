import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiSearch,
  HiEye,
  HiPencil,
  HiTrash,
} from "react-icons/hi";

import supplierService from "../../services/supplierService";
import DeleteConfirmationModal from "../../common/DeleteConfirmationModal";
import { Supplier } from "../../types/supplier";

const statusStyles: Record<Supplier["status"], string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-red-100 text-red-700",
};

const SupplierTable = () => {
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [selectedSupplier, setSelectedSupplier] =
    useState<Supplier | null>(null);

  const suppliers = useMemo(() => {
    if (!search.trim()) {
      return supplierService.getAll();
    }

    return supplierService.search(search);
  }, [search, refresh]);

  const handleDelete = () => {
    if (!selectedSupplier) return;

    supplierService.delete(selectedSupplier.id);

    setSelectedSupplier(null);
    setRefresh((prev) => !prev);
  };

  return (
    <>
      <div className="rounded-xl border bg-white shadow-sm">

        {/* Header */}

        <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="text-xl font-semibold">
              Suppliers
            </h2>

            <p className="text-sm text-gray-500">
              Manage supplier information.
            </p>
          </div>

          <Link
            to="/suppliers/new"
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            Add Supplier
          </Link>

        </div>

        {/* Search */}

        <div className="p-6">

          <div className="relative max-w-md">

            <HiSearch className="absolute left-3 top-3 text-gray-400" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search suppliers..."
              className="w-full rounded-lg border py-2 pl-10 pr-4"
            />

          </div>

        </div>

        {/* Table */}

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-6 py-3 text-left">
                  Company
                </th>

                <th className="px-6 py-3 text-left">
                  Contact
                </th>

                <th className="px-6 py-3 text-left">
                  Email
                </th>

                <th className="px-6 py-3 text-left">
                  Phone
                </th>

                <th className="px-6 py-3 text-center">
                  Status
                </th>

                <th className="px-6 py-3 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {suppliers.map((supplier) => (

                <tr
                  key={supplier.id}
                  className="border-t hover:bg-gray-50"
                >

                  <td className="px-6 py-4 font-semibold">
                    {supplier.companyName}
                  </td>

                  <td className="px-6 py-4">
                    {supplier.contactPerson}
                  </td>

                  <td className="px-6 py-4">
                    {supplier.email}
                  </td>

                  <td className="px-6 py-4">
                    {supplier.phone}
                  </td>

                  <td className="px-6 py-4 text-center">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[supplier.status]}`}
                    >
                      {supplier.status}
                    </span>

                  </td>

                  <td className="px-6 py-4">

                    <div className="flex justify-center gap-2">

                      <Link
                        to={`/suppliers/${supplier.id}`}
                        className="rounded bg-blue-100 p-2 text-blue-700"
                      >
                        <HiEye />
                      </Link>

                      <Link
                        to={`/suppliers/edit/${supplier.id}`}
                        className="rounded bg-yellow-100 p-2 text-yellow-700"
                      >
                        <HiPencil />
                      </Link>

                      <button
                        onClick={() =>
                          setSelectedSupplier(supplier)
                        }
                        className="rounded bg-red-100 p-2 text-red-700"
                      >
                        <HiTrash />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

              {suppliers.length === 0 && (

                <tr>

                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-500"
                  >
                    No suppliers found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      <DeleteConfirmationModal
        isOpen={selectedSupplier !== null}
        title="Delete Supplier"
        message="This action cannot be undone."
        itemName={selectedSupplier?.companyName}
        onCancel={() => setSelectedSupplier(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default SupplierTable;