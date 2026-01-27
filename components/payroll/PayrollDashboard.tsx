"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { parseBackendError } from "@/lib/parse-backend-error";
import { useCan } from "@/lib/acl";
import { PayrollTable } from "@/components/payroll/PayrollTable";
import { PayrollSummaryTable } from "@/components/payroll/PayrollSummaryTable";
import { payrollApi, usePayrollSummary, usePayrollWeek } from "@/hooks/api/payroll";
import { useWorks } from "@/hooks/api/works";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Normalizar fecha a formato yyyy-MM-dd para inputs de tipo date
function normalizeDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) {
    return formatDate(getWeekStart(new Date()));
  }
  try {
    // Si ya está en formato yyyy-MM-dd, devolverlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // Si es un ISO string, extraer solo la parte de la fecha
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // Si no se puede parsear, usar fecha actual
      return formatDate(getWeekStart(new Date()));
    }
    return formatDate(getWeekStart(date));
  } catch {
    // Si falla, usar fecha actual
    return formatDate(getWeekStart(new Date()));
  }
}

export function PayrollDashboard({
  initialWeekStartDate,
  showWeekPicker = true,
}: {
  initialWeekStartDate?: string;
  showWeekPicker?: boolean;
}) {
  const toast = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return normalizeDateForInput(initialWeekStartDate);
  });
  const [filterByOrganization, setFilterByOrganization] = useState(false);
  const [workId, setWorkId] = useState<string>("");
  const [groupBy, setGroupBy] = useState<"none" | "work" | "trade">("work");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Asegurar que selectedDate siempre esté en formato yyyy-MM-dd
  useEffect(() => {
    const normalized = normalizeDateForInput(selectedDate);
    if (normalized !== selectedDate) {
      setSelectedDate(normalized);
    }
  }, [selectedDate]);

  const weekStartDate = useMemo(() => {
    try {
      const parsed = new Date(selectedDate);
      return getWeekStart(parsed);
    } catch {
      return getWeekStart(new Date());
    }
  }, [selectedDate]);
  const weekStartDateStr = formatDate(weekStartDate);

  const canRead = useCan("payroll.read");
  const canPayrollCreate = useCan("payroll.create");
  const canPayrollUpdate = useCan("payroll.update");
  const canPayrollManage = useCan("payroll.manage");
  const canCalculate = canPayrollCreate || canPayrollManage;
  const canMarkPaid = canPayrollUpdate || canPayrollManage;
  const canCreateExpense = useCan("expenses.create");
  const { works } = useWorks();

  const { payments, isLoading: isLoadingWeek, error: weekError, mutate: mutateWeek } = usePayrollWeek(
    weekStartDateStr,
    {
      filterByOrganization,
      work_id: workId || undefined,
    }
  );

  const { summary, isLoading: isLoadingSummary, error: summaryError, mutate: mutateSummary } = usePayrollSummary({
    filterByOrganization,
  });

  // Función auxiliar para normalizar fechas para comparación
  const normalizeDateForComparison = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    try {
      // Si ya está en formato yyyy-MM-dd, devolverlo tal cual
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      // Si es un ISO string, extraer solo la parte de la fecha
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      return date.toISOString().split("T")[0];
    } catch {
      return dateStr;
    }
  };

  const currentSummary = useMemo(() => {
    const normalizedSelected = normalizeDateForComparison(weekStartDateStr);
    return (summary || []).find((s) => {
      const normalizedSummary = normalizeDateForComparison(s.week_start_date);
      return normalizedSummary === normalizedSelected;
    }) || null;
  }, [summary, weekStartDateStr]);

  // Detectar errores 429 específicamente
  const isRateLimited = 
    (weekError as any)?.response?.status === 429 || 
    (weekError as any)?.status === 429 ||
    (summaryError as any)?.response?.status === 429 ||
    (summaryError as any)?.status === 429;

  const handleCalculate = async () => {
    setIsSubmitting(true);
    try {
      await payrollApi.calculate(weekStartDateStr, {
        filterByOrganization,
        createExpenses: true,
        work_id: workId || undefined,
      });
      await mutateWeek();
      await mutateSummary();
      toast.success("Nómina calculada");
    } catch (err: unknown) {
      toast.error(parseBackendError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async (paymentId: string) => {
    setIsSubmitting(true);
    try {
      await payrollApi.markPaid(paymentId);
      await mutateWeek();
      await mutateSummary();
      toast.success("Pago marcado como realizado");
    } catch (err: unknown) {
      toast.error(parseBackendError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateExpense = async (paymentId: string) => {
    setIsSubmitting(true);
    try {
      await payrollApi.createExpenseFromPayment(paymentId);
      await mutateWeek();
      await mutateSummary();
      toast.success("Gasto creado desde el pago");
    } catch (err: unknown) {
      toast.error(parseBackendError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingWeek || isLoadingSummary;
  const error = weekError || summaryError;

  if (!canRead) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
        No tenés permisos para acceder a Nómina.
      </div>
    );
  }

  // Mostrar mensaje específico para errores 429 (Too Many Requests)
  if (isRateLimited) {
    return (
      <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg">
        <div className="font-semibold mb-2">Demasiadas solicitudes</div>
        <p className="text-sm">
          El servidor está recibiendo demasiadas solicitudes. Por favor, espera unos momentos antes de intentar nuevamente.
          Los datos anteriores se mantendrán visibles mientras tanto.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState message="Cargando nómina…" />;
  }

  if (error) {
    // No mostrar error si es 429 (ya se maneja arriba)
    if (!isRateLimited) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error al cargar nómina: {error.message || "Error desconocido"}
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Nómina</h1>
          <p className="text-gray-600">Cálculo de pagos semanales y creación de gastos</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/payroll/payment-history" className="text-sm text-blue-700 hover:underline">
            Ver historial
          </Link>
          {canCalculate && (
            <Button variant="primary" onClick={handleCalculate} disabled={isSubmitting}>
              {isSubmitting ? "Calculando..." : "Calcular semana"}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {showWeekPicker && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Semana:</label>
                <Input
                  type="date"
                  value={normalizeDateForInput(selectedDate)}
                  onChange={(e) => {
                    if (e.target.value) {
                      const date = new Date(e.target.value);
                      const normalized = formatDate(getWeekStart(date));
                      setSelectedDate(normalized);
                    }
                  }}
                  className="w-auto"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Obra:</label>
              <select
                value={workId}
                onChange={(e) => setWorkId(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
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
              <label className="text-sm font-medium text-gray-700">Agrupar:</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="work">Obra</option>
                <option value="trade">Rubro</option>
                <option value="none">Sin agrupar</option>
              </select>
            </div>

            {/* <div className="flex items-center gap-2 ml-auto">
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
            </div> */}
          </div>
        </CardContent>
      </Card>

      {currentSummary && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-gray-700">
              <div>
                <span className="font-medium">Pagos:</span> {currentSummary.total_payments}
              </div>
              <div>
                <span className="font-medium">Pendientes:</span> {currentSummary.unpaid_payments}
              </div>
              <div>
                <span className="font-medium">Sin gasto:</span> {currentSummary.missing_expense}
              </div>
              <div>
                <span className="font-medium">Total neto:</span>{" "}
                {Number(currentSummary.total_net_payment).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <PayrollSummaryTable
        rows={summary || []}
        selectedWeekStartDate={weekStartDateStr}
        onSelectWeek={(week) => setSelectedDate(normalizeDateForInput(week))}
      />

      <PayrollTable
        payments={payments || []}
        groupBy={groupBy}
        onMarkPaid={handleMarkPaid}
        onCreateExpense={handleCreateExpense}
        canMarkPaid={canMarkPaid}
        canCreateExpense={canCreateExpense}
        isLoadingActions={isSubmitting}
      />
    </div>
  );
}

