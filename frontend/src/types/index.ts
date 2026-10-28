export type Role = 'AGENT' | 'PLATFORM_CREATOR' | 'ADMIN';

export type VerificationStatus = 'UNSUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type SubscriptionType = 'AGENT_PREMIUM' | 'CREATOR_PREMIUM';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  bio?: string | null;
  avatarUrl?: string | null;
  verificationStatus: VerificationStatus;
  agencyCenter?: string | null;
  platformId?: string | null;
  superLevel?: string | null;
  workedApp?: string | null;
  workedAppId?: string | null;
  experienceLevel?: string | null;
  createdAt: string;
  activeSubscriptions?: Subscription[];
  latestVerification?: VerificationSubmission | null;
}

export interface VerificationSubmission {
  id: string;
  userId: string;
  screenshotPath?: string | null;
  platformId?: string | null;
  agencyCenter?: string | null;
  superLevel?: string | null;
  workedApp?: string | null;
  workedAppId?: string | null;
  pastExperience?: string | null;
  experienceLevel?: string | null;
  notes?: string | null;
  adminDirectMessage?: string | null;
  adminMessageSentAt?: string | null;
  status: VerificationStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    verificationStatus: VerificationStatus;
    agencyCenter?: string | null;
    platformId?: string | null;
    superLevel?: string | null;
    workedApp?: string | null;
    workedAppId?: string | null;
    experienceLevel?: string | null;
    createdAt: string;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  type: SubscriptionType;
  status: SubscriptionStatus;
  pricePaid: number;
  startDate: string;
  expirationDate: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
  };
  payment?: PaymentRecord | null;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  purpose: 'AGENT_PREMIUM' | 'CREATOR_PREMIUM' | 'POST_BOOST';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  transactionId: string;
  paymentMethod: string;
  referenceId?: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
  };
  subscription?: Subscription | null;
  boost?: {
    post?: {
      title: string;
      platformName: string;
    };
  } | null;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  platformName: string;
  destinationLink: string;
  imageUrl?: string | null;
  creator: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
  likeCount: number;
  viewCount: number;
  isBoosted: boolean;
  boostExpiresAt?: string | null;
  isLiked?: boolean;
  isPublished?: boolean;
  createdAt: string;
  updatedAt?: string;
  likedByAgents?: Array<{
    id: string;
    fullName: string;
    email: string;
    bio?: string | null;
    likedAt: string;
  }>;
}

export interface AgentListItem {
  id: string;
  fullName: string;
  bio?: string | null;
  verificationStatus: VerificationStatus;
  agencyCenter?: string | null;
  platformId?: string | null;
  superLevel?: string | null;
  workedApp?: string | null;
  workedAppId?: string | null;
  experienceLevel?: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSelf: boolean;
  createdAt: string;
}

export interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  isSelf: boolean;
  createdAt: string;
}

export interface ConversationItem {
  otherUser: {
    id: string;
    fullName: string;
    email: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ContactTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'RESOLVED';
  adminReply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalAgents: number;
  totalCreators: number;
  pendingVerifications: number;
  totalPosts: number;
  activeBoosts: number;
  openTickets: number;
  totalRevenue: number;
}
