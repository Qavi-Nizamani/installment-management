"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentActivity } from "@/services/dashboard/activity.service";
import type { ActivityLogEntry } from "@/services/dashboard/dashboard.types";
import { formatActivityMessage } from "@/helpers/activityMessage";
import { useUserStore } from "@/store/user.store";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";

function formatRelativeTime(isoDate: string): string {
  try {
    return formatDistanceToNow(new Date(isoDate), { addSuffix: true });
  } catch {
    return isoDate;
  }
}

/** Theme-aware row styles: background + left border by action (INSERT=green, UPDATE=blue, DELETE=red) */
function getActivityRowClasses(action: string): string {
  const base =
    "flex items-start justify-between gap-3 p-3 rounded-lg border-l-2 transition-colors " +
    "hover:bg-muted/60 dark:hover:bg-muted/40 ";
  switch (action) {
    case "INSERT":
      return base + "border-l-green-500 dark:border-l-green-600 bg-green-500/5 dark:bg-green-500/10";
    case "UPDATE":
      return base + "border-l-blue-500 dark:border-l-blue-600 bg-blue-500/5 dark:bg-blue-500/10";
    case "DELETE":
      return base + "border-l-destructive dark:border-l-destructive/90 bg-destructive/5 dark:bg-destructive/10";
    default:
      return base + "border-l-muted-foreground/30 dark:border-l-muted-foreground/40 bg-muted/30 dark:bg-muted/20";
  }
}

export function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tenantId = useUserStore((state) => state.tenant?.id);
  const currentUserId = useUserStore((state) => state.user?.id);

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true);
      setError(null);
      if (!tenantId) {
        setLoading(false);
        return;
      }
      const response = await getRecentActivity(tenantId, 20);
      if (response.success && response.data) {
        setEntries(response.data);
      } else {
        setError(response.error ?? "Failed to load activity.");
      }
      setLoading(false);
    }
    fetchActivity();
  }, [tenantId]);

  if (!tenantId) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest actions in your workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg">
                <div className="h-4 flex-1 bg-muted animate-pulse rounded dark:bg-muted/60" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded dark:bg-muted/60" />
              </div>
            ))}
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {!loading && !error && entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        )}
        {!loading && !error && entries.length > 0 && (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={getActivityRowClasses(entry.action)}
              >
                <p className="text-sm text-foreground flex-1 dark:text-foreground">
                  {formatActivityMessage(entry, currentUserId)}
                </p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatRelativeTime(entry.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
