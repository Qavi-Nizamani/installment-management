import { createClient } from "@/supabase/database/server";
import { MEMBER_ROLE, MEMBER_ROLE_HIERARCHY } from "@/constants/member.constants";

export interface TenantContext {
  userId: string;
  tenantId: string;
  role: MEMBER_ROLE;
}

/**
 * Get the current user's tenant context
 * This is our main security guard - ensures user is authenticated and has a tenant
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Get the user's tenant membership
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return null;
    }

    return {
      userId: user.id,
      tenantId: member.tenant_id,
      role: member.role as MEMBER_ROLE,
    };
  } catch (error) {
    console.error("Error getting tenant context:", error);
    return null;
  }
}

/**
 * Ensure user has access to a specific tenant
 */
export async function requireTenantAccess(
  requiredTenantId?: string
): Promise<TenantContext> {
  const context = await getTenantContext();

  if (!context) {
    throw new Error("Authentication required");
  }

  if (requiredTenantId && context.tenantId !== requiredTenantId) {
    throw new Error("Access denied to this tenant");
  }

  return context;
}

/**
 * Ensure user has a specific role or higher
 */
export async function requireRole(
  minimumRole: MEMBER_ROLE
): Promise<TenantContext> {
  const context = await requireTenantAccess();

  const roleHierarchy = MEMBER_ROLE_HIERARCHY;

  if (roleHierarchy[context.role] < roleHierarchy[minimumRole]) {
    throw new Error(`Role ${minimumRole} or higher required`);
  }

  return context;
}

/**
 * Filter query to only include records from user's tenant
 */
export function withTenantFilter(
  query: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  tenantId: string
) {
  return query.eq("tenant_id", tenantId);
}
