import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'e2e/**/*.cy.ts',
    supportFile: false,
    viewportWidth: 1280,
    viewportHeight: 720,
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
  },
});
