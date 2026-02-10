import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/supabase/database/admin";
import { getPlanCodeFromProductId } from "@/services/billing/lemon-squeezy";
import type { PlanCode, SubscriptionStatus } from "@/types/subscription";

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string | number;
    attributes?: {
      status?: string;
      product_id?: string | number;
      customer_id?: string | number;
      variant_id?: string | number;
      created_at?: string;
      renews_at?: string | null;
      ends_at?: string | null;
      updated_at?: string;
    } & Record<string, unknown>;
  };
};

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
    case "on_trial":
      return "trialing";
    case "active":
    case "paused":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "cancelled":
      return "canceled";
    case "expired":
      return "expired";
    default:
      return "active";
  }
};

const verifySignature = (
  payload: string,
  signature: string,
  secret: string,
) => {
  const digest = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
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
      { status: 500 },
    );
  }

  const signature = request.headers.get("x-signature") || "";
  const rawBody = await request.text();

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const eventName = payload?.meta?.event_name;
  if (!eventName || !relevantEvents.has(eventName)) {
    return NextResponse.json({ received: true });
  }

  const subscriptionData = payload?.data;
  const attributes = subscriptionData?.attributes || {};
  const customData = (payload?.meta?.custom_data || {}) as {
    tenant_id?: string | number;
    plan_code?: PlanCode;
  };
  const providerSubscriptionId = subscriptionData?.id?.toString();

  const providerResourceId = providerSubscriptionId;
  const syntheticEventIdParts = [
    eventName || "unknown",
    providerResourceId || "no-resource-id",
    attributes.updated_at ||
      attributes.renews_at ||
      attributes.created_at ||
      new Date().toISOString(),
  ];
  const webhookEventId = syntheticEventIdParts.join(":");

  const admin = createAdminClient();

  // Idempotency: log the webhook event and short-circuit if we've seen it before
  const { error: webhookEventError } = await admin
    .from("billing_webhook_events")
    .insert({
      id: webhookEventId,
      event_type: eventName,
    });

  // 23505 = unique_violation (duplicate primary key)
  if (webhookEventError?.code === "23505") {
    return NextResponse.json({ received: true });
  }

  if (webhookEventError) {
    return NextResponse.json(
      { error: webhookEventError.message },
      { status: 500 },
    );
  }

  let tenantId = customData.tenant_id?.toString();
  let planCode: PlanCode | null = customData.plan_code ?? null;

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
    provider: "LEMON_SQUEEZY",
    status: mapStatus(attributes.status),
    current_period_start: attributes.created_at || null,
    current_period_end: attributes.renews_at || attributes.ends_at || null,
    provider_subscription_id: providerSubscriptionId || null,
    provider_customer_id: attributes.customer_id?.toString() || null,
    provider_product_id: attributes.product_id?.toString() || null,
    provider_variant_id: attributes.variant_id?.toString() || null,
  };

  // Clear lifecycle timestamps when subscription becomes active again
  const mappedStatus = mapStatus(attributes.status);
  const isActiveAgain =
    eventName === "subscription_resumed" ||
    eventName === "subscription_unpaused" ||
    (eventName === "subscription_created" &&
      ["active", "trialing", "past_due"].includes(mappedStatus)) ||
    (eventName === "subscription_updated" &&
      ["active", "trialing", "past_due"].includes(mappedStatus));

  if (isActiveAgain) {
    updatePayload.canceled_at = null;
    updatePayload.expired_at = null;
  }

  // Lifecycle timestamps for cancellations and expirations
  if (eventName === "subscription_cancelled") {
    updatePayload.canceled_at = attributes.ends_at || new Date().toISOString();
  }

  if (eventName === "subscription_expired") {
    updatePayload.expired_at = attributes.ends_at || new Date().toISOString();
  }

  if (planId) {
    updatePayload.plan_id = planId;
  }

  // First try to update an existing subscription for this tenant
  const { data: updatedRows, error: updateError } = await admin
    .from("subscriptions")
    .update(updatePayload)
    .eq("tenant_id", tenantId)
    .select("id");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If no existing row was updated, insert a new subscription record
  if (
    !updatedRows ||
    (Array.isArray(updatedRows) && updatedRows.length === 0)
  ) {
    const insertPayload: Record<string, unknown> = {
      tenant_id: tenantId,
      provider: "LEMON_SQUEEZY",
      status: updatePayload.status,
      current_period_start: updatePayload.current_period_start,
      current_period_end: updatePayload.current_period_end,
      provider_subscription_id: updatePayload.provider_subscription_id,
      provider_customer_id: updatePayload.provider_customer_id,
      provider_product_id: updatePayload.provider_product_id,
      provider_variant_id: updatePayload.provider_variant_id,
    };

    if (planId) {
      insertPayload.plan_id = planId;
    }

    const { error: insertError } = await admin
      .from("subscriptions")
      .insert(insertPayload);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
