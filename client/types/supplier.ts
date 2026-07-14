export type SupplierStatus = "Active" | "Inactive";

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  website: string;
  taxNumber: string;
  notes: string;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  website: string;
  taxNumber: string;
  notes: string;
  status: SupplierStatus;
}