"use client";

import type { PrintableReceiptItem } from "@/lib/types/receipts";
import { EmployeeReceipt } from "@/components/receipts/EmployeeReceipt";
import { ContractorReceipt } from "@/components/receipts/ContractorReceipt";

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function PrintableReceipts({ items }: { items: PrintableReceiptItem[] }) {
  if (!items.length) {
    return (
      <div className="print-empty">
        No hay recibos para imprimir con los filtros seleccionados.
      </div>
    );
  }

  const pages = chunk(items, 5);

  return (
    <div className="print-root">
      {pages.map((pageItems, pageIdx) => (
        <section key={pageIdx} className="receipt-page">
          <div className="receipt-grid">
            {pageItems.map((it) => (
              <div key={`${it.type}-${"employee" in it ? it.employee.id : it.contractor.id}-${it.week_start_date}`} className="receipt-slot">
                {it.type === "employee" ? (
                  <EmployeeReceipt receipt={it} />
                ) : (
                  <ContractorReceipt receipt={it} />
                )}
              </div>
            ))}
            {/* Relleno para mantener 5 por página */}
            {pageItems.length < 5
              ? Array.from({ length: 5 - pageItems.length }).map((_, idx) => (
                  <div key={`empty-${pageIdx}-${idx}`} className="receipt-slot receipt-slot-empty" />
                ))
              : null}
          </div>
        </section>
      ))}
    </div>
  );
}

