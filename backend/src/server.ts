import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { exec } from 'child_process';
import prisma from './prisma';
import { postsDir } from './middleware/upload';
import { seedDatabase } from './seed';
import { initializeDatabase } from './initDb';

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
    console.log('[Setup] Initializing database tables and seed data...');
    const result = await initializeDatabase();
    res.json({
      success: true,
      message: 'Database tables created and demo accounts seeded successfully!',
      ...result,
    });
  } catch (err: any) {
    console.error('[Setup Error] Failed to initialize database:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Database initialization error',
    });
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

app.listen(PORT, async () => {
  console.log(`Party Hub Backend Server listening on http://localhost:${PORT}`);

  // Automatically check if database tables exist and initialize if empty
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('[Auto-Init] Database is empty. Seeding accounts...');
      await seedDatabase();
    } else {
      console.log(`[Auto-Init] Database connected. Found ${userCount} users.`);
    }
  } catch (err: any) {
    if (err.message?.includes('does not exist') || err.message?.includes('relation')) {
      console.log('[Auto-Init] Database tables not found. Automatically creating tables and seeding...');
      try {
        await initializeDatabase();
        console.log('[Auto-Init] Tables and seed data created successfully on boot!');
      } catch (initErr: any) {
        console.error('[Auto-Init Error] Failed to create tables on boot:', initErr.message);
      }
    } else {
      console.warn('[Auto-Init Notice] Database check deferred:', err.message);
    }
  }
});

export default app;
