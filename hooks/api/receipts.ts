import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type {
  ReceiptPrintType,
  PrintReceiptsResponse,
  WeekReceiptsResponse,
  EmployeeReceipt,
  ContractorReceipt,
} from "@/lib/types/receipts";

export function usePrintReceipts(
  weekStartDate: string | null,
  type: ReceiptPrintType,
  filters?: { filterByOrganization?: boolean; enabled?: boolean },
) {
  const { token } = useAuthStore();

  const fetcher = (key: [string, string, string, string]) => {
    const [, week, printType, filterByOrg] = key;
    const params = new URLSearchParams();
    if (filterByOrg === "1") params.set("filterByOrganization", "true");
    const qs = params.toString();
    const url = qs
      ? `/payroll/receipts/print/${printType}/${week}?${qs}`
      : `/payroll/receipts/print/${printType}/${week}`;
    return apiClient.get(url);
  };

  const { data, error, isLoading, mutate } = useSWR(
    token && weekStartDate && (filters?.enabled ?? true)
      ? (["payroll/receipts/print", weekStartDate, type, filters?.filterByOrganization ? "1" : "0"] as const)
      : null,
    fetcher,
  );

  const resp = (data as any)?.data || data || null;

  return {
    receipts: resp as PrintReceiptsResponse | null,
    error,
    isLoading,
    mutate,
  };
}

export const receiptsApi = {
  getEmployeeReceipt: (employeeId: string, weekStartDate: string, params?: { filterByOrganization?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.filterByOrganization) sp.set("filterByOrganization", "true");
    const qs = sp.toString();
    const url = qs
      ? `/payroll/receipts/employee/${employeeId}/week/${weekStartDate}?${qs}`
      : `/payroll/receipts/employee/${employeeId}/week/${weekStartDate}`;
    return apiClient.get<EmployeeReceipt>(url);
  },
  getContractorReceipt: (contractorId: string, weekStartDate: string, params?: { filterByOrganization?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.filterByOrganization) sp.set("filterByOrganization", "true");
    const qs = sp.toString();
    const url = qs
      ? `/payroll/receipts/contractor/${contractorId}/week/${weekStartDate}?${qs}`
      : `/payroll/receipts/contractor/${contractorId}/week/${weekStartDate}`;
    return apiClient.get<ContractorReceipt>(url);
  },
  getWeekReceipts: (weekStartDate: string, params?: { filterByOrganization?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.filterByOrganization) sp.set("filterByOrganization", "true");
    const qs = sp.toString();
    const url = qs ? `/payroll/receipts/week/${weekStartDate}?${qs}` : `/payroll/receipts/week/${weekStartDate}`;
    return apiClient.get<WeekReceiptsResponse>(url);
  },
  getPrintReceipts: (type: ReceiptPrintType, weekStartDate: string, params?: { filterByOrganization?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.filterByOrganization) sp.set("filterByOrganization", "true");
    const qs = sp.toString();
    const url = qs
      ? `/payroll/receipts/print/${type}/${weekStartDate}?${qs}`
      : `/payroll/receipts/print/${type}/${weekStartDate}`;
    return apiClient.get<PrintReceiptsResponse>(url);
  },
};

