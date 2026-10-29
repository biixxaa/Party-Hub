"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const upload_1 = require("./middleware/upload");
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
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve ONLY promotional post images publicly
// NOTE: Verification screenshots are protected and NOT mounted as static files!
app.use('/uploads/posts', express_1.default.static(upload_1.postsDir));
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/verification', verification_routes_1.default);
app.use('/api/posts', posts_routes_1.default);
app.use('/api/payments', payments_routes_1.default);
app.use('/api/agents', agents_routes_1.default);
app.use('/api/messages', messages_routes_1.default);
app.use('/api/contact-admin', contact_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'Party Hub API is running',
        service: 'Party Hub API',
        timestamp: new Date().toISOString(),
    });
});
// Root welcome & status endpoint
app.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'Party Hub API is running',
        healthCheck: '/api/health',
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
app.listen(PORT, () => {
    console.log(`Party Hub Backend Server listening on http://localhost:${PORT}`);
});
exports.default = app;
