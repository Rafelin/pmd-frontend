/**
 * Tipos TypeScript para Employee del frontend
 * Basado en la entidad Employee del backend (RESUMEN_IMPLEMENTACION_PMD_PRINCIPAL.md)
 */

export enum EmployeeTrade {
  ALBANILERIA = 'albanileria',
  STEEL_FRAMING = 'steel_framing',
  PINTURA = 'pintura',
  PLOMERIA = 'plomeria',
  ELECTRICIDAD = 'electricidad',
}

export interface Employee {
  id: string;
  fullName: string;
  name?: string; // Alias para fullName
  nombre?: string; // Alias para fullName
  email?: string | null;
  phone?: string | null;
  daily_salary?: number | null;
  trade?: EmployeeTrade | null;
  work_id?: string | null;
  workId?: string | null; // Alias para work_id
  obraId?: string | null; // Alias para work_id
  work?: {
    id: string;
    name: string;
  } | null;
  area?: string | null;
  position?: string | null;
  puesto?: string | null; // Alias para position
  role?: string | null; // Job role (not UserRole)
  subrole?: string | null;
  hireDate?: string | null;
  seguro?: Record<string, unknown> | null;
  insurance?: Record<string, unknown> | null; // Alias para seguro
  isActive: boolean;
  organization_id?: string | null;
  organization?: {
    id: string;
    name: string;
  } | null;
  created_at?: string;
  updated_at?: string;
  createdAt?: string; // Alias
  updatedAt?: string; // Alias
}

export interface CreateEmployeeData {
  fullName: string;
  email?: string;
  phone?: string;
  daily_salary?: number;
  trade?: EmployeeTrade;
  work_id?: string;
  area?: string;
  position?: string;
  role?: string;
  subrole?: string;
  hireDate?: string;
  seguro?: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateEmployeeData {
  fullName?: string;
  email?: string;
  phone?: string;
  daily_salary?: number;
  trade?: EmployeeTrade;
  work_id?: string;
  area?: string;
  position?: string;
  role?: string;
  subrole?: string;
  hireDate?: string;
  seguro?: Record<string, unknown>;
  isActive?: boolean;
}

