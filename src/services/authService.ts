/**
 * Authentication Service
 * Handles user authentication, session management, and validation
 */

import { User } from '@/types';
import { TwoFactorAuthService } from './twoFactorAuthService';

interface SessionData {
  userId: string;
  email: string;
  timestamp: number;
  requires2FA?: boolean;
  temp2FAToken?: string;
}

export class AuthService {
  private static SESSION_KEY = 'stockAdvisorSession';
  private static USERS_KEY = 'stockAdvisorUsers';
  private static SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Generate a session token
   */
  private static generateSessionToken(user: User): string {
    const sessionData: SessionData = {
      userId: user.id,
      email: user.email,
      timestamp: Date.now()
    };
    return btoa(JSON.stringify(sessionData));
  }

  /**
   * Validate session token
   */
  private static validateSessionToken(token: string): SessionData | null {
    try {
      const sessionData: SessionData = JSON.parse(atob(token));
      const now = Date.now();
      
      // Check if session has expired
      if (now - sessionData.timestamp > this.SESSION_DURATION) {
        return null;
      }
      
      return sessionData;
    } catch {
      return null;
    }
  }

  /**
   * Get all users from storage
   */
  private static getUsers(): User[] {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Save users to storage
   */
  private static saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  /**
   * Hash password (simple implementation for demo - use bcrypt in production)
   */
  private static hashPassword(password: string): string {
    // Simple hash for demo - in production, use bcrypt or similar
    return btoa(password + 'salt_string_here');
  }

  /**
   * Verify password
   */
  private static verifyPassword(password: string, hashedPassword: string): boolean {
    return this.hashPassword(password) === hashedPassword;
  }

  /**
   * Register a new user
   */
  static async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const users = this.getUsers();
      
      // Check if user already exists
      if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        return { success: false, error: 'An account with this email already exists' };
      }

      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email.toLowerCase().trim(),
        name: userData.name.trim(),
        password: this.hashPassword(userData.password), // Store hashed password
        phoneNumber: userData.phone || '',
        createdAt: new Date(),
      };

      // Save user
      users.push(newUser);
      this.saveUsers(users);

      // Create session
      const sessionToken = this.generateSessionToken(newUser);
      localStorage.setItem(this.SESSION_KEY, sessionToken);

      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      return { success: true, user: userWithoutPassword as User };
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  /**
   * Login user
   */
  static async login(email: string, password: string, twoFactorCode?: string): Promise<{ 
    success: boolean; 
    user?: User; 
    error?: string;
    requires2FA?: boolean;
    temp2FAToken?: string;
  }> {
    try {
      const users = this.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password
      if (user.password && !this.verifyPassword(password, user.password)) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check if 2FA is enabled
      const is2FAEnabled = TwoFactorAuthService.is2FAEnabled(user.id);
      
      if (is2FAEnabled) {
        // If 2FA code is not provided, return temp token
        if (!twoFactorCode) {
          const tempToken = this.generateTempToken(user);
          return { 
            success: false, 
            requires2FA: true, 
            temp2FAToken: tempToken,
            error: '2FA verification required'
          };
        }
        
        // Verify 2FA code
        const verification = TwoFactorAuthService.verify2FA(user.id, twoFactorCode);
        if (!verification.success) {
          return { success: false, error: verification.error || 'Invalid 2FA code' };
        }
      }

      // Create session
      const sessionToken = this.generateSessionToken(user);
      localStorage.setItem(this.SESSION_KEY, sessionToken);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword as User };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  /**
   * Complete 2FA login with temporary token
   */
  static async complete2FALogin(tempToken: string, twoFactorCode: string): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      // Validate temp token
      const tempData = this.validateTempToken(tempToken);
      if (!tempData) {
        return { success: false, error: 'Invalid or expired temporary token' };
      }

      const users = this.getUsers();
      const user = users.find(u => u.id === tempData.userId);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Verify 2FA code
      const verification = TwoFactorAuthService.verify2FA(user.id, twoFactorCode);
      if (!verification.success) {
        return { success: false, error: verification.error || 'Invalid 2FA code' };
      }

      // Create session
      const sessionToken = this.generateSessionToken(user);
      localStorage.setItem(this.SESSION_KEY, sessionToken);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword as User };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  /**
   * Generate temporary token for 2FA process
   */
  private static generateTempToken(user: User): string {
    const tempData = {
      userId: user.id,
      email: user.email,
      timestamp: Date.now(),
      expires: Date.now() + 300000 // 5 minutes
    };
    return btoa(JSON.stringify(tempData));
  }

  /**
   * Validate temporary token
   */
  private static validateTempToken(token: string): { userId: string; email: string } | null {
    try {
      const tempData = JSON.parse(atob(token));
      const now = Date.now();
      
      // Check if token has expired
      if (now > tempData.expires) {
        return null;
      }
      
      return {
        userId: tempData.userId,
        email: tempData.email
      };
    } catch {
      return null;
    }
  }

  /**
   * Get current user from session
   */
  static getCurrentUser(): User | null {
    try {
      const sessionToken = localStorage.getItem(this.SESSION_KEY);
      if (!sessionToken) return null;

      const sessionData = this.validateSessionToken(sessionToken);
      if (!sessionData) {
        this.logout();
        return null;
      }

      const users = this.getUsers();
      const user = users.find(u => u.id === sessionData.userId);
      
      if (!user) {
        this.logout();
        return null;
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch {
      this.logout();
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Logout user
   */
  static logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem('stockAdvisorUser'); // Remove legacy storage
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return { success: false, error: 'User not found' };
      }

      // Update user
      users[userIndex] = { ...users[userIndex], ...updates };
      this.saveUsers(users);

      // Return updated user without password
      const { password, ...userWithoutPassword } = users[userIndex];
      return { success: true, user: userWithoutPassword as User };
    } catch (error) {
      return { success: false, error: 'Profile update failed. Please try again.' };
    }
  }

  /**
   * Change password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return { success: false, error: 'User not found' };
      }

      const user = users[userIndex];
      
      // Verify current password
      if (user.password && !this.verifyPassword(currentPassword, user.password)) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Update password
      users[userIndex].password = this.hashPassword(newPassword);
      this.saveUsers(users);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Password change failed. Please try again.' };
    }
  }

  /**
   * Migrate legacy user data and initialize test users
   */
  static migrateLegacyData(): void {
    try {
      // Check for legacy user data
      const legacyUser = localStorage.getItem('stockAdvisorUser');
      if (legacyUser) {
        const user: User = JSON.parse(legacyUser);
        const users = this.getUsers();
        
        // Add user if not already exists
        if (!users.some(u => u.id === user.id || u.email === user.email)) {
          // Set a default password for legacy users
          user.password = this.hashPassword('defaultPassword123!');
          users.push(user);
          this.saveUsers(users);
        }
        
        // Create session for migrated user
        const sessionToken = this.generateSessionToken(user);
        localStorage.setItem(this.SESSION_KEY, sessionToken);
        
        // Remove legacy storage
        localStorage.removeItem('stockAdvisorUser');
      }

      // Initialize test users for demo purposes
      this.initializeTestUsers();
    } catch (error) {
      console.error('Legacy data migration failed:', error);
    }
  }

  /**
   * Initialize test users for demonstration
   */
  private static initializeTestUsers(): void {
    const users = this.getUsers();
    
    // Create test users if they don't exist
    const testUsers = [
      {
        id: 'test-user-no-2fa',
        name: 'Demo User (No 2FA)',
        email: 'demo@test.com',
        password: this.hashPassword('password123'),
        phone: '+1234567890',
        preferences: {},
        watchlist: ['AAPL', 'GOOGL', 'MSFT'],
        alerts: []
      },
      {
        id: 'test-user-with-2fa',
        name: 'Demo User (With 2FA)',
        email: 'demo2fa@test.com',
        password: this.hashPassword('password123'),
        phone: '+1234567891',
        preferences: {},
        watchlist: ['TSLA', 'NVDA', 'AMD'],
        alerts: []
      }
    ];

    let usersUpdated = false;
    testUsers.forEach(testUser => {
      if (!users.some(u => u.email === testUser.email || u.id === testUser.id)) {
        users.push(testUser as any);
        usersUpdated = true;
      }
    });

    if (usersUpdated) {
      this.saveUsers(users);
      
      // Enable 2FA for the second test user
      const setupData = TwoFactorAuthService.setup2FA('test-user-with-2fa', 'Stock Advisor Pro');
      if (setupData) {
        // For demo purposes, enable 2FA without verification
        TwoFactorAuthService.enable2FA('test-user-with-2fa', '123456', true);
      }
    }
  }
}

export default AuthService;
