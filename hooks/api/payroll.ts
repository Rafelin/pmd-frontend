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

  const fetcher = () => {
    const params = new URLSearchParams();
    if (filters?.filterByOrganization) params.append("filterByOrganization", "true");
    if (filters?.work_id) params.append("work_id", filters.work_id);
    const qs = params.toString();
    const url = qs ? `/payroll/week/${weekStartDate}?${qs}` : `/payroll/week/${weekStartDate}`;
    return apiClient.get(url);
  };

  const { data, error, isLoading, mutate } = useSWR(
    token ? ["payroll/week", weekStartDate, filters] : null,
    fetcher
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

  const { data, error, isLoading, mutate } = useSWR(
    token ? ["payroll/employee", employeeId, filters] : null,
    fetcher
  );

  return {
    payments: ((data as any)?.data || data || []) as EmployeePayment[],
    error,
    isLoading,
    mutate,
  };
}

