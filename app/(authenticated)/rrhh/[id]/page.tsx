"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useEmployee } from "@/hooks/api/employees";
import { LoadingState } from "@/components/ui/LoadingState";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Button } from "@/components/ui/Button";
import { EmployeeTrade } from "@/lib/types/employee";
import { HandCoins } from "lucide-react";
import Link from "next/link";

function EmployeeDetailContent({ id }: { id: string }) {
  const { employee, isLoading, error } = useEmployee(id);

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

  if (isLoading) {
    return <LoadingState message="Cargando empleado…" />;
  }

  if (error || !employee) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error ? `Error: ${error.message || "Error desconocido"}` : "Empleado no encontrado"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BotonVolver />
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {employee.fullName || employee.name || employee.nombre}
              </h1>
              <div className="flex gap-2">
                {employee.trade && (
                  <Badge variant="info">{getTradeLabel(employee.trade)}</Badge>
                )}
                {!employee.isActive && (
                  <Badge variant="error">Inactivo</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Información Personal</h3>
                <div className="space-y-2 text-sm">
                  {employee.email && (
                    <p>
                      <span className="font-medium text-gray-700">Email:</span>{" "}
                      <span className="text-gray-600">{employee.email}</span>
                    </p>
                  )}
                  {employee.phone && (
                    <p>
                      <span className="font-medium text-gray-700">Teléfono:</span>{" "}
                      <span className="text-gray-600">{employee.phone}</span>
                    </p>
                  )}
                  {employee.hireDate && (
                    <p>
                      <span className="font-medium text-gray-700">Fecha de Contratación:</span>{" "}
                      <span className="text-gray-600">
                        {new Date(employee.hireDate).toLocaleDateString('es-AR')}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Información Laboral</h3>
                <div className="space-y-2 text-sm">
                  {employee.daily_salary && (
                    <p>
                      <span className="font-medium text-gray-700">Salario Diario:</span>{" "}
                      <span className="text-gray-600">
                        ${employee.daily_salary.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                  )}
                  {employee.work && (
                    <p>
                      <span className="font-medium text-gray-700">Obra:</span>{" "}
                      <span className="text-gray-600">{employee.work.name}</span>
                    </p>
                  )}
                  {employee.area && (
                    <p>
                      <span className="font-medium text-gray-700">Área:</span>{" "}
                      <span className="text-gray-600">{employee.area}</span>
                    </p>
                  )}
                  {employee.position && (
                    <p>
                      <span className="font-medium text-gray-700">Puesto:</span>{" "}
                      <span className="text-gray-600">{employee.position}</span>
                    </p>
                  )}
                  {employee.role && (
                    <p>
                      <span className="font-medium text-gray-700">Rol:</span>{" "}
                      <span className="text-gray-600">{employee.role}</span>
                    </p>
                  )}
                  {employee.subrole && (
                    <p>
                      <span className="font-medium text-gray-700">Subrol:</span>{" "}
                      <span className="text-gray-600">{employee.subrole}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Acciones rápidas</h3>
            <Link href={`/employee-advances?employee_id=${id}`}>
              <Button
                variant="secondary"
                className="flex items-center gap-2"
              >
                <HandCoins className="h-4 w-4" />
                Ver Adelantos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <EmployeeDetailContent id={params.id} />
    </ProtectedRoute>
  );
}
