// ecosystem.config.js — PM2 Configuration
// Usage: pm2 start ecosystem.config.js
// Usage (prod): pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    // ─── Express API ──────────────────────────────────────
    {
      name: 'disco-api',
      cwd: './api',
      script: 'dist/index.js',
      instances: 'max',          // cluster mode — one per CPU core
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      restart_delay: 3000,
    },

    // ─── Discord Bot ──────────────────────────────────────
    {
      name: 'disco-bot',
      cwd: './bot',
      script: 'dist/index.js',
      instances: 1,              // single instance — Discord WebSocket
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/bot-error.log',
      out_file: './logs/bot-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};
