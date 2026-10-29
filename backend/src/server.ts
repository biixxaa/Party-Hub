import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { exec } from 'child_process';
import prisma from './prisma';
import { postsDir } from './middleware/upload';
import { seedDatabase } from './seed';

// Route imports
import authRoutes from './routes/auth.routes';
import verificationRoutes from './routes/verification.routes';
import postsRoutes from './routes/posts.routes';
import paymentsRoutes from './routes/payments.routes';
import agentsRoutes from './routes/agents.routes';
import messagesRoutes from './routes/messages.routes';
import contactRoutes from './routes/contact.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://partyhubs.netlify.app',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or web origins including Netlify
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.netlify.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve ONLY promotional post images publicly
// NOTE: Verification screenshots are protected and NOT mounted as static files!
app.use('/uploads/posts', express.static(postsDir));

// API Routes - Mounted under both /api/... and /... for maximum client compatibility
const apiRoutes = [
  { path: 'auth', router: authRoutes },
  { path: 'verification', router: verificationRoutes },
  { path: 'posts', router: postsRoutes },
  { path: 'payments', router: paymentsRoutes },
  { path: 'agents', router: agentsRoutes },
  { path: 'messages', router: messagesRoutes },
  { path: 'contact-admin', router: contactRoutes },
  { path: 'admin', router: adminRoutes },
];

for (const route of apiRoutes) {
  app.use(`/api/${route.path}`, route.router);
  app.use(`/${route.path}`, route.router);
}

// Health check endpoint (accessible at /api/health and /health)
app.get(['/api/health', '/health'], async (_req, res) => {
  let dbStatus = 'disconnected';
  let userCount = 0;
  let dbError: string | null = null;

  try {
    userCount = await prisma.user.count();
    dbStatus = 'connected';
  } catch (err: any) {
    dbError = err.message || 'Database connection error';
  }

  res.json({
    status: 'ok',
    message: 'Party Hub API is running',
    database: {
      status: dbStatus,
      userCount,
      error: dbError,
    },
    service: 'Party Hub API',
    timestamp: new Date().toISOString(),
  });
});

// Safe database setup & seed endpoint (accessible via browser or API)
app.all(['/api/setup-database', '/setup-database'], async (_req, res) => {
  try {
    console.log('[Setup] Running prisma db push to ensure schema tables exist...');
    exec('npx prisma db push --accept-data-loss', { env: process.env }, async (error, stdout, stderr) => {
      if (error) {
        console.error('[Setup Error] prisma db push failed:', stderr || error.message);
        res.status(500).json({
          success: false,
          stage: 'prisma db push',
          error: error.message,
          output: stderr || stdout,
        });
        return;
      }

      console.log('[Setup] Schema synchronized successfully. Seeding initial accounts...');
      try {
        await seedDatabase();
        const userCount = await prisma.user.count();
        res.json({
          success: true,
          message: 'Database tables created and demo accounts seeded successfully!',
          userCount,
          output: stdout,
        });
      } catch (seedErr: any) {
        console.error('[Setup Error] Seeding failed:', seedErr);
        res.status(500).json({
          success: false,
          stage: 'seed',
          error: seedErr.message || 'Seeding failed',
          output: stdout,
        });
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Root welcome & status endpoint
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Party Hub API is running',
    healthCheck: '/api/health',
    setupDatabase: '/api/setup-database',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`Party Hub Backend Server listening on http://localhost:${PORT}`);
});

export default app;
