"use client";

import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/settings/UserAvatar";
import { Building2, Mail, Phone, Calendar, AlertTriangle, Bell, Edit } from "lucide-react";
import { useAlertsStore } from "@/store/alertsStore";
import { useWorks } from "@/hooks/api/works";
import { useRoles } from "@/hooks/api/roles";
import Link from "next/link";
import { Employee } from "@/lib/types/employee";
import { Work } from "@/lib/types/work";
import { Role } from "@/lib/types/role";
import { Alert } from "@/store/alertsStore";

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onEdit?: (employee: Employee) => void;
  onAssignWork?: (employee: Employee) => void;
  onViewAlerts?: (employee: Employee) => void;
}

export function EmployeeDetailModal({
  isOpen,
  onClose,
  employee,
  onEdit,
  onAssignWork,
  onViewAlerts,
}: EmployeeDetailModalProps) {
  const { alerts } = useAlertsStore();
  const { works } = useWorks();
  const { roles } = useRoles();

  if (!employee) return null;

  const getWorkName = (workId?: string) => {
    if (!workId) return null;
    const work = works.find((w: Work) => w.id === workId);
    if (!work) return null;
    return work.name || workId;
  };

  const name = employee.fullName || employee.name || (employee as any).nombre || "Sin nombre";
  const roleId = (employee as any).roleId || (employee as any).role;
  const role = roles.find((r: Role) => r.id === roleId || r.name === roleId);
  const roleName = role?.name || roleId || "Sin rol";
  const subrole = (employee as any).subrole || "";
  const isActive = employee.isActive !== false;
  const workName = getWorkName(employee.workId ?? undefined);
  const workId = employee.workId;
  const employeeAlerts = alerts.filter((alert: Alert) => {
    // Check if alert is related to this employee via user_id or metadata
    return alert.user_id === employee.id || (alert.metadata && typeof alert.metadata === 'object' && 'personId' in alert.metadata && (alert.metadata as { personId?: string }).personId === employee.id);
  });
  const unreadAlerts = employeeAlerts.filter((a) => !a.read).length;
  const criticalAlerts = employeeAlerts.filter((a) => a.severity === "critical").length;
  const warningAlerts = employeeAlerts.filter((a) => a.severity === "warning").length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del Personal" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
          <UserAvatar name={name} size="lg" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{name}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant={isActive ? "success" : "default"}>{isActive ? "Activo" : "Inactivo"}</Badge>
              <Badge variant="info">{roleName}</Badge>
              {subrole && <Badge variant="default">{subrole}</Badge>}
            </div>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Información de Contacto</h4>
          <div className="space-y-2">
            {employee.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{employee.email}</span>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{employee.phone}</span>
              </div>
            )}
            {employee.hireDate && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                  Ingreso: {new Date(employee.hireDate).toLocaleDateString("es-AR")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Obra asignada */}
        {workName && workId ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Obra Asignada</h4>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <Link href={`/works/${workId}`} className="text-sm text-blue-600 hover:underline">
                {workName}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Obra Asignada</h4>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Sin obra asignada</span>
            </div>
          </div>
        )}

        {/* Alertas */}
        {employeeAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Alertas</h4>
            <div className="space-y-2">
              {employeeAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                    className={`p-2 rounded border ${
                    alert.severity === "critical"
                      ? "border-red-200 bg-red-50"
                      : alert.severity === "warning"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-blue-200 bg-blue-50"
                  }`}
                  style={{
                    borderColor:
                      alert.severity === "critical"
                        ? "rgba(255,59,48,0.3)"
                        : alert.severity === "warning"
                        ? "rgba(255,193,7,0.3)"
                        : "rgba(0,122,255,0.3)",
                    backgroundColor:
                      alert.severity === "critical"
                        ? "rgba(255,59,48,0.1)"
                        : alert.severity === "warning"
                        ? "rgba(255,193,7,0.1)"
                        : "rgba(0,122,255,0.1)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`h-4 w-4 mt-0.5 ${
                        alert.severity === "critical"
                          ? "text-red-600"
                          : alert.severity === "warning"
                          ? "text-yellow-600"
                          : "text-blue-600"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">{alert.title || alert.description || "Sin título"}</p>
                      {alert.description && (
                        <p className="text-xs text-gray-600 mt-0.5">{alert.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {employeeAlerts.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{employeeAlerts.length - 3} alerta{employeeAlerts.length - 3 !== 1 ? "s" : ""} más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="pt-4 border-t border-gray-200 flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onEdit?.(employee);
              onClose();
            }}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onAssignWork?.(employee);
              onClose();
            }}
            className="flex-1"
          >
            <Building2 className="h-4 w-4 mr-2" />
            {workName ? "Cambiar Obra" : "Asignar Obra"}
          </Button>
          {employeeAlerts.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                onViewAlerts?.(employee);
                onClose();
              }}
              className="flex-1"
            >
              <Bell className="h-4 w-4 mr-2" />
              Ver Alertas ({unreadAlerts})
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

