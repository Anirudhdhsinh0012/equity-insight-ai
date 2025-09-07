export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Optional for backward compatibility, stored hashed in production
  phoneNumber: string; // Added for WhatsApp notifications
  createdAt: Date;
  watchlist?: string[]; // Array of stock symbols in user's personal watchlist
}

export interface Stock {
  id: string;
  ticker: string;
  buyDate: Date;
  buyPrice: number;
  quantity: number;
  currentPrice?: number;
  userId: string;
}

export interface StockData {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high52Week: number;
  low52Week: number;
  marketCap: number;
  volume: number;
  peRatio: number;
  dividendYield: number;
  beta: number;
}

export interface HistoricalData {
  date: string;
  price: number;
  volume: number;
}

export interface Portfolio {
  stocks: Stock[];
  totalInvestment: number;
  currentValue: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export interface AIRecommendation {
  action: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  reasoning: string;
  targetPrice?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RecommendedStock {
  ticker: string;
  name: string;
  currentPrice: number;
  reason: string;
  potentialGain: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  sector: string;
}

// Personality Match Types
export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  text: string;
  scores: {
    explorer: number;
    guardian: number;
    opportunist: number;
    contrarian: number;
  };
}

export interface QuizResponse {
  questionId: string;
  selectedOptionId: string;
}

export interface InvestmentArchetype {
  id: 'explorer' | 'guardian' | 'opportunist' | 'contrarian';
  name: string;
  title: string;
  description: string;
  strengths: string[];
  weaknesses?: string[];
  traits: string[];
  idealStocks?: string[];
  emoji: string;
  risks: string[];
  idealHolding: string;
  riskTolerance: string;
  preferredSectors: string[];
  stockCriteria: {
    marketCap: string[];
    volatility: string;
    dividendYield: string;
    peRatio: string;
    growth: string;
  };
  colors: {
    primary: string;
    secondary: string;
    gradient: string;
  };
}

export interface StockRecommendation {
  symbol: string;
  company: string;
  sector: string;
  currentPrice?: number;
  matchScore: number;
  reason: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  archetypeMatch: string[];
}

export interface PersonalityAnalysis {
  primaryArchetype: InvestmentArchetype;
  secondaryArchetype?: InvestmentArchetype;
  confidence: number;
  scores: {
    explorer: number;
    guardian: number;
    opportunist: number;
    contrarian: number;
  };
  recommendations: StockRecommendation[];
  personalizedMessage: string;
  traits: string[];
  coachingTips: string[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BUY' | 'SELL' | 'HOLD' | 'ALERT' | 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  ticker?: string;
  currentPrice?: number;
  targetPrice?: number;
  action?: 'BUY' | 'SELL' | 'HOLD';
  timestamp: Date;
  isRead: boolean;
  isPush?: boolean;
  isWhatsApp?: boolean; // Added to track WhatsApp notifications
  whatsAppMessageId?: string; // Twilio message ID
}

export interface StockAlert {
  id: string;
  userId: string;
  ticker: string;
  type: 'ABOVE' | 'BELOW';
  targetPrice: number;
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

export interface NotificationSettings {
  userId: string;
  enableBrowserNotifications: boolean;
  enablePushNotifications: boolean;
  enableWhatsAppNotifications: boolean; // Added WhatsApp setting
  priceChangeThreshold: number; // Percentage
  buyThreshold: number; // Percentage below buy price
  sellThreshold: number; // Percentage above buy price
  soundEnabled: boolean;
}

// Added WhatsApp specific interfaces
export interface WhatsAppMessage {
  id: string;
  userId: string;
  phoneNumber: string;
  message: string;
  ticker: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  sentAt: Date;
  twilioMessageId: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsAppNumber: string; // Twilio WhatsApp-enabled number
}

// Finnhub API Types
export interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface FinnhubApiStatus {
  quotaUsed: number;
  quotaLimit: number;
  quotaRemaining: number;
  resetTime: Date;
  isLimitReached: boolean;
  lastUpdated: Date;
}

export interface PriceAlert {
  id: string;
  userId: string;
  ticker: string;
  upperThreshold?: number;
  lowerThreshold?: number;
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

export interface RealtimePrice {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
  volume?: number;
}

export interface FinnhubServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  apiQuota: FinnhubApiStatus;
  websocketConnected: boolean;
  cacheSize: number;
}

// Historical Price and Date-Time Based Monitoring
export interface HistoricalPriceRequest {
  ticker: string;
  date: string; // ISO date string
  time: string; // HH:MM format
  quantity: number;
}

export interface HistoricalPriceData {
  ticker: string;
  requestedDateTime: Date;
  actualDateTime: Date; // Closest available data point
  price: number;
  quantity: number;
  totalValue: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
}

export interface StockPosition {
  id: string;
  userId: string;
  ticker: string;
  referenceDate: Date;
  referencePrice: number;
  quantity: number;
  totalValue: number;
  upperThreshold?: number;
  lowerThreshold?: number;
  isMonitoring: boolean;
  createdAt: Date;
  lastChecked?: Date;
  alerts: PositionAlert[];
}

export interface PositionAlert {
  id: string;
  positionId: string;
  userId: string;
  ticker: string;
  alertType: 'UPPER_BREACH' | 'LOWER_BREACH';
  triggerPrice: number;
  referencePrice: number;
  threshold: number;
  triggeredAt: Date;
  isRead: boolean;
  notificationSent: boolean;
}

export interface DateTimeCandle {
  timestamp: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// AI Investment Stories Types
export interface StoryData {
  id: string;
  title: string;
  content: string;
  ticker: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  emoji: string;
  readTime: string;
  timestamp: Date;
  priceData: {
    currentPrice: number;
    change: number;
    changePercent: number;
  };
  tags: string[];
  aiConfidence: number;
}

// Admin Settings Interface
export interface AdminSettings {
  general: {
    siteName: string;
    siteDescription: string;
    timezone: string;
    language: string;
    theme: string;
  };
  users: {
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
    maxLoginAttempts: number;
    sessionTimeout: number;
    passwordMinLength: number;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    soundEnabled: boolean;
    marketAlerts: boolean;
    newsUpdates: boolean;
    systemMaintenance: boolean;
  };
  security: {
    enableSSL: boolean;
    enableFirewall: boolean;
    blockSuspiciousIPs: boolean;
    enableAPIRateLimit: boolean;
    maxAPIRequests: number;
    enableAuditLog: boolean;
    dataRetention: number;
  };
  database: {
    autoBackup: boolean;
    backupFrequency: string;
    maxBackupFiles: number;
    enableCompression: boolean;
    lastBackup: string;
    databaseSize: string;
  };
  appearance: {
    primaryColor: string;
    fontFamily: string;
    sidebarWidth: number;
    compactMode: boolean;
    animations: boolean;
    showTooltips: boolean;
    highContrast: boolean;
  };
}
