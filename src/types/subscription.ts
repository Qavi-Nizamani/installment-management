export type PlanCode = "FREE" | "STARTER" | "PRO";

export type SubscriptionStatus = "active" | "past_due" | "canceled";

export interface Plan {
  id: string;
  code: PlanCode;
  active_plan_limit: number | null;
  price_pkr: number;
  billing_period: "monthly";
  created_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string | null;
  provider_subscription_id?: string | null;
  provider_customer_id?: string | null;
  provider_product_id?: string | null;
  provider_variant_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionWithPlan extends Subscription {
  plan?: Plan | null;
}
