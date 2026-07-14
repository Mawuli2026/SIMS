import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiSearch,
  HiEye,
  HiPencil,
  HiTrash,
  HiCheckCircle,
} from "react-icons/hi";

import purchaseOrderService from "../../services/purchaseOrderService";
import DeleteConfirmationModal from "../../common/DeleteConfirmationModal";
import { PurchaseOrder } from "../../types/purchaseOrder";

const statusStyles: Record<
  PurchaseOrder["status"],
  string
> = {
  Draft: "bg-gray-100 text-gray-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Received: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const PurchaseOrderTable = () => {
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [selectedOrder, setSelectedOrder] =
    useState<PurchaseOrder | null>(null);

  const orders = useMemo(() => {
    if (!search.trim()) {
      return purchaseOrderService.getAll();
    }

    return purchaseOrderService.search(search);
  }, [search, refresh]);

  const handleDelete = () => {
    if (!selectedOrder) return;

    purchaseOrderService.delete(selectedOrder.id);

    setSelectedOrder(null);

    setRefresh((prev) => !prev);
  };

  const receiveOrder = (order: PurchaseOrder) => {
    purchaseOrderService.update(order.id, {
      supplierId: order.supplierId,
      orderDate: order.orderDate,
      expectedDate: order.expectedDate,
      status: "Received",
      items: order.items,
      tax: order.tax,
      discount: order.discount,
      notes: order.notes,
    });

    setRefresh((prev) => !prev);
  };

  return (
    <>
      <div className="rounded-xl border bg-white shadow">

        {/* Header */}

        <div className="flex items-center justify-between border-b p-6">

          <div>

            <h2 className="text-xl font-semibold">
              Purchase Orders
            </h2>

            <p className="text-gray-500">
              Manage supplier purchase orders.
            </p>

          </div>

          <Link
            to="/purchase-orders/new"
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            New Purchase Order
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
              placeholder="Search order..."
              className="w-full rounded-lg border py-2 pl-10 pr-4"
            />

          </div>

        </div>

        {/* Table */}

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-5 py-3 text-left">
                  Order #
                </th>

                <th className="px-5 py-3 text-left">
                  Supplier
                </th>

                <th className="px-5 py-3 text-center">
                  Date
                </th>

                <th className="px-5 py-3 text-center">
                  Status
                </th>

                <th className="px-5 py-3 text-right">
                  Total
                </th>

                <th className="px-5 py-3 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {orders.map((order) => (

                <tr
                  key={order.id}
                  className="border-t hover:bg-gray-50"
                >

                  <td className="px-5 py-4 font-semibold">
                    {order.orderNumber}
                  </td>

                  <td className="px-5 py-4">
                    {order.supplierName || "-"}
                  </td>

                  <td className="px-5 py-4 text-center">
                    {order.orderDate}
                  </td>

                  <td className="px-5 py-4 text-center">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
                    >
                      {order.status}
                    </span>

                  </td>

                  <td className="px-5 py-4 text-right font-semibold">
                    ${order.grandTotal.toFixed(2)}
                  </td>

                  <td className="px-5 py-4">

                    <div className="flex justify-center gap-2">

                      <Link
                        to={`/purchase-orders/${order.id}`}
                        className="rounded bg-blue-100 p-2 text-blue-700"
                      >
                        <HiEye />
                      </Link>

                      <Link
                        to={`/purchase-orders/edit/${order.id}`}
                        className="rounded bg-yellow-100 p-2 text-yellow-700"
                      >
                        <HiPencil />
                      </Link>

                      {order.status !== "Received" && (

                        <button
                          onClick={() =>
                            receiveOrder(order)
                          }
                          className="rounded bg-green-100 p-2 text-green-700"
                          title="Receive Order"
                        >
                          <HiCheckCircle />
                        </button>

                      )}

                      <button
                        onClick={() =>
                          setSelectedOrder(order)
                        }
                        className="rounded bg-red-100 p-2 text-red-700"
                      >
                        <HiTrash />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

              {orders.length === 0 && (

                <tr>

                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-500"
                  >
                    No purchase orders found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      <DeleteConfirmationModal
        isOpen={selectedOrder !== null}
        title="Delete Purchase Order"
        message="This purchase order will be permanently removed."
        itemName={selectedOrder?.orderNumber}
        onCancel={() => setSelectedOrder(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default PurchaseOrderTable;