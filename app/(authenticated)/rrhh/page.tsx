"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useEmployees, employeeApi } from "@/hooks/api/employees";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmployeesList } from "@/components/rrhh/EmployeesList";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { useToast } from "@/components/ui/Toast";
import { Plus } from "lucide-react";
import { Employee, CreateEmployeeData, UpdateEmployeeData } from "@/lib/types/employee";
import { parseBackendError } from "@/lib/parse-backend-error";
import { useCan } from "@/lib/acl";

function RRHHContent() {
  const [filterByOrganization, setFilterByOrganization] = useState(false);
  const { employees, isLoading, error, mutate } = useEmployees({
    filterByOrganization,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  
  const canCreate = useCan("employees.create");

  const handleCreate = async (data: CreateEmployeeData | UpdateEmployeeData) => {
    setIsSubmitting(true);
    try {
      if (!data.fullName) {
        toast.error("El nombre completo es requerido");
        setIsSubmitting(false);
        return;
      }
      await employeeApi.create(data as CreateEmployeeData);
      await mutate();
      toast.success("Empleado creado correctamente");
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al crear empleado:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Cargando empleados…" />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Error al cargar los empleados: {error.message || "Error desconocido"}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <BotonVolver />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Recursos Humanos</h1>
              <p className="text-gray-600">Gestión de empleados y personal</p>
            </div>
            {canCreate && (
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Empleado
              </Button>
            )}
          </div>
        </div>

        {/* Filtro por organización */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
          <span className="text-xs text-gray-500">
            (Por defecto se muestran todos los empleados)
          </span>
        </div>

        <EmployeesList employees={employees || []} onRefresh={mutate} />

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Nuevo Empleado"
          size="lg"
        >
          <EmployeeForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={isSubmitting}
          />
        </Modal>
      </div>
    </>
  );
}

export default function RRHHPage() {
  return (
    <ProtectedRoute>
      <RRHHContent />
    </ProtectedRoute>
  );
}
