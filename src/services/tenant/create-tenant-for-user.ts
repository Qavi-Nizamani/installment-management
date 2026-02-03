"use server";

import type { createClient } from "@/supabase/database/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const DEFAULT_WORKSPACE_NAME = "My Workspace";

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
  workspaceName?: string,
): Promise<CreateTenantForUserResult> {
  const name = workspaceName?.trim() || DEFAULT_WORKSPACE_NAME;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "You must be logged in to create a workspace.",
    };
  }

  const { data: tenant, error: tenantError } = await supabase
    .rpc("create_tenant", {
      p_name: name,
    })
    .select("id")
    .maybeSingle();

  if (tenantError || !tenant) {
    return {
      success: false,
      error: "Failed to create workspace. Please try again.",
    };
  }

  return { success: true, tenantId: tenant.id };
}
