import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReceiptsPage from "@/app/(authenticated)/receipts/page";

const mockUsePrintReceipts = jest.fn();

jest.mock("@/hooks/api/receipts", () => ({
  usePrintReceipts: (...args: any[]) => mockUsePrintReceipts(...args),
}));

jest.mock("@/lib/acl", () => ({
  useCan: jest.fn(() => true),
}));

jest.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("ReceiptsPage", () => {
  beforeEach(() => {
    (window as any).print = jest.fn();

    mockUsePrintReceipts.mockReturnValue({
      receipts: {
        week_start_date: "2026-01-19",
        week_end_date: "2026-01-25",
        type: "all",
        employees: [],
        contractors: [],
        items: [
          {
            type: "employee",
            week_start_date: "2026-01-19",
            week_end_date: "2026-01-25",
            employee: { id: "emp-1", fullName: "Empleado 1", trade: null, work: { id: "w1", name: "Obra" } },
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
            meta: { payment_id: "pay-1", paid_at: null, expense_id: null },
          },
        ],
      },
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });
  });

  it("renderiza botones de impresión", () => {
    render(<ReceiptsPage />);
    expect(screen.getByText("Imprimir empleados")).toBeInTheDocument();
    expect(screen.getByText("Imprimir contratistas")).toBeInTheDocument();
    expect(screen.getByText("Imprimir todos")).toBeInTheDocument();
  });

  it("al hacer click en 'Imprimir todos' llama a window.print()", async () => {
    const user = userEvent.setup();
    render(<ReceiptsPage />);

    await user.click(screen.getByText("Imprimir todos"));
    expect(window.print).toHaveBeenCalledTimes(1);
  });
});

