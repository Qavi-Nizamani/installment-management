import { z } from "zod";

// Login Types
export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginPayload = z.infer<typeof LoginSchema>;

export interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Signup Types (for future use)
export const SignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignupPayload = z.infer<typeof SignupSchema>;

// Forgot Password Types (for future use)
export const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordPayload = z.infer<typeof ForgotPasswordSchema>; 