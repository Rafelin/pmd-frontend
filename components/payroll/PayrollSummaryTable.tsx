"use client";

import { Button } from "@/components/ui/Button";
import type { PayrollSummaryRow } from "@/lib/types/employee-payment";

// Normalizar formato de fecha: convertir ISO string a yyyy-MM-dd
function normalizeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    // Si ya está en formato yyyy-MM-dd, devolverlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // Si es un ISO string, extraer solo la parte de la fecha
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Si no se puede parsear, devolver el original
    }
    return date.toISOString().split("T")[0];
  } catch {
    return dateStr; // Si falla, devolver el original
  }
}

interface PayrollSummaryTableProps {
  rows: PayrollSummaryRow[];
  selectedWeekStartDate?: string;
  onSelectWeek?: (weekStartDate: string) => void;
}

export function PayrollSummaryTable({
  rows,
  selectedWeekStartDate,
  onSelectWeek,
}: PayrollSummaryTableProps) {
  if (!rows.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Semana
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Pagos
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Pendientes
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sin gasto
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Total neto
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((r) => {
              const normalizedWeekDate = normalizeDate(r.week_start_date);
              const normalizedSelectedDate = normalizeDate(selectedWeekStartDate);
              const active = normalizedSelectedDate === normalizedWeekDate;
              return (
                <tr key={r.week_start_date} className={active ? "bg-blue-50" : "hover:bg-gray-50"}>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{normalizedWeekDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{r.total_payments}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{r.unpaid_payments}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{r.missing_expense}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                    {Number(r.total_net_payment).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Button
                      variant={active ? "secondary" : "outline"}
                      onClick={() => onSelectWeek?.(normalizedWeekDate)}
                    >
                      Ver
                    </Button>
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

