import { Page, Locator, expect } from '@playwright/test';

/**
 * Helpers para interactuar con formularios en pruebas E2E
 */

/**
 * Llena un campo de formulario
 * 
 * Los formularios usan componentes como InputField, SelectField que tienen:
 * - Labels dentro de FormField
 * - Inputs/selects sin IDs específicos, pero con labels asociados
 * 
 * Busca por: label asociado, name, placeholder, id, o data-testid
 */
/**
 * Verifica que un modal esté abierto antes de interactuar con campos
 */
async function ensureModalIsOpen(page: Page): Promise<boolean> {
  // Verificar si hay un modal visible
  const modalSelectors = [
    'div[class*="modal"]',
    'div[class*="Modal"]',
    'div[class*="overlay"]',
    '[role="dialog"]',
    // Selectores más específicos del componente Modal
    'div[class*="modal-overlay"]',
    'div[class*="modal-container"]',
  ];
  
  let modalFound = false;
  for (const selector of modalSelectors) {
    const modal = page.locator(selector).first();
    const isVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      modalFound = true;
      console.log(`[fillField] ✅ Modal encontrado con selector: ${selector}`);
      break;
    }
  }
  
  if (!modalFound) {
    console.log(`[fillField] ⚠️ No se encontró modal abierto, continuando de todas formas...`);
  }
  
  return modalFound;
}

export async function fillField(page: Page, label: string | Locator, value: string): Promise<void> {
  console.log(`[fillField] 🔍 Buscando campo con label: "${typeof label === 'string' ? label : 'Locator'}"`);
  
  // Verificar que hay un modal abierto (si estamos en un contexto de modal)
  // No lanzar error si no se encuentra, solo loguear
  const modalIsOpen = await ensureModalIsOpen(page).catch(() => false);
  if (!modalIsOpen) {
    console.log(`[fillField] ⚠️ No se encontró modal abierto, pero continuando (puede que el campo esté en la página principal)...`);
  }
  
  let field: Locator | null = null;
  
  if (typeof label === 'string') {
    // Normalizar el label para búsqueda (sin acentos, lowercase)
    const normalizedLabel = label.toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .trim();
    
    // Intentar múltiples estrategias de búsqueda (ordenadas por confiabilidad)
    // También buscar variaciones del label (con/sin "de", mayúsculas/minúsculas)
    // Casos especiales: "Monto Total" puede ser "Monto Total" o "Monto"
    // "Fecha Inicio" puede ser "Fecha de inicio", "Fecha Inicio", "Fecha inicio"
    const labelVariations = [
      label,
      label.replace(/ de /gi, ' '), // "Fecha de inicio" -> "Fecha inicio"
      label.replace(/^Fecha /i, 'Fecha de '), // "Fecha Inicio" -> "Fecha de Inicio"
      label.replace(/^Fecha inicio$/i, 'Fecha de inicio'), // "Fecha inicio" -> "Fecha de inicio"
      label.replace(/^Monto Total$/i, 'Monto Total'), // Mantener "Monto Total"
      label.replace(/^Monto$/i, 'Monto Total'), // "Monto" -> "Monto Total"
      label.toLowerCase(),
      label.toUpperCase(),
      // Variaciones comunes
      label.replace(/\s+/g, ' ').trim(), // Normalizar espacios
    ];
    
    const selectors: string[] = [];
    
    // 1. Buscar por label asociado (más confiable en FormField) - con todas las variaciones
    for (const labelVar of labelVariations) {
      selectors.push(
        `label:has-text("${labelVar}") + input`,
        `label:has-text("${labelVar}") ~ input`,
        `label:has-text("${labelVar}") + select`,
        `label:has-text("${labelVar}") ~ select`,
        `label:has-text("${labelVar}") + textarea`,
        `label:has-text("${labelVar}") ~ textarea`,
      );
    }
    
    // Agregar selectores originales
    selectors.push(
      // 2. Buscar por name (si el campo tiene name)
      `input[name*="${normalizedLabel}"]`,
      `select[name*="${normalizedLabel}"]`,
      `textarea[name*="${normalizedLabel}"]`,
      `input[name*="${label.toLowerCase()}"]`,
      `select[name*="${label.toLowerCase()}"]`,
      // 3. Buscar por ID (si existe)
      `#${normalizedLabel.replace(/\s+/g, '-')}`,
      `input[id*="${normalizedLabel}"]`,
      `select[id*="${normalizedLabel}"]`,
      `textarea[id*="${normalizedLabel}"]`,
      // 4. Buscar por placeholder
      `input[placeholder*="${label}"]`,
      `input[placeholder*="${normalizedLabel}"]`,
      `textarea[placeholder*="${label}"]`,
      // 5. Buscar por data-testid
      `[data-testid*="${normalizedLabel}"]`,
      `input[data-testid*="${normalizedLabel}"]`,
      `select[data-testid*="${normalizedLabel}"]`,
      // 6. Buscar en contenedor con label (con todas las variaciones)
    );
    
    for (const labelVar of labelVariations) {
      selectors.push(
        `div:has(label:has-text("${labelVar}")) input`,
        `div:has(label:has-text("${labelVar}")) select`,
        `div:has(label:has-text("${labelVar}")) textarea`,
      );
    }
    
    // Probar cada selector hasta encontrar uno visible
    // Aumentar timeout para dar más tiempo a que los campos se rendericen
    console.log(`[fillField] 🔍 Probando ${selectors.length} selectores...`);
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const locator = page.locator(selector).first();
      const isVisible = await locator.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        field = locator;
        console.log(`[fillField] ✅ Campo encontrado con selector ${i + 1}/${selectors.length}: ${selector.substring(0, 80)}...`);
        break;
      }
    }
    
    // Si no se encontró, intentar buscar el label y luego el input/select más cercano
    // Probar con todas las variaciones del label
    if (!field) {
      for (const labelVar of labelVariations) {
        const labelElement = page.locator(`label:has-text("${labelVar}")`).first();
        const labelExists = await labelElement.isVisible({ timeout: 2000 }).catch(() => false);
        if (labelExists) {
          // Buscar el input/select más cercano al label (en el mismo contenedor)
          // El componente Input renderiza: <div><label>...</label><input /></div>
          const parentContainer = labelElement.locator('..'); // div contenedor
          const fieldInParent = parentContainer.locator('input, select, textarea').first();
          const isFieldVisible = await fieldInParent.isVisible({ timeout: 2000 }).catch(() => false);
          if (isFieldVisible) {
            field = fieldInParent;
            break;
          } else {
            // Buscar en el siguiente hermano
            const nextSibling = labelElement.locator('+ *').locator('input, select, textarea').first();
            const isNextVisible = await nextSibling.isVisible({ timeout: 2000 }).catch(() => false);
            if (isNextVisible) {
              field = nextSibling;
              break;
            }
          }
        }
      }
    }
    
    // Si aún no se encontró, buscar por aria-label o aria-labelledby
    if (!field || !(await field.isVisible({ timeout: 2000 }).catch(() => false))) {
      const ariaLabelField = page.locator(`input[aria-label*="${label}"], select[aria-label*="${label}"], textarea[aria-label*="${label}"]`).first();
      const isAriaVisible = await ariaLabelField.isVisible({ timeout: 2000 }).catch(() => false);
      if (isAriaVisible) {
        field = ariaLabelField;
      }
    }
    
    // Último fallback: buscar por texto parcial del label (para casos como "Descripción" que puede estar en diferentes lugares)
    if (!field || !(await field.isVisible({ timeout: 2000 }).catch(() => false))) {
      const partialLabel = label.split(' ')[0]; // Tomar la primera palabra
      const partialSelectors = [
        `label:has-text("${partialLabel}") + input`,
        `label:has-text("${partialLabel}") + textarea`,
        `input[placeholder*="${partialLabel}"]`,
        `textarea[placeholder*="${partialLabel}"]`,
      ];
      for (const selector of partialSelectors) {
        const locator = page.locator(selector).first();
        const isVisible = await locator.isVisible({ timeout: 2000 }).catch(() => false);
        if (isVisible) {
          field = locator;
          break;
        }
      }
    }
    
    // Último fallback: usar el primer selector y esperar a que aparezca
    if (!field || !(await field.isVisible({ timeout: 2000 }).catch(() => false))) {
      field = page.locator(selectors[0]).first();
    }
  } else {
    field = label;
  }
  
  if (!field) {
    // Capturar información de debugging
    const pageContent = await page.content().catch(() => '');
    const allLabels = await page.locator('label').allTextContents().catch(() => []);
    console.error(`[fillField] ❌ No se encontró el campo con label "${typeof label === 'string' ? label : 'Locator'}"`);
    console.error(`[fillField] 📋 Labels disponibles en la página:`, allLabels.slice(0, 20));
    throw new Error(`No se pudo encontrar el campo con label "${typeof label === 'string' ? label : 'Locator'}". Labels disponibles: ${allLabels.slice(0, 10).join(', ')}`);
  }
  
  console.log(`[fillField] ✅ Campo encontrado, verificando visibilidad...`);
  await expect(field).toBeVisible({ timeout: 15000 });
  
  // Detectar si es un <select> y usar selectOption en lugar de fill
  const tagName = await field.evaluate((el) => el.tagName.toLowerCase());
  const inputType = await field.evaluate((el) => (el as HTMLInputElement).type).catch(() => '');
  
  // Si es un input de tipo combobox/autocomplete, usar estrategia especial
  if (inputType === 'text' && typeof label === 'string' && (label.toLowerCase().includes('obra') || label.toLowerCase().includes('proveedor') || label.toLowerCase().includes('supplier') || label.toLowerCase().includes('work'))) {
    // Intentar llenar y luego seleccionar de un dropdown
    await field.fill(value);
    await page.waitForTimeout(500);
    // Buscar la opción en el dropdown
    const option = page.locator(`text="${value}"`).first();
    const isOptionVisible = await option.isVisible({ timeout: 3000 }).catch(() => false);
    if (isOptionVisible) {
      await option.click();
      return;
    }
    // Si no hay dropdown, presionar Enter para confirmar
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    return;
  }
  
  if (tagName === 'select') {
    // Para select, usar selectOption
    await field.selectOption({ label: value }).catch(async () => {
      // Si no encuentra por label, intentar por value
      await field.selectOption(value).catch(async () => {
        // Si tampoco funciona, intentar por index
        const options = await field.locator('option').all();
        for (let i = 0; i < options.length; i++) {
          const optionText = await options[i].textContent();
          if (optionText && optionText.toLowerCase().includes(value.toLowerCase())) {
            await field.selectOption({ index: i });
            return;
          }
        }
        throw new Error(`No se pudo seleccionar la opción "${value}" en el select`);
      });
    });
  } else {
    // Para input, textarea, etc., usar fill
    await field.fill(value);
  }
}

/**
 * Selecciona una opción de un select
 * 
 * Los selects usan SelectField que tiene un label y un <select> dentro de FormField
 * También puede ser un combobox/autocomplete que requiere interacción especial
 */
export async function selectOption(page: Page, label: string, value: string): Promise<void> {
  // Primero intentar si es un combobox/autocomplete (input con dropdown)
  const comboboxInput = page.locator(`label:has-text("${label}") + input, label:has-text("${label}") ~ input`).first();
  const isCombobox = await comboboxInput.isVisible({ timeout: 1000 }).catch(() => false);
  
  if (isCombobox) {
    // Es un combobox, usar estrategia de autocomplete
    await comboboxInput.click();
    await comboboxInput.fill(value);
    await page.waitForTimeout(500);
    
    // Buscar la opción en el dropdown
    const dropdownOption = page.locator(`text="${value}"`).first();
    const isOptionVisible = await dropdownOption.isVisible({ timeout: 3000 }).catch(() => false);
    if (isOptionVisible) {
      await dropdownOption.click();
      await page.waitForTimeout(300);
      return;
    }
    
    // Si no aparece el dropdown, intentar presionar Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    return;
  }
  
  // Buscar el select por label asociado (más confiable)
  // Los componentes Select y SelectField tienen un label y un <select>
  let select: Locator | null = null;
  
  // Estrategia 1: Buscar por label seguido de select (hermano directo)
  const labelWithSelect = page.locator(`label:has-text("${label}") + select`).first();
  if (await labelWithSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    select = labelWithSelect;
  }
  
  // Estrategia 2: Buscar por label y luego el select en el contenedor padre
  if (!select) {
    const labelEl = page.locator(`label:has-text("${label}")`).first();
    if (await labelEl.isVisible({ timeout: 2000 }).catch(() => false)) {
      const parentContainer = labelEl.locator('..');
      const selectInParent = parentContainer.locator('select').first();
      if (await selectInParent.isVisible({ timeout: 2000 }).catch(() => false)) {
        select = selectInParent;
      }
    }
  }
  
  // Estrategia 3: Buscar por name
  if (!select) {
    const normalizedLabel = label.toLowerCase().replace(/\s+/g, '-');
    const selectByName = page.locator(`select[name*="${normalizedLabel}"], select[name*="${label.toLowerCase()}"]`).first();
    if (await selectByName.isVisible({ timeout: 2000 }).catch(() => false)) {
      select = selectByName;
    }
  }
  
  // Estrategia 4: Buscar en contenedor con label
  if (!select) {
    const selectInContainer = page.locator(`div:has(label:has-text("${label}")) select`).first();
    if (await selectInContainer.isVisible({ timeout: 2000 }).catch(() => false)) {
      select = selectInContainer;
    }
  }
  
  // Fallback: usar el primer selector
  if (!select) {
    select = page.locator(`label:has-text("${label}") + select`).first();
  }
  
  if (!select) {
    throw new Error(`No se pudo encontrar el select con label "${label}"`);
  }
  
  await expect(select).toBeVisible({ timeout: 10000 });
  
  // Esperar a que el select esté habilitado
  await expect(select).toBeEnabled({ timeout: 10000 });
  
  // Esperar un poco para que las opciones se carguen
  await page.waitForTimeout(1000);
  
  // Verificar que el select tiene opciones
  const options = await select.locator('option').count();
  if (options === 0) {
    // Esperar un poco más si no hay opciones
    await page.waitForTimeout(2000);
    const optionsAfterWait = await select.locator('option').count();
    if (optionsAfterWait === 0) {
      throw new Error(`El select no tiene opciones disponibles`);
    }
  }
  
  // Intentar seleccionar la opción
  try {
    await select.selectOption({ label: value });
  } catch (error) {
    // Si falla, intentar por value
    try {
      await select.selectOption(value);
    } catch (error2) {
      // Si también falla, intentar buscar por texto parcial
      const allOptions = await select.locator('option').all();
      for (let i = 0; i < allOptions.length; i++) {
        const optionText = await allOptions[i].textContent();
        if (optionText && optionText.toLowerCase().includes(value.toLowerCase())) {
          await select.selectOption({ index: i });
          return;
        }
      }
      const optionTexts = await Promise.all(allOptions.map(o => o.textContent()));
      throw new Error(`No se pudo seleccionar la opción "${value}" en el select. Opciones disponibles: ${optionTexts.join(', ')}`);
    }
  }
}

/**
 * Selecciona una opción de un combobox/autocomplete
 */
export async function selectComboboxOption(page: Page, label: string, optionText: string): Promise<void> {
  const combobox = page.locator(`input[placeholder*="${label}"], label:has-text("${label}") + input`).first();
  await combobox.click();
  await combobox.fill(optionText);
  
  // Esperar a que aparezcan las opciones
  const option = page.locator(`text="${optionText}"`).first();
  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click();
}

/**
 * Marca/desmarca un checkbox
 */
export async function toggleCheckbox(page: Page, label: string, checked: boolean = true): Promise<void> {
  const checkbox = page.locator(`input[type="checkbox"][name*="${label}"], label:has-text("${label}") input[type="checkbox"]`).first();
  const isChecked = await checkbox.isChecked();
  
  if (isChecked !== checked) {
    await checkbox.click();
  }
}

/**
 * Envía un formulario
 */
export async function submitForm(page: Page, buttonText: string = 'Guardar'): Promise<void> {
  const submitButton = page.locator(`button[type="submit"], button:has-text("${buttonText}")`).first();
  await expect(submitButton).toBeVisible();
  await submitButton.click();
}

/**
 * Verifica que un campo muestra un error de validación
 */
export async function expectFieldError(page: Page, label: string, errorMessage?: string): Promise<void> {
  const field = page.locator(`input[name*="${label}"], label:has-text("${label}") + input`).first();
  const errorElement = page.locator(`text=/error|invalid|requerido/i`).first();
  
  await expect(errorElement).toBeVisible({ timeout: 2000 });
  
  if (errorMessage) {
    await expect(errorElement).toContainText(errorMessage);
  }
}

/**
 * Espera a que aparezca un mensaje de éxito
 * El componente Toast tiene esta estructura:
 * - ToastContainer: div.fixed.top-4.right-4.z-50.space-y-2.max-w-md
 * - ToastItem: div.flex.items-center.gap-3.px-4.py-3.rounded-lg.border.shadow-lg
 *   - Para success: bg-green-50.border-green-200.text-green-800
 *   - Para error: bg-red-50.border-red-200.text-red-800
 *   - Mensaje: p.flex-1.text-sm.font-medium
 */
export async function expectSuccessMessage(page: Page, message?: string): Promise<void> {
  console.log('[expectSuccessMessage] 🔍 Iniciando búsqueda de mensaje de éxito...');
  
  // Patrón regex para detectar mensajes de éxito (expandido)
  const successPattern = /éxito|success|guardado|creado|actualizado|eliminado|correctamente|exitosamente|alerta creada|alerta guardada|alerta resuelta|gasto creado|gasto guardado|proveedor creado|proveedor guardado|proveedor aprobado|documento creado|documento guardado|documento subido|obra creada|obra guardada|obra guardado|usuario creado|usuario guardado|ingreso creado|ingreso guardado|contrato creado|contrato guardado|caja creada|caja guardada|cerrada correctamente|subido correctamente|resuelta correctamente|aprobado correctamente/i;
  
  // Esperar un momento para que el toast aparezca
  await page.waitForTimeout(1500);
  
  // PRIMERO: Verificar si hay un toast de error (esto indica que la operación falló)
  try {
    console.log('[expectSuccessMessage] ⚠️ Verificando si hay toasts de error...');
    const errorToastSelectors = [
      'div.bg-red-50.border-red-200',
      'div[class*="bg-red-50"][class*="border-red-200"]',
      'div.bg-red-50',
      'div[class*="bg-red-50"]',
      'div[class*="red-50"]',
    ];
    
    for (const selector of errorToastSelectors) {
      try {
        const errorToast = page.locator(selector).first();
        const isVisible = await errorToast.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisible) {
          const errorText = await errorToast.textContent({ timeout: 2000 }).catch(() => '') || '';
          console.error(`[expectSuccessMessage] ❌ Toast de ERROR encontrado: "${errorText?.trim().substring(0, 200)}"`);
          
          // Si hay un error 403, 401, u otro error, lanzar excepción con detalles
          // Nota: Los errores 403 pueden ser esperados si el usuario no tiene permisos
          // El test debería verificar permisos antes de intentar la operación
          if (errorText.includes('403') || errorText.includes('Forbidden') || errorText.includes('Insufficient permissions')) {
            throw new Error(
              `Operación falló con error 403 (Forbidden). Mensaje: "${errorText.trim()}". ` +
              `Esto puede ser esperado si el usuario no tiene los permisos necesarios. ` +
              `Verifica los permisos del usuario antes de intentar esta operación.`
            );
          }
          if (errorText.includes('401') || errorText.includes('Unauthorized')) {
            throw new Error(`Operación falló con error 401 (Unauthorized). Mensaje: "${errorText.trim()}". Esto indica un problema de autenticación.`);
          }
          throw new Error(`Operación falló. Toast de error encontrado: "${errorText.trim()}"`);
        }
      } catch (error) {
        // Si es un error que lanzamos nosotros, re-lanzarlo
        if (error instanceof Error && error.message.includes('Operación falló')) {
          throw error;
        }
        continue;
      }
    }
  } catch (error) {
    // Si es un error que lanzamos nosotros, re-lanzarlo
    if (error instanceof Error && error.message.includes('Operación falló')) {
      throw error;
    }
    // Si es otro tipo de error, continuar con la búsqueda de éxito
  }
  
  // Estrategia 1: Buscar el ToastContainer primero y luego el toast dentro
  try {
    console.log('[expectSuccessMessage] 📦 Estrategia 1: Buscando ToastContainer...');
    
    // Buscar el contenedor usando múltiples variaciones de selectores
    const containerSelectors = [
      'div.fixed.top-4.right-4.z-50', // Selector específico
      'div[class*="fixed"][class*="top-4"][class*="right-4"]', // Más flexible
      'div.fixed[style*="top"], div.fixed[style*="right"]', // Por estilos inline (fallback)
    ];
    
    let toastContainer = null;
    for (const selector of containerSelectors) {
      try {
        const locator = page.locator(selector).first();
        const isVisible = await locator.isVisible({ timeout: 3000 }).catch(() => false);
        if (isVisible) {
          toastContainer = locator;
          console.log(`[expectSuccessMessage] ✅ Contenedor encontrado con selector: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Si encontramos el contenedor, buscar el toast dentro
    if (toastContainer) {
      // Buscar toast de éxito dentro del contenedor (múltiples variaciones)
      const toastSelectors = [
        'div.bg-green-50', // Clase exacta
        'div[class*="bg-green-50"]', // Clase parcial
        'div[class*="green-50"]', // Más flexible
      ];
      
      for (const toastSelector of toastSelectors) {
        try {
          const successToast = toastContainer.locator(toastSelector).first();
          const isVisible = await successToast.isVisible({ timeout: 4000 }).catch(() => false);
          
          if (isVisible) {
            // Buscar el texto en el elemento p o directamente en el toast
            const messageElement = successToast.locator('p').first();
            const hasP = await messageElement.count().catch(() => 0) > 0;
            const text = hasP 
              ? (await messageElement.textContent({ timeout: 2000 }).catch(() => '') || '')
              : (await successToast.textContent({ timeout: 2000 }).catch(() => '') || '');
            
            console.log(`[expectSuccessMessage] 📝 Texto encontrado: "${text?.trim().substring(0, 100)}"`);
            
            if (text && successPattern.test(text)) {
              console.log('[expectSuccessMessage] ✅ Mensaje de éxito encontrado (Estrategia 1)');
              return; // Éxito!
            }
          }
        } catch (error) {
          continue;
        }
      }
    }
  } catch (error) {
    console.log('[expectSuccessMessage] ⚠️ Estrategia 1 falló:', error);
  }
  
  // Estrategia 2: Buscar toast de éxito directamente en toda la página (sin contenedor)
  try {
    console.log('[expectSuccessMessage] 📦 Estrategia 2: Buscando toast directamente en la página...');
    await page.waitForTimeout(1000); // Dar tiempo adicional
    
    const toastSelectors = [
      'div.bg-green-50.border-green-200', // Toast success completo con clases específicas
      'div[class*="bg-green-50"][class*="border-green-200"]', // Más flexible
      'div.bg-green-50', // Solo bg-green-50
      'div[class*="bg-green-50"]:has(p)', // Toast con párrafo
      'div[class*="green-50"]', // Más general
    ];
    
    for (const selector of toastSelectors) {
      try {
        const locator = page.locator(selector).first();
        const isVisible = await locator.isVisible({ timeout: 4000 }).catch(() => false);
        
        if (isVisible) {
          // Verificar que está en la parte superior derecha (característico de toasts)
          const boundingBox = await locator.boundingBox().catch(() => null);
          if (boundingBox) {
            const viewportSize = page.viewportSize();
            if (viewportSize && boundingBox.x > viewportSize.width * 0.5) {
              // Está en la mitad derecha de la pantalla, probablemente es un toast
              const text = await locator.textContent({ timeout: 2000 }).catch(() => '') || '';
              console.log(`[expectSuccessMessage] 📝 Texto encontrado (Estrategia 2): "${text?.trim().substring(0, 100)}"`);
              
              if (text && successPattern.test(text)) {
                console.log(`[expectSuccessMessage] ✅ Mensaje de éxito encontrado (Estrategia 2, selector: ${selector})`);
                return; // Éxito!
              }
            }
          }
        }
      } catch (error) {
        continue;
      }
    }
  } catch (error) {
    console.log('[expectSuccessMessage] ⚠️ Estrategia 2 falló:', error);
  }
  
  // Estrategia 3: Buscar por texto directamente y verificar contexto
  try {
    console.log('[expectSuccessMessage] 📦 Estrategia 3: Buscando por texto de éxito...');
    await page.waitForTimeout(1500);
    
    // Buscar cualquier elemento con texto de éxito
    const textLocator = page.locator('text=/éxito|success|guardado|creado|actualizado|eliminado|correctamente/i').first();
    const isVisible = await textLocator.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      // Verificar que está dentro de un elemento con clases de toast (subir en el árbol DOM)
      let element = textLocator;
      for (let i = 0; i < 5; i++) { // Buscar hasta 5 niveles arriba
        try {
          const classes = await element.getAttribute('class').catch(() => '') || '';
          const parent = element.locator('..').first();
          
          if (classes.includes('bg-green-50') || classes.includes('green-50') || classes.includes('border-green')) {
            const text = await textLocator.textContent({ timeout: 2000 }).catch(() => '') || '';
            console.log(`[expectSuccessMessage] 📝 Texto encontrado (Estrategia 3): "${text?.trim().substring(0, 100)}"`);
            console.log('[expectSuccessMessage] ✅ Mensaje de éxito encontrado (Estrategia 3)');
            return; // Éxito!
          }
          
          element = parent;
        } catch (error) {
          break;
        }
      }
    }
  } catch (error) {
    console.log('[expectSuccessMessage] ⚠️ Estrategia 3 falló:', error);
  }
  
  // Estrategia 4: Buscar el mensaje en párrafos dentro de toasts
  try {
    console.log('[expectSuccessMessage] 📦 Estrategia 4: Buscando mensaje en párrafos de toasts...');
    await page.waitForTimeout(1000);
    
    // Buscar p que está dentro de div con bg-green-50
    const messageLocator = page.locator('div.bg-green-50 p, div[class*="bg-green-50"] p, div[class*="green-50"] p').first();
    const isVisible = await messageLocator.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      const text = await messageLocator.textContent({ timeout: 2000 }).catch(() => '') || '';
      console.log(`[expectSuccessMessage] 📝 Texto en párrafo: "${text?.trim().substring(0, 100)}"`);
      
      if (text && successPattern.test(text)) {
        console.log('[expectSuccessMessage] ✅ Mensaje de éxito encontrado (Estrategia 4)');
        return; // Éxito!
      }
    }
  } catch (error) {
    console.log('[expectSuccessMessage] ⚠️ Estrategia 4 falló:', error);
  }
  
  // Si llegamos aquí, no encontramos el mensaje
  console.error('[expectSuccessMessage] ❌ No se encontró mensaje de éxito después de todas las estrategias');
  
  // Verificar una última vez si hay toasts de error (puede que aparezcan después)
  try {
    const errorToast = page.locator('div.bg-red-50, div[class*="bg-red-50"], div[class*="red-50"]').first();
    const isVisible = await errorToast.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      const errorText = await errorToast.textContent({ timeout: 2000 }).catch(() => '') || '';
      console.error(`[expectSuccessMessage] ❌ Toast de ERROR encontrado al final: "${errorText?.trim().substring(0, 200)}"`);
      throw new Error(`Operación falló. Toast de error: "${errorText.trim()}"`);
    }
  } catch (error) {
    // Si es un error que lanzamos nosotros, re-lanzarlo
    if (error instanceof Error && error.message.includes('Operación falló')) {
      throw error;
    }
  }
  
  // Intentar capturar screenshot para debug
  try {
    await page.screenshot({ path: 'test-results/toast-not-found.png', fullPage: false });
    console.log('[expectSuccessMessage] 📸 Screenshot guardado en test-results/toast-not-found.png');
  } catch (error) {
    // Ignorar errores de screenshot
  }
  
  throw new Error('No se encontró mensaje de éxito después de esperar. Verifica que la operación se haya completado correctamente en el backend.');
}

/**
 * Espera a que aparezca un mensaje de error
 */
export async function expectErrorMessage(page: Page, message?: string): Promise<void> {
  // Intentar múltiples selectores para mensajes de error
  const errorSelectors = [
    'text=/error|fallo|incorrecto|inválido|requerido/i',
    '[data-testid*="error"]',
    '[data-testid*="toast-error"]',
    '.toast-error',
    '.alert-error',
    '[role="alert"]:has-text(/error|fallo/i)',
    '.notification-error',
    '.text-red-600',
    '.text-red-500',
  ];
  
  let errorMessage = null;
  for (const selector of errorSelectors) {
    try {
      const locator = page.locator(selector).first();
      const isVisible = await locator.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        errorMessage = locator;
        break;
      }
    } catch (error) {
      continue;
    }
  }
  
  if (!errorMessage) {
    // Fallback: buscar cualquier texto que contenga palabras de error
    errorMessage = page.locator('text=/error|fallo|incorrecto/i').first();
  }
  
  await expect(errorMessage).toBeVisible({ timeout: 10000 });
  
  if (message) {
    await expect(errorMessage).toContainText(message, { timeout: 10000 });
  }
}

