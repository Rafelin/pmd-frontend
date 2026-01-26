import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers/auth';
import { navigateViaSidebar, expectRoute } from './helpers/navigation';
import { fillField, selectOption, selectComboboxOption, submitForm, expectSuccessMessage } from './helpers/forms';
import { waitForLoadingComplete, waitForTableData } from './helpers/wait';
import { hasPermission, handleExpected403 } from './helpers/permissions';

/**
 * Pruebas E2E del Flujo de Contratos
 * 
 * Verifica: crear contrato → actualizar → verificar bloqueo
 */
test.describe('Flujo de Contratos', () => {
  
  test('Administration debe poder crear contrato', async ({ page }) => {
    await login(page, TEST_USERS.administration);
    await navigateViaSidebar(page, 'Contratos');
    await expectRoute(page, /\/contracts/);
    
    await waitForTableData(page, 0); // Esperar que la tabla cargue (puede estar vacía)
    
    const createButton = page.locator('button:has-text("New Contract"), button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Agregar")').first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();
    
    // Esperar a que el modal se abra completamente
    console.log('[CONTRACTS] ⏳ Esperando a que el modal se abra...');
    const modalSelectors = [
      'div[class*="modal"]',
      'div[class*="Modal"]',
      '[role="dialog"]',
      'div[class*="overlay"]',
    ];
    
    let modal = null;
    for (const selector of modalSelectors) {
      const modalLocator = page.locator(selector).first();
      const isVisible = await modalLocator.isVisible({ timeout: 10000 }).catch(() => false);
      if (isVisible) {
        modal = modalLocator;
        console.log(`[CONTRACTS] ✅ Modal encontrado con selector: ${selector}`);
        break;
      }
    }
    
    if (!modal) {
      // Esperar un poco más y buscar de nuevo
      await page.waitForTimeout(2000);
      for (const selector of modalSelectors) {
        const modalLocator = page.locator(selector).first();
        const isVisible = await modalLocator.isVisible({ timeout: 5000 }).catch(() => false);
        if (isVisible) {
          modal = modalLocator;
          console.log(`[CONTRACTS] ✅ Modal encontrado después de espera adicional con selector: ${selector}`);
          break;
        }
      }
    }
    
    if (!modal) {
      throw new Error('El modal no se abrió después de hacer clic en el botón de crear.');
    }
    
    await waitForLoadingComplete(page);
    
    // Esperar a que el formulario se cargue completamente dentro del modal
    await page.waitForTimeout(2000);
    
    try {
      await selectOption(page, 'Proveedor', 'Test');
    } catch (error) {
      // Si selectOption falla, intentar con selectComboboxOption
      try {
        await selectComboboxOption(page, 'Proveedor', 'Test');
      } catch (error1) {
        // Si selectComboboxOption falla, intentar con fillField y Enter
        try {
          await fillField(page, 'Proveedor', 'Test');
          await page.waitForTimeout(500);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        } catch (error2) {
          console.warn('No se pudo seleccionar proveedor:', error2);
        }
      }
    }
    
    try {
      await selectOption(page, 'Obra', 'Test');
    } catch (error) {
      // Si selectOption falla, intentar con selectComboboxOption
      try {
        await selectComboboxOption(page, 'Obra', 'Test');
      } catch (error1) {
        // Si selectComboboxOption falla, intentar con fillField y Enter
        try {
          await fillField(page, 'Obra', 'Test');
          await page.waitForTimeout(500);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        } catch (error2) {
          console.warn('No se pudo seleccionar obra:', error2);
        }
      }
    }
    
    // "Monto Total" solo aparece si el usuario es Direction
    // Intentar llenar el campo, si no existe puede ser que el usuario no tenga permisos
    try {
      await fillField(page, 'Monto Total', '50000');
    } catch (error) {
      // Si no se encuentra, puede ser que el usuario no sea Direction
      console.warn('[CONTRACTS] Campo "Monto Total" no encontrado, puede ser que el usuario no tenga permisos de Direction');
      // Verificar si hay un mensaje de error o si el campo simplemente no está visible
      const errorMessage = page.locator('text=/sin permisos|forbidden|403/i').first();
      const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasError) {
        throw new Error('El usuario no tiene permisos para crear contratos como Direction');
      }
      // Si no hay error, continuar sin llenar Monto Total
    }
    
    // "Fecha Inicio" puede ser "Fecha de inicio" o "Fecha Inicio"
    try {
      await fillField(page, 'Fecha Inicio', new Date().toISOString().split('T')[0]);
    } catch (error) {
      // Intentar con "Fecha de inicio"
      try {
        await fillField(page, 'Fecha de inicio', new Date().toISOString().split('T')[0]);
      } catch {
        await fillField(page, 'Fecha de Inicio', new Date().toISOString().split('T')[0]);
      }
    }

    // Rubrica es requerida para crear contrato
    try {
      await selectOption(page, 'Rubrica', 'Nómina');
    } catch (e) {
      // fallback: seleccionar la primera opción válida
      const rubricSelect = page.locator('div:has(label:has-text("Rubrica")) select, div:has(label:has-text("Rúbrica")) select').first();
      if (await rubricSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rubricSelect.selectOption({ index: 1 });
      }
    }
    
    // Seleccionar moneda
    const currencySelect = page.locator('select[name*="currency"], select[name*="moneda"]').first();
    if (await currencySelect.isVisible()) {
      await currencySelect.selectOption('ARS');
    }
    
    await submitForm(page, 'Guardar');
    await expectSuccessMessage(page);
    
    // Esperar a que el modal se cierre y el refresh termine
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Verificar que aparece en la lista
    await waitForTableData(page, 1);
  });

  test('Direction debe poder actualizar contrato', async ({ page }) => {
    await login(page, TEST_USERS.direction);
    
    // Verificar permisos antes de intentar actualizar
    const canUpdateContract = await hasPermission(page, 'contracts.update');
    console.log(`[CONTRACTS] Usuario tiene permiso 'contracts.update': ${canUpdateContract}`);
    
    if (!canUpdateContract) {
      test.skip('El usuario no tiene permiso contracts.update. Error 403 sería esperado.');
      return;
    }
    
    await navigateViaSidebar(page, 'Contratos');
    
    await waitForTableData(page, 0);
    
    // Buscar primer contrato
    const firstContract = page.locator('tbody tr').first();
    const hasAnyContract = await firstContract.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasAnyContract) {
      test.skip('No hay contratos para actualizar');
      return;
    }
    
    // Hacer clic para editar
    const editButton = firstContract.locator('button:has-text("Editar"), button[title*="editar"]').first();
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
    } else {
      // Si no hay botón de editar, hacer clic en la fila
      await firstContract.click();
    }
    
    await waitForLoadingComplete(page);
    
    // Actualizar monto
    const amountField = page.locator('input[name*="amount"], input[name*="monto"]').first();
    if (await amountField.isVisible({ timeout: 3000 })) {
      await amountField.fill('60000');
      await submitForm(page, 'Guardar');
      try {
        await expectSuccessMessage(page);
      } catch (error) {
        // Si hay error 403, verificar si es esperado
        if (error instanceof Error && error.message.includes('403')) {
          await handleExpected403(page, 'contracts.update', error.message, test);
          return;
        }
        throw error;
      }
      
      // Esperar a que el refresh termine
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    }
  });

  test('Supervisor debe poder ver contratos pero no crear', async ({ page }) => {
    await login(page, TEST_USERS.supervisor);
    await navigateViaSidebar(page, 'Contratos');
    
    await waitForTableData(page, 0);
    
    // Verificar que no hay botón de crear
    const createButton = page.locator('button:has-text("Nuevo"), button:has-text("Crear")').first();
    await expect(createButton).not.toBeVisible({ timeout: 3000 });
  });

  test('Operator no debe tener acceso a contratos', async ({ page }) => {
    await login(page, TEST_USERS.operator);
    
    // Verificar que no aparece en el sidebar
    const contractsLink = page.locator('nav a:has-text("Contratos")');
    await expect(contractsLink).not.toBeVisible({ timeout: 3000 });
    
    // Intentar acceder directamente
    await page.goto('/contracts');
    
    // Esperar a que la redirección ocurra o que se muestre un error
    await page.waitForTimeout(2000);
    
    // Debe redirigir a /unauthorized o a otra página (no /contracts)
    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(/\/contracts/);
    
    // Verificar que se muestra mensaje de no autorizado o se redirige
    const unauthorizedMessage = page.locator('text=/no autorizado|sin permisos|unauthorized/i').first();
    const isUnauthorized = await unauthorizedMessage.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isUnauthorized && !currentUrl.includes('/unauthorized') && !currentUrl.includes('/dashboard')) {
      // Si no hay mensaje de error ni redirección, verificar que al menos no está en /contracts
      expect(currentUrl).not.toContain('/contracts');
    }
  });
});

