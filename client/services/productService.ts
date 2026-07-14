import { Product, ProductFormData } from "../types/product";
import inventoryService from "./inventoryService";

let products: Product[] = [
  {
    id: crypto.randomUUID(),
    barcode: "100001",
    sku: "MILK-001",
    name: "Milk",
    description: "Fresh whole milk",
    category: "Dairy",
    brand: "Farm Fresh",
    costPrice: 1.2,
    sellingPrice: 1.8,
    quantity: 25,
    reorderLevel: 10,
    image: "",
    status: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  {
    id: crypto.randomUUID(),
    barcode: "100002",
    sku: "SUGAR-001",
    name: "Sugar",
    description: "White sugar",
    category: "Food",
    brand: "Premium",
    costPrice: 2,
    sellingPrice: 3,
    quantity: 8,
    reorderLevel: 15,
    image: "",
    status: "Low Stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  {
    id: crypto.randomUUID(),
    barcode: "100003",
    sku: "RICE-001",
    name: "Rice",
    description: "Basmati Rice",
    category: "Food",
    brand: "Royal",
    costPrice: 12,
    sellingPrice: 16,
    quantity: 55,
    reorderLevel: 20,
    image: "",
    status: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const calculateStatus = (
  quantity: number,
  reorderLevel: number
): Product["status"] => {
  if (quantity <= 0) return "Out of Stock";
  if (quantity <= reorderLevel) return "Low Stock";
  return "Active";
};

class ProductService {
  getAll() {
    return [...products];
  }

  getById(id: string) {
    return products.find((p) => p.id === id);
  }

  create(data: ProductFormData) {
    const product: Product = {
      id: crypto.randomUUID(),
      barcode: data.barcode,
      sku: data.sku,
      name: data.name,
      description: data.description,
      category: data.category,
      brand: data.brand,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      quantity: data.quantity,
      reorderLevel: data.reorderLevel,
      image: "",
      status: calculateStatus(
        data.quantity,
        data.reorderLevel
      ),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.push(product);

    // Create inventory record for the new product
    inventoryService.createFromProduct({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      supplier: data.supplier,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      reorderLevel: product.reorderLevel,
    });

    return product;
  }

  update(id: string, data: ProductFormData) {
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) return null;

    const product = products[index];

    products[index] = {
      ...product,
      ...data,
      image: product.image,
      status: calculateStatus(
        data.quantity,
        data.reorderLevel
      ),
      updatedAt: new Date().toISOString(),
    };

    // Update inventory record when product is updated
    const item =
      inventoryService
        .getAll()
        .find(i => i.productId === product.id);

    if (item) {
      inventoryService.update({
        ...item,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        supplier: data.supplier,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        inventoryValue:
          item.quantity * product.costPrice,
      });
    }

    return products[index];
  }

  delete(id: string) {
    // Remove inventory record when product is deleted
    const inventory =
      inventoryService.getAll();

    const record = inventory.find(
      i => i.productId === id
    );

    if (record) {
      inventoryService.remove(record.id);
    }

    products = products.filter((p) => p.id !== id);
  }

  search(keyword: string) {
    const query = keyword.toLowerCase();

    return products.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query) ||
      product.barcode.toLowerCase().includes(query)
    );
  }

  filter(category: string) {
    if (category === "All") return products;

    return products.filter(
      (product) => product.category === category
    );
  }

  getLowStock() {
    return products.filter(
      (product) =>
        product.quantity <= product.reorderLevel
    );
  }

  updateStock(id: string, quantity: number) {
    const product = products.find((p) => p.id === id);

    if (!product) return null;

    product.quantity = quantity;

    product.status = calculateStatus(
      quantity,
      product.reorderLevel
    );

    product.updatedAt = new Date().toISOString();

    return product;
  }
}

export default new ProductService();