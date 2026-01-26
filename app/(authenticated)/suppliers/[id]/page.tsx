"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useSupplier, supplierApi } from "@/hooks/api/suppliers";
import { useAlertsStore } from "@/store/alertsStore";
import { useAuthStore } from "@/store/authStore";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { useToast } from "@/components/ui/Toast";
import { AlertCircle, Unlock, FileText, CheckCircle, XCircle } from "lucide-react";
import { SupplierType, FiscalCondition } from "@/lib/types/supplier";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useContractorCertifications } from "@/hooks/api/contractorCertifications";
import { useContracts } from "@/hooks/api/contracts";
import { ContractorProgress } from "@/components/contractors/ContractorProgress";
import { ContractorCertificationList } from "@/components/contractors/ContractorCertificationList";

function SupplierDetailContent() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore.getState().user;
  const toast = useToast();
  const { alerts, fetchAlerts } = useAlertsStore();
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);

  const id =
    typeof params?.id === "string"
      ? params.id
      : "";

  const { supplier, isLoading, error, mutate } = useSupplier(id);
  const isContractor = supplier?.type === SupplierType.CONTRACTOR || (supplier as any)?.type === "contractor";
  const { certifications, mutate: mutateCerts } = useContractorCertifications({
    supplier_id: id || "",
    enabled: Boolean(isContractor && id),
  });
  const { contracts } = useContracts();
  
  // Verificar permisos
  const isDirection = user?.role?.name === "DIRECTION";
  const canApproveReject = user?.role?.name === "ADMINISTRATION" || isDirection;
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAlerts();
    }
  }, [id, fetchAlerts]);

  if (!id) {
    return null;
  }

  if (isLoading) {
    return (
      <LoadingState message="Cargando proveedor…" />
    );
  }

  if (error) {
    return (
      <>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-pmd">
          Error al cargar el proveedor: {error.message || "Error desconocido"}
        </div>
        <div className="mt-4">
          <Button onClick={() => router.push("/suppliers")}>Volver a Proveedores</Button>
        </div>
      </>
    );
  }

  if (!supplier) {
    return (
      <>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-pmd">
          Proveedor no encontrado
        </div>
        <div className="mt-4">
          <Button onClick={() => router.push("/suppliers")}>Volver a Proveedores</Button>
        </div>
      </>
    );
  }

  const getSupplierName = () => {
    return supplier.nombre || supplier.name || "Sin nombre";
  };

  const getSupplierStatus = () => {
    return supplier.estado || supplier.status || "pendiente";
  };

  const isProvisional = getSupplierStatus().toLowerCase() === "provisional" || 
                        getSupplierStatus().toLowerCase() === "pending" || 
                        getSupplierStatus().toLowerCase() === "pendiente";

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

  // Función para desbloquear proveedor (solo Direction)
  const handleUnblockClick = () => {
    if (!id || !isDirection) return;
    setShowUnblockModal(true);
  };

  const handleConfirmUnblock = async () => {
    if (!id || !isDirection) return;
    
    setIsUnblocking(true);
    setShowUnblockModal(false);
    try {
      await supplierApi.update(id, { status: "APPROVED" as any });
      await mutate();
      toast.success("Proveedor desbloqueado correctamente");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al desbloquear el proveedor";
      toast.error(errorMessage);
    } finally {
      setIsUnblocking(false);
    }
  };

  // Función para aprobar proveedor
  const handleApproveClick = () => {
    if (!id || !canApproveReject) return;
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!id || !canApproveReject) return;

    setIsApproving(true);
    setShowApproveModal(false);
    try {
      await supplierApi.approve(id);
      await mutate();
      toast.success("Proveedor aprobado correctamente");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al aprobar el proveedor";
      toast.error(errorMessage);
    } finally {
      setIsApproving(false);
    }
  };

  // Función para rechazar proveedor
  const handleRejectClick = () => {
    if (!id || !canApproveReject) return;
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!id || !canApproveReject) return;

    setIsRejecting(true);
    setShowRejectModal(false);
    try {
      await supplierApi.reject(id);
      await mutate();
      toast.success("Proveedor rechazado correctamente. Se ha enviado una alerta al operador.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al rechazar el proveedor";
      toast.error(errorMessage);
    } finally {
      setIsRejecting(false);
    }
  };

  // Obtener información de ART del proveedor
  const artDocument = (supplier as any)?.documents?.find(
    (doc: any) => doc.document_type === "ART" || doc.document_type === "art"
  );
  const isBlocked = getSupplierStatus().toLowerCase() === "blocked" || getSupplierStatus().toLowerCase() === "bloqueado";
  
  // Filtrar alertas relacionadas con este proveedor
  const supplierAlerts = alerts.filter(
    (alert) => alert.supplier_id === id
  );

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "No especificada";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Función para renderizar un campo si existe
  const renderField = (label: string, value: any, formatter?: (val: any) => string) => {
    if (!value) return null;
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{label}</h3>
        <p className="text-gray-900">{formatter ? formatter(value) : String(value)}</p>
      </div>
    );
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

  return (
    <div className="space-y-6">
        <div>
          <BotonVolver backTo="/suppliers" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-pmd-darkBlue mb-2">Detalle del proveedor</h1>
            <p className="text-gray-600">Información completa del proveedor seleccionado</p>
          </div>
          <div className="flex gap-2">
            {canApproveReject && isProvisional && (
              <>
                <Button
                  variant="primary"
                  onClick={handleApproveClick}
                  disabled={isApproving || isRejecting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isApproving ? "Aprobando..." : "Aprobar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRejectClick}
                  disabled={isApproving || isRejecting}
                  style={{ borderColor: "rgba(255, 59, 48, 1)", color: "rgba(255, 59, 48, 1)" }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isRejecting ? "Rechazando..." : "Rechazar"}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => router.push("/suppliers")}>
              Volver a Proveedores
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{getSupplierName()}</CardTitle>
              <div className="flex gap-2">
                {isBlocked && (
                  <Badge variant="error">Bloqueado</Badge>
                )}
                <Badge variant={getStatusVariant(getSupplierStatus())}>
                  {getStatusLabel(getSupplierStatus())}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mensaje informativo cuando el proveedor está bloqueado */}
            {isBlocked && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      Proveedor Bloqueado
                    </p>
                    <p className="text-sm text-red-700 mb-3">
                      Este proveedor ha sido bloqueado automáticamente porque su ART está vencida. 
                      No se pueden crear gastos con este proveedor hasta que sea desbloqueado.
                    </p>
                    {isDirection && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleUnblockClick}
                        disabled={isUnblocking}
                        style={{ borderColor: "rgba(255, 59, 48, 1)", color: "rgba(255, 59, 48, 1)" }}
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        {isUnblocking ? "Desbloqueando..." : "Desbloquear Proveedor"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField("Nombre", (supplier as any).nombre || supplier.name)}
              {renderField("Email", supplier.email)}
              {renderField("Contacto", (supplier as any).contacto || (supplier as any).contact || (supplier as any).contactName)}
              {renderField("Teléfono", (supplier as any).telefono || (supplier as any).phone)}
              {renderField("Dirección", (supplier as any).direccion || (supplier as any).address)}
              {renderField("CUIT", (supplier as any).cuit || (supplier as any).CUIT)}
              {renderField("Tipo de Proveedor", getTypeLabel(supplier.type))}
              {renderField("Condición Fiscal", getFiscalConditionLabel(supplier.fiscal_condition))}
              {renderField("Estado", getStatusLabel(getSupplierStatus()))}
              {renderField("Fecha de creación", supplier.createdAt, formatDate)}
              {renderField("Última actualización", supplier.updatedAt, formatDate)}
            </div>

            {/* Sección de contratista */}
            {isContractor && (
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contratista</h3>
                <ContractorProgress supplier={supplier as any} />
                <ContractorCertificationList
                  supplierId={supplier.id}
                  certifications={certifications || []}
                  contracts={contracts || []}
                  onRefresh={async () => {
                    await mutate();
                    await mutateCerts();
                  }}
                />
              </div>
            )}

            {/* Información de ART */}
            {artDocument && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">Información de ART</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField("Fecha de vencimiento", artDocument.expiration_date, formatDate)}
                  {renderField("Estado del documento", artDocument.is_valid ? "Válido" : "Inválido")}
                  {artDocument.expiration_date && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Estado de vencimiento</h3>
                      {(() => {
                        const expirationDate = new Date(artDocument.expiration_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        expirationDate.setHours(0, 0, 0, 0);
                        const isExpired = expirationDate < today;
                        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        if (isExpired) {
                          return (
                            <Badge variant="error">
                              Vencido hace {Math.abs(daysUntilExpiration)} día(s)
                            </Badge>
                          );
                        } else if (daysUntilExpiration <= 30) {
                          return (
                            <Badge variant="warning">
                              Vence en {daysUntilExpiration} día(s)
                            </Badge>
                          );
                        } else {
                          return (
                            <Badge variant="success">
                              Válido hasta {formatDate(artDocument.expiration_date)}
                            </Badge>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mostrar campos adicionales si existen */}
            {Object.keys(supplier).some(
              (key) =>
                !["id", "nombre", "name", "email", "contacto", "contact", "contactName", "telefono", "phone", "direccion", "address", "cuit", "CUIT", "type", "fiscal_condition", "estado", "status", "createdAt", "updatedAt"].includes(
                  key
                ) && (supplier as any)[key] !== null && (supplier as any)[key] !== undefined && (supplier as any)[key] !== ""
            ) && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Información adicional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.keys(supplier)
                    .filter(
                      (key) =>
                        !["id", "nombre", "name", "email", "contacto", "contact", "contactName", "telefono", "phone", "direccion", "address", "cuit", "CUIT", "type", "fiscal_condition", "estado", "status", "createdAt", "updatedAt"].includes(
                          key
                        ) && (supplier as any)[key] !== null && (supplier as any)[key] !== undefined && (supplier as any)[key] !== ""
                    )
                    .map((key) => (
                      <div key={key}>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </h3>
                        <p className="text-gray-900">
                          {typeof (supplier as any)[key] === "object"
                            ? JSON.stringify((supplier as any)[key])
                            : String((supplier as any)[key])}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {supplier.id && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">ID del proveedor</h3>
                <p className="text-gray-600 font-mono text-sm">{supplier.id}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas relacionadas */}
        {supplierAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Alertas</CardTitle>
                <Badge variant="info">{supplierAlerts.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supplierAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.severity === "critical"
                        ? "bg-red-50 border-red-200"
                        : alert.severity === "warning"
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle
                        className={`h-4 w-4 ${
                          alert.severity === "critical"
                            ? "text-red-600"
                            : alert.severity === "warning"
                            ? "text-yellow-600"
                            : "text-blue-600"
                        }`}
                      />
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "error"
                            : alert.severity === "warning"
                            ? "warning"
                            : "info"
                        }
                      >
                        {alert.severity === "critical"
                          ? "Crítico"
                          : alert.severity === "warning"
                          ? "Advertencia"
                          : "Info"}
                      </Badge>
                      {!alert.read && (
                        <Badge variant="info" className="text-[10px]">
                          Nuevo
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{alert.title}</h4>
                    <p className="text-sm text-gray-700">{alert.message}</p>
                    {alert.createdAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(alert.createdAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Modal de confirmación para desbloquear proveedor */}
        <ConfirmationModal
          isOpen={showUnblockModal}
          onClose={() => setShowUnblockModal(false)}
          onConfirm={handleConfirmUnblock}
          title="Desbloquear proveedor"
          description="¿Estás seguro de desbloquear este proveedor? Asegúrate de que el ART esté actualizado."
          confirmText="Desbloquear"
          cancelText="Cancelar"
          variant="default"
          isLoading={isUnblocking}
        />
      </div>
  );
}

export default function SupplierDetailPage() {
  return (
    <ProtectedRoute>
      <SupplierDetailContent />
    </ProtectedRoute>
  );
}

