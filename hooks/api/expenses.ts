import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Expense, CreateExpenseData, UpdateExpenseData } from "@/lib/types/expense";

export function useExpenses() {
  const { token } = useAuthStore();
  
  const fetcher = async (key: string): Promise<Expense[]> => {
    const response = await apiClient.get<Expense[]>(key);
    return (response as any)?.data || response || [];
  };
  
  const { data, error, isLoading, mutate } = useSWR<Expense[]>(
    token ? "expenses" : null,
    fetcher
  );

  return {
    expenses: data || [],
    error,
    isLoading,
    mutate,
  };
}

export function useExpense(id: string | null) {
  const { token } = useAuthStore();
  
  // Siempre llamar useSWR, pero con key null si no hay id o token
  const { data, error, isLoading, mutate } = useSWR<Expense>(
    token && id ? `expenses/${id}` : null,
    async (key: string) => {
      if (!id) {
        return null;
      }
      const response = await apiClient.get<Expense>(key);
      return (response as any)?.data || response;
    }
  );

  // Si no hay id, retornar valores por defecto
  if (!id) {
    if (process.env.NODE_ENV === "development") {
      console.warn("❗ [useExpense] id no está definido");
    }
    return { expense: null, error: null, isLoading: false, mutate: async () => {} };
  }

  return {
    expense: data || null,
    error,
    isLoading,
    mutate,
  };
}

export const expenseApi = {
  create: (data: CreateExpenseData) => {
    return apiClient.post<Expense>("/expenses", data);
  },
  update: (id: string, data: UpdateExpenseData) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [expenseApi.update] id no está definido");
      }
      throw new Error("ID de gasto no está definido");
    }
    // El backend usa PATCH, no PUT
    return apiClient.patch<Expense>(`/expenses/${id}`, data);
  },
  delete: (id: string) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [expenseApi.delete] id no está definido");
      }
      throw new Error("ID de gasto no está definido");
    }
    return apiClient.delete(`/expenses/${id}`);
  },
  validate: (id: string, state: "validated" | "observed" | "annulled", observations?: string) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [expenseApi.validate] id no está definido");
      }
      throw new Error("ID de gasto no está definido");
    }
    // El backend usa POST, no PATCH
    return apiClient.post<Expense>(`/expenses/${id}/validate`, {
      state,
      observations,
    });
  },
  reject: (id: string, observations: string) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [expenseApi.reject] id no está definido");
      }
      throw new Error("ID de gasto no está definido");
    }
    return apiClient.post<Expense>(`/expenses/${id}/reject`, {
      observations,
    });
  },
  getOne: async (id: string): Promise<Expense> => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [expenseApi.getOne] id no está definido");
      }
      throw new Error("ID de gasto no está definido");
    }
    const response = await apiClient.get<Expense>(`/expenses/${id}`);
    return (response as any)?.data || response;
  },
  createFromCertification: (certificationId: string) => {
    if (!certificationId) {
      throw new Error("ID de certificación no está definido");
    }
    return apiClient.post<Expense>(`/expenses/from-certification/${certificationId}`, {});
  },
};
