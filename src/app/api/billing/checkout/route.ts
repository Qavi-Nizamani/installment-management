import { NextResponse } from "next/server";
import { createClient } from "@/supabase/database/server";
import { getTenantContextSummary } from "@/services/tenant/tenant-context.service";
import {
  createCheckout,
  getStoreId,
  resolveVariantId,
} from "@/services/billing/lemon-squeezy";
import type { PlanCode } from "@/types/subscription";

const allowedPlans: PlanCode[] = ["STARTER", "PRO"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const planCode = body?.planCode as PlanCode | undefined;

    if (!planCode || !allowedPlans.includes(planCode)) {
      return NextResponse.json(
        { error: "Invalid plan selection." },
        { status: 400 }
      );
    }

    const tenantContext = await getTenantContextSummary();
    if (!tenantContext.success || !tenantContext.data) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (tenantContext.data.member.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only owners can upgrade subscriptions." },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    const variantId = await resolveVariantId(planCode);
    const storeId = getStoreId();
    const redirectUrl = `${new URL(request.url).origin}/dashboard/settings/subscription?checkout=success&plan_code=${encodeURIComponent(
      planCode
    )}`;

    const checkout = await createCheckout({
      storeId,
      variantId,
      redirectUrl,
      email: userData.user?.email,
      name: userData.user?.user_metadata?.name,
      customData: {
        tenant_id: tenantContext.data.tenant.id,
        plan_code: planCode,
        user_id: userData.user?.id,
      },
    });

    return NextResponse.json({ url: checkout.data.attributes.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
