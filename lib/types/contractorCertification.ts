import { Supplier } from "./supplier";
import { Expense } from "./expense";
import { Contract } from "./contract";

export interface ContractorCertification {
  id: string;
  supplier_id: string;
  supplier?: Supplier;
  week_start_date: string; // YYYY-MM-DD
  amount: number;
  description?: string | null;
  contract_id?: string | null;
  contract?: Contract | null;
  expense_id?: string | null;
  expense?: Expense | null;
  organization_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateContractorCertificationData {
  supplier_id: string;
  week_start_date: string; // YYYY-MM-DD (any date in week ok; backend normaliza a lunes)
  amount: number;
  description?: string;
  contract_id?: string;
}

export interface UpdateContractorCertificationData {
  week_start_date?: string;
  amount?: number;
  description?: string | null;
  contract_id?: string | null;
}

