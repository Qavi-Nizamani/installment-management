
import { createClient } from "@/supabase/database/client";
import { LoginPayload, LoginResponse } from "@/types/auth";

export async function login(data: LoginPayload): Promise<LoginResponse> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      const message = error.message;
      const normalized = message.toLowerCase();
      const isEmailUnconfirmed =
        normalized.includes("email not confirmed") ||
        normalized.includes("confirm your email") ||
        normalized.includes("confirm your account");

      return {
        success: false,
        error: message,
        errorCode: isEmailUnconfirmed ? "email_not_confirmed" : undefined,
      };
    }

    return {
      success: true,
      message: "Successfully logged in",
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}