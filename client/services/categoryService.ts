import { Category, CategoryFormData } from "../types/category";

let categories: Category[] = [
  {
    id: crypto.randomUUID(),
    name: "Food",
    description: "Food products",
    color: "#16a34a",
    icon: "🍞",
    productCount: 35,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Drinks",
    description: "Beverages",
    color: "#2563eb",
    icon: "🥤",
    productCount: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Electronics",
    description: "Electronic items",
    color: "#7c3aed",
    icon: "💻",
    productCount: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class CategoryService {
  getAll() {
    return [...categories];
  }

  getById(id: string) {
    return categories.find((c) => c.id === id);
  }

  create(data: CategoryFormData) {
    const category: Category = {
      id: crypto.randomUUID(),
      ...data,
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    categories.push(category);

    return category;
  }

  update(id: string, data: CategoryFormData) {
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) return null;

    categories[index] = {
      ...categories[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return categories[index];
  }

  delete(id: string) {
    categories = categories.filter((c) => c.id !== id);
  }

  search(keyword: string) {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(keyword.toLowerCase())
    );
  }
}

export default new CategoryService();