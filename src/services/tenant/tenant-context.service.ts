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
  code?: "AUTH_REQUIRED" | "NO_TENANT" | "UNKNOWN";
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
      return { success: false, error: "Authentication required.", code: "AUTH_REQUIRED" };
    }

    const { data: member, error } = await supabase
      .from("members")
      .select("tenant_id, role, tenant:tenants(id, name)")
      .eq("user_id", user.id)
      .single();

    type MemberRow = { tenant_id: string; role: string; tenant: { id: string; name: string } };
    const m = member as MemberRow | null;

    if (error || !m || !m.tenant) {
      return {
        success: false,
        error: "No tenant membership found for this user.",
        code: "NO_TENANT",
      };
    }

    return {
      success: true,
      data: {
        member: {
          tenantId: m.tenant_id,
          role: m.role,
        },
        tenant: {
          id: m.tenant.id,
          name: m.tenant.name,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching tenant context summary:", error);
    return { success: false, error: "Failed to fetch tenant context.", code: "UNKNOWN" };
  }
}
