import { createClient } from "@/supabase/database/client";
import { LoginResponse } from "@/types/auth";

export async function logout(): Promise<LoginResponse> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Successfully logged out",
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}