"use server";

import { createClient } from "@/supabase/database/server";
import { withTenantFilter } from "@/guards/tenant.guard";
import type { ServiceResponse, ActivityLogEntry, ActivityLogMetadata } from "./dashboard.types";

/**
 * Fetch recent activity logs for the current tenant for dashboard display.
 */
export async function getRecentActivity(
  tenantId: string,
  limit: number = 20
): Promise<ServiceResponse<ActivityLogEntry[]>> {
  try {
    if (!tenantId) {
      return { success: false, error: "Tenant context required" };
    }
    const supabase = await createClient();
    const query = supabase
      .from("activity_logs")
      .select("id, action, reference_type, reference_id, user_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    const { data, error } = await withTenantFilter(query, tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    const entries: ActivityLogEntry[] = (data ?? []).map((row: {
      id: string;
      action: string;
      reference_type: string;
      reference_id: string | null;
      user_id: string | null;
      metadata: ActivityLogMetadata | null;
      created_at: string;
    }) => ({
      id: row.id,
      action: row.action,
      reference_type: row.reference_type,
      reference_id: row.reference_id,
      user_id: row.user_id ?? null,
      metadata: (row.metadata ?? {}) as ActivityLogMetadata,
      created_at: row.created_at,
    }));

    return { success: true, data: entries };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load activity";
    return { success: false, error: message };
  }
}
