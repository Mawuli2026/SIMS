import { useState } from "react";

import ProductSearch from "../../components/sales/ProductSearch";
import ShoppingCart from "../../components/sales/ShoppingCart";
import OrderSummary from "../../components/sales/OrderSummary";
import CustomerSelector from "../../components/sales/CustomerSelector";
import PaymentPanel from "../../components/sales/PaymentPanel";

import { SaleItem } from "../../types/sale";

const Sales = () => {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("Walk-in Customer");

  const [summary, setSummary] = useState({
    subtotal: 0,
    tax: 0,
    discount: 0,
    grandTotal: 0,
    totalItems: 0,
    totalQuantity: 0,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <p className="text-gray-500">Create a new sale</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          <ProductSearch cart={cart} setCart={setCart} />
          <ShoppingCart cart={cart} setCart={setCart} />
        </div>

        <div className="col-span-4 space-y-6">
          <CustomerSelector
            customerId={customerId}
            customerName={customerName}
            setCustomerId={setCustomerId}
            setCustomerName={setCustomerName}
          />
          <OrderSummary cart={cart} onSummaryChange={setSummary} />
          <PaymentPanel
            cart={cart}
            customerId={customerId}
            customerName={customerName}
            summary={summary}
          />
        </div>
      </div>
    </div>
  );
};

export default Sales;