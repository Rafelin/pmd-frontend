"use client";

import { useState } from "react";
import { AttendanceCell } from "./AttendanceCell";
import { LateHoursModal } from "./LateHoursModal";
import { Attendance, AttendanceStatus } from "@/lib/types/attendance";
import { Employee } from "@/lib/types/employee";
import { attendanceApi } from "@/hooks/api/attendance";
import { useToast } from "@/components/ui/Toast";
import { parseBackendError } from "@/lib/parse-backend-error";

interface AttendanceSheetProps {
  employees: Employee[];
  weekStartDate: Date;
  attendance: Attendance[];
  onRefresh: () => void;
  isLoading?: boolean;
}

/**
 * Get all dates in a week (Monday to Sunday)
 */
function getWeekDates(weekStart: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get attendance for a specific employee and date
 */
function getAttendanceForDate(
  attendance: Attendance[],
  employeeId: string,
  date: string
): Attendance | null {
  return (
    attendance.find(
      (a) => a.employee_id === employeeId && a.date === date
    ) || null
  );
}

/**
 * Cycle through attendance status: null -> PRESENT -> ABSENT -> LATE -> null
 */
function getNextStatus(currentStatus: AttendanceStatus | null): AttendanceStatus | null {
  if (!currentStatus) return AttendanceStatus.PRESENT;
  if (currentStatus === AttendanceStatus.PRESENT) return AttendanceStatus.ABSENT;
  if (currentStatus === AttendanceStatus.ABSENT) return AttendanceStatus.LATE;
  return null; // LATE -> null (delete)
}

export function AttendanceSheet({
  employees,
  weekStartDate,
  attendance,
  onRefresh,
  isLoading = false,
}: AttendanceSheetProps) {
  const [selectedCell, setSelectedCell] = useState<{
    employeeId: string;
    date: string;
  } | null>(null);
  const [showLateHoursModal, setShowLateHoursModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const weekDates = getWeekDates(weekStartDate);
  const weekStartDateStr = formatDate(weekStartDate);

  const handleCellClick = async (
    employeeId: string,
    date: string,
    currentAttendance: Attendance | null
  ) => {
    if (isSubmitting || isLoading) return;

    const currentStatus = currentAttendance?.status || null;
    const nextStatus = getNextStatus(currentStatus);

    // If next status is LATE, show modal for late hours
    if (nextStatus === AttendanceStatus.LATE) {
      setSelectedCell({ employeeId, date });
      setShowLateHoursModal(true);
      return;
    }

    // Otherwise, create/update/delete attendance
    await updateAttendance(employeeId, date, nextStatus, null);
  };

  const handleLateHoursConfirm = async (hours: number) => {
    if (!selectedCell) return;

    await updateAttendance(
      selectedCell.employeeId,
      selectedCell.date,
      AttendanceStatus.LATE,
      hours
    );
    setShowLateHoursModal(false);
    setSelectedCell(null);
  };

  const updateAttendance = async (
    employeeId: string,
    date: string,
    status: AttendanceStatus | null,
    lateHours: number | null
  ) => {
    setIsSubmitting(true);
    try {
      // Find existing attendance
      const existing = getAttendanceForDate(attendance, employeeId, date);

      if (!status && existing) {
        // Delete attendance
        await attendanceApi.delete(existing.id);
        toast.success("Asistencia eliminada");
      } else if (existing) {
        // Update existing
        await attendanceApi.update(existing.id, {
          status: status ?? undefined,
          late_hours: lateHours || undefined,
        });
        toast.success("Asistencia actualizada");
      } else {
        // Create new
        await attendanceApi.create({
          employee_id: employeeId,
          date,
          status: status!,
          late_hours: lateHours || undefined,
        });
        toast.success("Asistencia registrada");
      }

      await onRefresh();
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al actualizar asistencia:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDayName = (date: Date): string => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return days[date.getDay()];
  };

  const getDaysWorked = (employeeId: string): number => {
    return attendance.filter(
      (a) =>
        a.employee_id === employeeId &&
        (a.status === AttendanceStatus.PRESENT ||
          a.status === AttendanceStatus.LATE)
    ).length;
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold sticky left-0 bg-gray-50 z-10">
                Empleado
              </th>
              {weekDates.map((date, idx) => (
                <th
                  key={idx}
                  className="border border-gray-300 px-3 py-2 text-center font-semibold min-w-[100px]"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">
                      {getDayName(date)}
                    </span>
                    <span className="text-sm">
                      {date.getDate()}/{date.getMonth() + 1}
                    </span>
                  </div>
                </th>
              ))}
              <th className="border border-gray-300 px-4 py-2 text-center font-semibold bg-gray-50">
                Días Trab.
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                >
                  No hay empleados registrados
                </td>
              </tr>
            ) : (
              employees.map((employee) => {
                const daysWorked = getDaysWorked(employee.id);
                return (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 sticky left-0 bg-white z-10">
                      <div className="font-medium">
                        {employee.fullName || employee.name || employee.nombre}
                      </div>
                      {employee.position && (
                        <div className="text-xs text-gray-500">
                          {employee.position}
                        </div>
                      )}
                    </td>
                    {weekDates.map((date, idx) => {
                      const dateStr = formatDate(date);
                      const cellAttendance = getAttendanceForDate(
                        attendance,
                        employee.id,
                        dateStr
                      );
                      return (
                        <td
                          key={idx}
                          className="border border-gray-300 px-1 py-1"
                        >
                          <AttendanceCell
                            status={cellAttendance?.status || null}
                            lateHours={cellAttendance?.late_hours || null}
                            onClick={() =>
                              handleCellClick(employee.id, dateStr, cellAttendance)
                            }
                            disabled={isSubmitting || isLoading}
                          />
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold bg-gray-50">
                      {daysWorked}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <LateHoursModal
        isOpen={showLateHoursModal}
        onClose={() => {
          setShowLateHoursModal(false);
          setSelectedCell(null);
        }}
        onConfirm={handleLateHoursConfirm}
        initialHours={
          selectedCell
            ? getAttendanceForDate(
                attendance,
                selectedCell.employeeId,
                selectedCell.date
              )?.late_hours || null
            : null
        }
        isLoading={isSubmitting}
      />
    </>
  );
}
