"use server";

import { createClient } from "@/supabase/database/server";
import { EmailVerifyPayload, LoginResponse } from "@/types/auth";

export async function resendVerificationEmail(
  data: EmailVerifyPayload
): Promise<LoginResponse> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: data.email,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Verification email sent. Please check your inbox.",
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
