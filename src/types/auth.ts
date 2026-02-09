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
  errorCode?: string;
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

// Forgot Password Types
export const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordPayload = z.infer<typeof ForgotPasswordSchema>;

// Reset Password (set new password after recovery link)
export const ResetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordPayload = z.infer<typeof ResetPasswordSchema>; 

// Email Verification Types
export const EmailVerifySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type EmailVerifyPayload = z.infer<typeof EmailVerifySchema>;