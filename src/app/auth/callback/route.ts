import { createClient } from "@/supabase/database/server";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_OTP_TYPES = [
  "email",
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");
  const redirectTo = next?.startsWith("/") ? next : "/dashboard";

  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL(
        `/auth/error?error=${encodeURIComponent("Missing verification link parameters. Please use the link from your email.")}`,
        request.url,
      ),
    );
  }

  if (!EMAIL_OTP_TYPES.includes(type as (typeof EMAIL_OTP_TYPES)[number])) {
    return NextResponse.redirect(
      new URL(
        `/auth/error?error=${encodeURIComponent("Invalid verification type.")}`,
        request.url,
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as
      | "email"
      | "signup"
      | "magiclink"
      | "recovery"
      | "invite"
      | "email_change",
  });

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/error?error=${encodeURIComponent(error.message)}`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
