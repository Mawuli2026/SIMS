import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100, "First name must not exceed 100 characters."),
  lastName: z.string().trim().min(1, "Last name is required.").max(100, "Last name must not exceed 100 characters."),
  email: z.string().trim().min(1, "Email address is required.").email("Email address must be valid.").max(150, "Email address must not exceed 150 characters."),
  role: z.enum(["Admin", "Cashier"], { message: "Role must be Admin or Cashier." }),
  password: z.string().min(1, "Password is required.").min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm password is required."),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const firstValidationError = (error: z.ZodError) => error.issues[0]?.message ?? "Invalid request data.";
