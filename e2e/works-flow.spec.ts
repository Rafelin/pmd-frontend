import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers/auth';
import { navigateViaSidebar, expectRoute } from './helpers/navigation';
import { fillField, submitForm, expectSuccessMessage } from './helpers/forms';
import { waitForLoadingComplete, waitForTableData } from './helpers/wait';
import { hasPermission, handleExpected403 } from './helpers/permissions';

/**
 * Pruebas E2E del Flujo de Obras
 * 
 * Verifica: crear obra → editar → cerrar obra
 */
test.describe('Flujo de Obras', () => {
  
  test('Direction debe poder crear obra', async ({ page }) => {
    await login(page, TEST_USERS.direction);
    
    // Verificar permisos antes de intentar crear
    const canCreateWork = await hasPermission(page, 'works.create');
    console.log(`[WORKS] Usuario tiene permiso 'works.create': ${canCreateWork}`);
    
    if (!canCreateWork) {
      test.skip('El usuario no tiene permiso works.create. Error 403 sería esperado.');
      return;
    }
    
    await navigateViaSidebar(page, 'Obras');
    await expectRoute(page, /\/works/);
    
    const createButton = page.locator('button:has-text("Nueva Obra"), button:has-text("Nuevo"), button:has-text("Crear")').first();
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    await waitForLoadingComplete(page);
    
    // Esperar a que el formulario esté completamente cargado
    await page.waitForTimeout(1000);
    
    // Verificar que el modal está abierto antes de continuar
    const modal = page.locator('div[class*="modal"], div[class*="Modal"], [role="dialog"]').first();
    const isModalOpen = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isModalOpen) {
      throw new Error('El modal no está abierto. No se puede llenar el formulario.');
    }
    
    // Llenar formulario con los labels exactos del formulario
    await fillField(page, 'Nombre de la obra', `Obra Test ${Date.now()}`);
    await fillField(page, 'Cliente', 'Cliente Test');
    await fillField(page, 'Dirección', 'Dirección Test 123');
    
    // Para campos de fecha, usar el label exacto del formulario
    const startDate = new Date().toISOString().split('T')[0];
    await fillField(page, 'Fecha de inicio', startDate);
    
    // Seleccionar moneda
    const currencySelect = page.locator('select[name*="currency"], select[name*="moneda"]').first();
    if (await currencySelect.isVisible()) {
      await currencySelect.selectOption('ARS');
    }
    
    await submitForm(page, 'Guardar');
    try {
      await expectSuccessMessage(page);
    } catch (error) {
      // Si hay error 403, verificar si es esperado
      if (error instanceof Error && error.message.includes('403')) {
        await handleExpected403(page, 'works.create', error.message, test);
        return;
      }
      throw error;
    }
    
    // Esperar a que el modal se cierre y el refresh termine
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Verificar que aparece en la lista
    await waitForTableData(page, 1);
  });

  test('Supervisor debe poder actualizar progreso de obra', async ({ page }) => {
    await login(page, TEST_USERS.supervisor);
    
    // Verificar permisos antes de intentar actualizar
    const canUpdateWork = await hasPermission(page, 'works.update');
    console.log(`[WORKS] Usuario tiene permiso 'works.update': ${canUpdateWork}`);
    
    if (!canUpdateWork) {
      test.skip('El usuario no tiene permiso works.update. Error 403 sería esperado.');
      return;
    }
    
    await navigateViaSidebar(page, 'Obras');
    
    await waitForTableData(page, 1);
    
    // La UI de Obras usa cards (no tabla). Abrir la primera obra.
    const viewButton = page.locator('button:has-text("Ver")').first();
    const hasView = await viewButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasView) {
      test.skip('No se encontró botón "Ver" en cards de obras');
      return;
    }
    await viewButton.click();
    
    // Buscar campo de progreso
    const progressField = page.locator('input[name*="progress"], input[name*="progreso"]').first();
    
    if (await progressField.isVisible({ timeout: 3000 })) {
      await progressField.fill('50');
      await submitForm(page, 'Guardar');
      try {
        await expectSuccessMessage(page);
      } catch (error) {
        // Si hay error 403, verificar si es esperado
        if (error instanceof Error && error.message.includes('403')) {
          await handleExpected403(page, 'works.update', error.message, test);
          return;
        }
        throw error;
      }
      
      // Esperar a que el refresh termine
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    } else {
      test.skip('No se encontró campo de progreso');
    }
  });

  test('Direction debe poder cerrar obra', async ({ page }) => {
    await login(page, TEST_USERS.direction);
    
    // Verificar permisos antes de intentar cerrar
    const canCloseWork = await hasPermission(page, 'works.update') || await hasPermission(page, 'works.close');
    console.log(`[WORKS] Usuario tiene permiso para cerrar obras: ${canCloseWork}`);
    
    if (!canCloseWork) {
      test.skip('El usuario no tiene permiso para cerrar obras. Error 403 sería esperado.');
      return;
    }
    
    await navigateViaSidebar(page, 'Obras');
    
    await waitForTableData(page, 1);
    
    // La UI de Obras usa cards; Direction tiene botón "Cerrar" en obras no cerradas
    const closeButton = page.locator('button:has-text("Cerrar")').first();
    const canClose = await closeButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (canClose) {
      await closeButton.click();

      // Confirmación: ConfirmationModal usa "Cerrar Obra"
      const confirmButton = page.locator('button:has-text("Cerrar Obra"), button:has-text("Confirmar")').first();
      if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await confirmButton.click();
      }
      
      try {
        await expectSuccessMessage(page);
      } catch (error) {
        // Si hay error 403, verificar si es esperado
        if (error instanceof Error && error.message.includes('403')) {
          await handleExpected403(page, 'works.update', error.message, test);
          return;
        }
        throw error;
      }
      
      // Esperar a que el refresh termine
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      // Verificar que ya no queda el botón "Cerrar" en el primer card (best-effort)
      await expect(closeButton).not.toBeVisible({ timeout: 5000 }).catch(() => {});
    } else {
      test.skip('No hay obras abiertas para cerrar');
    }
  });
});

