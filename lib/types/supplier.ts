/**
 * Tipos TypeScript para la entidad Supplier del frontend
 * Basado en la entidad Supplier del backend
 */

export enum SupplierStatus {
  PROVISIONAL = 'provisional',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

export enum SupplierType {
  LABOR = 'labor',
  MATERIALS = 'materials',
  CONTRACTOR = 'contractor',
  SERVICES = 'services',
  LOGISTICS = 'logistics',
  OTHER = 'other',
}

export enum FiscalCondition {
  RI = 'ri',
  MONOTRIBUTISTA = 'monotributista',
  EXEMPT = 'exempt',
  OTHER = 'other',
}

export interface Supplier {
  id: string;
  name: string;
  nombre?: string; // Alias para name
  cuit?: string;
  email?: string;
  phone?: string;
  contact?: string;
  contacto?: string; // Alias para contact
  contactName?: string; // Alias para contact
  category?: string;
  status?: SupplierStatus | string;
  estado?: string; // Alias para status
  type?: SupplierType | string;
  // Contractor-only fields (when type === contractor)
  weekly_payment?: number | null;
  contractor_budget?: number | null;
  contractor_total_paid?: number | null;
  contractor_remaining_balance?: number | null;
  fiscal_condition?: FiscalCondition | string;
  address?: string;
  created_by_id?: string;
  organization_id?: string | null;
  organization?: {
    id: string;
    name: string;
  } | null;
  workId?: string; // Para filtrado por obra
  obraId?: string; // Alias para workId
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSupplierData {
  name: string;
  cuit?: string;
  email?: string;
  phone?: string;
  contact?: string;
  category?: string;
  status?: SupplierStatus;
  type?: SupplierType;
  weekly_payment?: number;
  contractor_budget?: number;
  fiscal_condition?: FiscalCondition;
  address?: string;
  created_by_id?: string;
}

export interface UpdateSupplierData {
  name?: string;
  cuit?: string;
  email?: string;
  phone?: string;
  contact?: string;
  category?: string;
  status?: SupplierStatus;
  type?: SupplierType;
  weekly_payment?: number | null;
  contractor_budget?: number | null;
  fiscal_condition?: FiscalCondition;
  address?: string;
}

