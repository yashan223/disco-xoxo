import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './utils/env';
import { logger } from './utils/logger';
import { connectRedis } from './services/redis.service';
import { initSocket } from './services/socket.service';
import authRoutes from './routes/auth.routes';
import apiRoutes from './routes/api.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();
app.set('trust proxy', 1); // Trust the reverse proxy (e.g. Nginx, Docker) to get accurate IPs for rate limiting
const server = createServer(app);

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.DASHBOARD_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP logging via morgan & winston logger
const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Initialization ──────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    // 1. Connect MongoDB
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('✅ MongoDB connected');

    // 2. Connect Redis
    logger.info('Connecting to Redis...');
    await connectRedis();

    // 3. Initialize Socket.IO
    logger.info('Initializing Socket.IO...');
    initSocket(server);
    logger.info('✅ Socket.IO server ready');

    // 4. Start Server
    const PORT = parseInt(env.PORT, 10);
    server.listen(PORT, () => {
      logger.info(`🚀 Disco XOXO API Server running on port ${PORT} (${env.NODE_ENV} mode)`);
    });
  } catch (err) {
    logger.error('Fatal bootstrap error:', err);
    process.exit(1);
  }
}

// Handle termination signals for clean shutdown
function handleShutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during MongoDB disconnection:', err);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

bootstrap();
