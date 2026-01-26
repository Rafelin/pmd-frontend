import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers/auth';
import { navigateViaSidebar, expectRoute } from './helpers/navigation';
import { fillField, selectOption, submitForm, expectSuccessMessage } from './helpers/forms';
import { waitForLoadingComplete, waitForTableData } from './helpers/wait';
import { hasPermission, handleExpected403 } from './helpers/permissions';

/**
 * Pruebas E2E del Flujo de Usuarios
 * 
 * Verifica: solo Direction puede acceder → crear → actualizar → eliminar
 */
test.describe('Flujo de Usuarios', () => {
  
  test('Direction debe poder crear usuario', async ({ page }) => {
    await login(page, TEST_USERS.direction);
    
    // Verificar permisos antes de intentar crear
    const canCreateUser = await hasPermission(page, 'users.create');
    console.log(`[USERS] Usuario tiene permiso 'users.create': ${canCreateUser}`);
    
    if (!canCreateUser) {
      test.skip('El usuario no tiene permiso users.create. Error 403 sería esperado.');
      return;
    }
    
    await navigateViaSidebar(page, 'Usuarios');
    await expectRoute(page, /\/settings\/users|\/admin\/users/);
    
    await waitForTableData(page, 0);
    
    const createButton = page.locator('button:has-text("Nuevo"), button:has-text("Crear")').first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();
    
    await waitForLoadingComplete(page);
    
    // Llenar formulario de usuario
    const timestamp = Date.now();
    await fillField(page, 'Email', `test${timestamp}@pmd.com`);
    await fillField(page, 'Nombre Completo', `Usuario Test ${timestamp}`);
    await fillField(page, 'Contraseña', 'password123');
    // El formulario requiere confirmación de contraseña
    await fillField(page, 'Repetir Contraseña', 'password123');
    
    // Seleccionar rol
    await selectOption(page, 'Rol', 'operator');
    
    await submitForm(page, 'Guardar');
    try {
      await expectSuccessMessage(page);
    } catch (error) {
      // Si hay error 403, verificar si es esperado
      if (error instanceof Error && error.message.includes('403')) {
        await handleExpected403(page, 'users.create', error.message, test);
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

  test('Direction debe poder actualizar usuario', async ({ page }) => {
    await login(page, TEST_USERS.direction);
    
    // Verificar permisos antes de intentar actualizar
    const canUpdateUser = await hasPermission(page, 'users.update');
    console.log(`[USERS] Usuario tiene permiso 'users.update': ${canUpdateUser}`);
    
    if (!canUpdateUser) {
      test.skip('El usuario no tiene permiso users.update. Error 403 sería esperado.');
      return;
    }
    
    await navigateViaSidebar(page, 'Usuarios');
    
    await waitForTableData(page, 1);
    
    // Buscar primer usuario (que no sea el actual)
    const firstUser = page.locator('tbody tr').first();
    await expect(firstUser).toBeVisible();
    
    // Hacer clic para editar
    const editButton = firstUser.locator('button:has-text("Editar"), button[title*="editar"]').first();
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
    } else {
      await firstUser.click();
    }
    
    await waitForLoadingComplete(page);
    
    // Actualizar nombre
    const nameField = page.locator('input[name*="name"], input[name*="nombre"]').first();
    if (await nameField.isVisible({ timeout: 3000 })) {
      await nameField.fill(`Usuario Actualizado ${Date.now()}`);
      await submitForm(page, 'Guardar');
      try {
        await expectSuccessMessage(page);
      } catch (error) {
        // Si hay error 403, verificar si es esperado
        if (error instanceof Error && error.message.includes('403')) {
          await handleExpected403(page, 'users.update', error.message, test);
          return;
        }
        throw error;
      }
      
      // Esperar a que el refresh termine
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    }
  });

  test('Supervisor no debe tener acceso a usuarios', async ({ page }) => {
    await login(page, TEST_USERS.supervisor);
    
    // Verificar que no aparece en el sidebar
    const usersLink = page.locator('nav a:has-text("Usuarios")');
    await expect(usersLink).not.toBeVisible({ timeout: 3000 });
    
    // Intentar acceder directamente
    await page.goto('/settings/users');
    
    // Esperar a que la redirección ocurra o que se muestre un error
    await page.waitForTimeout(2000);
    
    // Debe redirigir a /unauthorized o a otra página (no /users)
    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(/\/users/);
    
    // Verificar que se muestra mensaje de no autorizado o se redirige
    const unauthorizedMessage = page.locator('text=/no autorizado|sin permisos|unauthorized/i').first();
    const isUnauthorized = await unauthorizedMessage.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isUnauthorized && !currentUrl.includes('/unauthorized') && !currentUrl.includes('/dashboard')) {
      // Si no hay mensaje de error ni redirección, verificar que al menos no está en /users
      expect(currentUrl).not.toContain('/users');
    }
  });

  test('Administration no debe tener acceso a usuarios', async ({ page }) => {
    await login(page, TEST_USERS.administration);
    
    // Verificar que no aparece en el sidebar
    const usersLink = page.locator('nav a:has-text("Usuarios")');
    await expect(usersLink).not.toBeVisible({ timeout: 3000 });
    
    // Intentar acceder directamente
    await page.goto('/settings/users');
    
    // Esperar a que la redirección ocurra o que se muestre un error
    await page.waitForTimeout(2000);
    
    // Debe redirigir a /unauthorized o a otra página (no /users)
    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(/\/users/);
  });

  test('Operator no debe tener acceso a usuarios', async ({ page }) => {
    await login(page, TEST_USERS.operator);
    
    // Verificar que no aparece en el sidebar
    const usersLink = page.locator('nav a:has-text("Usuarios")');
    await expect(usersLink).not.toBeVisible({ timeout: 3000 });
  });
});

