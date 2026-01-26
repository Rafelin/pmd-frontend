import { test, expect } from "@playwright/test";
import { login, TEST_USERS } from "./helpers/auth";
import { navigateViaSidebar, expectRoute } from "./helpers/navigation";
import { waitForLoadingComplete } from "./helpers/wait";

test.describe("Recibos (Fase 6)", () => {
  test("debe renderizar 5 slots por página (1 recibo => 1 página)", async ({ page }) => {
    await login(page, TEST_USERS.direction);

    await page.route("**/api/payroll/receipts/print/**", async (route) => {
      const body = {
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
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    await navigateViaSidebar(page, "Recibos");
    await expectRoute(page, /\/receipts/);
    await waitForLoadingComplete(page);

    // Confirmar que renderizó el recibo y el layout de impresión
    await expect(page.locator("text=RECIBO DE SUELDO").first()).toBeVisible({ timeout: 10000 });

    await expect(page.locator(".receipt-page")).toHaveCount(1);
    await expect(page.locator(".receipt-slot")).toHaveCount(5);
    await expect(page.locator(".receipt-card")).toHaveCount(1);
  });

  test("paginación: 6 recibos => 2 páginas y 10 slots", async ({ page }) => {
    await login(page, TEST_USERS.direction);

    await page.route("**/api/payroll/receipts/print/**", async (route) => {
      const items = Array.from({ length: 6 }).map((_, idx) => ({
        type: "employee",
        week_start_date: "2026-01-19",
        week_end_date: "2026-01-25",
        employee: { id: `emp-${idx + 1}`, fullName: `Empleado ${idx + 1}`, trade: null, work: { id: "w1", name: "Obra" } },
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
        meta: { payment_id: `pay-${idx + 1}`, paid_at: null, expense_id: null },
      }));

      const body = {
        week_start_date: "2026-01-19",
        week_end_date: "2026-01-25",
        type: "all",
        employees: [],
        contractors: [],
        items,
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    await navigateViaSidebar(page, "Recibos");
    await expectRoute(page, /\/receipts/);
    await waitForLoadingComplete(page);

    await expect(page.locator("text=RECIBO DE SUELDO").first()).toBeVisible({ timeout: 10000 });

    await expect(page.locator(".receipt-page")).toHaveCount(2);
    await expect(page.locator(".receipt-slot")).toHaveCount(10);
    await expect(page.locator(".receipt-card")).toHaveCount(6);
  });

  test("debe abrir /receipts y disparar window.print al imprimir", async ({ page }) => {
    // Stub de window.print para no abrir diálogo real
    await page.addInitScript(() => {
      (window as any).__PRINT_COUNT__ = 0;
      window.print = () => {
        (window as any).__PRINT_COUNT__ += 1;
      };
    });

    // Importante: el stub debe instalarse ANTES de que cargue la app (Next hace navegación client-side)
    await login(page, TEST_USERS.direction);

    // Mock del endpoint de impresión (evita depender de datos reales)
    await page.route("**/api/payroll/receipts/print/**", async (route) => {
      const body = {
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
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    await navigateViaSidebar(page, "Recibos");
    await expectRoute(page, /\/receipts/);

    await waitForLoadingComplete(page);

    // Setear semana a un valor determinista (opcional; ya suele arrancar en el lunes actual)
    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible({ timeout: 10000 });
    await dateInput.fill("2026-01-19");

    // Click imprimir (esto debería llamar window.print luego de cargar)
    await page.locator('button:has-text("Imprimir todos")').click();

    // Esperar a que el contador se incremente
    await page.waitForFunction(() => (window as any).__PRINT_COUNT__ >= 1, null, { timeout: 10000 });

    const printed = await page.evaluate(() => (window as any).__PRINT_COUNT__);
    expect(printed).toBeGreaterThanOrEqual(1);
  });
});

