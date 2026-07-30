import { Sale } from "../types/sale.types";

export const SALES_STORAGE_KEY = "sims-sales";

export const loadSales = (): Sale[] => {
  try {
    const stored = localStorage.getItem(SALES_STORAGE_KEY);
    if (!stored) return [];
    const sales = JSON.parse(stored) as Sale[];
    return Array.isArray(sales) ? sales : [];
  } catch {
    return [];
  }
};

export const saveSale = (sale: Sale) => {
  const sales = loadSales();
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify([sale, ...sales]));
};

export const findSaleById = (saleId: number) => loadSales().find((sale) => sale.id === saleId);

export const createReceiptNumber = (saleId: number) => `SIMS-${String(saleId).slice(-8)}`;
