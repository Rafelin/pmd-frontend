"use client";

import type { ContractorReceipt } from "@/lib/types/receipts";

function formatMoney(value: unknown): string {
  const n = Number(value ?? 0);
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ContractorReceipt({ receipt }: { receipt: ContractorReceipt }) {
  const workName = receipt.work?.name ?? "—";
  const remaining = receipt.balance.contractor_remaining_balance;

  return (
    <div className="receipt-card">
      <div className="receipt-title">RECIBO DE CERTIFICACIÓN</div>

      <div className="receipt-row">
        <span className="receipt-label">Contratista:</span>
        <span className="receipt-value">{receipt.contractor.name}</span>
      </div>
      <div className="receipt-row">
        <span className="receipt-label">Obra:</span>
        <span className="receipt-value">{workName}</span>
      </div>
      <div className="receipt-row">
        <span className="receipt-label">Semana:</span>
        <span className="receipt-value">
          {receipt.week_start_date} - {receipt.week_end_date}
        </span>
      </div>

      <div className="receipt-sep" />

      <div className="receipt-row receipt-row-strong">
        <span className="receipt-label">Monto certificado:</span>
        <span className="receipt-value">$ {formatMoney(receipt.certification.amount)}</span>
      </div>
      <div className="receipt-row">
        <span className="receipt-label">Descripción:</span>
        <span className="receipt-value">{receipt.certification.description ?? "—"}</span>
      </div>

      <div className="receipt-sep" />

      <div className="receipt-row">
        <span className="receipt-label">Saldo restante:</span>
        <span className="receipt-value">
          {remaining === null ? "—" : `$ ${formatMoney(remaining)}`}
        </span>
      </div>
    </div>
  );
}

