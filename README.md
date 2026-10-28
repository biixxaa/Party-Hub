# 🎉 Party Hub

**Party Hub** is a promotional full-stack web application designed to connect **Agents** with **Platform Creators**. It enables Platform Creators to advertise apps, websites, and platforms, boost promotional visibility, track verified impressions and Agent likes, while providing verified Agents with private direct networking, talent discovery, and campaign engagement.

---

## 🌟 Key Features

### 1. User Roles & Server-Enforced Permissions
- **Agent**: Browse promotional posts, like/unlike campaigns, discover and follow other Agents, view Agent profiles, send/receive private direct messages (requires Agent Premium and approved identity verification), and contact the Admin.
- **Platform Creator**: Publish promotional posts with platform banners, manage campaigns, track view impressions and Agent likes, inspect the specific Agents who liked each post, boost posts for 24 hours, and contact the Admin.
- **Admin**: Review and approve/reject identity verification screenshots, moderate promotional campaigns, manage user accounts, review subscriptions and verified payments, oversee 24-hour boosted posts, monitor platform analytics, and respond to support inquiries.

### 2. First Deploy Identity Verification & Direct Admin Authentication
- In this deployment, identity verification and authentication are conducted directly through Platform Administrators.
- Agents and Creators share their **Platform / App User ID**, **Agency Center**, and claimed **Super Level** rank (with optional screenshot proof).
- **Admin Direct Verification Protocol**:
  1. Platform Admins receive the shared ID and Agency Center in the Admin Verification Queue.
  2. The Admin direct-messages the candidate on their shared platform ID (with challenge verification codes) to confirm that they are the genuine owner of the account.
  3. Once confirmed, the Admin approves the real user, which permanently attaches and displays their verified **Agency Center** and **Super Level** badge throughout the platform.
- Verification status transitions: `UNSUBMITTED` ➔ `PENDING` ➔ `APPROVED` or `REJECTED`.
- Any submitted verification screenshots are stored in private server storage and are only accessible via authenticated endpoints by platform administrators or the submitting user.

### 3. Safety & Prohibited Contact Restrictions (Section 7)
- **WhatsApp numbers, WhatsApp links (`wa.me`, `whatsapp.com`), Telegram usernames, and Telegram links (`t.me`) are strictly prohibited throughout the platform.**
- Enforced on backend and frontend across:
  - User profiles (full name, bio).
  - Promotional posts (title, description, platform name, destination link).
  - Private messages.
  - Contact Admin inquiry tickets.
- Legitimate official website and application URLs are fully permitted.

### 4. Pricing & Verified Payments
- **Agent Premium Subscription**: **$50 USD / week**
  - Unlocks private direct messaging with verified Agents.
  - Expiration tracked in database; access automatically disabled upon expiration.
  - **Supported Payment Gateways**:
    - **Chapa Payment Gateway** (Telebirr, CBEBirr, Commercial Bank of Ethiopia, QR Pay, and local cards) via [Chapa Payment Link](https://qr.chapa.global/test/payment-preview/payment-link/m6c7yeUA7Y).
    - **Credit / Debit Cards** (Visa, Mastercard with instant gateway authorization).
- **Creator Premium Subscription**: **$100 USD / week**
  - Unlocks publishing and managing promotional campaigns, engagement analytics, and the list of Agents who liked posts.
- **Paid Post Boosting**: **$50 USD per post / 24 hours**
  - Boosts receive top-of-feed priority and display a prominent **Sponsored / Promoted** badge.
  - Boost status automatically expires after exactly 24 hours from payment confirmation.

---

## 🚀 Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Axios, Canvas Confetti.
- **Backend**: Node.js, Express, TypeScript, Multer, Bcrypt, JSON Web Tokens (JWT).
- **Database**: PostgreSQL (`party_hub`).
- **ORM**: Prisma Client.

---

## 🔑 Demo Test Accounts

The database comes pre-seeded with accounts for all roles:

| Role | Email | Password | Status / Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@partyhub.com` | `admin123` | Full admin control, review queue, moderation |
| **VIP Agent** | `agent.sarah@partyhub.com` | `password123` | Approved Verification + Active Agent Premium ($50/wk) |
| **Agent (Leo)** | `agent.leo@partyhub.com` | `password123` | Approved Verification + Active Agent Premium ($50/wk) |
| **Pending Agent** | `agent.pending@partyhub.com` | `password123` | Verification pending review |
| **Platform Creator** | `creator.alex@partyhub.com` | `password123` | Approved Verification + Active Creator Premium ($100/wk) |

*(Quick 1-click test login buttons are also conveniently provided on the `/login` screen)*

---

## 🛠️ Running Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL server running on `127.0.0.1:5432` with database `party_hub`

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run prisma:seed
npm run dev
```
Backend runs on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 📁 Project Structure

```
party/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # PostgreSQL schema (Users, Subscriptions, Boosts, Posts, Likes, Messages)
│   ├── src/
│   │   ├── middleware/           # auth, roleGuard, verificationGuard, subscriptionGuard, upload
│   │   ├── routes/               # auth, verification, posts, payments, agents, messages, contact, admin
│   │   ├── utils/                # prohibitedPatterns.ts (WhatsApp/Telegram detection)
│   │   ├── seed.ts               # Database seeder for demo accounts
│   │   └── server.ts             # Main Express API entry point
│   ├── uploads/
│   │   ├── verifications/        # SECURE: Private verification screenshots (not publicly exposed)
│   │   └── posts/                # Public promotional banners
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, PostCard, CheckoutModal, LikersModal, ProtectedRoute
│   │   ├── context/              # AuthContext
│   │   ├── pages/                # Feed, Login, Register, Verification, AgentDashboard,
│   │   │                         # CreatorDashboard, ManagePosts, Messaging, Subscriptions,
│   │   │                         # ContactAdmin, AdminDashboard
│   │   ├── services/             # Axios API client
│   │   ├── types/                # TypeScript interfaces
│   │   ├── utils/                # Client-side prohibitedValidator
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```
