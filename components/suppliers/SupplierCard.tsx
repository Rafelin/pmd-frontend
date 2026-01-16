"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { SupplierForm } from "@/components/forms/SupplierForm";
import { supplierApi } from "@/hooks/api/suppliers";
import { useExpenses } from "@/hooks/api/expenses";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";
import { parseBackendError } from "@/lib/parse-backend-error";
import { Edit, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import { Supplier, UpdateSupplierData, SupplierType, FiscalCondition } from "@/lib/types/supplier";
import { useCan } from "@/lib/acl";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface SupplierCardProps {
  supplier: Supplier;
  onRefresh?: () => void;
}

export function SupplierCard({ supplier, onRefresh }: SupplierCardProps) {
  const router = useRouter();
  const user = useAuthStore.getState().user;
  const { expenses } = useExpenses();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const toast = useToast();
  
  // Verificar permisos
  const canUpdate = useCan("suppliers.update");
  const canDelete = useCan("suppliers.delete");
  const canApprove = useCan("suppliers.approve");
  const canReject = useCan("suppliers.approve"); // Reject usa el mismo permiso que approve
  
  // Obtener gastos asociados al proveedor
  const associatedExpenses = expenses?.filter(
    (exp: any) => exp.supplier_id === supplier.id || exp.supplierId === supplier.id
  ) || [];
  const hasExpenses = associatedExpenses.length > 0;
  const validatedExpenses = associatedExpenses.filter((exp: any) => exp.state === "validated").length;

  const getSupplierName = () => {
    return (supplier as any).nombre || supplier.name || "Sin nombre";
  };

  const getSupplierEmail = () => {
    return supplier.email || null;
  };

  const getSupplierContact = () => {
    return supplier.contact || (supplier as any).contacto || (supplier as any).contactName || null;
  };

  const getSupplierStatus = () => {
    return (supplier as any).estado || (supplier as any).status || "pendiente";
  };

  const isProvisional = getSupplierStatus().toLowerCase() === "provisional" || getSupplierStatus().toLowerCase() === "pending" || getSupplierStatus().toLowerCase() === "pendiente";

  const getStatusVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "aprobado" || statusLower === "approved" || statusLower === "active") {
      return "success";
    }
    if (statusLower === "pendiente" || statusLower === "pending" || statusLower === "provisional") {
      return "warning";
    }
    if (statusLower === "rechazado" || statusLower === "rejected" || statusLower === "inactive") {
      return "error";
    }
    if (statusLower === "bloqueado" || statusLower === "blocked") {
      return "error";
    }
    return "default";
  };

  const getStatusLabel = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "approved") return "Aprobado";
    if (statusLower === "active") return "Aprobado";
    if (statusLower === "pending" || statusLower === "provisional") return "Pendiente";
    if (statusLower === "rejected") return "Rechazado";
    if (statusLower === "inactive") return "Rechazado";
    if (statusLower === "blocked" || statusLower === "bloqueado") return "Bloqueado";
    return status;
  };

  const getTypeLabel = (type?: string) => {
    if (!type) return null;
    const typeMap: Record<string, string> = {
      [SupplierType.LABOR]: "Mano de obra",
      [SupplierType.MATERIALS]: "Materiales",
      [SupplierType.CONTRACTOR]: "Contratista",
      [SupplierType.SERVICES]: "Servicios",
      [SupplierType.LOGISTICS]: "Logística",
      [SupplierType.OTHER]: "Otro",
    };
    return typeMap[type] || type;
  };

  const getFiscalConditionLabel = (condition?: string) => {
    if (!condition) return null;
    const conditionMap: Record<string, string> = {
      [FiscalCondition.RI]: "Responsable Inscripto",
      [FiscalCondition.MONOTRIBUTISTA]: "Monotributista",
      [FiscalCondition.EXEMPT]: "Exento",
      [FiscalCondition.OTHER]: "Otro",
    };
    return conditionMap[condition] || condition;
  };

  const handleUpdate = async (data: UpdateSupplierData) => {
    setIsSubmitting(true);
    try {
      await supplierApi.update(supplier.id, data);
      await onRefresh?.();
      toast.success("Proveedor actualizado correctamente");
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al actualizar proveedor:", err);
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
      await supplierApi.delete(supplier.id);
      await onRefresh?.();
      toast.success("Proveedor eliminado correctamente");
      setIsDeleteModalOpen(false);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al eliminar proveedor:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveClick = () => {
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
    setIsApproving(true);
    setShowApproveModal(false);
    try {
      await supplierApi.approve(supplier.id);
      await onRefresh?.();
      toast.success("Proveedor aprobado correctamente");
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al aprobar proveedor:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    setIsRejecting(true);
    setShowRejectModal(false);
    try {
      await supplierApi.reject(supplier.id);
      await onRefresh?.();
      toast.success("Proveedor rechazado correctamente. Se ha enviado una alerta al operador.");
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error al rechazar proveedor:", err);
      }
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <Card className="border-l-4 border-[#162F7F]/40 hover:bg-white/15 transition-all">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-pmd-darkBlue mb-2">
                {getSupplierName()}
              </h3>
            </div>

            <div className="space-y-2">
              {getSupplierEmail() && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="text-sm text-gray-900 font-medium">{getSupplierEmail()}</span>
                </div>
              )}

              {getSupplierContact() && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Contacto:</span>
                  <span className="text-sm text-gray-900">{getSupplierContact()}</span>
                </div>
              )}

              {getTypeLabel(supplier.type) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Tipo:</span>
                  <span className="text-sm text-gray-900 font-medium">{getTypeLabel(supplier.type)}</span>
                </div>
              )}

              {getFiscalConditionLabel(supplier.fiscal_condition) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Condición Fiscal:</span>
                  <span className="text-sm text-gray-900 font-medium">{getFiscalConditionLabel(supplier.fiscal_condition)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Estado:</span>
                <div className="flex gap-2">
                  {(getSupplierStatus().toLowerCase() === "blocked" || getSupplierStatus().toLowerCase() === "bloqueado") && (
                    <Badge variant="error">Bloqueado</Badge>
                  )}
                  <Badge variant={getStatusVariant(getSupplierStatus())}>
                    {getStatusLabel(getSupplierStatus())}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              {/* Botones de aprobación/rechazo para proveedores provisionales */}
              {canApprove && isProvisional && (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1"
                    onClick={handleApproveClick}
                    disabled={isApproving || isRejecting}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isApproving ? "Aprobando..." : "Aprobar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                    onClick={handleRejectClick}
                    disabled={isApproving || isRejecting}
                  >
                    <XCircle className="h-4 w-4" />
                    {isRejecting ? "Rechazando..." : "Rechazar"}
                  </Button>
                </div>
              )}
              
              {/* Botones de acción generales */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1"
                  onClick={() => router.push(`/suppliers/${supplier.id}`)}
                >
                  <Eye className="h-4 w-4" />
                  Ver
                </Button>
                {canUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Proveedor"
        size="lg"
      >
        <SupplierForm
          initialData={supplier}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar el proveedor <strong>{getSupplierName()}</strong>?
          </p>
          
          {hasExpenses && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-semibold text-red-800 mb-2">
                ⚠️ Este proveedor tiene gastos asociados
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Total de gastos asociados: <strong>{associatedExpenses.length}</strong></li>
                {validatedExpenses > 0 && (
                  <li>• Gastos validados: <strong>{validatedExpenses}</strong> (tienen registros contables)</li>
                )}
              </ul>
              <p className="text-xs text-red-600 mt-2">
                Al eliminar este proveedor, los gastos asociados quedarán sin proveedor asignado.
                {validatedExpenses > 0 && " Los registros contables de los gastos validados se mantendrán."}
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación para aprobar proveedor */}
      <ConfirmationModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleConfirmApprove}
        title="Aprobar proveedor"
        description={`¿Estás seguro de aprobar el proveedor "${getSupplierName()}"?`}
        confirmText="Aprobar"
        cancelText="Cancelar"
        variant="default"
        isLoading={isApproving}
      />

      {/* Modal de confirmación para rechazar proveedor */}
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleConfirmReject}
        title="Rechazar proveedor"
        description={`¿Estás seguro de rechazar el proveedor "${getSupplierName()}"? Se enviará una alerta al operador que lo creó.`}
        confirmText="Rechazar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isRejecting}
      />
    </>
  );
}

