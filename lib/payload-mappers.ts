/**
 * Payload Mappers
 * 
 * Funciones de mapeo ESPECÍFICAS por entidad para alinear EXACTAMENTE
 * los payloads del frontend con los DTOs de creación del backend.
 * 
 * El backend usa ValidationPipe con:
 * - whitelist: true
 * - forbidNonWhitelisted: true
 * 
 * Por lo tanto, cualquier campo extra o campo faltante causará 400.
 * 
 * PROHIBIDO:
 * - Reusar payloads entre módulos
 * - Traducir keys dinámicamente
 * - Mandar campos visuales o auxiliares
 */

/**
 * Formatea una fecha a formato YYYY-MM-DD
 */
function formatDateYYYYMMDD(date: string | Date | undefined | null): string | undefined {
  if (!date) return undefined;
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return undefined;
    
    // Si ya está en formato YYYY-MM-DD, retornar directamente
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Formatear a YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}`;
  } catch {
    return undefined;
  }
}

/**
 * Convierte una fecha a formato ISO8601 completo (con hora y timezone)
 */
function toISODateTime(date: string | Date | undefined | null): string {
  if (!date) {
    throw new Error("La fecha es requerida");
  }
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      throw new Error("La fecha no es válida");
    }
    
    return dateObj.toISOString();
  } catch (error) {
    throw new Error("La fecha no es válida");
  }
}

/**
 * --- SUPPLIER ---
 * 
 * Mapea los datos del formulario de Supplier al payload exacto del DTO del backend.
 * 
 * DTO esperado (CreateSupplierDto):
 * - name: string (requerido)
 * - cuit?: string
 * - email?: string
 * - phone?: string
 * - category?: string
 * - status?: "provisional" | "approved" | "blocked" | "rejected"
 * - type?: "labor" | "materials" | "contractor" | "services" | "logistics" | "other"
 * - fiscal_condition?: "ri" | "monotributista" | "exempt" | "other"
 * - address?: string
 */
export function mapCreateSupplierPayload(form: Record<string, unknown>): {
  name: string;
  cuit?: string;
  email?: string;
  phone?: string;
  contact?: string;
  category?: string;
  status?: "provisional" | "approved" | "blocked" | "rejected";
  type?: "labor" | "materials" | "contractor" | "services" | "logistics" | "other";
  weekly_payment?: number;
  contractor_budget?: number;
  fiscal_condition?: "ri" | "monotributista" | "exempt" | "other";
  address?: string;
} {
  const payload: {
    name: string;
    cuit?: string;
    email?: string;
    phone?: string;
    contact?: string;
    category?: string;
    status?: "provisional" | "approved" | "blocked" | "rejected";
    type?: "labor" | "materials" | "contractor" | "services" | "logistics" | "other";
    weekly_payment?: number;
    contractor_budget?: number;
    fiscal_condition?: "ri" | "monotributista" | "exempt" | "other";
    address?: string;
  } = {
    name: (typeof form.nombre === "string" ? form.nombre : typeof form.name === "string" ? form.name : "").trim(),
    // ⚠️ Importante: en el backend @IsOptional NO ignora strings vacíos.
    // Si enviamos "" en campos con validaciones extra (email/cuit), puede causar 400.
    cuit: typeof form.cuit === "string" ? form.cuit.trim() || undefined : undefined,
    email: typeof form.email === "string" ? form.email.trim() || undefined : undefined,
    phone: (typeof form.telefono === "string" ? form.telefono : typeof form.phone === "string" ? form.phone : undefined)?.trim() || undefined,
    contact: (typeof form.contacto === "string" ? form.contacto : typeof form.contactName === "string" ? form.contactName : typeof form.contact === "string" ? form.contact : undefined)?.trim() || undefined,
    category: typeof form.category === "string" ? form.category.trim() || undefined : undefined,
    status: (() => {
      const raw =
        typeof (form as any).existstatus === "string"
          ? (form as any).existstatus
          : typeof (form as any).status === "string"
          ? (form as any).status
          : undefined;
      const normalized = typeof raw === "string" ? raw.trim() : "";
      if (!normalized) return undefined;
      if (normalized === "provisional" || normalized === "approved" || normalized === "blocked" || normalized === "rejected") {
        return normalized;
      }
      return undefined;
    })(),
    address: (typeof form.direccion === "string" ? form.direccion : typeof form.address === "string" ? form.address : undefined)?.trim() || undefined,
  };

  // Agregar type si está presente
  if (form.type && typeof form.type === "string" && form.type.trim() !== "") {
    payload.type = form.type.trim() as "labor" | "materials" | "contractor" | "services" | "logistics" | "other";
  }

  // Campos de contratista (solo si type === contractor)
  if (payload.type === "contractor") {
    const weeklyPaymentRaw = (form as any).weekly_payment ?? (form as any).weeklyPayment;
    const contractorBudgetRaw = (form as any).contractor_budget ?? (form as any).contractorBudget;

    if (weeklyPaymentRaw !== undefined && weeklyPaymentRaw !== null && String(weeklyPaymentRaw).trim() !== "") {
      const n = Number(weeklyPaymentRaw);
      if (!Number.isNaN(n) && n >= 0) payload.weekly_payment = n;
    }

    if (contractorBudgetRaw !== undefined && contractorBudgetRaw !== null && String(contractorBudgetRaw).trim() !== "") {
      const n = Number(contractorBudgetRaw);
      if (!Number.isNaN(n) && n >= 0) payload.contractor_budget = n;
    }
  }

  // Agregar fiscal_condition si está presente
  if (form.fiscal_condition && typeof form.fiscal_condition === "string" && form.fiscal_condition.trim() !== "") {
    payload.fiscal_condition = form.fiscal_condition.trim() as "ri" | "monotributista" | "exempt" | "other";
  }

  return payload;
}

/**
 * --- WORK ---
 * 
 * Mapea los datos del formulario de Work al payload exacto del DTO del backend.
 * 
 * DTO esperado (CreateWorkDto):
 * - name: string (requerido)
 * - client: string (requerido)
 * - address: string (requerido)
 * - start_date: string (requerido, ISO date: YYYY-MM-DD)
 * - end_date?: string (opcional, ISO date: YYYY-MM-DD)
 * - status?: WorkStatus (opcional, enum: "active" | "paused" | "finished" | "administratively_closed" | "archived")
 * - currency: Currency (requerido, enum: "ARS" | "USD")
 * - supervisor_id?: string (opcional, UUID)
 * - total_budget?: number (opcional)
 * - work_type?: WorkType (opcional, enum: "house" | "local" | "expansion" | "renovation" | "other")
 */
export function mapCreateWorkPayload(form: Record<string, unknown>): {
  name: string;
  client: string;
  address: string;
  start_date: string;
  end_date?: string;
  status?: string;
  currency: string;
  work_type?: string;
  supervisor_id?: string;
  total_budget?: number;
} {
  // ✅ Formulario ahora usa modelo único alineado al backend (start_date directamente)
  const startDate = formatDateYYYYMMDD(form.start_date as string | Date | undefined | null);
  if (!startDate) {
    throw new Error("La fecha de inicio es requerida y debe ser válida");
  }

  const payload: {
    name: string;
    client: string;
    address: string;
    start_date: string;
    currency: string;
    end_date?: string;
    status?: string;
    work_type?: string;
    supervisor_id?: string;
    total_budget?: number;
  } = {
    name: (typeof form.name === "string" ? form.name : "").trim(),
    client: (typeof form.client === "string" ? form.client : "").trim(),
    address: (typeof form.address === "string" ? form.address : "").trim(),
    start_date: startDate,
    currency: (typeof form.currency === "string" ? form.currency : "USD") || "USD",
  };

  // Campos opcionales - solo incluir si tienen valor
  const endDate = formatDateYYYYMMDD(form.end_date as string | Date | undefined | null);
  if (endDate) {
    payload.end_date = endDate;
  }

  const status = form.status;
  if (typeof status === "string" && ["active", "paused", "finished", "administratively_closed", "archived"].includes(status)) {
    payload.status = status;
  }

  const workType = form.work_type;
  if (typeof workType === "string" && ["house", "local", "expansion", "renovation", "other"].includes(workType)) {
    payload.work_type = workType;
  }

  const supervisorId = typeof form.supervisor_id === "string" ? form.supervisor_id.trim() : undefined;
  if (supervisorId) {
    payload.supervisor_id = supervisorId;
  }

  if (form.total_budget !== undefined && form.total_budget !== null && form.total_budget !== "") {
    const budgetNum = Number(form.total_budget);
    if (!isNaN(budgetNum) && budgetNum >= 0) {
      payload.total_budget = budgetNum;
    }
  }

  return payload;
}

/**
 * --- CASHBOX ---
 * 
 * Mapea los datos del formulario de Cashbox al payload exacto del DTO del backend.
 * 
 * DTO esperado (CreateCashboxDto):
 * - opening_date: string (ISO8601 date string, requerido)
 * - user_id: string (UUID, requerido)
 */
export function mapCreateCashboxPayload(form: Record<string, unknown>, userId: string): {
  opening_date: string;
  user_id: string;
} {
  if (!userId) {
    throw new Error("El ID de usuario es requerido");
  }
  
  const openingDate = form.opening_date;
  if (!openingDate) {
    throw new Error("La fecha de apertura es requerida");
  }
  return {
    opening_date: toISODateTime(openingDate as string | Date),
    user_id: userId,
  };
}
