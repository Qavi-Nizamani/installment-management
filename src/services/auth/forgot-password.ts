"use server";

import { createClient } from "@/supabase/database/server";
import { ForgotPasswordPayload, LoginResponse } from "@/types/auth";

export async function forgotPassword(data: ForgotPasswordPayload): Promise<LoginResponse> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Password reset email sent successfully. Please check your inbox.",
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
} 