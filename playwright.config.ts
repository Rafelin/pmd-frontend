import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para pruebas E2E del frontend PMD
 * 
 * Las pruebas verifican los flujos completos del usuario desde el navegador,
 * asegurando que no haya errores en la interacción real con el sistema.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Desactivar paralelismo completo para evitar sobrecarga
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Usar solo 1 worker para evitar problemas de recursos
  // Seed mínimo para que los E2E no dependan del orden ni de datos manuales
  globalSetup: require.resolve('./e2e/global-setup'),
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 60000, // Aumentar timeout de acciones
    navigationTimeout: 120000, // Aumentar timeout de navegación a 2 minutos
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Descomentar para ejecutar en múltiples navegadores
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Configurar servidor de desarrollo de Next.js antes de las pruebas
  // Nota: Si el servidor ya está corriendo en otro puerto, Playwright lo reutilizará
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // Reutilizar servidor existente si no está en CI
    timeout: 180000, // 3 minutos para dar tiempo a Next.js a compilar
    stdout: 'ignore',
    stderr: 'pipe',
  },
  
  // Aumentar timeout global de los tests
  timeout: 120000, // 120 segundos por test (2 minutos)
});

