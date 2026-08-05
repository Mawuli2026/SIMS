import { z } from "zod";
import { AUDIT_ACTIONS } from "../types/audit.types";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email address is required.").email("Email address must be valid."),
  password: z.string().min(1, "Password is required."),
});

export const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100, "First name must not exceed 100 characters."),
  lastName: z.string().trim().min(1, "Last name is required.").max(100, "Last name must not exceed 100 characters."),
  email: z.string().trim().min(1, "Email address is required.").email("Email address must be valid.").max(150, "Email address must not exceed 150 characters."),
  role: z.enum(["Manager", "Cashier"], { message: "Employee role must be Manager or Cashier." }),
  password: z.string().min(12, "Temporary password must be at least 12 characters.").max(128, "Temporary password must not exceed 128 characters."),
  confirmPassword: z.string().min(1, "Confirm password is required."),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const employeeQuerySchema = z.object({
  q: z.string().trim().max(100, "Employee search must not exceed 100 characters.").optional(),
  role: z.enum(["SystemAdmin", "Manager", "Cashier"], { message: "Employee role filter is invalid." }).optional(),
  status: z.enum(["Active", "Disabled"], { message: "Employee status filter is invalid." }).optional(),
});

export const employeeStatusSchema = z.object({
  status: z.enum(["Active", "Disabled"], { message: "Employee status must be Active or Disabled." }),
});

export const employeeRoleSchema = z.object({
  role: z.enum(["Manager", "Cashier"], { message: "Employee role must be Manager or Cashier." }),
});

export const employeePasswordSchema = z.object({
  password: z.string().min(12, "Temporary password must be at least 12 characters.").max(128, "Temporary password must not exceed 128 characters."),
  confirmPassword: z.string().min(1, "Confirm password is required."),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email address is required.").email("Email address must be valid.").max(150, "Email address must not exceed 150 characters."),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().trim().min(1, "Password reset token is required.").max(256, "Password reset token is invalid."),
  password: z.string().min(1, "Password is required.").min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm password is required."),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(12, "New password must be at least 12 characters.").max(128, "New password must not exceed 128 characters."),
  confirmPassword: z.string().min(1, "Confirm password is required."),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const inventoryNumber = (label: string) => z.number({ message: `${label} must be a number.` })
  .finite(`${label} must be a valid number.`)
  .nonnegative(`${label} cannot be negative.`);

const moneyNumber = (label: string) => inventoryNumber(label)
  .max(9_999_999_999.99, `${label} is too large.`)
  .multipleOf(0.01, `${label} must have no more than two decimal places.`);

const stockNumber = (label: string) => inventoryNumber(label)
  .int(`${label} must be a whole number.`)
  .max(2_147_483_647, `${label} is too large.`);

export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required.").max(150, "Product name must not exceed 150 characters."),
  category: z.string().trim().min(1, "Category is required.").max(100, "Category must not exceed 100 characters."),
  costPrice: moneyNumber("Cost price"),
  sellingPrice: moneyNumber("Selling price").positive("Selling price must be greater than zero."),
  quantityInStock: stockNumber("Quantity in stock"),
  reorderLevel: stockNumber("Reorder level"),
});

export const productStatusSchema = z.object({
  status: z.enum(["Active", "Inactive"], { message: "Status must be Active or Inactive." }),
});

export const createSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.number({ message: "Product ID must be a number." })
      .int("Product ID must be a whole number.")
      .positive("Product ID must be a positive integer."),
    quantity: z.number({ message: "Quantity must be a number." })
      .int("Quantity must be a whole number.")
      .positive("Quantity must be at least 1.")
      .max(2_147_483_647, "Quantity is too large."),
  })).min(1, "Add at least one product before completing the sale.")
    .max(100, "A sale cannot contain more than 100 different products."),
}).superRefine((values, context) => {
  const productIds = values.items.map((item) => item.productId);
  if (new Set(productIds).size !== productIds.length) {
    context.addIssue({ code: "custom", message: "Each product may appear only once in a sale.", path: ["items"] });
  }
});

const reportDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Report dates must use YYYY-MM-DD format.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Report date must be valid.");

export const reportQuerySchema = z.object({
  fromDate: reportDate.optional(),
  toDate: reportDate.optional(),
}).superRefine((values, context) => {
  if (values.fromDate && values.toDate && values.fromDate > values.toDate) {
    context.addIssue({
      code: "custom",
      message: "The start date must not be later than the end date.",
      path: ["fromDate"],
    });
  }
});

export const auditQuerySchema = z.object({
  q: z.string().trim().max(100, "Audit search must not exceed 100 characters.").optional(),
  action: z.enum(AUDIT_ACTIONS, { message: "Audit action filter is invalid." }).optional(),
  outcome: z.enum(["success", "failure"], { message: "Audit outcome must be success or failure." }).optional(),
  fromDate: reportDate.optional(),
  toDate: reportDate.optional(),
}).superRefine((values, context) => {
  if (values.fromDate && values.toDate && values.fromDate > values.toDate) {
    context.addIssue({
      code: "custom",
      message: "The start date must not be later than the end date.",
      path: ["fromDate"],
    });
  }
});

export const firstValidationError = (error: z.ZodError) => error.issues[0]?.message ?? "Invalid request data.";
