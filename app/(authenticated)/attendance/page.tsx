"use client";

import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAttendance } from "@/hooks/api/attendance";
import { useEmployees } from "@/hooks/api/employees";
import { useWorks } from "@/hooks/api/works";
import { LoadingState } from "@/components/ui/LoadingState";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { AttendanceSheet } from "@/components/attendance/AttendanceSheet";

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

function AttendanceContent() {
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDate(getWeekStart(new Date()))
  );
  const [filterByOrganization, setFilterByOrganization] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string>("");

  const weekStartDate = useMemo(() => {
    return selectedDate ? new Date(selectedDate) : getWeekStart(new Date());
  }, [selectedDate]);

  const { works } = useWorks();

  const { attendance, isLoading: isLoadingAttendance, error: attendanceError, mutate } = useAttendance({
    filterByOrganization,
    week_start_date: formatDate(weekStartDate),
    work_id: selectedWorkId || undefined,
  });

  const { employees, isLoading: isLoadingEmployees, error: employeesError } = useEmployees({
    filterByOrganization,
    isActive: true,
    work_id: selectedWorkId || undefined,
  });

  const isLoading = isLoadingAttendance || isLoadingEmployees;
  const error = attendanceError || employeesError;

  const handlePreviousWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(formatDate(newDate));
  };

  const handleNextWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(formatDate(newDate));
  };

  const handleToday = () => {
    setSelectedDate(formatDate(getWeekStart(new Date())));
  };

  if (isLoading) {
    return <LoadingState message="Cargando asistencias…" />;
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
          <BotonVolver />
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
        <BotonVolver />
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold mb-2">Error al cargar las asistencias</p>
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
      <BotonVolver />
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Control de Asistencia
        </h1>
        <p className="text-gray-600">Gestión de asistencia semanal de empleados</p>
      </div>

      {/* Filtros y navegación */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Selector de semana */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Semana:
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : new Date();
                  setSelectedDate(formatDate(getWeekStart(date)));
                }}
                className="w-auto"
              />
            </div>

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

            {/* Navegación */}
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

            {/* Filtro por organización */}
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

      {/* Información de la semana */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium">Semana del:</span>{" "}
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
            <p className="mt-1">
              <span className="font-medium">Total de registros:</span>{" "}
              {attendance?.length || 0}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card>
        <CardContent className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Instrucciones:</strong> Selecciona el estado de asistencia desde el menú desplegable en cada celda.
            Si seleccionas &quot;Tarde&quot;, se abrirá un modal para ingresar las horas de tardanza.
          </p>
        </CardContent>
      </Card>

      {/* Planilla de asistencia */}
      <Card>
        <CardContent className="p-4">
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

export default function AttendancePage() {
  return (
    <ProtectedRoute>
      <AttendanceContent />
    </ProtectedRoute>
  );
}
