import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/supabase/database/admin";
import { getPlanCodeFromProductId } from "@/services/billing/lemon-squeezy";
import type { PlanCode, SubscriptionStatus } from "@/types/subscription";

const relevantEvents = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_payment_success",
  "subscription_payment_failed",
  "subscription_payment_recovered",
  "subscription_payment_refunded",
]);

const mapStatus = (status?: string): SubscriptionStatus => {
  switch (status) {
    case "active":
    case "on_trial":
    case "paused":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "cancelled":
    case "expired":
      return "canceled";
    default:
      return "active";
  }
};

const verifySignature = (payload: string, signature: string, secret: string) => {
  const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const digestBuffer = Buffer.from(digest, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
};

export async function POST(request: Request) {
  const secret = process.env.LEMON_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "LEMON_WEBHOOK_SECRET is not set." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("x-signature") || "";
  const rawBody = await request.text();

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventName = payload?.meta?.event_name as string | undefined;
  if (!eventName || !relevantEvents.has(eventName)) {
    return NextResponse.json({ received: true });
  }

  const subscriptionData = payload?.data;
  const attributes = subscriptionData?.attributes || {};
  const customData = payload?.meta?.custom_data || {};
  const providerSubscriptionId = subscriptionData?.id?.toString();

  const admin = createAdminClient();

  let tenantId = customData?.tenant_id?.toString();
  let planCode: PlanCode | null = customData?.plan_code || null;

  if (!planCode) {
    planCode = getPlanCodeFromProductId(attributes.product_id);
  }

  if (!tenantId && providerSubscriptionId) {
    const { data } = await admin
      .from("subscriptions")
      .select("tenant_id")
      .eq("provider_subscription_id", providerSubscriptionId)
      .maybeSingle();

    tenantId = data?.tenant_id || null;
  }

  if (!tenantId) {
    return NextResponse.json({ received: true });
  }

  let planId: string | null = null;
  if (planCode) {
    const { data: plan } = await admin
      .from("plans")
      .select("id")
      .eq("code", planCode)
      .single();
    planId = plan?.id || null;
  }

  const updatePayload: Record<string, unknown> = {
    status: mapStatus(attributes.status),
    current_period_start: attributes.created_at || null,
    current_period_end: attributes.renews_at || attributes.ends_at || null,
    provider_subscription_id: providerSubscriptionId || null,
    provider_customer_id: attributes.customer_id?.toString() || null,
    provider_product_id: attributes.product_id?.toString() || null,
    provider_variant_id: attributes.variant_id?.toString() || null,
  };

  if (planId) {
    updatePayload.plan_id = planId;
  }

  const { error } = await admin
    .from("subscriptions")
    .update(updatePayload)
    .eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
