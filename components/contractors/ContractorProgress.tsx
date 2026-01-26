"use client";

import { Supplier } from "@/lib/types/supplier";
import { Badge } from "@/components/ui/Badge";

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function ContractorProgress({ supplier }: { supplier: Supplier }) {
  const budget = supplier.contractor_budget ?? null;
  const totalPaid = supplier.contractor_total_paid ?? 0;
  const remaining = supplier.contractor_remaining_balance ?? (budget !== null ? budget - totalPaid : null);

  const pct =
    budget && budget > 0 ? Math.max(0, Math.min(100, (Number(totalPaid) / Number(budget)) * 100)) : 0;

  const over80 = budget !== null && budget > 0 && pct >= 80;

  const weekly = supplier.weekly_payment ?? null;
  const weeksRemaining =
    weekly && weekly > 0 && remaining !== null ? remaining / weekly : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Presupuesto del contratista</div>
          <div className="text-xs text-gray-600">
            Total pagado vs presupuesto (certificaciones)
          </div>
        </div>
        {over80 ? <Badge variant="warning">+80%</Badge> : <Badge variant="info">OK</Badge>}
      </div>

      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-3 ${over80 ? "bg-yellow-500" : "bg-pmd-darkBlue"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-gray-600">Presupuesto</div>
          <div className="font-semibold text-gray-900">{formatMoney(budget)}</div>
        </div>
        <div>
          <div className="text-gray-600">Total certificado</div>
          <div className="font-semibold text-gray-900">{formatMoney(totalPaid)}</div>
        </div>
        <div>
          <div className="text-gray-600">Saldo restante</div>
          <div className="font-semibold text-gray-900">{formatMoney(remaining)}</div>
        </div>
        <div className="md:col-span-3">
          <div className="text-gray-600">Semanas restantes (estimación)</div>
          <div className="font-semibold text-gray-900">
            {weeksRemaining === null ? "—" : `${weeksRemaining.toFixed(1)} semanas`}
            {weekly ? (
              <span className="text-xs text-gray-600 font-normal"> (base semanal: {formatMoney(weekly)})</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

