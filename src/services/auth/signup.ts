"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
      message: "Account created successfully. Please check your email to verify your account.",
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function redirectAfterSignup() {
  redirect("/auth/login");
} 