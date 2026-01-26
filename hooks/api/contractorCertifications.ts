import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  ContractorCertification,
  CreateContractorCertificationData,
  UpdateContractorCertificationData,
} from "@/lib/types/contractorCertification";

export function useContractorCertifications(filters?: {
  supplier_id?: string;
  week_start_date?: string;
  filterByOrganization?: boolean;
  enabled?: boolean;
}) {
  const { token } = useAuthStore();

  const fetcher = (key: [string, string, string, string]) => {
    const [, supplierId, week, filterByOrg] = key;
    const params = new URLSearchParams();
    if (supplierId) params.set("supplier_id", supplierId);
    if (week) params.set("week_start_date", week);
    if (filterByOrg === "1") params.set("filterByOrganization", "true");
    const qs = params.toString();
    const url = qs ? `/contractor-certifications?${qs}` : "/contractor-certifications";
    return apiClient.get(url);
  };

  const { data, error, isLoading, mutate } = useSWR(
    token && (filters?.enabled ?? true)
      ? ([
          "contractor-certifications",
          filters?.supplier_id ?? "",
          filters?.week_start_date ?? "",
          filters?.filterByOrganization ? "1" : "0",
        ] as const)
      : null,
    fetcher,
  );

  return {
    certifications: ((data as any)?.data || data || []) as ContractorCertification[],
    error,
    isLoading,
    mutate,
  };
}

export const contractorCertificationApi = {
  create: (data: CreateContractorCertificationData) => {
    return apiClient.post("/contractor-certifications", data);
  },
  update: (id: string, data: UpdateContractorCertificationData) => {
    return apiClient.patch(`/contractor-certifications/${id}`, data);
  },
  delete: (id: string) => {
    return apiClient.delete(`/contractor-certifications/${id}`);
  },
  listBySupplier: (supplierId: string) => {
    return apiClient.get(`/contractor-certifications/supplier/${supplierId}`);
  },
  listByWeek: (weekStartDate: string) => {
    return apiClient.get(`/contractor-certifications/week/${weekStartDate}`);
  },
};

