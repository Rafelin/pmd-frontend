"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingState } from "@/components/ui/LoadingState";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { parseBackendError } from "@/lib/parse-backend-error";
import { useCan } from "@/lib/acl";
import { AdvanceForm } from "@/components/advances/AdvanceForm";
import { AdvanceList } from "@/components/advances/AdvanceList";
import { useEmployeeAdvances, employeeAdvancesApi } from "@/hooks/api/employeeAdvances";
import { useEmployees } from "@/hooks/api/employees";
import type { CreateEmployeeAdvanceData, UpdateEmployeeAdvanceData } from "@/lib/types/employee-advance";

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

function EmployeeAdvancesContent() {
  const searchParams = useSearchParams();
  const employeeIdFromUrl = searchParams?.get("employee_id");
  
  const [filterByOrganization, setFilterByOrganization] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedWeekStartDate, setSelectedWeekStartDate] = useState<string>("");

  // Establecer el filtro de empleado desde la URL cuando se carga la página
  useEffect(() => {
    if (employeeIdFromUrl) {
      setSelectedEmployeeId(employeeIdFromUrl);
    }
  }, [employeeIdFromUrl]);

  const { advances, isLoading, error, mutate } = useEmployeeAdvances({
    filterByOrganization,
    employee_id: selectedEmployeeId || undefined,
    week_start_date: selectedWeekStartDate || undefined,
  });

  const { employees, isLoading: isLoadingEmployees } = useEmployees({
    filterByOrganization,
    isActive: true,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const canCreate = useCan("employee_advances.create");

  const handleClearFilters = () => {
    setSelectedEmployeeId("");
    setSelectedWeekStartDate("");
  };

  const hasActiveFilters = selectedEmployeeId || selectedWeekStartDate;

  const handleCreate = async (data: CreateEmployeeAdvanceData | UpdateEmployeeAdvanceData) => {
    setIsSubmitting(true);
    try {
      await employeeAdvancesApi.create(data as CreateEmployeeAdvanceData);
      await mutate();
      toast.success("Adelanto creado correctamente");
      setIsCreateOpen(false);
    } catch (err: unknown) {
      toast.error(parseBackendError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingState message="Cargando adelantos…" />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Error al cargar los adelantos: {error.message || "Error desconocido"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <BotonVolver />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Adelantos</h1>
            <p className="text-gray-600">Gestión de adelantos de empleados</p>
          </div>
          {canCreate && (
            <Button
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Adelanto
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Filtro por Empleado */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="employeeFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Empleado
              </label>
              <select
                id="employeeFilter"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#162F7F] focus:border-[#162F7F] outline-none text-sm"
              >
                <option value="">Todos los empleados</option>
                {employees?.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName || employee.name || employee.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Semana */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="weekFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Semana
              </label>
              <Input
                id="weekFilter"
                type="date"
                value={selectedWeekStartDate}
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value);
                    const weekStart = getWeekStart(date);
                    setSelectedWeekStartDate(formatDate(weekStart));
                  } else {
                    setSelectedWeekStartDate("");
                  }
                }}
                className="w-full"
              />
            </div>

            {/* Botón para limpiar filtros */}
            {hasActiveFilters && (
              <div>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AdvanceList
        advances={advances || []}
        onRefresh={async () => {
          await mutate();
        }}
      />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo Adelanto" size="lg">
        <AdvanceForm onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} isLoading={isSubmitting} />
      </Modal>
    </div>
  );
}

export default function EmployeeAdvancesPage() {
  return (
    <ProtectedRoute>
      <EmployeeAdvancesContent />
    </ProtectedRoute>
  );
}

