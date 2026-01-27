"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingState } from "@/components/ui/LoadingState";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { parseBackendError } from "@/lib/parse-backend-error";
import { useCan } from "@/lib/acl";
import { AdvanceForm } from "@/components/advances/AdvanceForm";
import { AdvanceList } from "@/components/advances/AdvanceList";
import { useEmployeeAdvances, employeeAdvancesApi } from "@/hooks/api/employeeAdvances";
import type { CreateEmployeeAdvanceData, UpdateEmployeeAdvanceData } from "@/lib/types/employee-advance";

function EmployeeAdvancesContent() {
  const [filterByOrganization, setFilterByOrganization] = useState(false);
  const { advances, isLoading, error, mutate } = useEmployeeAdvances({
    filterByOrganization,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const canCreate = useCan("employee_advances.create");

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

      {/* <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <input
          type="checkbox"
          id="filterByOrganization"
          checked={filterByOrganization}
          onChange={(e) => setFilterByOrganization(e.target.checked)}
          className="w-4 h-4 text-pmd-darkBlue border-gray-300 rounded focus:ring-pmd-darkBlue"
        />
        <label htmlFor="filterByOrganization" className="text-sm font-medium text-gray-700 cursor-pointer">
          Filtrar por mi organización
        </label>
        <span className="text-xs text-gray-500">(Por defecto se muestran todos los adelantos)</span>
      </div> */}

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

