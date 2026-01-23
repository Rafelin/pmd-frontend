"use client";

import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAttendance } from "@/hooks/api/attendance";
import { LoadingState } from "@/components/ui/LoadingState";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

function AttendanceContent() {
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDate(getWeekStart(new Date()))
  );
  const [filterByOrganization, setFilterByOrganization] = useState(false);

  const weekStartDate = useMemo(() => {
    return selectedDate ? new Date(selectedDate) : getWeekStart(new Date());
  }, [selectedDate]);

  const { attendance, isLoading, error, mutate } = useAttendance({
    filterByOrganization,
    week_start_date: formatDate(weekStartDate),
  });

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
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Error al cargar las asistencias: {error.message || "Error desconocido"}
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

      {/* Mensaje informativo */}
      <Card>
        <CardContent className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Para ver y editar la planilla semanal completa,
            haz clic en &quot;Ver Planilla Semanal&quot; o navega a la semana específica.
            La planilla permite hacer clic en cada celda para cambiar el estado
            de asistencia (Presente → Ausente → Tarde → Sin registro).
          </p>
        </CardContent>
      </Card>

      {/* Botón para ver planilla */}
      <div className="flex justify-center">
        <Button
          variant="primary"
          onClick={() => {
            window.location.href = `/attendance/week/${formatDate(weekStartDate)}`;
          }}
        >
          Ver Planilla Semanal
        </Button>
      </div>
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
