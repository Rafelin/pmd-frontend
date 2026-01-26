import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Supplier, CreateSupplierData, UpdateSupplierData } from "@/lib/types/supplier";

export function useSuppliers(options?: { type?: string; filterByOrganization?: boolean }) {
  const { token } = useAuthStore();
  
  const fetcher = (key: [string, string, string]) => {
    const [, type, filterByOrganization] = key;
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (filterByOrganization === "1") params.set("filterByOrganization", "true");
    const qs = params.toString();
    const url = qs ? `/suppliers?${qs}` : "/suppliers";
    return apiClient.get(url);
  };
  
  const { data, error, isLoading, mutate } = useSWR(
    token
      ? ([
          "suppliers",
          options?.type ? String(options.type) : "",
          options?.filterByOrganization ? "1" : "0",
        ] as const)
      : null,
    fetcher
  );

  return {
    suppliers: ((data as any)?.data || data || []) as Supplier[],
    error,
    isLoading,
    mutate,
  };
}

export function useSupplier(id: string | null) {
  const { token } = useAuthStore();
  
  if (!id) {
    if (process.env.NODE_ENV === "development") {
      console.warn("❗ [useSupplier] id no está definido");
    }
    return { supplier: null, error: null, isLoading: false, mutate: async () => {} };
  }
  
  const { data, error, isLoading, mutate } = useSWR(
    token && id ? `suppliers/${id}` : null,
    () => {
      return apiClient.get(`/suppliers/${id}`);
    }
  );

  return {
    supplier: ((data as any)?.data || data) as Supplier | null,
    error,
    isLoading,
    mutate,
  };
}

export const supplierApi = {
  create: (data: CreateSupplierData) => {
    return apiClient.post("/suppliers", data);
  },
  update: (id: string, data: UpdateSupplierData) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [supplierApi.update] id no está definido");
      }
      throw new Error("ID de proveedor no está definido");
    }
    return apiClient.patch(`/suppliers/${id}`, data);
  },
  delete: (id: string) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [supplierApi.delete] id no está definido");
      }
      throw new Error("ID de proveedor no está definido");
    }
    return apiClient.delete(`/suppliers/${id}`);
  },
  approve: (id: string) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [supplierApi.approve] id no está definido");
      }
      throw new Error("ID de proveedor no está definido");
    }
    // El backend usa POST, no PATCH
    return apiClient.post(`/suppliers/${id}/approve`, {});
  },
  reject: (id: string) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [supplierApi.reject] id no está definido");
      }
      throw new Error("ID de proveedor no está definido");
    }
    // El backend usa POST, no PATCH
    return apiClient.post(`/suppliers/${id}/reject`, {});
  },
};

