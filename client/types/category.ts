export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}