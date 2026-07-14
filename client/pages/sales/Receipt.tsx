import { useParams } from "react-router-dom";
import {
  HiPrinter,
  HiDownload,
} from "react-icons/hi";

import salesService from "../../services/salesService";
import pdfService from "../../services/pdfService";

const Receipt = () => {

  const { id } = useParams();

  const sale = id
    ? salesService.getById(id)
    : undefined;

  if (!sale) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">
          Receipt Not Found
        </h2>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    pdfService.exportSale(sale);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Action Buttons */}
      <div className="mb-6 flex justify-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="
          flex
          items-center
          gap-2
          rounded-lg
          bg-green-600
          px-5
          py-3
          text-white
          "
        >
          <HiPrinter />
          Print Receipt
        </button>
        <button
          onClick={handleDownloadPdf}
          className="
          flex
          items-center
          gap-2
          rounded-lg
          bg-blue-600
          px-5
          py-3
          text-white
          "
        >
          <HiDownload />
          Download PDF
        </button>
      </div>

      {/* Receipt Container */}
      <div
        className="
        mx-auto
        max-w-md
        rounded-lg
        bg-white
        p-6
        shadow
        "
      >

        {/* Business Header */}
        <div className="text-center">

          <h1 className="text-2xl font-bold">
            Smart Store
          </h1>

          <p className="text-sm text-gray-500">
            Sales & Inventory Management System
          </p>

          <p className="text-sm">
            Bujumbura, Burundi
          </p>

          <hr className="my-4"/>

        </div>

        {/* Receipt Information */}
        <div className="space-y-1 text-sm">

          <p>
            <strong>
              Receipt:
            </strong>
            {" "}
            {sale.saleNumber}
          </p>

          <p>
            <strong>
              Date:
            </strong>
            {" "}
            {new Date(
              sale.createdAt
            ).toLocaleString()}
          </p>

          <p>
            <strong>
              Cashier:
            </strong>
            {" "}
            {sale.cashierName}
          </p>

          <p>
            <strong>
              Customer:
            </strong>
            {" "}
            {sale.customerName}
          </p>

        </div>

        <hr className="my-4"/>

        {/* Items */}
        <table className="w-full text-sm">

          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">
                Item
              </th>
              <th>
                Qty
              </th>
              <th className="text-right">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {sale.items.map(
              (item)=> (
              <tr
                key={item.id}
                className="border-b"
              >
                <td className="py-2">
                  {item.productName}
                </td>
                <td className="text-center">
                  {item.quantity}
                </td>
                <td className="text-right">
                  ${item.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>

        </table>

        <hr className="my-4"/>

        {/* Totals */}
        <div className="space-y-2 text-sm">

          <div className="flex justify-between">
            <span>
              Subtotal
            </span>
            <span>
              ${sale.subtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              Discount
            </span>
            <span>
              ${sale.discount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              Tax
            </span>
            <span>
              ${sale.tax.toFixed(2)}
            </span>
          </div>

          <div
            className="
            flex
            justify-between
            border-t
            pt-3
            text-lg
            font-bold
            "
          >
            <span>
              Total
            </span>
            <span>
              ${sale.grandTotal.toFixed(2)}
            </span>
          </div>

        </div>

        <hr className="my-4"/>

        {/* Payment */}
        <div className="text-sm">

          <p>
            <strong>
              Payment:
            </strong>
            {" "}
            {sale.paymentMethod}
          </p>

          <p>
            <strong>
              Paid:
            </strong>
            {" "}
            ${sale.amountPaid.toFixed(2)}
          </p>

          <p>
            <strong>
              Change:
            </strong>
            {" "}
            ${sale.change.toFixed(2)}
          </p>

        </div>

        <hr className="my-4"/>

        {/* Footer */}
        <div className="text-center text-sm">

          <p>
            Thank you for shopping with us!
          </p>
          <p className="text-gray-500">
            Come again.
          </p>

        </div>

      </div>

    </div>
  );
};

export default Receipt;