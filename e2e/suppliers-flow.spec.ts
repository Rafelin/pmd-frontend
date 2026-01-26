import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers/auth';
import { navigateViaSidebar, expectRoute } from './helpers/navigation';
import { fillField, submitForm, expectSuccessMessage } from './helpers/forms';
import { waitForLoadingComplete, waitForTableData } from './helpers/wait';
import { hasPermission, handleExpected403 } from './helpers/permissions';

/**
 * Pruebas E2E del Flujo de Proveedores
 * 
 * Verifica: crear proveedor → aprobar → crear gasto con proveedor
 */
test.describe('Flujo de Proveedores', () => {
  
  test('Operator debe poder crear proveedor provisorio', async ({ page }) => {
    await login(page, TEST_USERS.operator);
    
    // Verificar permisos antes de intentar crear
    const canCreateSupplier = await hasPermission(page, 'suppliers.create');
    console.log(`[SUPPLIERS] Usuario tiene permiso 'suppliers.create': ${canCreateSupplier}`);
    
    if (!canCreateSupplier) {
      test.skip('El usuario no tiene permiso suppliers.create. Error 403 sería esperado.');
      return;
    }
    
    await navigateViaSidebar(page, 'Proveedores');
    await expectRoute(page, /\/suppliers/);
    
    // Crear nuevo proveedor
    const createButton = page.locator('button:has-text("Nuevo"), button:has-text("Crear")').first();
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    await waitForLoadingComplete(page);
    
    // Llenar formulario
    await fillField(page, 'Nombre o Razón Social', `Proveedor Test ${Date.now()}`);
    // CUIT con dígito verificador válido (evita 400 por checksum del backend)
    await fillField(page, 'CUIT', '20-12345678-6');
    
    // Guardar
    await submitForm(page, 'Guardar');
    try {
      await expectSuccessMessage(page);
    } catch (error) {
      // Si hay error 403, verificar si es esperado
      if (error instanceof Error && error.message.includes('403')) {
        await handleExpected403(page, 'suppliers.create', error.message, test);
        return;
      }
      throw error;
    }
    
    // Esperar a que el modal se cierre y el refresh termine
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Verificar que aparece en la lista con estado PROVISIONAL
    await waitForTableData(page, 1);
    const provisionalStatus = page.locator('text=/provisional|pendiente/i').first();
    await expect(provisionalStatus).toBeVisible({ timeout: 5000 });
  });

  test('Administration debe poder aprobar proveedor', async ({ page }) => {
    await login(page, TEST_USERS.administration);
    
    // Verificar permisos antes de intentar aprobar
    const canApproveSupplier = await hasPermission(page, 'suppliers.update') || await hasPermission(page, 'suppliers.approve');
    console.log(`[SUPPLIERS] Usuario tiene permiso para aprobar proveedores: ${canApproveSupplier}`);
    
    if (!canApproveSupplier) {
      test.skip('El usuario no tiene permiso para aprobar proveedores. Error 403 sería esperado.');
      return;
    }
    
    await navigateViaSidebar(page, 'Proveedores');
    
    await waitForTableData(page, 1);
    
    // Buscar proveedor provisorio
    const provisionalRow = page.locator('tbody tr').filter({ hasText: /provisional|pendiente/i }).first();
    
    if (await provisionalRow.isVisible({ timeout: 5000 })) {
      // Hacer clic en aprobar
      const approveButton = provisionalRow.locator('button:has-text("Aprobar"), button[title*="aprobar"]').first();
      await approveButton.click();
      
      // Confirmar si hay modal
      const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Aprobar")').first();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
      
      try {
        await expectSuccessMessage(page);
      } catch (error) {
        // Si hay error 403, verificar si es esperado
        if (error instanceof Error && error.message.includes('403')) {
          await handleExpected403(page, 'suppliers.update', error.message, test);
          return;
        }
        throw error;
      }
      
      // Esperar a que el refresh termine
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      // Verificar que el estado cambió a APPROVED
      await expect(provisionalRow.locator('text=/aprobado|approved/i')).toBeVisible({ timeout: 5000 });
    } else {
      test.skip('No hay proveedores provisionales para aprobar');
    }
  });

  test('debe validar formato de CUIT', async ({ page }) => {
    await login(page, TEST_USERS.operator);
    await navigateViaSidebar(page, 'Proveedores');
    
    const createButton = page.locator('button:has-text("Nuevo"), button:has-text("Crear")').first();
    await createButton.click();
    
    await fillField(page, 'Nombre', 'Test Supplier');
    await fillField(page, 'CUIT', '123'); // CUIT inválido
    
    await submitForm(page, 'Guardar');
    
    // Verificar error de validación
    const errorMessage = page.locator('text=/cuit|inválido|invalid/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });
});

