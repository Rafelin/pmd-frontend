export type ReceiptPrintType = "employees" | "contractors" | "all";

export interface EmployeeAdvanceLineItem {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string | null;
}

export interface EmployeeReceipt {
  type: "employee";
  week_start_date: string; // YYYY-MM-DD
  week_end_date: string; // YYYY-MM-DD
  employee: {
    id: string;
    fullName: string;
    trade?: string | null;
    work?: { id?: string; name?: string } | null;
  };
  totals: {
    days_worked: number;
    total_salary: number;
    late_hours: number;
    late_deduction: number;
    total_advances: number;
    total_discounts: number;
    net_payment: number;
  };
  advances: EmployeeAdvanceLineItem[];
  meta: {
    payment_id: string;
    paid_at: string | null;
    expense_id: string | null;
  };
}

export interface ContractorReceipt {
  type: "contractor";
  week_start_date: string; // YYYY-MM-DD
  week_end_date: string; // YYYY-MM-DD
  contractor: {
    id: string;
    name: string;
  };
  work: { id?: string; name?: string } | null;
  certification: {
    id: string;
    amount: number;
    description: string | null;
    expense_id: string | null;
  };
  balance: {
    contractor_remaining_balance: number | null;
    contractor_total_paid: number | null;
    contractor_budget: number | null;
  };
}

export type PrintableReceiptItem = EmployeeReceipt | ContractorReceipt;

export interface WeekReceiptsResponse {
  week_start_date: string;
  week_end_date: string;
  employees: EmployeeReceipt[];
  contractors: ContractorReceipt[];
}

export interface PrintReceiptsResponse extends WeekReceiptsResponse {
  type: ReceiptPrintType;
  items: PrintableReceiptItem[];
}

