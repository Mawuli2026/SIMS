import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import salesService from "../../services/salesService";
import { SaleItem, SaleFormData } from "../../types/sale";

interface PaymentSummary {
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  totalItems: number;
  totalQuantity: number;
}

interface PaymentPanelProps {
  cart: SaleItem[];

  customerId: string;

  customerName: string;

  summary: PaymentSummary;
}

const PaymentPanel = ({
  cart,
  customerId,
  customerName,
  summary,
}: PaymentPanelProps) => {

  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] =
    useState<
      "Cash" | "Card" | "Mobile Money" | "Bank Transfer"
    >("Cash");

  const [amountReceived, setAmountReceived] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const change = useMemo(() => {

    return amountReceived - summary.grandTotal;

  }, [amountReceived, summary]);

  const completeSale = () => {

    if (cart.length === 0) {

      alert("Shopping cart is empty.");

      return;

    }

    if (
      paymentMethod === "Cash" &&
      amountReceived < summary.grandTotal
    ) {

      alert("Insufficient cash received.");

      return;

    }

    try {

      setLoading(true);

      const saleData: SaleFormData = {

        customerId,

        customerName,

        cashierId: "ADMIN",

        cashierName: "Administrator",

        items: cart,

        tax: summary.tax,

        discount: summary.discount,

        paymentMethod,

        paymentStatus: "Paid",

        notes: "",

      };

      const sale =
        salesService.completeSale(saleData);

      alert("Sale completed successfully.");

      navigate(`/receipt/${sale.id}`);

    } catch (error) {

      if (error instanceof Error) {

        alert(error.message);

      } else {

        alert("Unable to complete sale.");

      }

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="rounded-xl border bg-white shadow">

      <div className="border-b p-5">

        <h2 className="text-xl font-semibold">

          Payment

        </h2>

      </div>

      <div className="space-y-5 p-5">

        <div>

          <label className="mb-2 block font-medium">

            Payment Method

          </label>

          <select
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(
                e.target.value as any
              )
            }
            className="w-full rounded-lg border px-3 py-2"
          >

            <option value="Cash">
              Cash
            </option>

            <option value="Card">
              Card
            </option>

            <option value="Mobile Money">
              Mobile Money
            </option>

            <option value="Bank Transfer">
              Bank Transfer
            </option>

          </select>

        </div>

        {paymentMethod === "Cash" && (

          <div>

            <label className="mb-2 block font-medium">

              Amount Received

            </label>

            <input
              type="number"
              min="0"
              value={amountReceived}
              onChange={(e) =>
                setAmountReceived(
                  Number(e.target.value)
                )
              }
              className="w-full rounded-lg border px-3 py-2"
            />

          </div>

        )}

        <div className="space-y-2 rounded-lg bg-gray-50 p-4">

          <div className="flex justify-between">

            <span>Total</span>

            <strong>

              ${summary.grandTotal.toFixed(2)}

            </strong>

          </div>

          {paymentMethod === "Cash" && (

            <div className="flex justify-between">

              <span>Change</span>

              <strong className="text-green-600">

                ${change.toFixed(2)}

              </strong>

            </div>

          )}

        </div>

        <button
          onClick={completeSale}
          disabled={loading}
          className="w-full rounded-lg bg-green-600 py-3 text-lg font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >

          {loading
            ? "Processing..."
            : "Complete Sale"}

        </button>

      </div>

    </div>

  );

};

export default PaymentPanel;