import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { EmployeePayment, PayrollSummaryRow } from "@/lib/types/employee-payment";

export function usePayrollWeek(
  weekStartDate: string | null,
  filters?: { filterByOrganization?: boolean; work_id?: string }
) {
  const { token } = useAuthStore();

  if (!weekStartDate) {
    return { payments: [], error: null, isLoading: false, mutate: async () => {} };
  }

  // Validar formato de fecha (debe ser yyyy-MM-dd)
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(weekStartDate);
  if (!isValidDate) {
    console.warn(`[usePayrollWeek] Formato de fecha inválido: ${weekStartDate}. Debe ser yyyy-MM-dd`);
    return { 
      payments: [], 
      error: new Error(`Formato de fecha inválido: ${weekStartDate}`), 
      isLoading: false, 
      mutate: async () => {} 
    };
  }

  const fetcher = async () => {
    const params = new URLSearchParams();
    if (filters?.filterByOrganization) params.append("filterByOrganization", "true");
    if (filters?.work_id) params.append("work_id", filters.work_id);
    const qs = params.toString();
    const url = qs ? `/payroll/week/${weekStartDate}?${qs}` : `/payroll/week/${weekStartDate}`;
    
    try {
      return await apiClient.get(url);
    } catch (error: any) {
      // Si es un error 429, no lanzar el error inmediatamente para evitar reintentos
      // SWR manejará el error según su configuración
      if (error?.response?.status === 429 || error?.status === 429) {
        throw error;
      }
      throw error;
    }
  };

  const { data, error, isLoading, mutate } = useSWR(
    token && isValidDate ? ["payroll/week", weekStartDate, filters] : null,
    fetcher,
    {
      // Configuración específica para payroll para evitar demasiadas solicitudes
      dedupingInterval: 10000, // 10 segundos de deduplicación (aumentado de 5s)
      revalidateOnFocus: false,
      revalidateIfStale: false,
      shouldRetryOnError: (error: any) => {
        // No reintentar en errores 429
        if (error?.response?.status === 429 || error?.status === 429) {
          return false;
        }
        // No reintentar en errores de autenticación/autorización
        if (error?.response?.status === 401 || error?.response?.status === 403 || error?.response?.status === 404) {
          return false;
        }
        return true;
      },
      errorRetryCount: 2, // Reducido de 3 a 2 para payroll
      errorRetryInterval: 10000, // 10 segundos entre reintentos (aumentado de 5s)
    }
  );

  return {
    payments: ((data as any)?.data || data || []) as EmployeePayment[],
    error,
    isLoading,
    mutate,
  };
}

export function usePayrollSummary(filters?: { filterByOrganization?: boolean }) {
  const { token } = useAuthStore();

  const fetcher = () => {
    const params = new URLSearchParams();
    if (filters?.filterByOrganization) params.append("filterByOrganization", "true");
    const qs = params.toString();
    const url = qs ? `/payroll/summary?${qs}` : `/payroll/summary`;
    return apiClient.get(url);
  };

  const { data, error, isLoading, mutate } = useSWR(
    token ? ["payroll/summary", filters] : null,
    fetcher
  );

  return {
    summary: ((data as any)?.data || data || []) as PayrollSummaryRow[],
    error,
    isLoading,
    mutate,
  };
}

export const payrollApi = {
  calculate: (
    weekStartDate: string,
    params?: { filterByOrganization?: boolean; createExpenses?: boolean; work_id?: string }
  ) => {
    const sp = new URLSearchParams();
    if (params?.filterByOrganization) sp.append("filterByOrganization", "true");
    if (params?.createExpenses === false) sp.append("createExpenses", "false");
    if (params?.work_id) sp.append("work_id", params.work_id);
    const qs = sp.toString();
    const url = qs ? `/payroll/calculate/${weekStartDate}?${qs}` : `/payroll/calculate/${weekStartDate}`;
    return apiClient.post(url);
  },
  markPaid: (paymentId: string) => {
    if (!paymentId) throw new Error("ID de pago no está definido");
    return apiClient.post(`/payroll/mark-paid/${paymentId}`);
  },
  createExpenseFromPayment: (paymentId: string) => {
    if (!paymentId) throw new Error("ID de pago no está definido");
    return apiClient.post(`/expenses/from-payment/${paymentId}`);
  },
};

export function usePayrollEmployee(
  employeeId: string | null,
  filters?: { filterByOrganization?: boolean }
) {
  const { token } = useAuthStore();

  if (!employeeId) {
    return { payments: [], error: null, isLoading: false, mutate: async () => {} };
  }

  const fetcher = () => {
    const params = new URLSearchParams();
    if (filters?.filterByOrganization) params.append("filterByOrganization", "true");
    const qs = params.toString();
    const url = qs ? `/payroll/employee/${employeeId}?${qs}` : `/payroll/employee/${employeeId}`;
    return apiClient.get(url);
  };

  // Crear una clave estable para SWR usando valores primitivos en lugar del objeto filters
  const swrKey = token && employeeId 
    ? ["payroll/employee", employeeId, filters?.filterByOrganization ?? false] 
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    fetcher
  );

  return {
    payments: ((data as any)?.data || data || []) as EmployeePayment[],
    error,
    isLoading,
    mutate,
  };
}

