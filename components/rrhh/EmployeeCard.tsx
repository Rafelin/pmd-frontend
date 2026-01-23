"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { employeeApi } from "@/hooks/api/employees";
import { useToast } from "@/components/ui/Toast";
import { parseBackendError } from "@/lib/parse-backend-error";
import { Edit, Trash2, Eye } from "lucide-react";
import { Employee, UpdateEmployeeData, EmployeeTrade } from "@/lib/types/employee";
import { useCan } from "@/lib/acl";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface EmployeeCardProps {
  employee: Employee;
  onRefresh?: () => void;
}

export function EmployeeCard({ employee, onRefresh }: EmployeeCardProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  
  const canUpdate = useCan("employees.update");
  const canDelete = useCan("employees.delete");
  
  const getEmployeeName = () => {
    return employee.fullName || employee.name || employee.nombre || "Sin nombre";
  };

  const getTradeLabel = (trade?: EmployeeTrade | null) => {
    if (!trade) return null;
    const tradeMap: Record<EmployeeTrade, string> = {
      [EmployeeTrade.ALBANILERIA]: "Albañilería",
      [EmployeeTrade.STEEL_FRAMING]: "Steel Framing",
      [EmployeeTrade.PINTURA]: "Pintura",
      [EmployeeTrade.PLOMERIA]: "Plomería",
      [EmployeeTrade.ELECTRICIDAD]: "Electricidad",
    };
    return tradeMap[trade] || trade;
  };

  const handleUpdate = async (data: UpdateEmployeeData) => {
    setIsSubmitting(true);
    try {
      await employeeApi.update(employee.id, data);
      await onRefresh?.();
      toast.success("Empleado actualizado correctamente");
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al actualizar empleado:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await employeeApi.delete(employee.id);
      await onRefresh?.();
      toast.success("Empleado eliminado correctamente");
      setIsDeleteModalOpen(false);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al eliminar empleado:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {getEmployeeName()}
              </h3>
              {employee.trade && (
                <Badge variant="info" className="text-xs">
                  {getTradeLabel(employee.trade)}
                </Badge>
              )}
            </div>
            {!employee.isActive && (
              <Badge variant="error" className="text-xs">
                Inactivo
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            {employee.email && (
              <p>
                <span className="font-medium">Email:</span> {employee.email}
              </p>
            )}
            {employee.phone && (
              <p>
                <span className="font-medium">Teléfono:</span> {employee.phone}
              </p>
            )}
            {employee.daily_salary && (
              <p>
                <span className="font-medium">Salario diario:</span> ${employee.daily_salary.toLocaleString('es-AR')}
              </p>
            )}
            {employee.work && (
              <p>
                <span className="font-medium">Obra:</span> {employee.work.name}
              </p>
            )}
            {employee.position && (
              <p>
                <span className="font-medium">Puesto:</span> {employee.position}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/rrhh/${employee.id}`)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            {canUpdate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Empleado"
        size="lg"
      >
        <EmployeeForm
          initialData={employee}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Empleado"
        description={`¿Estás seguro de que deseas eliminar a ${getEmployeeName()}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isSubmitting}
      />
    </>
  );
}
