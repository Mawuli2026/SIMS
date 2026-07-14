import {
  InventoryItem,
  StockMovement,
  StockAdjustmentData,
} from "../types/inventory";

let inventory: InventoryItem[] = [];
let movements: StockMovement[] = [];

class InventoryService {
  getAll() {
    return [...inventory];
  }

  getById(id: string) {
    return inventory.find((item) => item.id === id);
  }

  search(keyword: string) {
    const text = keyword.toLowerCase();
    return inventory.filter(
      (item) =>
        item.productName.toLowerCase().includes(text) ||
        item.sku.toLowerCase().includes(text)
    );
  }

  create(item: InventoryItem) {
    inventory.push(item);
    return item;
  }

  update(item: InventoryItem) {
    const index = inventory.findIndex((i) => i.id === item.id);
    if (index === -1) return;

    inventory[index] = {
      ...item,
      updatedAt: new Date().toISOString(),
    };
  }

  remove(id: string) {
    inventory = inventory.filter((item) => item.id !== id);
  }

  stockIn(productId: string, quantity: number, reference = "") {
    const item = inventory.find((i) => i.productId === productId);
    if (!item) return;

    const previous = item.quantity;
    item.quantity += quantity;
    item.inventoryValue = item.quantity * item.costPrice;
    item.updatedAt = new Date().toISOString();

    movements.unshift({
      id: crypto.randomUUID(),
      productId: item.productId,
      productName: item.productName,
      type: "Stock In",
      quantity,
      previousStock: previous,
      newStock: item.quantity,
      reference,
      createdAt: new Date().toISOString(),
    });
  }

  stockOut(productId: string, quantity: number, reference = "") {
    const item = inventory.find((i) => i.productId === productId);
    if (!item) return;

    const previous = item.quantity;
    item.quantity = Math.max(0, item.quantity - quantity);
    item.inventoryValue = item.quantity * item.costPrice;
    item.updatedAt = new Date().toISOString();

    movements.unshift({
      id: crypto.randomUUID(),
      productId: item.productId,
      productName: item.productName,
      type: "Stock Out",
      quantity,
      previousStock: previous,
      newStock: item.quantity,
      reference,
      createdAt: new Date().toISOString(),
    });
  }

  adjustStock(data: StockAdjustmentData) {
    const item = inventory.find((i) => i.productId === data.productId);
    if (!item) return;

    const previous = item.quantity;
    item.quantity = data.quantity;
    item.inventoryValue = item.quantity * item.costPrice;

    movements.unshift({
      id: crypto.randomUUID(),
      productId: item.productId,
      productName: item.productName,
      type: "Adjustment",
      quantity: data.quantity,
      previousStock: previous,
      newStock: item.quantity,
      notes: data.notes,
      reference: data.reason,
      createdAt: new Date().toISOString(),
    });
  }

  receivePurchaseOrder(order: {
    orderNumber: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  }) {
    order.items.forEach((purchaseItem) => {
      const item = inventory.find((i) => i.productId === purchaseItem.productId);
      if (!item) return;

      const previous = item.quantity;
      item.quantity += purchaseItem.quantity;
      item.inventoryValue = item.quantity * item.costPrice;
      item.updatedAt = new Date().toISOString();

      movements.unshift({
        id: crypto.randomUUID(),
        productId: item.productId,
        productName: item.productName,
        type: "Purchase",
        quantity: purchaseItem.quantity,
        previousStock: previous,
        newStock: item.quantity,
        reference: order.orderNumber,
        createdAt: new Date().toISOString(),
      });
    });
  }

  completeSale(sale: {
    saleNumber: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  }) {
    for (const saleItem of sale.items) {
      const item = inventory.find(
        i => i.productId === saleItem.productId
      );

      if (!item) {
        throw new Error(
          `Inventory record not found for product ${saleItem.productId}`
        );
      }

      if (item.quantity < saleItem.quantity) {
        throw new Error(
          `${item.productName} has only ${item.quantity} units remaining.`
        );
      }

      const previousStock = item.quantity;

      item.quantity -= saleItem.quantity;

      item.inventoryValue =
        item.quantity * item.costPrice;

      item.updatedAt =
        new Date().toISOString();

      movements.unshift({
        id: crypto.randomUUID(),
        productId: item.productId,
        productName: item.productName,
        type: "Sale",
        quantity: saleItem.quantity,
        previousStock,
        newStock: item.quantity,
        reference: sale.saleNumber,
        createdAt: new Date().toISOString(),
      });
    }
  }

  getMovements() {
    return [...movements];
  }

  getLowStock() {
    return inventory.filter((item) => item.quantity <= item.reorderLevel);
  }

  getInventoryValue() {
    return inventory.reduce((sum, item) => sum + item.inventoryValue, 0);
  }

  totalProducts() {
    return inventory.length;
  }

  totalQuantity() {
    return inventory.reduce((sum, item) => sum + item.quantity, 0);
  }

  createFromProduct(product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    supplier: string;
    costPrice: number;
    sellingPrice: number;
    quantity?: number;
    reorderLevel?: number;
  }) {
    const exists = inventory.find((item) => item.productId === product.id);
    if (exists) return exists;

    const qty = product.quantity ?? 0;
    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      supplier: product.supplier,
      quantity: qty,
      minimumStock: 0,
      maximumStock: 1000,
      reorderLevel: product.reorderLevel ?? 10,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      inventoryValue: qty * product.costPrice,
      updatedAt: new Date().toISOString(),
    };

    inventory.push(newItem);
    return newItem;
  }
}

export default new InventoryService();