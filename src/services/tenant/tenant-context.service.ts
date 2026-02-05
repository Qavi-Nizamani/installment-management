"use server";

import { createClient } from "@/supabase/database/server";

export interface TenantSummary {
  id: string;
  name: string;
}

export interface MemberSummary {
  tenantId: string;
  role: string;
}

export interface TenantContextSummary {
  tenant: TenantSummary;
  member: MemberSummary;
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getTenantContextSummary(): Promise<
  ServiceResponse<TenantContextSummary>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const { data: member, error } = await supabase
      .from("members")
      .select("tenant_id, role, tenant:tenants(id, name)")
      .eq("user_id", user.id)
      .single();

    if (error || !member || !member.tenant) {
      return {
        success: false,
        error: "No tenant membership found for this user.",
      };
    }

    return {
      success: true,
      data: {
        member: {
          tenantId: member.tenant_id,
          role: member.role,
        },
        tenant: {
          id: member.tenant.id,
          name: member.tenant.name,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching tenant context summary:", error);
    return { success: false, error: "Failed to fetch tenant context." };
  }
}
