import { createClient } from "@/supabase/database/server";
import { createTenantForUser } from "@/services/tenant/create-tenant-for-user";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_OTP_TYPES = [
  "email",
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
] as const;

function redirectToError(request: NextRequest, message: string) {
  return NextResponse.redirect(
    new URL(`/auth/error?error=${encodeURIComponent(message)}`, request.url),
  );
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const token_hash = sp.get("token_hash");
  const type = sp.get("type");
  const next = sp.get("next");
  const redirectTo = next?.startsWith("/") ? next : "/dashboard";

  if (!token_hash || !type) {
    return redirectToError(
      request,
      "Missing verification link parameters. Please use the link from your email.",
    );
  }

  if (!EMAIL_OTP_TYPES.includes(type as (typeof EMAIL_OTP_TYPES)[number])) {
    return redirectToError(request, "Invalid verification type.");
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
    return redirectToError(request, error.message);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return redirectToError(request, "Could not load your account. Please try again.");
  }

  const { data: existingMember } = await supabase
    .from("members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingMember) {
    const result = await createTenantForUser(supabase, user.id);
    if (!result.success) {
      return redirectToError(request, result.error ?? "Could not create your workspace. Please try again.");
    }
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
