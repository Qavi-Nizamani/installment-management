import type { ActivityLogEntry, ActivityLogMetadata, ActivityLogChange } from "@/services/dashboard/dashboard.types";

function fmtNum(n: number): string {
  return n.toLocaleString();
}

function prefix(meta: ActivityLogMetadata): string {
  const n = meta.installment_number ?? 0;
  const name = meta.customer_name ?? "";
  return `Installment #${n} (${name})`;
}

/** Read change from new shape (metadata.changes) or legacy flat (metadata.old_* / new_*) */
function getChange(meta: ActivityLogMetadata, field: string): ActivityLogChange | undefined {
  const c = meta.changes?.[field];
  if (c && (c.old !== undefined || c.new !== undefined)) return c;
  const legacyOld = meta[`old_${field}` as keyof ActivityLogMetadata];
  const legacyNew = meta[`new_${field}` as keyof ActivityLogMetadata];
  if (legacyOld !== undefined || legacyNew !== undefined) {
    return { old: legacyOld, new: legacyNew };
  }
  return undefined;
}

/** Single value: from metadata field or from changes[field].new */
function getValue(meta: ActivityLogMetadata, field: string): unknown {
  const v = meta[field as keyof ActivityLogMetadata];
  if (v !== undefined) return v;
  return meta.changes?.[field]?.new;
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

/** Resolve actor label from user_id; pass currentUserId to show "you" when matching. */
export function getActivityActorLabel(entry: ActivityLogEntry, currentUserId: string | undefined): string {
  if (entry.user_id && currentUserId && entry.user_id === currentUserId) return "you";
  if (entry.user_id) return "a team member";
  return "someone";
}

/**
 * Build human-readable activity line from action, reference_type, and metadata.
 * Supports new metadata shape (changes) and legacy flat old_/new_. Actor derived from entry.user_id when currentUserId is passed.
 */
export function formatActivityMessage(
  entry: ActivityLogEntry,
  currentUserId?: string
): string {
  const actor = getActivityActorLabel(entry, currentUserId);
  const { action, reference_type: refType, metadata } = entry;
  const meta = metadata ?? {};

  if (refType === "installments" && meta) {
    const pre = prefix(meta);
    if (action === "DELETE") {
      return `${pre} deleted by ${actor}`;
    }
    if (action === "INSERT") {
      const status = (getValue(meta, "status") as string) ?? meta.status ?? "";
      const amountPaid = Number(getValue(meta, "amount_paid") ?? meta.amount_paid ?? 0);
      if (status === "PAID" || amountPaid > 0) {
        return `${pre} amount paid by ${actor}`;
      }
      return `${pre} created by ${actor}`;
    }
    if (action === "UPDATE") {
      const statusCh = getChange(meta, "status");
      const amountCh = getChange(meta, "amount_due");
      const dueCh = getChange(meta, "due_date");
      const amountPaidCh = getChange(meta, "amount_paid");

      const newStatus = (statusCh?.new ?? meta.new_status) as string | undefined;
      const oldAmount = amountCh?.old ?? meta.old_amount;
      const newAmount = amountCh?.new ?? meta.new_amount;
      const oldDue = dueCh?.old ?? meta.old_due_date;
      const newDue = dueCh?.new ?? meta.new_due_date;

      if (
        oldAmount !== undefined &&
        newAmount !== undefined &&
        Number(oldAmount) !== Number(newAmount)
      ) {
        return `${pre} amount changed ${fmtNum(Number(oldAmount))} → ${fmtNum(Number(newAmount))} by ${actor}`;
      }
      if (amountPaidCh?.old !== undefined && amountPaidCh?.new !== undefined) {
        return `${pre} amount paid by ${actor}`;
      }
      if (newStatus === "PAID") {
        return `${pre} amount paid by ${actor}`;
      }
      if (newStatus === "PENDING" || newStatus === "OVERDUE") {
        const statusLabel = (newStatus ?? "").toLowerCase();
        return `${pre} set status ${statusLabel} by ${actor}`;
      }
      if (oldDue !== undefined && newDue !== undefined && String(oldDue) !== String(newDue)) {
        return `${pre} due date changed ${oldDue} → ${newDue} by ${actor}`;
      }
      return `${pre} updated by ${actor}`;
    }
  }

  const label = refTypeLabel(refType);
  const verb = actionVerb(action);
  return `${label} ${verb} by ${actor}`;
}
