import { useEffect, useMemo, useState } from "react";
import { SaleItem } from "../../types/sale";

interface OrderSummaryProps {
  cart: SaleItem[];

  onSummaryChange?: (summary: {
    subtotal: number;
    tax: number;
    discount: number;
    grandTotal: number;
    totalItems: number;
    totalQuantity: number;
  }) => void;
}

const OrderSummary = ({
  cart,
  onSummaryChange,
}: OrderSummaryProps) => {

  const [tax, setTax] = useState(0);

  const [discount, setDiscount] = useState(0);

  const subtotal = useMemo(() => {

    return cart.reduce(
      (sum, item) => sum + item.total,
      0
    );

  }, [cart]);

  const totalQuantity = useMemo(() => {

    return cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

  }, [cart]);

  const totalItems = cart.length;

  const grandTotal =
    subtotal + tax - discount;

  useEffect(() => {

    onSummaryChange?.({

      subtotal,

      tax,

      discount,

      grandTotal,

      totalItems,

      totalQuantity,

    });

  }, [
    subtotal,
    tax,
    discount,
    grandTotal,
    totalItems,
    totalQuantity,
    onSummaryChange,
  ]);

  return (

    <div className="rounded-xl border bg-white shadow">

      <div className="border-b p-5">

        <h2 className="text-xl font-semibold">

          Order Summary

        </h2>

      </div>

      <div className="space-y-5 p-5">

        <div className="flex justify-between">

          <span>Total Items</span>

          <span className="font-semibold">

            {totalItems}

          </span>

        </div>

        <div className="flex justify-between">

          <span>Total Quantity</span>

          <span className="font-semibold">

            {totalQuantity}

          </span>

        </div>

        <hr />

        <div className="flex justify-between">

          <span>Subtotal</span>

          <span>

            ${subtotal.toFixed(2)}

          </span>

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium">

            Tax

          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={tax}
            onChange={(e) =>
              setTax(Number(e.target.value))
            }
            className="w-full rounded-lg border px-3 py-2"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium">

            Discount

          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={discount}
            onChange={(e) =>
              setDiscount(Number(e.target.value))
            }
            className="w-full rounded-lg border px-3 py-2"
          />

        </div>

        <hr />

        <div className="flex justify-between text-xl font-bold">

          <span>Grand Total</span>

          <span className="text-blue-600">

            ${grandTotal.toFixed(2)}

          </span>

        </div>

      </div>

    </div>

  );

};

export default OrderSummary;