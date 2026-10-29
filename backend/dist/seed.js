"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("./prisma"));
const upload_1 = require("./middleware/upload");
async function seedDatabase() {
    console.log('--- Starting Party Hub Database Seeder ---');
    // Ensure directories exist
    if (!fs_1.default.existsSync(upload_1.verificationsDir))
        fs_1.default.mkdirSync(upload_1.verificationsDir, { recursive: true });
    if (!fs_1.default.existsSync(upload_1.postsDir))
        fs_1.default.mkdirSync(upload_1.postsDir, { recursive: true });
    // Create dummy verification screenshot image if not present
    const dummyVerifyFile = path_1.default.join(upload_1.verificationsDir, 'verify-sample-agent.png');
    if (!fs_1.default.existsSync(dummyVerifyFile)) {
        // 1x1 PNG or small placeholder image buffer
        const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        fs_1.default.writeFileSync(dummyVerifyFile, dummyPng);
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const commonPassword = await bcryptjs_1.default.hash('password123', salt);
    const adminPassword = await bcryptjs_1.default.hash('admin123', salt);
    // 1. Admin
    const admin = await prisma_1.default.user.upsert({
        where: { email: 'admin@partyhub.com' },
        update: {},
        create: {
            email: 'admin@partyhub.com',
            passwordHash: adminPassword,
            fullName: 'System Administrator',
            role: 'ADMIN',
            bio: 'Head of platform moderation and compliance operations.',
            verificationStatus: 'APPROVED',
        },
    });
    console.log('Seeded Admin:', admin.email);
    // 2. Verified Agent with Active Premium
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const verifiedAgent = await prisma_1.default.user.upsert({
        where: { email: 'agent.sarah@partyhub.com' },
        update: {
            verificationStatus: 'APPROVED',
            agencyCenter: 'Star Prime Agency #88',
            platformId: 'ID-992014',
            superLevel: 'Super Level 10 (Diamond)',
        },
        create: {
            email: 'agent.sarah@partyhub.com',
            passwordHash: commonPassword,
            fullName: 'Sarah Jenkins',
            role: 'AGENT',
            bio: 'Top-tier Talent & Marketing Agent representing leading digital creators.',
            verificationStatus: 'APPROVED',
            agencyCenter: 'Star Prime Agency #88',
            platformId: 'ID-992014',
            superLevel: 'Super Level 10 (Diamond)',
        },
    });
    // Seed Agent Premium Subscription
    await prisma_1.default.subscription.upsert({
        where: { id: 'seed-sub-agent-sarah' },
        update: {
            status: 'ACTIVE',
            expirationDate: nextWeek,
        },
        create: {
            id: 'seed-sub-agent-sarah',
            userId: verifiedAgent.id,
            type: 'AGENT_PREMIUM',
            status: 'ACTIVE',
            pricePaid: 50.0,
            startDate: now,
            expirationDate: nextWeek,
        },
    });
    // Seed verification submission for Sarah
    await prisma_1.default.verificationSubmission.deleteMany({ where: { userId: verifiedAgent.id } });
    await prisma_1.default.verificationSubmission.create({
        data: {
            userId: verifiedAgent.id,
            screenshotPath: 'verify-sample-agent.png',
            platformId: 'ID-992014',
            agencyCenter: 'Star Prime Agency #88',
            superLevel: 'Super Level 10 (Diamond)',
            notes: 'Verified Star Agency Center lead host.',
            status: 'APPROVED',
            reviewedBy: 'admin@partyhub.com',
            reviewedAt: now,
        },
    });
    // 3. Second Agent (for messaging demonstration)
    const agentLeo = await prisma_1.default.user.upsert({
        where: { email: 'agent.leo@partyhub.com' },
        update: {
            verificationStatus: 'APPROVED',
            agencyCenter: 'Apex Talent Guild #12',
            platformId: 'ID-440192',
            superLevel: 'Super Level 8 (Platinum)',
        },
        create: {
            email: 'agent.leo@partyhub.com',
            passwordHash: commonPassword,
            fullName: 'Leo Vance',
            role: 'AGENT',
            bio: 'Entertainment & Gaming Specialist Agent with 500k+ reach networks.',
            verificationStatus: 'APPROVED',
            agencyCenter: 'Apex Talent Guild #12',
            platformId: 'ID-440192',
            superLevel: 'Super Level 8 (Platinum)',
        },
    });
    await prisma_1.default.subscription.upsert({
        where: { id: 'seed-sub-agent-leo' },
        update: {
            status: 'ACTIVE',
            expirationDate: nextWeek,
        },
        create: {
            id: 'seed-sub-agent-leo',
            userId: agentLeo.id,
            type: 'AGENT_PREMIUM',
            status: 'ACTIVE',
            pricePaid: 50.0,
            startDate: now,
            expirationDate: nextWeek,
        },
    });
    // 4. Pending Agent (for identity verification review test)
    const pendingAgent = await prisma_1.default.user.upsert({
        where: { email: 'agent.pending@partyhub.com' },
        update: {
            verificationStatus: 'PENDING',
            agencyCenter: 'Galaxy Global Agency #305',
            platformId: 'ID-881295',
            superLevel: 'Super Level 6 (Gold)',
        },
        create: {
            email: 'agent.pending@partyhub.com',
            passwordHash: commonPassword,
            fullName: 'Marcus Cole',
            role: 'AGENT',
            bio: 'New talent manager exploring platform partnerships.',
            verificationStatus: 'PENDING',
            agencyCenter: 'Galaxy Global Agency #305',
            platformId: 'ID-881295',
            superLevel: 'Super Level 6 (Gold)',
        },
    });
    await prisma_1.default.verificationSubmission.deleteMany({ where: { userId: pendingAgent.id } });
    await prisma_1.default.verificationSubmission.create({
        data: {
            userId: pendingAgent.id,
            screenshotPath: 'verify-sample-agent.png',
            platformId: 'ID-881295',
            agencyCenter: 'Galaxy Global Agency #305',
            superLevel: 'Super Level 6 (Gold)',
            notes: 'Please message my ID-881295 directly on the app to verify host agency ownership.',
            status: 'PENDING',
        },
    });
    // 5. Verified Platform Creator with Active Premium
    const creatorAlex = await prisma_1.default.user.upsert({
        where: { email: 'creator.alex@partyhub.com' },
        update: {
            verificationStatus: 'APPROVED',
            agencyCenter: 'Nexora Media Group',
            platformId: 'CR-10024',
            superLevel: 'Super Level 12 (Master)',
        },
        create: {
            email: 'creator.alex@partyhub.com',
            passwordHash: commonPassword,
            fullName: 'Alex Rivera',
            role: 'PLATFORM_CREATOR',
            bio: 'Founder at PulsePlay & Nexora Studios. Building next-gen social entertainment platforms.',
            verificationStatus: 'APPROVED',
            agencyCenter: 'Nexora Media Group',
            platformId: 'CR-10024',
            superLevel: 'Super Level 12 (Master)',
        },
    });
    await prisma_1.default.subscription.upsert({
        where: { id: 'seed-sub-creator-alex' },
        update: {
            status: 'ACTIVE',
            expirationDate: nextWeek,
        },
        create: {
            id: 'seed-sub-creator-alex',
            userId: creatorAlex.id,
            type: 'CREATOR_PREMIUM',
            status: 'ACTIVE',
            pricePaid: 100.0,
            startDate: now,
            expirationDate: nextWeek,
        },
    });
    // 6. Seed Promotional Posts
    const post1 = await prisma_1.default.post.upsert({
        where: { id: 'seed-post-pulseplay' },
        update: {},
        create: {
            id: 'seed-post-pulseplay',
            creatorId: creatorAlex.id,
            platformName: 'PulsePlay Interactive',
            title: 'PulsePlay — Interactive Live Streaming & Fan Rewards App',
            description: 'Connect with top-tier live entertainment. Streamers and fans engage with gamified badges, instant tip drops, and exclusive artist lounges. Ready for creator onboarding with revenue share.',
            destinationLink: 'https://pulseplay.example.com',
            isPublished: true,
            viewCount: 1420,
            likeCount: 1,
        },
    });
    // Boost Post 1 (Active for 24h)
    const boostExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const boostPayment = await prisma_1.default.payments.upsert({
        where: { transactionId: 'TXN-BST-SEED-01' },
        update: {},
        create: {
            userId: creatorAlex.id,
            amount: 50.0,
            currency: 'USD',
            purpose: 'POST_BOOST',
            status: 'COMPLETED',
            transactionId: 'TXN-BST-SEED-01',
            paymentMethod: 'Card (ending in 4242)',
            referenceId: post1.id,
        },
    });
    await prisma_1.default.postBoost.upsert({
        where: { paymentId: boostPayment.id },
        update: {
            status: 'ACTIVE',
            expirationTime: boostExpiresAt,
        },
        create: {
            postId: post1.id,
            status: 'ACTIVE',
            pricePaid: 50.0,
            startTime: now,
            expirationTime: boostExpiresAt,
            paymentId: boostPayment.id,
        },
    });
    const post2 = await prisma_1.default.post.upsert({
        where: { id: 'seed-post-nexora' },
        update: {},
        create: {
            id: 'seed-post-nexora',
            creatorId: creatorAlex.id,
            platformName: 'Nexora Web3 Lounge',
            title: 'Nexora — Community Platform for Music & NFT Showcase',
            description: 'A sleek modern digital hub tailored for entertainment agents and indie musicians to showcase verified track premieres and fan tickets.',
            destinationLink: 'https://nexora.example.com',
            isPublished: true,
            viewCount: 680,
            likeCount: 0,
        },
    });
    // Seed like on Post 1 by Sarah
    await prisma_1.default.postLike.upsert({
        where: {
            postId_userId: {
                postId: post1.id,
                userId: verifiedAgent.id,
            },
        },
        update: {},
        create: {
            postId: post1.id,
            userId: verifiedAgent.id,
        },
    });
    // Seed follow between Sarah and Leo
    await prisma_1.default.follow.upsert({
        where: {
            followerId_followingId: {
                followerId: verifiedAgent.id,
                followingId: agentLeo.id,
            },
        },
        update: {},
        create: {
            followerId: verifiedAgent.id,
            followingId: agentLeo.id,
        },
    });
    // Seed initial sample message between Sarah and Leo
    await prisma_1.default.message.create({
        data: {
            senderId: agentLeo.id,
            receiverId: verifiedAgent.id,
            content: 'Hey Sarah! Loved your recent portfolio update. Are you available for a creator promotion collab next week?',
            isRead: false,
        },
    });
    // Seed contact admin ticket
    await prisma_1.default.contactAdminTicket.create({
        data: {
            userId: verifiedAgent.id,
            subject: 'Inquiry regarding promotional campaign billing',
            message: 'Hello Party Hub Support, could you please clarify if invoice receipts include VAT breakdown for corporate agency accounts? Thank you.',
            status: 'OPEN',
        },
    });
    console.log('--- Seed Data Successfully Inserted ---');
}
// Execute immediately when invoked directly as a script
if (process.argv[1]?.includes('seed')) {
    seedDatabase()
        .catch((e) => {
        console.error('Seed Error:', e);
        process.exit(1);
    })
        .finally(async () => {
        await prisma_1.default.$disconnect();
    });
}
