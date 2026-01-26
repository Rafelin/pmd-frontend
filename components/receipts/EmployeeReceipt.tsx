"use client";

import type { EmployeeReceipt } from "@/lib/types/receipts";

function formatMoney(value: unknown): string {
  const n = Number(value ?? 0);
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function EmployeeReceipt({ receipt }: { receipt: EmployeeReceipt }) {
  const workName = receipt.employee.work?.name ?? "—";
  const trade = receipt.employee.trade ?? "—";

  return (
    <div className="receipt-card">
      <div className="receipt-title">RECIBO DE SUELDO</div>

      <div className="receipt-row">
        <span className="receipt-label">Empleado:</span>
        <span className="receipt-value">{receipt.employee.fullName}</span>
      </div>
      <div className="receipt-row">
        <span className="receipt-label">Obra:</span>
        <span className="receipt-value">{workName}</span>
      </div>
      <div className="receipt-row">
        <span className="receipt-label">Rubro:</span>
        <span className="receipt-value">{trade}</span>
      </div>
      <div className="receipt-row">
        <span className="receipt-label">Semana:</span>
        <span className="receipt-value">
          {receipt.week_start_date} - {receipt.week_end_date}
        </span>
      </div>

      <div className="receipt-sep" />

      <div className="receipt-row">
        <span className="receipt-label">Salario bruto:</span>
        <span className="receipt-value">$ {formatMoney(receipt.totals.total_salary)}</span>
      </div>
      <div className="receipt-row">
        <span className="receipt-label">Descuento por tardanzas:</span>
        <span className="receipt-value">- $ {formatMoney(receipt.totals.late_deduction)}</span>
      </div>

      <div className="receipt-subtitle">Adelantos</div>
      {receipt.advances.length ? (
        <div className="receipt-list">
          {receipt.advances.slice(0, 6).map((a) => (
            <div key={a.id} className="receipt-list-item">
              <span className="receipt-muted">{a.date}</span>
              <span className="receipt-value">$ {formatMoney(a.amount)}</span>
              {a.description ? <span className="receipt-muted">({a.description})</span> : null}
            </div>
          ))}
          {receipt.advances.length > 6 ? (
            <div className="receipt-muted">… y {receipt.advances.length - 6} más</div>
          ) : null}
        </div>
      ) : (
        <div className="receipt-muted">Sin adelantos</div>
      )}

      <div className="receipt-sep" />

      <div className="receipt-row">
        <span className="receipt-label">Total descuentos:</span>
        <span className="receipt-value">$ {formatMoney(receipt.totals.total_discounts)}</span>
      </div>
      <div className="receipt-row receipt-row-strong">
        <span className="receipt-label">Pago neto:</span>
        <span className="receipt-value">$ {formatMoney(receipt.totals.net_payment)}</span>
      </div>
    </div>
  );
}

