"use client";

import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAttendanceWeek } from "@/hooks/api/attendance";
import { useEmployees } from "@/hooks/api/employees";
import { LoadingState } from "@/components/ui/LoadingState";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AttendanceSheet } from "@/components/attendance/AttendanceSheet";
import { Card, CardContent } from "@/components/ui/Card";

/**
 * Get Monday of the week for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function WeeklyAttendanceContent({ date }: { date: string }) {
  const [filterByOrganization, setFilterByOrganization] = useState(false);

  // Parse week start date from URL param
  const weekStartDate = useMemo(() => {
    try {
      const parsed = new Date(date);
      return getWeekStart(parsed);
    } catch {
      return getWeekStart(new Date());
    }
  }, [date]);

  const weekStartDateStr = formatDate(weekStartDate);

  const { attendance, isLoading: isLoadingAttendance, error: attendanceError, mutate } =
    useAttendanceWeek(weekStartDateStr);
  const {
    employees,
    isLoading: isLoadingEmployees,
    error: employeesError,
  } = useEmployees({ filterByOrganization, isActive: true });

  const isLoading = isLoadingAttendance || isLoadingEmployees;
  const error = attendanceError || employeesError;

  const handlePreviousWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() - 7);
    window.location.href = `/attendance/week/${formatDate(newDate)}`;
  };

  const handleNextWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() + 7);
    window.location.href = `/attendance/week/${formatDate(newDate)}`;
  };

  const handleToday = () => {
    window.location.href = `/attendance/week/${formatDate(getWeekStart(new Date()))}`;
  };

  if (isLoading) {
    return <LoadingState message="Cargando planilla semanal…" />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Error al cargar la planilla:{" "}
        {error.message || "Error desconocido"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BotonVolver />
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Planilla Semanal de Asistencia
        </h1>
        <p className="text-gray-600">
          Semana del{" "}
          {weekStartDate.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}{" "}
          al{" "}
          {(() => {
            const endDate = new Date(weekStartDate);
            endDate.setDate(endDate.getDate() + 6);
            return endDate.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
          })()}
        </p>
      </div>

      {/* Navegación y filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePreviousWeek} size="sm">
                ← Semana anterior
              </Button>
              <Button variant="outline" onClick={handleToday} size="sm">
                Hoy
              </Button>
              <Button variant="outline" onClick={handleNextWeek} size="sm">
                Semana siguiente →
              </Button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <input
                type="checkbox"
                id="filterByOrganization"
                checked={filterByOrganization}
                onChange={(e) => setFilterByOrganization(e.target.checked)}
                className="w-4 h-4 text-pmd-darkBlue border-gray-300 rounded focus:ring-pmd-darkBlue"
              />
              <label
                htmlFor="filterByOrganization"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Filtrar por mi organización
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planilla */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-4 text-sm text-gray-600">
            <p>
              <strong>Instrucciones:</strong> Haz clic en cada celda para cambiar
              el estado de asistencia. El ciclo es: Sin registro → Presente →
              Ausente → Tarde → Sin registro. Si seleccionas &quot;Tarde&quot;, se abrirá
              un modal para ingresar las horas de tardanza.
            </p>
          </div>
          <AttendanceSheet
            employees={employees || []}
            weekStartDate={weekStartDate}
            attendance={attendance || []}
            onRefresh={mutate}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function WeeklyAttendancePage({
  params,
}: {
  params: { date: string };
}) {
  return (
    <ProtectedRoute>
      <WeeklyAttendanceContent date={params.date} />
    </ProtectedRoute>
  );
}
