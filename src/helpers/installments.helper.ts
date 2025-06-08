import type { InstallmentStatus } from '@/types/installments/installments.types';

// ==================== CALCULATION HELPERS ====================

/**
 * Calculate remaining amount due for an installment
 * @param amountDue - Total amount due for the installment
 * @param amountPaid - Amount already paid
 * @returns Remaining amount due (never negative)
 */
export function calculateRemainingDue(amountDue: number, amountPaid: number): number {
  return Math.max(0, amountDue - amountPaid);
}

/**
 * Calculate how many days an installment is overdue
 * @param dueDate - The due date string (YYYY-MM-DD format)
 * @returns Number of days overdue (0 if not overdue)
 */
export function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  
  if (now <= due) return 0;
  
  return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if installment is due within specified days ahead
 * @param dueDate - The due date string (YYYY-MM-DD format)
 * @param status - Current installment status
 * @param daysAhead - Number of days to look ahead (default: 7)
 * @returns True if installment is upcoming and pending
 */
export function isUpcoming(dueDate: string, status: InstallmentStatus, daysAhead: number = 7): boolean {
  if (status !== 'PENDING') return false;
  
  const due = new Date(dueDate);
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  return due >= now && due <= futureDate;
}

// ==================== DATE HELPERS ====================

/**
 * Format a date string to a readable format
 * @param dateString - Date string in ISO format
 * @returns Formatted date string
 */
export function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get relative time description for due date
 * @param dueDate - The due date string
 * @returns Human-readable relative time (e.g., "Due in 3 days", "Overdue by 2 days")
 */
export function getRelativeDueTime(dueDate: string): string {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays > 0) {
    return `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  } else {
    const overdueDays = Math.abs(diffDays);
    return `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`;
  }
}

// ==================== STATUS HELPERS ====================

/**
 * Get priority level based on installment status and due date
 * @param status - Installment status
 * @param dueDate - Due date string
 * @returns Priority level: 'high', 'medium', 'low'
 */
export function getInstallmentPriority(status: InstallmentStatus, dueDate: string): 'high' | 'medium' | 'low' {
  if (status === 'OVERDUE') return 'high';
  if (status === 'PAID') return 'low';
  
  // For pending installments, check how soon they're due
  const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue <= 3) return 'high';
  if (daysUntilDue <= 7) return 'medium';
  return 'low';
}

/**
 * Check if an installment requires immediate attention
 * @param status - Installment status
 * @param dueDate - Due date string
 * @returns True if requires attention (overdue or due soon)
 */
export function requiresAttention(status: InstallmentStatus, dueDate: string): boolean {
  if (status === 'OVERDUE') return true;
  if (status === 'PAID') return false;
  
  return isUpcoming(dueDate, status, 3); // Due within 3 days
}

// ==================== VALIDATION HELPERS ====================

/**
 * Validate installment payment amount
 * @param amountPaid - Amount being paid
 * @param amountDue - Total amount due
 * @returns Validation result with error message if invalid
 */
export function validatePaymentAmount(amountPaid: number, amountDue: number): { isValid: boolean; error?: string } {
  if (amountPaid <= 0) {
    return { isValid: false, error: 'Payment amount must be greater than 0' };
  }
  
  if (amountPaid > amountDue) {
    return { isValid: false, error: 'Payment amount cannot exceed amount due' };
  }
  
  return { isValid: true };
}

/**
 * Validate due date format and logic
 * @param dueDate - Due date string
 * @returns Validation result with error message if invalid
 */
export function validateDueDate(dueDate: string): { isValid: boolean; error?: string } {
  const date = new Date(dueDate);
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }
  
  // Check if date is too far in the past (more than 10 years)
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  
  if (date < tenYearsAgo) {
    return { isValid: false, error: 'Due date cannot be more than 10 years in the past' };
  }
  
  return { isValid: true };
} 