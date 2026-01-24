/**
 * Tipos TypeScript para EmployeeAdvance del frontend
 * Basado en la entidad EmployeeAdvance del backend (RESUMEN_IMPLEMENTACION_PMD_PRINCIPAL.md)
 */

import type { Employee } from "./employee";

export interface EmployeeAdvance {
  id: string;
  employee_id: string;
  amount: number;
  date: string;
  description?: string | null;
  week_start_date: string;
  organization_id?: string | null;
  created_at?: string;
  updated_at?: string;
  employee?: Employee;
}

export interface CreateEmployeeAdvanceData {
  employee_id: string;
  amount: number;
  date: string;
  description?: string;
  week_start_date?: string;
}

export interface UpdateEmployeeAdvanceData {
  employee_id?: string;
  amount?: number;
  date?: string;
  description?: string | null;
  week_start_date?: string;
}

