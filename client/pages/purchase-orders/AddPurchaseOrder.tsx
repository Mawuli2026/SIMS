import { useNavigate } from "react-router-dom";

import PurchaseOrderForm from "../../components/purchase-orders/PurchaseOrderForm";
import purchaseOrderService from "../../services/purchaseOrderService";
import { PurchaseOrderFormData } from "../../types/purchaseOrder";
import supplierService from "../../services/supplierService";

const AddPurchaseOrder = () => {
  const navigate = useNavigate();

  const suppliers = supplierService.getActive();

  const initialData: PurchaseOrderFormData = {
    supplierId: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDate: "",
    status: "Draft",
    items: [],
    tax: 0,
    discount: 0,
    notes: "",
  };

  const handleSubmit = (data: PurchaseOrderFormData) => {

    const supplier = suppliers.find(
      (s) => s.id === data.supplierId
    );

    purchaseOrderService.create({
      ...data,
      supplierId: supplier?.id ?? "",
    });

    navigate("/purchase-orders");
  };

  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          New Purchase Order
        </h1>

        <p className="text-gray-500">
          Create a new purchase order.
        </p>

      </div>

      <PurchaseOrderForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Create Purchase Order"
      />

    </div>
  );
};

export default AddPurchaseOrder;