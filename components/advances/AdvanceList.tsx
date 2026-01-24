"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { parseBackendError } from "@/lib/parse-backend-error";
import { AdvanceForm } from "./AdvanceForm";
import type { EmployeeAdvance, UpdateEmployeeAdvanceData } from "@/lib/types/employee-advance";
import { employeeAdvancesApi } from "@/hooks/api/employeeAdvances";
import { useCan } from "@/lib/acl";

interface AdvanceListProps {
  advances: EmployeeAdvance[];
  onRefresh: () => Promise<void> | void;
}

export function AdvanceList({ advances, onRefresh }: AdvanceListProps) {
  const toast = useToast();
  const canUpdate = useCan("employee_advances.update");
  const canDelete = useCan("employee_advances.delete");

  const [selected, setSelected] = useState<EmployeeAdvance | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rows = useMemo(() => advances || [], [advances]);

  const handleEdit = async (data: UpdateEmployeeAdvanceData) => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await employeeAdvancesApi.update(selected.id, data);
      await onRefresh();
      toast.success("Adelanto actualizado");
      setIsEditOpen(false);
      setSelected(null);
    } catch (err: unknown) {
      toast.error(parseBackendError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await employeeAdvancesApi.delete(id);
      await onRefresh();
      toast.success("Adelanto eliminado");
    } catch (err: unknown) {
      toast.error(parseBackendError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!rows.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
        No hay adelantos registrados.
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Semana (descuento)
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {a.employee?.fullName ?? a.employee_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.week_start_date}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {Number(a.amount).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.description ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      {canUpdate && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelected(a);
                            setIsEditOpen(true);
                          }}
                          disabled={isSubmitting}
                        >
                          Editar
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(a.id)}
                          disabled={isSubmitting}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelected(null);
        }}
        title="Editar Adelanto"
        size="lg"
      >
        <AdvanceForm
          initialData={selected}
          onSubmit={handleEdit}
          onCancel={() => {
            setIsEditOpen(false);
            setSelected(null);
          }}
          isLoading={isSubmitting}
        />
      </Modal>
    </>
  );
}

