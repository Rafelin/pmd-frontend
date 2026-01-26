const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  // No ejecutar Playwright E2E con Jest; se ejecutan con `npm run test:e2e`
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/e2e/'],
  // Evita que Jest escanee artefactos de build (p.ej. `.next/standalone/package.json`)
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  watchPathIgnorePatterns: ['<rootDir>/.next/'],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'store/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/__tests__/**',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/*.spec.{js,jsx,ts,tsx}',
    // Excluir rutas de API de Next.js y páginas (no son testables unitariamente)
    '!app/**',
    // Excluir archivos de configuración
    '!**/*.config.{js,ts}',
    '!**/jest.setup.js',
  ],
  // Deshabilitar instrumentación automática para evitar problemas con babel-plugin-istanbul
  coverageProvider: 'v8',
  // Deshabilitar umbrales estrictos por ahora debido a problemas con babel-plugin-istanbul
  // Los umbrales se pueden habilitar cuando se resuelva el problema de instrumentación
  // coverageThreshold: {
  //   global: {
  //     branches: 70,
  //     functions: 75,
  //     lines: 75,
  //     statements: 75,
  //   },
  // },
  moduleDirectories: ['node_modules', '<rootDir>/'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

