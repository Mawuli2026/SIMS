import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import {
  HiArrowLeft,
  HiPencil,
  HiTrash,
  HiCheckCircle,
  HiPrinter,
} from "react-icons/hi";

import purchaseOrderService from "../../services/purchaseOrderService";
import DeleteConfirmationModal from "../../common/DeleteConfirmationModal";

const statusColors = {
  Draft: "bg-gray-100 text-gray-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Received: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const PurchaseOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);

  const order = id ? purchaseOrderService.getById(id) : undefined;

  if (!order) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow">
        <h1 className="mb-4 text-3xl font-bold">Purchase Order Not Found</h1>
        <Link
          to="/purchase-orders"
          className="rounded-lg bg-blue-600 px-5 py-3 text-white"
        >
          Back
        </Link>
      </div>
    );
  }

  const receiveOrder = () => {
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

    navigate("/purchase-orders");
  };

  const deleteOrder = () => {
    purchaseOrderService.delete(order.id);
    navigate("/purchase-orders");
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/purchase-orders" className="rounded-lg border p-2">
              <HiArrowLeft />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
              <p className="text-gray-500">Purchase Order Details</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg border px-4 py-2"
            >
              <HiPrinter />
              Print
            </button>
            <Link
              to={`/purchase-orders/edit/${order.id}`}
              className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-white"
            >
              <HiPencil />
              Edit
            </Link>

            {order.status !== "Received" && (
              <button
                onClick={receiveOrder}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white"
              >
                <HiCheckCircle />
                Receive
              </button>
            )}

            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white"
            >
              <HiTrash />
              Delete
            </button>
          </div>
        </div>

        {/* Order Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Order Information</h2>
            <Info label="Order Number" value={order.orderNumber} />
            <Info label="Supplier" value={order.supplierName} />
            <Info label="Order Date" value={order.orderDate} />
            <Info label="Expected Date" value={order.expectedDate} />
          </div>

          <div className="rounded-xl border bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Status</h2>
            <span
              className={`rounded-full px-4 py-2 font-semibold ${statusColors[order.status]}`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* Products */}
        <div className="rounded-xl border bg-white shadow">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">Products</h2>
          </div>

          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-center">Qty</th>
                <th className="px-5 py-3 text-right">Cost</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-5 py-4">{item.productName}</td>
                  <td className="px-5 py-4 text-center">{item.quantity}</td>
                  <td className="px-5 py-4 text-right">
                    ${item.costPrice.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold">
                    ${item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="rounded-xl border bg-white p-6 shadow">
          <div className="space-y-3">
            <Summary label="Subtotal" value={order.subtotal} />
            <Summary label="Tax" value={order.tax} />
            <Summary label="Discount" value={order.discount} />
            <hr />
            <Summary label="Grand Total" value={order.grandTotal} bold />
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Notes</h2>
          <p>{order.notes || "-"}</p>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDelete}
        title="Delete Purchase Order"
        message="This purchase order will be permanently deleted."
        itemName={order.orderNumber}
        onCancel={() => setShowDelete(false)}
        onConfirm={deleteOrder}
      />
    </>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="mb-4">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

const Summary = ({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) => (
  <div className={`flex justify-between ${bold ? "text-xl font-bold" : ""}`}>
    <span>{label}</span>
    <span>${value.toFixed(2)}</span>
  </div>
);

export default PurchaseOrderDetails;