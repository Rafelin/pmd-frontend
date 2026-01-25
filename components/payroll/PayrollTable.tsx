"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { EmployeePayment } from "@/lib/types/employee-payment";

interface PayrollTableProps {
  payments: EmployeePayment[];
  groupBy?: "none" | "work" | "trade";
  showWeekStartDate?: boolean;
  onMarkPaid?: (paymentId: string) => Promise<void> | void;
  onCreateExpense?: (paymentId: string) => Promise<void> | void;
  canMarkPaid?: boolean;
  canCreateExpense?: boolean;
  isLoadingActions?: boolean;
}

function formatMoney(value: unknown): string {
  const n = Number(value ?? 0);
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PayrollTable({
  payments,
  groupBy = "none",
  showWeekStartDate = false,
  onMarkPaid,
  onCreateExpense,
  canMarkPaid = false,
  canCreateExpense = false,
  isLoadingActions = false,
}: PayrollTableProps) {
  if (groupBy !== "none") {
    const groups = new Map<string, EmployeePayment[]>();
    for (const p of payments) {
      const key =
        groupBy === "work"
          ? p.employee?.work?.name ?? "Sin obra"
          : p.employee?.trade ?? "Sin rubro";
      const arr = groups.get(String(key)) ?? [];
      arr.push(p);
      groups.set(String(key), arr);
    }

    const keys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, "es"));

    return (
      <div className="space-y-4">
        {keys.map((k) => {
          const items = groups.get(k) ?? [];
          const total = items.reduce((sum, it) => sum + Number(it.net_payment ?? 0), 0);
          return (
            <div key={k} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">{k}</div>
                <div className="text-sm text-gray-700">
                  Total:{" "}
                  <span className="font-semibold">
                    {total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <PayrollTable
                payments={items}
                groupBy="none"
                showWeekStartDate={showWeekStartDate}
                onMarkPaid={onMarkPaid}
                onCreateExpense={onCreateExpense}
                canMarkPaid={canMarkPaid}
                canCreateExpense={canCreateExpense}
                isLoadingActions={isLoadingActions}
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
        No hay pagos calculados para esta semana.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {showWeekStartDate && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Semana
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Obra
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Rubro
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Días
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tarde (hs)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Bruto
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Desc. tarde
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Adelantos
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Neto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Pagado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Gasto
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((p) => {
              const employeeName = p.employee?.fullName ?? p.employee_id;
              const workName = p.employee?.work?.name ?? "-";
              const trade = p.employee?.trade ?? "-";
              const hasExpense = Boolean(p.expense_id);
              const isPaid = Boolean(p.paid_at);

              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  {showWeekStartDate && (
                    <td className="px-4 py-3 text-sm text-gray-700">{p.week_start_date}</td>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-900">{employeeName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{workName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{trade}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{p.days_worked ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {formatMoney(p.late_hours ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {formatMoney(p.total_salary ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {formatMoney(p.late_deduction ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {formatMoney(p.total_advances ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                    {formatMoney(p.net_payment ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {isPaid ? (
                      <span className="text-green-700 font-medium">Sí</span>
                    ) : (
                      <span className="text-yellow-700 font-medium">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {hasExpense ? (
                      <Link className="text-blue-700 hover:underline" href={`/expenses/${p.expense_id}`}>
                        Ver gasto
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      {canMarkPaid && !isPaid && (
                        <Button
                          variant="secondary"
                          onClick={() => onMarkPaid?.(p.id)}
                          disabled={isLoadingActions}
                        >
                          Marcar pagado
                        </Button>
                      )}
                      {canCreateExpense && !hasExpense && (
                        <Button
                          variant="primary"
                          onClick={() => onCreateExpense?.(p.id)}
                          disabled={isLoadingActions}
                        >
                          Crear gasto
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

