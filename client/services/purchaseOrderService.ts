import {
  PurchaseOrder,
  PurchaseOrderFormData,
} from "../types/purchaseOrder";
import supplierService from "./supplierService";
import inventoryService from "./inventoryService";

let purchaseOrders: PurchaseOrder[] = [];

class PurchaseOrderService {
  getAll() {
    return [...purchaseOrders];
  }

  getById(id: string) {
    return purchaseOrders.find((order) => order.id === id);
  }

  isReceived(id: string) {
    const order = purchaseOrders.find((p) => p.id === id);
    return order?.status === "Received";
  }

  create(data: PurchaseOrderFormData) {
    const supplier = supplierService.getById(data.supplierId);
    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const grandTotal = subtotal + data.tax - data.discount;

    const order: PurchaseOrder = {
      id: crypto.randomUUID(),
      orderNumber: `PO-${Date.now()}`,
      supplierId: data.supplierId,
      supplierName: supplier?.companyName ?? "",
      orderDate: data.orderDate,
      expectedDate: data.expectedDate,
      status: data.status,
      items: data.items,
      subtotal,
      tax: data.tax,
      discount: data.discount,
      grandTotal,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    purchaseOrders.push(order);
    return order;
  }

  update(id: string, data: PurchaseOrderFormData) {
    const index = purchaseOrders.findIndex((order) => order.id === id);
    if (index === -1) return null;

    const supplier = supplierService.getById(data.supplierId);
    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const grandTotal = subtotal + data.tax - data.discount;

    const wasReceived = purchaseOrders[index].status === "Received";
    const becomingReceived = data.status === "Received";

    purchaseOrders[index] = {
      ...purchaseOrders[index],
      supplierId: data.supplierId,
      supplierName: supplier?.companyName ?? "",
      orderDate: data.orderDate,
      expectedDate: data.expectedDate,
      status: data.status,
      items: data.items,
      tax: data.tax,
      discount: data.discount,
      notes: data.notes,
      subtotal,
      grandTotal,
      updatedAt: new Date().toISOString(),
    };

    if (!wasReceived && becomingReceived) {
      inventoryService.receivePurchaseOrder({
        orderNumber: purchaseOrders[index].orderNumber,
        items: purchaseOrders[index].items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
    }

    return purchaseOrders[index];
  }

  delete(id: string) {
    purchaseOrders = purchaseOrders.filter((order) => order.id !== id);
  }

  search(keyword: string) {
    const text = keyword.toLowerCase();
    return purchaseOrders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(text) ||
        order.supplierName.toLowerCase().includes(text)
    );
  }

  getByStatus(status: string) {
    return purchaseOrders.filter((order) => order.status === status);
  }
}

export default new PurchaseOrderService();