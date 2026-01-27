"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useEmployees, employeeApi } from "@/hooks/api/employees";
import { useWorks } from "@/hooks/api/works";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmployeesList } from "@/components/rrhh/EmployeesList";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { useToast } from "@/components/ui/Toast";
import { Plus } from "lucide-react";
import { CreateEmployeeData, UpdateEmployeeData, EmployeeTrade } from "@/lib/types/employee";
import { parseBackendError } from "@/lib/parse-backend-error";
import { useCan } from "@/lib/acl";

const TRADE_LABELS: Record<EmployeeTrade, string> = {
  [EmployeeTrade.ALBANILERIA]: "Albañilería",
  [EmployeeTrade.STEEL_FRAMING]: "Steel Framing",
  [EmployeeTrade.PINTURA]: "Pintura",
  [EmployeeTrade.PLOMERIA]: "Plomería",
  [EmployeeTrade.ELECTRICIDAD]: "Electricidad",
};

function RRHHContent() {
  const searchParams = useSearchParams();
  const [filterByOrganization, setFilterByOrganization] = useState(false);
  const [workId, setWorkId] = useState<string>("");
  const [trade, setTrade] = useState<string>("");

  const { works } = useWorks();
  
  // Memoizar los filtros para evitar recrear el objeto en cada render
  const employeeFilters = useMemo(
    () => ({
      filterByOrganization,
      work_id: workId || undefined,
      trade: trade || undefined,
      isActive: true,
    }),
    [filterByOrganization, workId, trade]
  );

  const { employees, isLoading, error, mutate } = useEmployees(employeeFilters);

  useEffect(() => {
    const q = searchParams.get("work_id");
    if (q) setWorkId(q);
  }, [searchParams]);
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

        {/* Filtros: Obra, Rubro */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <label htmlFor="filter-work" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Obra:
            </label>
            <select
              id="filter-work"
              value={workId}
              onChange={(e) => setWorkId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white min-w-[200px]"
            >
              <option value="">Todas</option>
              {works?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-trade" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Rubro:
            </label>
            <select
              id="filter-trade"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white min-w-[180px]"
            >
              <option value="">Todos</option>
              {(Object.keys(TRADE_LABELS) as EmployeeTrade[]).map((t) => (
                <option key={t} value={t}>
                  {TRADE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
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
