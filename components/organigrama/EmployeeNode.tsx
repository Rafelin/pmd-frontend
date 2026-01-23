"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/settings/UserAvatar";
import { calcularEstadoSeguro, getBadgeColorSeguro } from "@/utils/seguro";
import { Employee } from "@/lib/types/employee";

interface EmployeeNodeProps {
  employee: Employee;
  isFirst?: boolean;
  isLast?: boolean;
}

export function EmployeeNode({ employee, isFirst = false, isLast = false }: EmployeeNodeProps) {
  const router = useRouter();

  const nombre = employee.nombre || employee.fullName || employee.name || "Sin nombre";
  const puesto = employee.puesto || employee.position || "Sin puesto";
  const area = employee.area || (employee as any).areaTrabajo || "";
  const seguro = employee.seguro || employee.insurance;
  const fechaVencimiento = (seguro?.fechaVencimiento || seguro?.expirationDate) as string | Date | null | undefined;
  const estadoSeguro = calcularEstadoSeguro(fechaVencimiento);

  return (
    <div className="relative">
      {/* Línea vertical superior (si no es el primero) */}
      {!isFirst && (
        <div className="absolute left-1/2 top-0 w-0.5 h-6 bg-gray-300 transform -translate-x-1/2 -translate-y-full" />
      )}

      {/* Card del empleado */}
      <div
        onClick={() => router.push(`/rrhh/${employee.id}`)}
        className="cursor-pointer"
      >
        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-pmd-darkBlue">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <UserAvatar name={nombre} size="sm" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-pmd-darkBlue mb-1 truncate">{nombre}</h3>
                <p className="text-sm text-gray-600 mb-2">{puesto}</p>
                <Badge variant={getBadgeColorSeguro(estadoSeguro.estado)} className="text-xs">
                  {estadoSeguro.texto}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Línea vertical inferior (si no es el último) */}
      {!isLast && (
        <div className="absolute left-1/2 bottom-0 w-0.5 h-6 bg-gray-300 transform -translate-x-1/2 translate-y-full" />
      )}
    </div>
  );
}

