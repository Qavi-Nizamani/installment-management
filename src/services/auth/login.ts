"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/database/server";
import { LoginPayload, LoginResponse } from "@/types/auth";

export async function login(data: LoginPayload): Promise<LoginResponse> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

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

export async function redirectAfterLogin() {
  redirect("/dashboard");
} 