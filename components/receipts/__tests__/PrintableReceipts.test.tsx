import { render } from "@testing-library/react";
import { PrintableReceipts } from "@/components/receipts/PrintableReceipts";
import type { PrintableReceiptItem } from "@/lib/types/receipts";

function makeEmployee(idx: number): PrintableReceiptItem {
  return {
    type: "employee",
    week_start_date: "2026-01-19",
    week_end_date: "2026-01-25",
    employee: { id: `emp-${idx}`, fullName: `Empleado ${idx}`, trade: null, work: { id: "w1", name: "Obra" } },
    totals: {
      days_worked: 5,
      total_salary: 50000,
      late_hours: 0,
      late_deduction: 0,
      total_advances: 0,
      total_discounts: 0,
      net_payment: 50000,
    },
    advances: [],
    meta: { payment_id: `pay-${idx}`, paid_at: null, expense_id: null },
  };
}

describe("PrintableReceipts", () => {
  it("muestra mensaje si no hay items", () => {
    const { container, getByText } = render(<PrintableReceipts items={[]} />);
    expect(getByText(/No hay recibos para imprimir/i)).toBeInTheDocument();
    expect(container.querySelectorAll(".receipt-page").length).toBe(0);
  });

  it("renderiza 1 recibo y completa a 5 slots", () => {
    const { container } = render(<PrintableReceipts items={[makeEmployee(1)]} />);
    expect(container.querySelectorAll(".receipt-page").length).toBe(1);
    expect(container.querySelectorAll(".receipt-card").length).toBe(1);
    // Slots totales por página: 5 (1 recibo + 4 vacíos)
    expect(container.querySelectorAll(".receipt-slot").length).toBe(5);
  });

  it("paginación: 6 items => 2 páginas", () => {
    const items = Array.from({ length: 6 }).map((_, i) => makeEmployee(i + 1));
    const { container } = render(<PrintableReceipts items={items} />);

    expect(container.querySelectorAll(".receipt-page").length).toBe(2);
    expect(container.querySelectorAll(".receipt-card").length).toBe(6);
    // 2 páginas * 5 slots
    expect(container.querySelectorAll(".receipt-slot").length).toBe(10);
  });
});

