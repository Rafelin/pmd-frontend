"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { LoadingState } from "@/components/ui/LoadingState";
import { Card, CardContent } from "@/components/ui/Card";
import { useEmployees } from "@/hooks/api/employees";
import { usePayrollEmployee } from "@/hooks/api/payroll";
import { PayrollTable } from "@/components/payroll/PayrollTable";
import { useCan } from "@/lib/acl";

export default function PayrollPaymentHistoryPage() {
  const [filterByOrganization, setFilterByOrganization] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>("");

  const canRead = useCan("payroll.read");

  const { employees, isLoading: isLoadingEmployees, error: employeesError } = useEmployees({
    filterByOrganization,
    isActive: true,
  });

  const {
    payments,
    isLoading: isLoadingPayments,
    error: paymentsError,
  } = usePayrollEmployee(employeeId || null, { filterByOrganization });

  const isLoading = isLoadingEmployees || isLoadingPayments;
  const error = employeesError || paymentsError;

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <BotonVolver />

        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Historial de Pagos</h1>
          <p className="text-gray-600">Pagos semanales históricos por empleado</p>
        </div>

        {!canRead && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            No tenés permisos para acceder a Nómina.
          </div>
        )}

        {canRead && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Empleado:</label>
                    <select
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white min-w-[260px]"
                    >
                      <option value="">Seleccionar empleado…</option>
                      {employees?.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {isLoading && <LoadingState message="Cargando historial…" />}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Error al cargar historial: {error.message || "Error desconocido"}
              </div>
            )}

            {!isLoading && !error && employeeId && (
              <PayrollTable payments={payments || []} groupBy="none" showWeekStartDate />
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

