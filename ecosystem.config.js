module.exports = {
  apps: [
    {
      name: "u-ride-backend",
      cwd: "./packages/backend",
      script: "dist/main.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        NODE_ENV: "production"
      },
      error_file: "./pm2_logs/u-ride-backend-error.log",
      out_file: "./pm2_logs/u-ride-backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm Z"
    },
    {
      name: "u-ride-frontend",
      cwd: "./packages/frontend",
      script: "node_modules/vite/bin/vite.js",
      args: "preview --host 0.0.0.0",
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        NODE_ENV: "production"
      },
      error_file: "./pm2_logs/u-ride-frontend-error.log",
      out_file: "./pm2_logs/u-ride-frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm Z"
    }
  ]
};
