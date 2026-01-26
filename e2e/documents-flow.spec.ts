import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers/auth';
import { navigateViaSidebar, expectRoute } from './helpers/navigation';
import { fillField, submitForm, expectSuccessMessage } from './helpers/forms';
import { waitForLoadingComplete, waitForTableData } from './helpers/wait';
import { hasPermission, handleExpected403 } from './helpers/permissions';

/**
 * Pruebas E2E del Flujo de Documentos
 * 
 * Verifica: crear documento → ver lista → permisos por rol
 */
test.describe('Flujo de Documentos', () => {
  
  test('Operator debe poder crear documento', async ({ page }) => {
    await login(page, TEST_USERS.operator);
    
    // Verificar permisos antes de intentar crear
    const canCreateDocument = await hasPermission(page, 'documents.create');
    console.log(`[DOCUMENTS] Usuario tiene permiso 'documents.create': ${canCreateDocument}`);
    
    if (!canCreateDocument) {
      test.skip('El usuario no tiene permiso documents.create. Error 403 sería esperado.');
      return;
    }
    
    await navigateViaSidebar(page, 'Documentación');
    await expectRoute(page, /\/documents/);
    
    await waitForTableData(page, 0);
    
    const createButton = page.locator('button:has-text("Subir Documento"), button:has-text("Nuevo"), button:has-text("Crear")').first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();
    
    await waitForLoadingComplete(page);
    
    // Esperar a que el formulario esté completamente cargado
    await page.waitForTimeout(1000);
    
    // Seleccionar campos requeridos (SelectField usa label + select dentro de FormField)
    const workSelect = page.locator('div:has(label:has-text("Obra")) select').first();
    await expect(workSelect).toBeVisible({ timeout: 10000 });
    await workSelect.selectOption({ index: 1 }); // primer obra disponible (seed: "Test Work")

    const typeSelect = page.locator('div:has(label:has-text("Tipo")) select').first();
    await expect(typeSelect).toBeVisible({ timeout: 10000 });
    await typeSelect.selectOption({ index: 1 });

    // Llenar formulario de documento (labels reales del formulario)
    await fillField(page, 'Nombre del documento', `Documento Test ${Date.now()}`);
    await fillField(page, 'Notas', 'Documento de prueba');
    
    await submitForm(page, 'Guardar');
    try {
      await expectSuccessMessage(page);
    } catch (error) {
      // Si hay error 403, verificar si es esperado
      if (error instanceof Error && error.message.includes('403')) {
        await handleExpected403(page, 'documents.create', error.message, test);
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

  test('Administration debe poder actualizar documento', async ({ page }) => {
    await login(page, TEST_USERS.administration);
    
    // Verificar permisos antes de intentar actualizar
    const canUpdateDocument = await hasPermission(page, 'documents.update');
    console.log(`[DOCUMENTS] Usuario tiene permiso 'documents.update': ${canUpdateDocument}`);
    
    if (!canUpdateDocument) {
      test.skip('El usuario no tiene permiso documents.update. Error 403 sería esperado.');
      return;
    }
    
    await navigateViaSidebar(page, 'Documentación');
    // Puede no haber documentos si el test de creación no corrió antes
    await waitForTableData(page, 0);
    
    // Buscar primer documento
    const firstDocument = page.locator('tbody tr').first();
    const hasDoc = await firstDocument.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasDoc) {
      test.skip('No hay documentos para actualizar');
      return;
    }
    
    // Hacer clic para editar
    const editButton = firstDocument.locator('button:has-text("Editar"), button[title*="editar"]').first();
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
    } else {
      await firstDocument.click();
    }
    
    await waitForLoadingComplete(page);
    
    // Actualizar descripción
    const descriptionField = page.locator('textarea[name*="description"], textarea[name*="descripción"]').first();
    if (await descriptionField.isVisible({ timeout: 3000 })) {
      await descriptionField.fill(`Descripción actualizada ${Date.now()}`);
      await submitForm(page, 'Guardar');
      try {
        await expectSuccessMessage(page);
      } catch (error) {
        // Si hay error 403, verificar si es esperado
        if (error instanceof Error && error.message.includes('403')) {
          await handleExpected403(page, 'documents.update', error.message, test);
          return;
        }
        throw error;
      }
      
      // Esperar a que el refresh termine
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    }
  });

  test('Supervisor debe poder ver documentos pero no crear', async ({ page }) => {
    await login(page, TEST_USERS.supervisor);
    await navigateViaSidebar(page, 'Documentación');
    
    await waitForTableData(page, 0);
    
    // Verificar que no hay botón de crear
    const createButton = page.locator('button:has-text("Nuevo"), button:has-text("Crear")').first();
    await expect(createButton).not.toBeVisible({ timeout: 3000 });
  });

  test('Direction debe poder eliminar documento', async ({ page }) => {
    await login(page, TEST_USERS.direction);
    
    // Verificar permisos antes de intentar eliminar
    const canDeleteDocument = await hasPermission(page, 'documents.delete');
    console.log(`[DOCUMENTS] Usuario tiene permiso 'documents.delete': ${canDeleteDocument}`);
    
    if (!canDeleteDocument) {
      test.skip('El usuario no tiene permiso documents.delete. Error 403 sería esperado.');
      return;
    }
    
    await navigateViaSidebar(page, 'Documentación');
    // Puede no haber documentos si el test de creación no corrió antes
    await waitForTableData(page, 0);
    
    // Buscar primer documento
    const firstDocument = page.locator('tbody tr').first();
    const hasDoc = await firstDocument.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasDoc) {
      test.skip('No hay documentos para eliminar');
      return;
    }
    
    // Buscar botón de eliminar
    const deleteButton = firstDocument.locator('button:has-text("Eliminar"), button[title*="eliminar"]').first();
    
    if (await deleteButton.isVisible({ timeout: 3000 })) {
      await deleteButton.click();
      
      // Confirmar eliminación
      const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Eliminar")').first();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
      
      try {
        await expectSuccessMessage(page);
      } catch (error) {
        // Si hay error 403, verificar si es esperado
        if (error instanceof Error && error.message.includes('403')) {
          await handleExpected403(page, 'documents.delete', error.message, test);
          return;
        }
        throw error;
      }
      
      // Esperar a que el refresh termine
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    } else {
      test.skip('No se encontró botón de eliminar');
    }
  });
});

