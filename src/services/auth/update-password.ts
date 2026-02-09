"use client";

import { createClient } from "@/supabase/database/client";
import { ResetPasswordPayload, LoginResponse } from "@/types/auth";

export async function updatePassword(
  data: ResetPasswordPayload
): Promise<LoginResponse> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.updateUser({
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
      message: "Password updated successfully. You can now sign in.",
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
