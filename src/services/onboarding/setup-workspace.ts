"use server";

import { createClient } from "@/supabase/database/server";
import { createTenantForUser } from "@/services/tenant/create-tenant-for-user";

export interface WorkspaceSetupPayload {
  workspaceName: string;
}

export interface WorkspaceSetupResponse {
  success: boolean;
  message?: string;
  error?: string;
  tenantId?: string;
}

export async function setupWorkspace(data: WorkspaceSetupPayload): Promise<WorkspaceSetupResponse> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "You must be logged in to create a workspace." };
    }

    const { data: existingMember } = await supabase
      .from("members")
      .select("tenant_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      return {
        success: false,
        error: "You already have a workspace. Please contact support if you need help.",
      };
    }

    const result = await createTenantForUser(supabase, user.id, data.workspaceName);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      message: "Workspace created successfully! Welcome to your dashboard.",
      tenantId: result.tenantId,
    };
  } catch (error) {
    console.error("Unexpected error during workspace setup:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
