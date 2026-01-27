import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Attendance,
  CreateAttendanceData,
  UpdateAttendanceData,
  BulkAttendanceData,
} from "@/lib/types/attendance";

export function useAttendance(filters?: {
  filterByOrganization?: boolean;
  week_start_date?: string;
  employee_id?: string;
  work_id?: string;
}) {
  const { token } = useAuthStore();
  
  const fetcher = () => {
    const params = new URLSearchParams();
    if (filters?.filterByOrganization) {
      params.append('filterByOrganization', 'true');
    }
    if (filters?.week_start_date) {
      params.append('week_start_date', filters.week_start_date);
    }
    if (filters?.employee_id) {
      params.append('employee_id', filters.employee_id);
    }
    if (filters?.work_id) {
      params.append('work_id', filters.work_id);
    }
    const queryString = params.toString();
    const url = queryString ? `/attendance?${queryString}` : '/attendance';
    return apiClient.get(url);
  };
  
  const { data, error, isLoading, mutate } = useSWR(
    token ? ["attendance", filters] : null,
    fetcher
  );

  return {
    attendance: ((data as any)?.data || data || []) as Attendance[],
    error,
    isLoading,
    mutate,
  };
}

export function useAttendanceWeek(
  weekStartDate: string | null,
  filters?: { filterByOrganization?: boolean; work_id?: string },
) {
  const { token } = useAuthStore();
  
  if (!weekStartDate) {
    return { attendance: [], error: null, isLoading: false, mutate: async () => {} };
  }
  
  const fetcher = () => {
    const params = new URLSearchParams();
    if (filters?.filterByOrganization) {
      params.append('filterByOrganization', 'true');
    }
    if (filters?.work_id) {
      params.append('work_id', filters.work_id);
    }
    const qs = params.toString();
    const url = qs ? `/attendance/week/${weekStartDate}?${qs}` : `/attendance/week/${weekStartDate}`;
    return apiClient.get(url);
  };

  const { data, error, isLoading, mutate } = useSWR(
    token && weekStartDate ? ['attendance/week', weekStartDate, filters] : null,
    fetcher
  );

  return {
    attendance: ((data as any)?.data || data || []) as Attendance[],
    error,
    isLoading,
    mutate,
  };
}

export function useAttendanceRecord(id: string | null) {
  const { token } = useAuthStore();
  
  if (!id) {
    return { attendance: null, error: null, isLoading: false, mutate: async () => {} };
  }
  
  const { data, error, isLoading, mutate } = useSWR(
    token && id ? `attendance/${id}` : null,
    () => {
      return apiClient.get(`/attendance/${id}`);
    }
  );

  return {
    attendance: ((data as any)?.data || data) as Attendance | null,
    error,
    isLoading,
    mutate,
  };
}

export const attendanceApi = {
  create: (data: CreateAttendanceData) => {
    return apiClient.post("/attendance", data);
  },
  update: (id: string, data: UpdateAttendanceData) => {
    if (!id) {
      throw new Error("ID de asistencia no está definido");
    }
    return apiClient.patch(`/attendance/${id}`, data);
  },
  delete: (id: string) => {
    if (!id) {
      throw new Error("ID de asistencia no está definido");
    }
    return apiClient.delete(`/attendance/${id}`);
  },
  bulkCreate: (data: BulkAttendanceData) => {
    return apiClient.post("/attendance/bulk", data);
  },
};
