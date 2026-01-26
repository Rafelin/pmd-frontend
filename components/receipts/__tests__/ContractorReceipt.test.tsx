import { render, screen } from "@testing-library/react";
import { ContractorReceipt } from "@/components/receipts/ContractorReceipt";
import type { ContractorReceipt as ContractorReceiptType } from "@/lib/types/receipts";

function makeReceipt(overrides?: Partial<ContractorReceiptType>): ContractorReceiptType {
  return {
    type: "contractor",
    week_start_date: "2026-01-19",
    week_end_date: "2026-01-25",
    contractor: { id: "sup-1", name: "Contratista SRL" },
    work: { id: "work-1", name: "Obra B" },
    certification: { id: "cert-1", amount: 123456, description: "Certificación semanal", expense_id: "exp-1" },
    balance: {
      contractor_remaining_balance: 376544,
      contractor_total_paid: 123456,
      contractor_budget: 500000,
    },
    ...overrides,
  };
}

describe("ContractorReceipt", () => {
  it("renderiza título y datos principales", () => {
    render(<ContractorReceipt receipt={makeReceipt()} />);

    expect(screen.getByText("RECIBO DE CERTIFICACIÓN")).toBeInTheDocument();
    expect(screen.getByText(/Contratista:/i)).toBeInTheDocument();
    expect(screen.getByText("Contratista SRL")).toBeInTheDocument();
    expect(screen.getByText(/Obra:/i)).toBeInTheDocument();
    expect(screen.getByText("Obra B")).toBeInTheDocument();
    expect(screen.getByText(/Semana:/i)).toBeInTheDocument();
    expect(screen.getByText("2026-01-19 - 2026-01-25")).toBeInTheDocument();
  });

  it("muestra monto certificado y saldo restante", () => {
    render(<ContractorReceipt receipt={makeReceipt()} />);

    // 123.456,00 en es-AR
    expect(screen.getByText(/\$?\s*123\.456,00/)).toBeInTheDocument();
    // 376.544,00 en es-AR
    expect(screen.getByText(/\$?\s*376\.544,00/)).toBeInTheDocument();
  });

  it("si saldo restante es null, muestra '—'", () => {
    render(<ContractorReceipt receipt={makeReceipt({ balance: { contractor_remaining_balance: null, contractor_total_paid: null, contractor_budget: null } })} />);
    // "Saldo restante:" existe, y el valor debería ser "—"
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});

