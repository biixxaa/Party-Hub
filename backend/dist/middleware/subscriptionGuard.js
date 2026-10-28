"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveSubscription = void 0;
exports.checkActiveSubscription = checkActiveSubscription;
const prisma_1 = __importDefault(require("../prisma"));
/**
 * Checks if the user has an active, unexpired subscription of the given type.
 * Also automatically marks any expired active subscriptions as EXPIRED in the database.
 */
async function checkActiveSubscription(userId, type) {
    const now = new Date();
    // Find active subscriptions
    const activeSub = await prisma_1.default.subscription.findFirst({
        where: {
            userId,
            type,
            status: 'ACTIVE',
        },
        orderBy: { expirationDate: 'desc' },
    });
    if (!activeSub) {
        return false;
    }
    // Check if expired
    if (activeSub.expirationDate <= now) {
        // Update to EXPIRED in database
        await prisma_1.default.subscription.update({
            where: { id: activeSub.id },
            data: { status: 'EXPIRED' },
        });
        return false;
    }
    return true;
}
const requireActiveSubscription = (type) => {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }
        // Admins bypass subscription checks
        if (req.user.role === 'ADMIN') {
            next();
            return;
        }
        const hasActive = await checkActiveSubscription(req.user.id, type);
        if (!hasActive) {
            const typeLabel = type === 'AGENT_PREMIUM' ? 'Agent Premium ($50/week)' : 'Creator Premium ($100/week)';
            res.status(403).json({
                error: `Active ${typeLabel} subscription is required to access this feature.`,
                subscriptionRequired: type,
            });
            return;
        }
        next();
    };
};
exports.requireActiveSubscription = requireActiveSubscription;
