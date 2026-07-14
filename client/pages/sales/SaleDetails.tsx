import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  HiArrowLeft,
  HiPrinter,
  HiDownload,
  HiBan,
  HiRefresh,
  HiUser,
  HiShoppingCart,
  HiCash,
  HiClipboardCheck,
} from "react-icons/hi";

import salesService from "../../services/salesService";
import pdfService from "../../services/pdfService";
import RefundDialog from "../../components/sales/RefundDialog";

const SaleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [refundOpen, setRefundOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);

  const sale = useMemo(() => {
    if (!id) return undefined;
    return salesService.getById(id);
  }, [id]);

  if (!sale) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold">Sale not found</h2>
        <Link to="/sales/history" className="mt-4 inline-flex text-blue-600">
          Back
        </Link>
      </div>
    );
  }

  const printReceipt = () => {
    window.print();
  };

  const exportPDF = () => {
    pdfService.exportSale(sale);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/sales/history"
            className="mb-3 inline-flex items-center gap-2 text-blue-600"
          >
            <HiArrowLeft />
            Back to Sales History
          </Link>
          <h1 className="text-3xl font-bold">{sale.saleNumber}</h1>
          <p className="text-gray-500">
            {new Date(sale.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={printReceipt}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <HiPrinter />
            Print
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <HiDownload />
            PDF
          </button>
          <button
            onClick={() => setRefundOpen(true)}
            className="rounded-lg bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
          >
            <HiRefresh />
          </button>
          <button
            onClick={() => setVoidOpen(true)}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            <HiBan />
          </button>
        </div>
      </div>

      {/* Customer & Cashier Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow">
          <div className="mb-4 flex items-center gap-2">
            <HiUser className="text-blue-600" />
            <h2 className="text-xl font-semibold">Customer</h2>
          </div>
          <p>
            <strong>Name:</strong> {sale.customerName}
          </p>
          <p>
            <strong>Phone:</strong> {sale.customerPhone || "-"}
          </p>
          <p>
            <strong>Email:</strong> {sale.customerEmail || "-"}
          </p>
          <p>
            <strong>Address:</strong> {sale.customerAddress || "-"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow">
          <div className="mb-4 flex items-center gap-2">
            <HiCash className="text-green-600" />
            <h2 className="text-xl font-semibold">Cashier</h2>
          </div>
          <p>
            <strong>Name:</strong> {sale.cashierName}
          </p>
          <p>
            <strong>Payment:</strong> {sale.paymentMethod}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                sale.status === "Completed"
                  ? "bg-green-100 text-green-800"
                  : sale.status === "Refunded"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {sale.status}
            </span>
          </p>
        </div>
      </div>

      {/* Purchased Items */}
      <div className="rounded-xl border bg-white shadow">
        <div className="border-b p-5">
          <div className="flex items-center gap-2">
            <HiShoppingCart />
            <h2 className="text-xl font-semibold">Purchased Items</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-center">Qty</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-right">Discount</th>
                <th className="px-5 py-3 text-right">Tax</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-5 py-4">{item.productName}</td>
                  <td className="px-5 py-4 text-center">{item.quantity}</td>
                  <td className="px-5 py-4 text-right">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    ${item.discount.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    ${item.tax.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold">
                    ${item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Summary & Audit Trail */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow">
          <div className="mb-4 flex items-center gap-2">
            <HiClipboardCheck className="text-indigo-600" />
            <h2 className="text-xl font-semibold">Payment Summary</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>${sale.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${sale.tax.toFixed(2)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span>${sale.grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid</span>
              <span>${sale.amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change</span>
              <span>${sale.change.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Method</span>
              <span>{sale.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Profit</span>
              <span className="font-semibold text-green-600">
                ${sale.profit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="rounded-xl border bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Audit Trail</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-semibold">Sale Created</p>
              <p className="text-sm text-gray-500">
                {new Date(sale.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-semibold">Status</p>
              <p className="text-sm text-gray-500">{sale.status}</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="font-semibold">Payment Method</p>
              <p className="text-sm text-gray-500">{sale.paymentMethod}</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <p className="font-semibold">Cashier</p>
              <p className="text-sm text-gray-500">{sale.cashierName}</p>
            </div>
            <div className="border-l-4 border-indigo-500 pl-4">
              <p className="font-semibold">Invoice Number</p>
              <p className="text-sm text-gray-500">{sale.saleNumber}</p>
            </div>

            {/* Refund Information */}
            {sale.refundedAt && (
              <div className="border-l-4 border-yellow-500 pl-4">
                <p className="font-semibold">Refunded</p>
                <p className="text-sm text-gray-500">{sale.refundedBy}</p>
                <p className="text-sm text-gray-500">{sale.refundedAt}</p>
                <p className="text-sm text-gray-500">{sale.refundReason}</p>
              </div>
            )}

            {/* Void Information */}
            {sale.voidedAt && (
              <div className="border-l-4 border-red-500 pl-4">
                <p className="font-semibold">Voided</p>
                <p className="text-sm text-gray-500">{sale.voidedBy}</p>
                <p className="text-sm text-gray-500">{sale.voidedAt}</p>
                <p className="text-sm text-gray-500">{sale.voidReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-xl border bg-white p-6 shadow">
        <div className="flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold">
            Thank you for your business!
          </h3>
          <p className="mt-2 text-gray-500">
            This invoice was generated by the Smart Sales & Inventory Management
            System.
          </p>
        </div>
      </div>

      {/* Refund Dialog */}
      <RefundDialog
        title="Refund Sale"
        isOpen={refundOpen}
        onClose={() => setRefundOpen(false)}
        onConfirm={(reason) => {
          salesService.refundSale(sale.id, reason);
          navigate("/sales/history");
        }}
      />

      {/* Void Dialog */}
      <RefundDialog
        title="Void Sale"
        isOpen={voidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={(reason) => {
          salesService.voidSale(sale.id, reason);
          navigate("/sales/history");
        }}
      />
    </div>
  );
};

export default SaleDetails;