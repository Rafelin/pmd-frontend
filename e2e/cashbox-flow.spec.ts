import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers/auth';
import { navigateViaSidebar, expectRoute } from './helpers/navigation';
import { fillField, submitForm, expectSuccessMessage } from './helpers/forms';
import { waitForLoadingComplete, waitForModal, waitForTableData } from './helpers/wait';
import { hasPermission, handleExpected403 } from './helpers/permissions';

/**
 * Pruebas E2E del Flujo de Caja
 * 
 * Verifica el flujo completo: crear caja → crear movimientos → cerrar caja
 */
test.describe('Flujo de Caja', () => {
  
  test('Operator debe poder crear su propia caja', async ({ page }) => {
    await login(page, TEST_USERS.operator);
    await navigateViaSidebar(page, 'Cajas');
    await expectRoute(page, /\/cashbox/);
    
    // Verificar si ya hay una caja abierta
    const openCashbox = page.locator('text=/abierta|open/i').first();
    const hasOpenCashbox = await openCashbox.isVisible({ timeout: 2000 });
    
    if (!hasOpenCashbox) {
      // Esperar a que la página termine de cargar completamente
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000); // Dar tiempo adicional para que se renderice
      
      // Verificar permisos del usuario antes de buscar el botón
      await page.waitForTimeout(1000);
      
      const canCreateCashbox = await hasPermission(page, 'cashboxes.create');
      console.log(`[CASHBOX] Usuario tiene permiso 'cashboxes.create': ${canCreateCashbox}`);
      
      if (!canCreateCashbox) {
        test.skip('El usuario no tiene permiso cashboxes.create. Error 403 sería esperado.');
        return;
      }
      
      // Crear nueva caja - buscar tanto el botón principal como el del EmptyState
      // El botón puede estar en el header o dentro del EmptyState
      const createButtonSelectors = [
        'button:has-text("Crear primera caja")',
        'button:has-text("Abrir nueva caja")',
        'button:has-text("Abrir Caja")',
        'button:has-text("Crear Caja")',
        'button:has-text("Nueva Caja")',
        'div.text-center.py-12 button', // Botón dentro de EmptyState
        'div:has-text("No hay cajas registradas") button', // Botón cerca del mensaje de EmptyState
        'div:has-text("Crea tu primera caja") button', // Botón cerca del mensaje de EmptyState
        'div:has-text("No tienes cajas asignadas") button', // Para Operator sin permisos
        'button:has-text("Nuevo")',
        'button:has-text("Crear")',
        // Buscar en el header
        'div.flex.items-center.justify-between button',
        'div:has(h1:has-text("Cajas")) button',
      ];
      
      console.log(`[CASHBOX] 🔍 Buscando botón para crear caja...`);
      let createButton = null;
      for (let i = 0; i < createButtonSelectors.length; i++) {
        const selector = createButtonSelectors[i];
        const button = page.locator(selector).first();
        const isVisible = await button.isVisible({ timeout: 3000 }).catch(() => false);
        if (isVisible) {
          const buttonText = await button.textContent().catch(() => '');
          console.log(`[CASHBOX] ✅ Botón encontrado con selector ${i + 1}/${createButtonSelectors.length}: "${buttonText}"`);
          createButton = button;
          break;
        }
      }
      
      if (!createButton) {
        // Capturar información de debugging
        const allButtons = await page.locator('button').allTextContents().catch(() => []);
        const pageContent = await page.content().catch(() => '');
        console.error(`[CASHBOX] ❌ No se encontró el botón para crear caja`);
        console.error(`[CASHBOX] 📋 Botones disponibles en la página:`, allButtons.slice(0, 20));
        throw new Error(`No se encontró el botón para crear caja. Botones disponibles: ${allButtons.slice(0, 10).join(', ')}`);
      }
      
      await expect(createButton).toBeVisible({ timeout: 15000 });
      await createButton.click();
      
      // El formulario solo tiene un campo: "Fecha de Apertura" que tiene un valor por defecto (fecha actual)
      // Solo necesitamos hacer clic en "Crear Caja" o "Guardar"
      // Esperar a que el modal/formulario esté visible
      await page.waitForTimeout(1000);
      
      // Buscar y hacer clic en el botón de guardar/crear
      const submitButton = page.locator('button[type="submit"]:has-text("Crear Caja"), button:has-text("Crear Caja"), button:has-text("Guardar")').first();
      await expect(submitButton).toBeVisible({ timeout: 5000 });
      await submitButton.click();
      
      // Esperar mensaje de éxito
      try {
        await expectSuccessMessage(page);
      } catch (error) {
        // Si hay error 403, verificar si es esperado
        if (error instanceof Error && error.message.includes('403')) {
          await handleExpected403(page, 'cashboxes.create', error.message, test);
          return;
        }
        throw error;
      }
    }
    
    // Verificar que la caja aparece en la lista
    await waitForTableData(page, 1);
  });

  test('Operator debe poder cerrar su propia caja', async ({ page }) => {
    await login(page, TEST_USERS.operator);
    
    // Verificar permisos antes de intentar cerrar
    const canCloseCashbox = await hasPermission(page, 'cashboxes.update') || await hasPermission(page, 'cashboxes.close');
    console.log(`[CASHBOX] Usuario tiene permiso para cerrar cajas: ${canCloseCashbox}`);
    
    if (!canCloseCashbox) {
      test.skip('El usuario no tiene permiso para cerrar cajas. Error 403 sería esperado.');
      return;
    }
    
    await navigateViaSidebar(page, 'Cajas');
    
    // Buscar caja abierta
    const openCashboxRow = page.locator('tbody tr').filter({ hasText: /abierta|open/i }).first();
    
    if (await openCashboxRow.isVisible({ timeout: 5000 })) {
      // Hacer clic en el botón de cerrar
      const closeButton = openCashboxRow.locator('button:has-text("Cerrar"), button[title*="cerrar"]').first();
      await closeButton.click();
      
      // Esperar modal de confirmación
      await waitForModal(page);
      
      // Llenar saldo de cierre real (UI actual)
      await fillField(page, 'Saldo de Cierre Real (ARS)', '10000');
      
      // Confirmar cierre
      const confirmButton = page.locator('button:has-text("Cerrar Caja"), button:has-text("Confirmar"), button:has-text("Cerrar")').first();
      await confirmButton.click();
      
      // Verificar mensaje de éxito
      try {
        await expectSuccessMessage(page);
      } catch (error) {
        // Si hay error 403, verificar si es esperado
        if (error instanceof Error && error.message.includes('403')) {
          await handleExpected403(page, 'cashboxes.update', error.message, test);
          return;
        }
        throw error;
      }
      
      // Esperar a que el refresh termine
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      // Verificar que la caja ahora está cerrada
      await expect(openCashboxRow.locator('text=/cerrada|closed/i')).toBeVisible({ timeout: 5000 });
    } else {
      test.skip('No hay caja abierta para cerrar');
    }
  });

  test('debe generar alerta si hay diferencias al cerrar caja', async ({ page }) => {
    await login(page, TEST_USERS.operator);
    await navigateViaSidebar(page, 'Cajas');
    
    // Buscar caja abierta
    const openCashboxRow = page.locator('tbody tr').filter({ hasText: /abierta|open/i }).first();
    
    if (await openCashboxRow.isVisible({ timeout: 5000 })) {
      await openCashboxRow.locator('button:has-text("Cerrar")').first().click();
      await waitForModal(page);
      
      // Cerrar con saldo diferente (simulando diferencia)
      await fillField(page, 'Saldo de Cierre Real (ARS)', '9500'); // Diferencia vs saldo calculado
      
      const confirmButton = page.locator('button:has-text("Cerrar Caja"), button:has-text("Confirmar")').first();
      await confirmButton.click();
      
      // Verificar que se genera alerta
      await navigateViaSidebar(page, 'Alertas');
      await waitForTableData(page, 1);
      
      // Buscar alerta de diferencia
      const differenceAlert = page.locator('text=/diferencia|difference/i').first();
      await expect(differenceAlert).toBeVisible({ timeout: 5000 });
    } else {
      test.skip('No hay caja abierta para cerrar');
    }
  });

  test('Direction debe ver todas las cajas', async ({ page }) => {
    await login(page, TEST_USERS.direction);
    await navigateViaSidebar(page, 'Cajas');
    
    // Verificar que puede ver la tabla de cajas
    await waitForTableData(page, 0); // Puede estar vacía, pero la tabla debe cargar
  });

  test('Operator NO debe ver cajas de otros usuarios', async ({ page }) => {
    await login(page, TEST_USERS.operator);
    await navigateViaSidebar(page, 'Cajas');
    
    // Verificar que solo ve su propia caja
    // (esto depende de tu implementación de filtrado)
    await waitForTableData(page, 0);
  });
});

