/**
 * Tipos TypeScript para Attendance del frontend
 * Basado en la entidad Attendance del backend (RESUMEN_IMPLEMENTACION_PMD_PRINCIPAL.md)
 */

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  status: AttendanceStatus;
  late_hours?: number | null;
  week_start_date: string;
  organization_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAttendanceData {
  employee_id: string;
  date: string;
  status?: AttendanceStatus;
  late_hours?: number;
}

export interface UpdateAttendanceData {
  date?: string;
  status?: AttendanceStatus;
  late_hours?: number;
}

export interface BulkAttendanceData {
  week_start_date: string;
  work_id?: string;
  attendances: CreateAttendanceData[];
}
