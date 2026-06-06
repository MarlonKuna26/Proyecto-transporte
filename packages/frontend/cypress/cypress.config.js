const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: 'http://localhost:8081',  // FIX: apuntar al frontend desplegado
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config)
      return config
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});