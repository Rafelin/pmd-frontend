import type { Employee } from "./employee";
import type { Expense } from "./expense";

/**
 * Tipos TypeScript para EmployeePayment (Fase 4 - Nómina)
 * Basado en pmd-backend/src/payroll/employee-payments.entity.ts
 */
export interface EmployeePayment {
  id: string;
  employee_id: string;
  week_start_date: string;
  days_worked: number;
  total_salary: number;
  late_hours?: number | null;
  late_deduction: number;
  total_advances: number;
  net_payment: number;
  paid_at?: string | null;
  expense_id?: string | null;
  organization_id?: string | null;
  created_at?: string;
  updated_at?: string;

  employee?: Employee;
  expense?: Expense | null;
}

export interface PayrollSummaryRow {
  week_start_date: string;
  total_payments: number;
  unpaid_payments: number;
  total_net_payment: number;
  missing_expense: number;
}

