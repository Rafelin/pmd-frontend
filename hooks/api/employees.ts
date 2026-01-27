import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Employee, CreateEmployeeData, UpdateEmployeeData } from "@/lib/types/employee";

export function useEmployees(
  filters?: {
    filterByOrganization?: boolean;
    work_id?: string;
    trade?: string;
    isActive?: boolean;
  },
  options?: {
    manual?: boolean; // Si es true, no hace fetch automático
  }
) {
  const { token } = useAuthStore();
  
  const fetcher = () => {
    const params = new URLSearchParams();
    if (filters?.filterByOrganization) {
      params.append('filterByOrganization', 'true');
    }
    if (filters?.work_id) {
      params.append('work_id', filters.work_id);
    }
    if (filters?.trade) {
      params.append('trade', filters.trade);
    }
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive ? 'true' : 'false');
    }
    const queryString = params.toString();
    const url = queryString ? `/employees?${queryString}` : '/employees';
    return apiClient.get(url);
  };
  
  // Crear una clave estable usando valores primitivos en lugar del objeto filters
  // Esto evita que SWR trate cada render como una nueva solicitud
  // Si manual es true, no pasar la clave para que no haga fetch automático
  const swrKey = options?.manual 
    ? null 
    : token 
      ? [
          "employees",
          filters?.filterByOrganization ?? false,
          filters?.work_id ?? null,
          filters?.trade ?? null,
          filters?.isActive ?? undefined,
        ]
      : null;
  
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    fetcher,
    {
      // Configuración para reducir solicitudes innecesarias
      dedupingInterval: 5000, // 5 segundos de deduplicación
      revalidateOnFocus: false, // No revalidar al enfocar la ventana
      revalidateIfStale: false, // No revalidar si los datos están "stale"
      shouldRetryOnError: (error: any) => {
        // No reintentar en errores 429 (Too Many Requests)
        if (error?.response?.status === 429 || error?.status === 429) {
          return false;
        }
        // No reintentar en errores de autenticación/autorización
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return true;
      },
      errorRetryCount: 2, // Máximo 2 reintentos
      errorRetryInterval: 5000, // 5 segundos entre reintentos
    }
  );

  return {
    employees: ((data as any)?.data || data || []) as Employee[],
    error,
    isLoading,
    mutate,
  };
}

export function useEmployee(id: string | null) {
  const { token } = useAuthStore();
  
  if (!id) {
    if (process.env.NODE_ENV === "development") {
      console.warn("❗ [useEmployee] id no está definido");
    }
    return { employee: null, error: null, isLoading: false, mutate: async () => {} };
  }
  
  const { data, error, isLoading, mutate } = useSWR(
    token && id ? `employees/${id}` : null,
    () => {
      return apiClient.get(`/employees/${id}`);
    }
  );

  return {
    employee: ((data as any)?.data || data) as Employee | null,
    error,
    isLoading,
    mutate,
  };
}

export const employeeApi = {
  create: (data: CreateEmployeeData) => {
    return apiClient.post("/employees", data);
  },
  update: (id: string, data: UpdateEmployeeData) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [employeeApi.update] id no está definido");
      }
      throw new Error("ID de empleado no está definido");
    }
    return apiClient.patch(`/employees/${id}`, data);
  },
  delete: (id: string) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [employeeApi.delete] id no está definido");
      }
      throw new Error("ID de empleado no está definido");
    }
    return apiClient.delete(`/employees/${id}`);
  },
};
