"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = __importDefault(require("./prisma"));
const upload_1 = require("./middleware/upload");
const seed_1 = require("./seed");
const initDb_1 = require("./initDb");
// Route imports
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const verification_routes_1 = __importDefault(require("./routes/verification.routes"));
const posts_routes_1 = __importDefault(require("./routes/posts.routes"));
const payments_routes_1 = __importDefault(require("./routes/payments.routes"));
const agents_routes_1 = __importDefault(require("./routes/agents.routes"));
const messages_routes_1 = __importDefault(require("./routes/messages.routes"));
const contact_routes_1 = __importDefault(require("./routes/contact.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://partyhubs.netlify.app',
    process.env.CLIENT_URL,
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow server-to-server or web origins including Netlify
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.netlify.app')) {
            callback(null, true);
        }
        else {
            callback(null, true);
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve ONLY promotional post images publicly
// NOTE: Verification screenshots are protected and NOT mounted as static files!
app.use('/uploads/posts', express_1.default.static(upload_1.postsDir));
// API Routes - Mounted under both /api/... and /... for maximum client compatibility
const apiRoutes = [
    { path: 'auth', router: auth_routes_1.default },
    { path: 'verification', router: verification_routes_1.default },
    { path: 'posts', router: posts_routes_1.default },
    { path: 'payments', router: payments_routes_1.default },
    { path: 'agents', router: agents_routes_1.default },
    { path: 'messages', router: messages_routes_1.default },
    { path: 'contact-admin', router: contact_routes_1.default },
    { path: 'admin', router: admin_routes_1.default },
];
for (const route of apiRoutes) {
    app.use(`/api/${route.path}`, route.router);
    app.use(`/${route.path}`, route.router);
}
// Health check endpoint (accessible at /api/health and /health)
app.get(['/api/health', '/health'], async (_req, res) => {
    let dbStatus = 'disconnected';
    let userCount = 0;
    let dbError = null;
    try {
        userCount = await prisma_1.default.user.count();
        dbStatus = 'connected';
    }
    catch (err) {
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
        const result = await (0, initDb_1.initializeDatabase)();
        res.json({
            success: true,
            message: 'Database tables created and demo accounts seeded successfully!',
            ...result,
        });
    }
    catch (err) {
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
app.use((err, _req, res, _next) => {
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
        const userCount = await prisma_1.default.user.count();
        if (userCount === 0) {
            console.log('[Auto-Init] Database is empty. Seeding accounts...');
            await (0, seed_1.seedDatabase)();
        }
        else {
            console.log(`[Auto-Init] Database connected. Found ${userCount} users.`);
        }
    }
    catch (err) {
        if (err.message?.includes('does not exist') || err.message?.includes('relation')) {
            console.log('[Auto-Init] Database tables not found. Automatically creating tables and seeding...');
            try {
                await (0, initDb_1.initializeDatabase)();
                console.log('[Auto-Init] Tables and seed data created successfully on boot!');
            }
            catch (initErr) {
                console.error('[Auto-Init Error] Failed to create tables on boot:', initErr.message);
            }
        }
        else {
            console.warn('[Auto-Init Notice] Database check deferred:', err.message);
        }
    }
});
exports.default = app;
