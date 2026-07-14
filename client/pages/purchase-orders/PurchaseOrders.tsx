import PurchaseOrderTable from "../../components/purchase-orders/PurchaseOrderTable";

const PurchaseOrders = () => {
  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          Purchase Orders
        </h1>

        <p className="text-gray-500">
          Manage all supplier purchase orders.
        </p>

      </div>

      <PurchaseOrderTable />

    </div>
  );
};

export default PurchaseOrders;