import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Work, CreateWorkData, UpdateWorkData } from "@/lib/types/work";

export function useWorks() {
  const { token } = useAuthStore();
  
  const fetcher = async (key: string): Promise<Work[]> => {
    const response = await apiClient.get<Work[]>(key);
    return (response as any)?.data || response || [];
  };
  
  const { data, error, isLoading, mutate } = useSWR<Work[]>(
    token ? "/works" : null,
    fetcher
  );

  return {
    works: data || [],
    error,
    isLoading,
    mutate,
  };
}

export function useWork(id: string | null) {
  const { token } = useAuthStore();
  
  if (!id) {
    if (process.env.NODE_ENV === "development") {
      console.warn("❗ [useWork] id no está definido");
    }
    return { work: null, error: null, isLoading: false, mutate: async () => {} };
  }
  
  const fetcher = async (key: string): Promise<Work> => {
    const response = await apiClient.get<Work>(key);
    return (response as any)?.data || response;
  };
  
  const { data, error, isLoading, mutate } = useSWR<Work>(
    token && id ? `/works/${id}` : null,
    fetcher
  );

  return {
    work: data || null,
    error,
    isLoading,
    mutate,
  };
}

export const workApi = {
  create: (data: CreateWorkData) => {
    return apiClient.post<Work>("/works", data);
  },
  update: (id: string, data: UpdateWorkData) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [workApi.update] id no está definido");
      }
      throw new Error("ID de obra no está definido");
    }
    return apiClient.patch<Work>(`/works/${id}`, data);
  },
  delete: (id: string) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [workApi.delete] id no está definido");
      }
      throw new Error("ID de obra no está definido");
    }
    return apiClient.delete(`/works/${id}`);
  },
  close: (id: string) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [workApi.close] id no está definido");
      }
      throw new Error("ID de obra no está definido");
    }
    return apiClient.post<Work>(`/works/${id}/close`);
  },
  allowPostClosure: (id: string) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [workApi.allowPostClosure] id no está definido");
      }
      throw new Error("ID de obra no está definido");
    }
    return apiClient.post<Work>(`/works/${id}/allow-post-closure`);
  },
  updateProgress: (id: string) => {
    if (!id) {
      if (process.env.NODE_ENV === "development") {
        console.warn("❗ [workApi.updateProgress] id no está definido");
      }
      throw new Error("ID de obra no está definido");
    }
    return apiClient.post<Work>(`/works/${id}/update-progress`);
  },
};

