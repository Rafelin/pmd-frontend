"use client";

import { Button } from "@/components/ui/Button";
import type { PayrollSummaryRow } from "@/lib/types/employee-payment";

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
              const active = selectedWeekStartDate === r.week_start_date;
              return (
                <tr key={r.week_start_date} className={active ? "bg-blue-50" : "hover:bg-gray-50"}>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{r.week_start_date}</td>
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
                      onClick={() => onSelectWeek?.(r.week_start_date)}
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

