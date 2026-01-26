import { Page, expect } from '@playwright/test';

/**
 * Helpers para navegación en pruebas E2E
 */

/**
 * Navega a una ruta específica y espera a que cargue
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  // Esperar a que la página cargue (ajustar según tu implementación)
  await page.waitForLoadState('networkidle');
}

/**
 * Verifica que estamos en una ruta específica
 */
export async function expectRoute(page: Page, path: string | RegExp): Promise<void> {
  if (typeof path === 'string') {
    expect(page.url()).toContain(path);
  } else {
    expect(page.url()).toMatch(path);
  }
}

/**
 * Mapeo de nombres de menú a rutas esperadas
 */
const MENU_ROUTE_MAP: Record<string, RegExp> = {
  'Dashboard': /\/dashboard/,
  'Obras': /\/works/,
  'Gastos': /\/expenses/,
  'Proveedores': /\/suppliers/,
  'Contratos': /\/contracts/,
  'Ingresos': /\/incomes/,
  'Caja': /\/cashbox/, // Alias para "Cajas"
  'Cajas': /\/cashbox/,
  'Documentación': /\/documents/,
  'Recibos': /\/receipts/,
  'Contabilidad': /\/accounting/,
  'Alertas': /\/alerts/,
  'Auditoría': /\/audit/,
  'Usuarios': /\/settings\/users|\/users/,
  'Roles': /\/settings\/roles|\/roles/,
  'Configuración': /\/settings/,
};

/**
 * Navega usando el menú lateral (sidebar)
 * 
 * El Sidebar usa Links de Next.js con texto específico:
 * - "Dashboard", "Obras", "Gastos", "Proveedores", "Contratos", "Ingresos", 
 *   "Cajas", "Documentación", "Contabilidad", "Alertas", "Auditoría", 
 *   "Usuarios", "Roles"
 */
export async function navigateViaSidebar(page: Page, menuItem: string): Promise<void> {
  console.log(`[NAV] Navegando a "${menuItem}" desde el sidebar...`);
  
  // El Sidebar usa Link de Next.js con el texto exacto del label
  // Los items están dentro de <Link> con href y texto en un <span>
  // Intentar múltiples selectores para encontrar el item
  const selectors = [
    `nav a:has-text("${menuItem}")`,
    `a:has-text("${menuItem}")`,
    `nav a[href*="${menuItem.toLowerCase()}"]`,
    `a[href*="${menuItem.toLowerCase()}"]`,
  ];
  
  let sidebarItem = null;
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      const isVisible = await locator.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        sidebarItem = locator;
        console.log(`[NAV] ✅ Item encontrado con selector: ${selector}`);
        break;
      }
    } catch (error) {
      continue;
    }
  }
  
  if (!sidebarItem) {
    // Si no se encuentra, listar todos los items del sidebar para debugging
    const allNavItems = await page.locator('nav a').allTextContents().catch(() => []);
    console.error(`[NAV] ❌ Item "${menuItem}" NO encontrado. Items disponibles en sidebar:`, allNavItems);
    throw new Error(`Item de navegación "${menuItem}" no está visible. Items disponibles: ${allNavItems.join(', ')}`);
  }
  
  // Obtener la URL actual antes de hacer clic
  const currentUrl = page.url();
  console.log(`[NAV] URL actual: ${currentUrl}`);
  
  // Hacer clic en el item del sidebar
  await sidebarItem.click();
  
  // Esperar a que la URL cambie (si hay navegación)
  const expectedRoute = MENU_ROUTE_MAP[menuItem];
  if (expectedRoute) {
    console.log(`[NAV] Esperando navegación a ruta que coincida con: ${expectedRoute}`);
    try {
      await page.waitForURL(expectedRoute, { timeout: 15000 });
      console.log(`[NAV] ✅ Navegación exitosa a: ${page.url()}`);
    } catch (e) {
      console.warn(`[NAV] ⚠️ No se detectó cambio de URL, pero continuando...`);
      // Esperar un poco para que la página cargue
      await page.waitForTimeout(2000);
    }
  } else {
    console.warn(`[NAV] ⚠️ No hay ruta esperada para "${menuItem}", esperando networkidle...`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  }
  
  // Esperar un poco más para que React renderice la nueva página
  await page.waitForTimeout(1000);
}

/**
 * Verifica que un elemento de navegación está visible según el rol
 * 
 * Los items del Sidebar están en Links de Next.js dentro de <nav>
 */
export async function expectNavigationVisible(page: Page, items: string[]): Promise<void> {
  console.log(`[NAV] Verificando que los siguientes items estén visibles: ${items.join(', ')}`);
  
  for (const item of items) {
    // Buscar en el sidebar (dentro de <nav>)
    // Intentar múltiples selectores para encontrar el item
    const selectors = [
      `nav a:has-text("${item}")`,
      `a:has-text("${item}")`,
      `nav [href*="${item.toLowerCase()}"]`,
    ];
    
    let found = false;
    for (const selector of selectors) {
      const navItem = page.locator(selector).first();
      const isVisible = await navItem.isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        console.log(`[NAV] ✅ Item "${item}" encontrado con selector: ${selector}`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Si no se encuentra, listar todos los items del sidebar para debugging
      const allNavItems = await page.locator('nav a').allTextContents().catch(() => []);
      console.error(`[NAV] ❌ Item "${item}" NO encontrado. Items disponibles en sidebar:`, allNavItems);
      throw new Error(`Item de navegación "${item}" no está visible. Items disponibles: ${allNavItems.join(', ')}`);
    }
  }
  
  console.log(`[NAV] ✅ Todos los items están visibles`);
}

/**
 * Verifica que un elemento de navegación NO está visible según el rol
 * 
 * Los items del Sidebar están en Links de Next.js dentro de <nav>
 */
export async function expectNavigationHidden(page: Page, items: string[]): Promise<void> {
  console.log(`[NAV] Verificando que los siguientes items NO estén visibles: ${items.join(', ')}`);
  
  for (const item of items) {
    // Buscar en el sidebar (dentro de <nav>)
    const navItem = page.locator(`nav a:has-text("${item}")`).first();
    const isVisible = await navItem.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isVisible) {
      // Si está visible, obtener el texto completo para debugging
      const text = await navItem.textContent().catch(() => '');
      const href = await navItem.getAttribute('href').catch(() => '');
      console.error(`[NAV] ❌ Item "${item}" ESTÁ visible (no debería estarlo). Texto: "${text}", href: "${href}"`);
      
      // Listar todos los items del sidebar para debugging
      const allNavItems = await page.locator('nav a').allTextContents().catch(() => []);
      console.error(`[NAV] Items disponibles en sidebar:`, allNavItems);
      
      throw new Error(`Item de navegación "${item}" está visible cuando no debería estarlo. Items disponibles: ${allNavItems.join(', ')}`);
    } else {
      console.log(`[NAV] ✅ Item "${item}" correctamente oculto`);
    }
  }
  
  console.log(`[NAV] ✅ Todos los items están correctamente ocultos`);
}

