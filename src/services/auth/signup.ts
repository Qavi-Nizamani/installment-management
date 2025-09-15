"use server";

import { cookies } from "next/headers";
import { createClient } from "@/supabase/database/server";
import { SignupPayload, LoginResponse } from "@/types/auth";

export async function signup(data: SignupPayload): Promise<LoginResponse> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

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
      message: "Account created successfully! Please complete your workspace setup.",
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
