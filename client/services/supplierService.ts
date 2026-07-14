import {
  Supplier,
  SupplierFormData,
} from "../types/supplier";

let suppliers: Supplier[] = [
  {
    id: crypto.randomUUID(),
    companyName: "ABC Foods Ltd",
    contactPerson: "John Smith",
    email: "sales@abcfoods.com",
    phone: "+1 555-1000",
    address: "123 Main Street",
    city: "New York",
    country: "USA",
    website: "https://abcfoods.com",
    taxNumber: "TIN100001",
    notes: "Main food supplier",
    status: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  {
    id: crypto.randomUUID(),
    companyName: "Fresh Dairy",
    contactPerson: "Mary Johnson",
    email: "contact@freshdairy.com",
    phone: "+1 555-2000",
    address: "45 Milk Road",
    city: "Chicago",
    country: "USA",
    website: "https://freshdairy.com",
    taxNumber: "TIN100002",
    notes: "Milk supplier",
    status: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  {
    id: crypto.randomUUID(),
    companyName: "Global Electronics",
    contactPerson: "David Wilson",
    email: "sales@globalelectronics.com",
    phone: "+1 555-3000",
    address: "88 Silicon Avenue",
    city: "San Francisco",
    country: "USA",
    website: "https://globalelectronics.com",
    taxNumber: "TIN100003",
    notes: "",
    status: "Inactive",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class SupplierService {
  getAll() {
    return [...suppliers];
  }

  getById(id: string) {
    return suppliers.find((supplier) => supplier.id === id);
  }

  create(data: SupplierFormData) {
    const supplier: Supplier = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    suppliers.push(supplier);

    return supplier;
  }

  update(id: string, data: SupplierFormData) {
    const index = suppliers.findIndex((s) => s.id === id);

    if (index === -1) return null;

    suppliers[index] = {
      ...suppliers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return suppliers[index];
  }

  delete(id: string) {
    suppliers = suppliers.filter((supplier) => supplier.id !== id);
  }

  search(keyword: string) {
    const search = keyword.toLowerCase();

    return suppliers.filter(
      (supplier) =>
        supplier.companyName.toLowerCase().includes(search) ||
        supplier.contactPerson.toLowerCase().includes(search) ||
        supplier.email.toLowerCase().includes(search)
    );
  }

  getActive() {
    return suppliers.filter(
      (supplier) => supplier.status === "Active"
    );
  }
}

export default new SupplierService();