/**
 * Real-time Database Service
 * Handles all database operations with Firebase Firestore for real-time data sync
 */

// Install required packages: npm install firebase

import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';

// Firebase configuration - you'll need to provide your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Database Collections
export const COLLECTIONS = {
  USERS: 'users',
  STOCKS: 'stocks',
  USER_STOCKS: 'user_stocks',
  QUIZZES: 'quizzes',
  QUIZ_RESULTS: 'quiz_results',
  NEWS: 'news',
  NOTIFICATIONS: 'notifications',
  ADMIN_SETTINGS: 'admin_settings'
};

// User Management
export interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  lastLogin: string;
  status: 'active' | 'inactive' | 'suspended';
  portfolioValue: number;
  totalTrades: number;
  watchlistItems: number;
  quizzesCompleted: number;
  subscriptionTier: 'free' | 'premium' | 'pro';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DatabaseStock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  marketCap: string;
  volume24h: number;
  watchersCount: number;
  holdersCount: number;
  avgHoldingValue: number;
  totalHoldingValue: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: Timestamp;
}

export interface DatabaseUserStock {
  id: string;
  userId: string;
  stockId: string;
  symbol: string;
  quantity: number;
  buyPrice: number;
  buyDate: Timestamp;
  currentValue: number;
  totalReturn: number;
  returnPercent: number;
}

export interface DatabaseQuiz {
  id: string;
  title: string;
  description: string;
  category: 'general' | 'stocks' | 'crypto' | 'options' | 'fundamental' | 'technical';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: QuizQuestion[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  completions: number;
  averageScore: number;
  tags: string[];
  estimatedTime: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
}

export interface DatabaseQuizResult {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
  completedAt: Timestamp;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface DatabaseNews {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  author: string;
  category: 'market' | 'stocks' | 'crypto' | 'economy' | 'politics' | 'technology' | 'earnings';
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  publishedAt: Timestamp;
  createdAt: Timestamp;
  isPinned: boolean;
  tags: string[];
  relatedSymbols: string[];
  views: number;
  shares: number;
  imageUrl?: string;
  originalUrl: string;
  isBreaking: boolean;
}

class DatabaseService {
  // User Operations
  static async createUser(userData: Omit<DatabaseUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(userId: string, userData: Partial<DatabaseUser>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        ...userData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async getUser(userId: string): Promise<DatabaseUser | null> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as DatabaseUser;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  static subscribeToUsers(callback: (users: DatabaseUser[]) => void) {
    return onSnapshot(
      query(collection(db, COLLECTIONS.USERS), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DatabaseUser[];
        callback(users);
      }
    );
  }

  // Stock Operations
  static async createStock(stockData: Omit<DatabaseStock, 'id' | 'lastUpdated'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.STOCKS), {
        ...stockData,
        lastUpdated: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating stock:', error);
      throw error;
    }
  }

  static async updateStock(stockId: string, stockData: Partial<DatabaseStock>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.STOCKS, stockId), {
        ...stockData,
        lastUpdated: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  static subscribeToStocks(callback: (stocks: DatabaseStock[]) => void) {
    return onSnapshot(
      query(collection(db, COLLECTIONS.STOCKS), orderBy('watchersCount', 'desc')),
      (snapshot) => {
        const stocks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DatabaseStock[];
        callback(stocks);
      }
    );
  }

  // Quiz Operations
  static async createQuiz(quizData: Omit<DatabaseQuiz, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.QUIZZES), {
        ...quizData,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  }

  static async updateQuiz(quizId: string, quizData: Partial<DatabaseQuiz>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.QUIZZES, quizId), quizData);
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  }

  static subscribeToQuizzes(callback: (quizzes: DatabaseQuiz[]) => void) {
    return onSnapshot(
      query(collection(db, COLLECTIONS.QUIZZES), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const quizzes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DatabaseQuiz[];
        callback(quizzes);
      }
    );
  }

  // Quiz Results Operations
  static async saveQuizResult(resultData: Omit<DatabaseQuizResult, 'id' | 'completedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.QUIZ_RESULTS), {
        ...resultData,
        completedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving quiz result:', error);
      throw error;
    }
  }

  // News Operations
  static async createNews(newsData: Omit<DatabaseNews, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.NEWS), {
        ...newsData,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating news:', error);
      throw error;
    }
  }

  static async updateNews(newsId: string, newsData: Partial<DatabaseNews>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.NEWS, newsId), newsData);
    } catch (error) {
      console.error('Error updating news:', error);
      throw error;
    }
  }

  static subscribeToNews(callback: (news: DatabaseNews[]) => void) {
    return onSnapshot(
      query(collection(db, COLLECTIONS.NEWS), orderBy('publishedAt', 'desc')),
      (snapshot) => {
        const news = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DatabaseNews[];
        callback(news);
      }
    );
  }

  // User Stock Operations
  static async addUserStock(userStockData: Omit<DatabaseUserStock, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.USER_STOCKS), userStockData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding user stock:', error);
      throw error;
    }
  }

  static subscribeToUserStocks(userId: string, callback: (stocks: DatabaseUserStock[]) => void) {
    return onSnapshot(
      query(collection(db, COLLECTIONS.USER_STOCKS), where('userId', '==', userId)),
      (snapshot) => {
        const stocks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DatabaseUserStock[];
        callback(stocks);
      }
    );
  }
}

export default DatabaseService;
