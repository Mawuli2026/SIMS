import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PurchaseOrderForm from "../../components/purchase-orders/PurchaseOrderForm";
import purchaseOrderService from "../../services/purchaseOrderService";
import { PurchaseOrderFormData } from "../../types/purchaseOrder";

const EditPurchaseOrder = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [formData, setFormData] =
    useState<PurchaseOrderFormData | null>(null);

  useEffect(() => {

    if (!id) return;

    const order =
      purchaseOrderService.getById(id);

    if (!order) {
      navigate("/purchase-orders");
      return;
    }

    setFormData({
      supplierId: order.supplierId,
      orderDate: order.orderDate,
      expectedDate: order.expectedDate,
      status: order.status,
      items: order.items,
      tax: order.tax,
      discount: order.discount,
      notes: order.notes,
    });

    setLoading(false);

  }, [id, navigate]);

  const handleSubmit = (
    data: PurchaseOrderFormData
  ) => {

    if (!id) return;

    purchaseOrderService.update(id, data);

    navigate("/purchase-orders");

  };

  if (loading || !formData) {

    return (
      <div className="flex justify-center py-20">

        <div className="text-lg">
          Loading Purchase Order...
        </div>

      </div>
    );

  }

  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          Edit Purchase Order
        </h1>

        <p className="text-gray-500">
          Update purchase order information.
        </p>

      </div>

      <PurchaseOrderForm
        initialData={formData}
        onSubmit={handleSubmit}
        submitLabel="Update Purchase Order"
      />

    </div>

  );
};

export default EditPurchaseOrder;