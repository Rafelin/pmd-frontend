import { render, screen } from "@testing-library/react";
import { EmployeeReceipt } from "@/components/receipts/EmployeeReceipt";
import type { EmployeeReceipt as EmployeeReceiptType } from "@/lib/types/receipts";

function makeReceipt(overrides?: Partial<EmployeeReceiptType>): EmployeeReceiptType {
  return {
    type: "employee",
    week_start_date: "2026-01-19",
    week_end_date: "2026-01-25",
    employee: {
      id: "emp-1",
      fullName: "Juan Pérez",
      trade: "PINTURA",
      work: { id: "work-1", name: "Obra A" },
    },
    totals: {
      days_worked: 5,
      total_salary: 50000,
      late_hours: 2,
      late_deduction: 2500,
      total_advances: 5000,
      total_discounts: 7500,
      net_payment: 42500,
    },
    advances: [
      { id: "adv-1", date: "2026-01-21", amount: 5000, description: "Adelanto test" },
    ],
    meta: {
      payment_id: "pay-1",
      paid_at: null,
      expense_id: "exp-1",
    },
    ...overrides,
  };
}

describe("EmployeeReceipt", () => {
  it("renderiza título y datos principales", () => {
    render(<EmployeeReceipt receipt={makeReceipt()} />);

    expect(screen.getByText("RECIBO DE SUELDO")).toBeInTheDocument();
    expect(screen.getByText(/Empleado:/i)).toBeInTheDocument();
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText(/Obra:/i)).toBeInTheDocument();
    expect(screen.getByText("Obra A")).toBeInTheDocument();
    expect(screen.getByText(/Semana:/i)).toBeInTheDocument();
    expect(screen.getByText("2026-01-19 - 2026-01-25")).toBeInTheDocument();
  });

  it("muestra adelantos y totales", () => {
    render(<EmployeeReceipt receipt={makeReceipt()} />);

    expect(screen.getByText(/Adelantos/i)).toBeInTheDocument();
    expect(screen.getByText("2026-01-21")).toBeInTheDocument();
    expect(screen.getByText(/\(Adelanto test\)/i)).toBeInTheDocument();

    expect(screen.getByText(/Pago neto:/i)).toBeInTheDocument();
    // 42.500,00 en es-AR
    expect(screen.getByText(/\$?\s*42\.500,00/)).toBeInTheDocument();
  });

  it("si no hay adelantos, muestra 'Sin adelantos'", () => {
    render(<EmployeeReceipt receipt={makeReceipt({ advances: [] })} />);
    expect(screen.getByText(/Sin adelantos/i)).toBeInTheDocument();
  });
});

