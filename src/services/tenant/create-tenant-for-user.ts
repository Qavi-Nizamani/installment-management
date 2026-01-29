import type { createClient } from "@/supabase/database/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const DEFAULT_WORKSPACE_NAME = "My Workspace";

const SAMPLE_CUSTOMERS = [
  { name: "Alice Johnson", phone: "+1 (555) 123-4567", address: "123 Main St, New York, NY", national_id: "123-45-6789" },
  { name: "Bob Smith", phone: "+1 (555) 987-6543", address: "456 Oak Ave, Los Angeles, CA", national_id: "987-65-4321" },
  { name: "Carol Davis", phone: "+1 (555) 456-7890", address: "789 Pine St, Chicago, IL", national_id: "456-78-9012" },
  { name: "David Wilson", phone: "+1 (555) 321-0987", address: "321 Elm St, Houston, TX", national_id: "321-09-8765" },
] as const;

export interface CreateTenantForUserResult {
  success: boolean;
  tenantId?: string;
  error?: string;
}

/**
 * Creates a tenant, member (OWNER), and sample customers for a user.
 * Uses the provided Supabase client (must have the user's session for RLS).
 */
export async function createTenantForUser(
  supabase: SupabaseClient,
  userId: string,
  workspaceName?: string,
): Promise<CreateTenantForUserResult> {
  const name = workspaceName?.trim() || DEFAULT_WORKSPACE_NAME;

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({ name })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    console.error("Tenant creation error:", tenantError);
    return { success: false, error: "Failed to create workspace. Please try again." };
  }

  const { error: memberError } = await supabase.from("members").insert({
    user_id: userId,
    tenant_id: tenant.id,
    role: "OWNER",
  });

  if (memberError) {
    console.error("Member creation error:", memberError);
    await supabase.from("tenants").delete().eq("id", tenant.id);
    return { success: false, error: "Failed to set up workspace membership. Please try again." };
  }

  const rows = SAMPLE_CUSTOMERS.map((c) => ({
    tenant_id: tenant.id,
    name: c.name,
    phone: c.phone,
    address: c.address,
    national_id: c.national_id,
  }));
  const { error: customersError } = await supabase.from("customers").insert(rows);
  if (customersError) {
    console.error("Sample customers creation error:", customersError);
  }

  return { success: true, tenantId: tenant.id };
}
