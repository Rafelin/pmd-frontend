import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type {
  EmployeeAdvance,
  CreateEmployeeAdvanceData,
  UpdateEmployeeAdvanceData,
} from "@/lib/types/employee-advance";

export function useEmployeeAdvances(filters?: {
  filterByOrganization?: boolean;
  employee_id?: string;
  week_start_date?: string;
}) {
  const { token } = useAuthStore();

  const fetcher = () => {
    const params = new URLSearchParams();
    if (filters?.filterByOrganization) params.append("filterByOrganization", "true");
    if (filters?.employee_id) params.append("employee_id", filters.employee_id);
    if (filters?.week_start_date) params.append("week_start_date", filters.week_start_date);
    const qs = params.toString();
    return apiClient.get(qs ? `/employee-advances?${qs}` : "/employee-advances");
  };

  const { data, error, isLoading, mutate } = useSWR(
    token ? ["employee-advances", filters] : null,
    fetcher
  );

  return {
    advances: ((data as any)?.data || data || []) as EmployeeAdvance[],
    error,
    isLoading,
    mutate,
  };
}

export function useEmployeeAdvance(id: string | null) {
  const { token } = useAuthStore();

  if (!id) {
    return { advance: null, error: null, isLoading: false, mutate: async () => {} };
  }

  const { data, error, isLoading, mutate } = useSWR(
    token && id ? `employee-advances/${id}` : null,
    () => apiClient.get(`/employee-advances/${id}`)
  );

  return {
    advance: ((data as any)?.data || data) as EmployeeAdvance | null,
    error,
    isLoading,
    mutate,
  };
}

export const employeeAdvancesApi = {
  create: (data: CreateEmployeeAdvanceData) => apiClient.post("/employee-advances", data),
  update: (id: string, data: UpdateEmployeeAdvanceData) => {
    if (!id) throw new Error("ID de adelanto no está definido");
    return apiClient.patch(`/employee-advances/${id}`, data);
  },
  delete: (id: string) => {
    if (!id) throw new Error("ID de adelanto no está definido");
    return apiClient.delete(`/employee-advances/${id}`);
  },
};

