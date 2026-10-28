import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { postsDir } from './middleware/upload';

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
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve ONLY promotional post images publicly
// NOTE: Verification screenshots are protected and NOT mounted as static files!
app.use('/uploads/posts', express.static(postsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/contact-admin', contactRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Party Hub API',
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
