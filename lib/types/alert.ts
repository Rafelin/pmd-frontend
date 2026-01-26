/**
 * Alert interface matching backend Alert entity
 * Based on pmd-backend/src/alerts/alerts.entity.ts
 */

export enum AlertType {
  EXPIRED_DOCUMENTATION = 'expired_documentation',
  CASHBOX_DIFFERENCE = 'cashbox_difference',
  CONTRACT_ZERO_BALANCE = 'contract_zero_balance',
  CONTRACT_INSUFFICIENT_BALANCE = 'contract_insufficient_balance',
  CONTRACTOR_BUDGET_LOW = 'contractor_budget_low',
  DUPLICATE_INVOICE = 'duplicate_invoice',
  OVERDUE_STAGE = 'overdue_stage',
  OBSERVED_EXPENSE = 'observed_expense',
  REJECTED_EXPENSE = 'rejected_expense',
  ANNULLED_EXPENSE = 'annulled_expense',
  POST_CLOSURE_EXPENSE = 'post_closure_expense',
  MISSING_VALIDATION = 'missing_validation',
  PENDING_INCOME_CONFIRMATION = 'pending_income_confirmation',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  is_read: boolean;
  read?: boolean; // Alias for is_read
  user_id?: string | null;
  user?: { id: string; name: string } | null;
  work_id?: string | null;
  work?: { id: string; name: string } | null;
  supplier_id?: string | null;
  supplier?: { id: string; name: string } | null;
  expense_id?: string | null;
  expense?: { id: string; document_number?: string } | null;
  contract_id?: string | null;
  contract?: { id: string } | null;
  cashbox_id?: string | null;
  cashbox?: { id: string } | null;
  assigned_to_id?: string | null;
  assigned_to?: { id: string; name: string } | null;
  resolved_by_id?: string | null;
  resolved_by?: { id: string; name: string } | null;
  resolved_at?: string | Date | null;
  metadata?: Record<string, any>;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface CreateAlertData {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  user_id?: string;
  work_id?: string;
  supplier_id?: string;
  expense_id?: string;
  contract_id?: string;
  cashbox_id?: string;
  metadata?: Record<string, any>;
}

export interface AssignAlertData {
  assigned_to_id: string;
}

export interface ResolveAlertData {
  resolution_notes?: string;
}

