"use server";

import { createClient } from "@/supabase/database/server";
import { SignupPayload, LoginResponse } from "@/types/auth";

export async function signup(data: SignupPayload): Promise<LoginResponse> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signUp({
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
      message:
        "Account created! Check your email to verify your account, then sign in to complete workspace setup.",
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
