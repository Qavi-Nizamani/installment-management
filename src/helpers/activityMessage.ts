import type { ActivityLogEntry, ActivityLogMetadata } from "@/services/dashboard/dashboard.types";

function fmtNum(n: number): string {
  return n.toLocaleString();
}

function prefix(meta: ActivityLogMetadata): string {
  const n = meta.installment_number ?? 0;
  const name = meta.customer_name ?? "";
  return `Installment #${n} (${name})`;
}

function refTypeLabel(referenceType: string): string {
  const labels: Record<string, string> = {
    tenants: "Workspace",
    members: "Member",
    plans: "Plan",
    subscriptions: "Subscription",
    customers: "Customer",
    installment_plans: "Installment plan",
    installments: "Installment",
    capital_ledger: "Capital entry",
    limits_usage: "Limits",
    billing_webhook_events: "Webhook",
  };
  return labels[referenceType] ?? referenceType;
}

function actionVerb(action: string): string {
  if (action === "INSERT") return "created";
  if (action === "UPDATE") return "updated";
  if (action === "DELETE") return "deleted";
  return "updated";
}

/**
 * Build human-readable activity line from action, reference_type, and metadata.
 */
export function formatActivityMessage(entry: ActivityLogEntry): string {
  const actor = entry.metadata?.actor_email ?? "Unknown";
  const { action, reference_type: refType, metadata } = entry;

  if (refType === "installments" && metadata) {
    const pre = prefix(metadata);
    if (action === "DELETE") {
      return `${pre} deleted by ${actor}`;
    }
    if (action === "INSERT") {
      const status = metadata.status ?? "";
      const amountPaid = metadata.amount_paid ?? 0;
      if (status === "PAID" || amountPaid > 0) {
        return `${pre} amount paid by ${actor}`;
      }
      return `${pre} created by ${actor}`;
    }
    if (action === "UPDATE") {
      const oldAmount = metadata.old_amount;
      const newAmount = metadata.new_amount;
      const oldStatus = metadata.old_status;
      const newStatus = metadata.new_status;
      const oldDue = metadata.old_due_date;
      const newDue = metadata.new_due_date;

      if (
        oldAmount !== undefined &&
        newAmount !== undefined &&
        oldAmount !== newAmount
      ) {
        return `${pre} amount changed ${fmtNum(oldAmount)} → ${fmtNum(newAmount)} by ${actor}`;
      }
      if (oldStatus !== newStatus && newStatus === "PAID") {
        return `${pre} amount paid by ${actor}`;
      }
      if (oldStatus !== newStatus && (newStatus === "PENDING" || newStatus === "OVERDUE")) {
        const statusLabel = (newStatus ?? "").toLowerCase();
        return `${pre} set status ${statusLabel} by ${actor}`;
      }
      if (oldDue !== undefined && newDue !== undefined && oldDue !== newDue) {
        return `${pre} due date changed ${oldDue} → ${newDue} by ${actor}`;
      }
      return `${pre} updated by ${actor}`;
    }
  }

  const label = refTypeLabel(refType);
  const verb = actionVerb(action);
  return `${label} ${verb} by ${actor}`;
}
