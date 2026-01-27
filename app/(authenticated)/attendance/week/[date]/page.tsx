"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAttendanceWeek } from "@/hooks/api/attendance";
import { useEmployees } from "@/hooks/api/employees";
import { useWorks } from "@/hooks/api/works";
import { LoadingState } from "@/components/ui/LoadingState";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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

function WeeklyAttendanceContent() {
  const router = useRouter();
  const params = useParams();
  const [filterByOrganization, setFilterByOrganization] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string>("");

  // Get date from URL params
  const date = typeof params?.date === "string" ? params.date : null;

  // Parse week start date from URL param
  const weekStartDate = useMemo(() => {
    if (!date) {
      return getWeekStart(new Date());
    }
    try {
      const parsed = new Date(date);
      return getWeekStart(parsed);
    } catch {
      return getWeekStart(new Date());
    }
  }, [date]);

  const weekStartDateStr = formatDate(weekStartDate);

  const { works } = useWorks();

  const { attendance, isLoading: isLoadingAttendance, error: attendanceError, mutate } =
    useAttendanceWeek(weekStartDateStr, { 
      filterByOrganization,
      work_id: selectedWorkId || undefined,
    });
  const {
    employees,
    isLoading: isLoadingEmployees,
    error: employeesError,
  } = useEmployees({ 
    filterByOrganization, 
    isActive: true,
    work_id: selectedWorkId || undefined,
  });

  const isLoading = isLoadingAttendance || isLoadingEmployees;
  const error = attendanceError || employeesError;

  const handlePreviousWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() - 7);
    router.push(`/attendance/week/${formatDate(newDate)}`);
  };

  const handleNextWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() + 7);
    router.push(`/attendance/week/${formatDate(newDate)}`);
  };

  const handleToday = () => {
    router.push(`/attendance/week/${formatDate(getWeekStart(new Date()))}`);
  };

  if (isLoading) {
    return <LoadingState message="Cargando planilla semanal…" />;
  }

  if (error) {
    // Manejar específicamente errores 429 (Too Many Requests)
    const isRateLimitError = 
      (error as any)?.response?.status === 429 || 
      (error as any)?.status === 429 ||
      error?.message?.includes('429') ||
      error?.message?.includes('Too Many Requests');
    
    if (isRateLimitError) {
      return (
        <div className="space-y-6">
          <BotonVolver backTo="/attendance" />
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            <p className="font-semibold mb-2">Demasiadas solicitudes</p>
            <p className="text-sm">
              El servidor está recibiendo demasiadas solicitudes. Por favor, espera unos momentos antes de intentar nuevamente.
            </p>
            <Button
              variant="outline"
              onClick={() => mutate()}
              className="mt-3"
              size="sm"
            >
              Reintentar
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <BotonVolver backTo="/attendance" />
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold mb-2">Error al cargar la planilla</p>
          <p className="text-sm">{error.message || "Error desconocido"}</p>
          <Button
            variant="outline"
            onClick={() => mutate()}
            className="mt-3"
            size="sm"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BotonVolver backTo="/attendance" />
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
            {/* Filtro por obra */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Obra:
              </label>
              <Select
                value={selectedWorkId}
                onChange={(e) => setSelectedWorkId(e.target.value)}
                className="w-auto min-w-[200px]"
              >
                <option value="">Todas las obras</option>
                {works?.map((work) => (
                  <option key={work.id} value={work.id}>
                    {work.name}
                  </option>
                ))}
              </Select>
            </div>

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

            {/* <div className="flex items-center gap-2 ml-auto">
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
            </div> */}
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

export default function WeeklyAttendancePage() {
  return (
    <ProtectedRoute>
      <WeeklyAttendanceContent />
    </ProtectedRoute>
  );
}
