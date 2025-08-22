
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
      return {
        success: false,
        error: error.message,
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