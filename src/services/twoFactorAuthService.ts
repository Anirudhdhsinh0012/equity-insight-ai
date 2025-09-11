interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface TwoFactorData {
  userId: string;
  secret: string;
  enabled: boolean;
  backupCodes: string[];
  usedCodes?: string[]; // Track used TOTP codes to prevent replay
  lastValidation?: number; // Timestamp of last successful validation
  failedAttempts?: number; // Counter for failed attempts
  lockedUntil?: number; // Timestamp when account unlocks
}

interface ValidationAttempt {
  userId: string;
  timestamp: number;
  code: string;
  success: boolean;
  method: 'totp' | 'backup';
  ip?: string;
  userAgent?: string;
}

interface ValidationMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  lastAttempt: number;
  lockedAccounts: number;
}

export class TwoFactorAuthService {
  private static STORAGE_KEY = 'stockAdvisor2FA';
  private static VALIDATION_LOG_KEY = 'stockAdvisor2FA_validations';
  private static METRICS_KEY = 'stockAdvisor2FA_metrics';
  
  // Security constants
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private static readonly CODE_EXPIRY_WINDOW = 30000; // 30 seconds
  private static readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private static readonly MAX_ATTEMPTS_PER_MINUTE = 10;
  
  private static generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private static get2FAData(): TwoFactorData[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private static save2FAData(data: TwoFactorData[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private static getValidationLog(): ValidationAttempt[] {
    try {
      return JSON.parse(localStorage.getItem(this.VALIDATION_LOG_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private static saveValidationLog(log: ValidationAttempt[]): void {
    // Keep only last 1000 entries
    const trimmedLog = log.slice(-1000);
    localStorage.setItem(this.VALIDATION_LOG_KEY, JSON.stringify(trimmedLog));
  }

  private static getMetrics(): ValidationMetrics {
    try {
      return JSON.parse(localStorage.getItem(this.METRICS_KEY) || '{"totalAttempts":0,"successfulAttempts":0,"failedAttempts":0,"lastAttempt":0,"lockedAccounts":0}');
    } catch {
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        lastAttempt: 0,
        lockedAccounts: 0
      };
    }
  }

  private static saveMetrics(metrics: ValidationMetrics): void {
    localStorage.setItem(this.METRICS_KEY, JSON.stringify(metrics));
  }

  private static logValidationAttempt(userId: string, code: string, success: boolean, method: 'totp' | 'backup'): void {
    const log = this.getValidationLog();
    const attempt: ValidationAttempt = {
      userId,
      timestamp: Date.now(),
      code: code.substring(0, 3) + '***', // Log only first 3 digits for security
      success,
      method,
      ip: 'localhost', // In real app, get from request
      userAgent: navigator.userAgent
    };
    
    log.push(attempt);
    this.saveValidationLog(log);
    
    // Update metrics
    const metrics = this.getMetrics();
    metrics.totalAttempts++;
    metrics.lastAttempt = Date.now();
    if (success) {
      metrics.successfulAttempts++;
    } else {
      metrics.failedAttempts++;
    }
    this.saveMetrics(metrics);
    
    console.log(`[2FA] ${success ? 'SUCCESS' : 'FAILED'} validation attempt for user ${userId} using ${method} method`);
  }

  private static isRateLimited(userId: string): boolean {
    const log = this.getValidationLog();
    const now = Date.now();
    const recentAttempts = log.filter(attempt => 
      attempt.userId === userId && 
      attempt.timestamp > now - this.RATE_LIMIT_WINDOW
    );
    
    if (recentAttempts.length >= this.MAX_ATTEMPTS_PER_MINUTE) {
      console.warn(`[2FA] Rate limit exceeded for user ${userId}: ${recentAttempts.length} attempts in last minute`);
      return true;
    }
    return false;
  }

  private static isAccountLocked(userData: TwoFactorData): boolean {
    if (!userData.lockedUntil) return false;
    
    const now = Date.now();
    if (now < userData.lockedUntil) {
      const remainingTime = Math.ceil((userData.lockedUntil - now) / 1000);
      console.warn(`[2FA] Account ${userData.userId} is locked for ${remainingTime} more seconds`);
      return true;
    }
    
    // Lock expired, reset counters
    userData.lockedUntil = undefined;
    userData.failedAttempts = 0;
    return false;
  }

  private static incrementFailedAttempts(userData: TwoFactorData): void {
    userData.failedAttempts = (userData.failedAttempts || 0) + 1;
    
    if (userData.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      userData.lockedUntil = Date.now() + this.LOCKOUT_DURATION;
      console.warn(`[2FA] Account ${userData.userId} locked due to ${userData.failedAttempts} failed attempts`);
      
      // Update locked accounts metric
      const metrics = this.getMetrics();
      metrics.lockedAccounts++;
      this.saveMetrics(metrics);
    }
  }

  private static resetFailedAttempts(userData: TwoFactorData): void {
    userData.failedAttempts = 0;
    userData.lockedUntil = undefined;
  }

  private static isCodeAlreadyUsed(userData: TwoFactorData, code: string, timestamp: number): boolean {
    if (!userData.usedCodes) userData.usedCodes = [];
    
    // Create a unique identifier for this code and time window
    const timeWindow = Math.floor(timestamp / this.CODE_EXPIRY_WINDOW);
    const codeId = `${code}-${timeWindow}`;
    
    return userData.usedCodes.includes(codeId);
  }

  private static markCodeAsUsed(userData: TwoFactorData, code: string, timestamp: number): void {
    if (!userData.usedCodes) userData.usedCodes = [];
    
    const timeWindow = Math.floor(timestamp / this.CODE_EXPIRY_WINDOW);
    const codeId = `${code}-${timeWindow}`;
    
    userData.usedCodes.push(codeId);
    
    // Clean up old used codes (older than 2 minutes)
    const cutoffTime = Math.floor((timestamp - 2 * 60 * 1000) / this.CODE_EXPIRY_WINDOW);
    userData.usedCodes = userData.usedCodes.filter(usedCodeId => {
      const [, usedTimeWindow] = usedCodeId.split('-');
      return parseInt(usedTimeWindow) > cutoffTime;
    });
  }

  private static simpleHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  }

  private static generateTOTP(secret: string, timestamp?: number): string {
    const time = Math.floor((timestamp || Date.now()) / 30000);
    const hash = this.simpleHash(secret + time.toString());
    const offset = hash.charCodeAt(hash.length - 1) & 0xf;
    const binary = (hash.charCodeAt(offset) & 0x7f) << 24 |
                   (hash.charCodeAt(offset + 1) & 0xff) << 16 |
                   (hash.charCodeAt(offset + 2) & 0xff) << 8 |
                   (hash.charCodeAt(offset + 3) & 0xff);
    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }

  private static verifyTOTP(secret: string, code: string): boolean {
    const currentTime = Date.now();
    for (let i = -1; i <= 1; i++) {
      const timestamp = currentTime + (i * 30000);
      const expectedCode = this.generateTOTP(secret, timestamp);
      if (expectedCode === code) {
        return true;
      }
    }
    return false;
  }

  private static verifyTOTPWithOnceCheck(userData: TwoFactorData, code: string): { success: boolean; error?: string } {
    const currentTime = Date.now();
    
    // Check each time window (-1, 0, +1)
    for (let i = -1; i <= 1; i++) {
      const timestamp = currentTime + (i * 30000);
      const expectedCode = this.generateTOTP(userData.secret, timestamp);
      
      if (expectedCode === code) {
        // Code is valid, now check if it's already been used
        if (this.isCodeAlreadyUsed(userData, code, timestamp)) {
          console.warn(`[2FA] Code ${code.substring(0, 3)}*** already used for user ${userData.userId}`);
          return { success: false, error: 'This code has already been used. Please wait for a new code.' };
        }
        
        // Mark code as used and return success
        this.markCodeAsUsed(userData, code, timestamp);
        userData.lastValidation = currentTime;
        return { success: true };
      }
    }
    
    return { success: false, error: 'Invalid verification code.' };
  }

  static get2FADataForDebug(): TwoFactorData[] {
    return this.get2FAData();
  }

  static generateTOTPForDebug(secret: string, timestamp?: number): string {
    return this.generateTOTP(secret, timestamp);
  }

  static setup2FA(userId: string, appName: string = 'Stock Advisor'): TwoFactorSetup {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();
    const qrCodeUrl = `otpauth://totp/${encodeURIComponent(appName)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;
    
    const data = this.get2FAData();
    const existingIndex = data.findIndex(item => item.userId === userId);
    
    const twoFactorData: TwoFactorData = {
      userId,
      secret,
      enabled: false,
      backupCodes
    };
    
    if (existingIndex >= 0) {
      data[existingIndex] = twoFactorData;
    } else {
      data.push(twoFactorData);
    }
    
    this.save2FAData(data);
    
    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  static enable2FA(userId: string, verificationCode: string, skipVerification: boolean = false): { success: boolean; error?: string } {
    try {
      console.log(`[2FA] Enabling 2FA for user ${userId}`);
      
      const data = this.get2FAData();
      const userIndex = data.findIndex(item => item.userId === userId);
      
      if (userIndex === -1) {
        return { success: false, error: '2FA setup not found. Please start setup again.' };
      }
      
      const userData = data[userIndex];
      
      if (!skipVerification) {
        // Use simple TOTP verification for setup (not the strict once-check)
        if (!this.verifyTOTP(userData.secret, verificationCode)) {
          console.warn(`[2FA] Setup verification failed for user ${userId}`);
          return { success: false, error: 'Invalid verification code. Please try again.' };
        }
      }
      
      // Initialize security fields
      userData.enabled = true;
      userData.usedCodes = [];
      userData.failedAttempts = 0;
      userData.lastValidation = Date.now();
      userData.lockedUntil = undefined;
      
      data[userIndex] = userData;
      this.save2FAData(data);
      
      console.log(`[2FA] 2FA enabled successfully for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error(`[2FA] Enable error for user ${userId}:`, error);
      return { success: false, error: 'Failed to enable 2FA. Please try again.' };
    }
  }

  static verify2FA(userId: string, code: string): { success: boolean; error?: string } {
    try {
      console.log(`[2FA] Starting verification for user ${userId} with code ${code.substring(0, 3)}***`);
      
      // Check rate limiting first
      if (this.isRateLimited(userId)) {
        this.logValidationAttempt(userId, code, false, 'totp');
        return { success: false, error: 'Too many attempts. Please wait a moment before trying again.' };
      }

      const data = this.get2FAData();
      const userIndex = data.findIndex(item => item.userId === userId);
      const userData = data[userIndex];
      
      if (!userData || !userData.enabled) {
        console.error(`[2FA] 2FA not enabled for user ${userId}`);
        this.logValidationAttempt(userId, code, false, 'totp');
        return { success: false, error: '2FA is not enabled for this account.' };
      }

      // Check if account is locked
      if (this.isAccountLocked(userData)) {
        this.logValidationAttempt(userId, code, false, 'totp');
        const lockTime = Math.ceil((userData.lockedUntil! - Date.now()) / 1000);
        return { success: false, error: `Account temporarily locked. Try again in ${lockTime} seconds.` };
      }

      // Check for backup code first (8 characters, alphanumeric)
      const upperCode = code.toUpperCase();
      if (code.length === 8 && userData.backupCodes.includes(upperCode)) {
        // Remove used backup code
        userData.backupCodes = userData.backupCodes.filter(c => c !== upperCode);
        this.resetFailedAttempts(userData);
        userData.lastValidation = Date.now();
        
        // Update data
        data[userIndex] = userData;
        this.save2FAData(data);
        
        console.log(`[2FA] Backup code verification successful for user ${userId}`);
        this.logValidationAttempt(userId, code, true, 'backup');
        return { success: true };
      }

      // Verify TOTP code (6 digits) with once-check
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        const verification = this.verifyTOTPWithOnceCheck(userData, code);
        
        if (verification.success) {
          this.resetFailedAttempts(userData);
          data[userIndex] = userData;
          this.save2FAData(data);
          
          console.log(`[2FA] TOTP verification successful for user ${userId}`);
          this.logValidationAttempt(userId, code, true, 'totp');
          return { success: true };
        } else {
          // Increment failed attempts
          this.incrementFailedAttempts(userData);
          data[userIndex] = userData;
          this.save2FAData(data);
          
          console.warn(`[2FA] TOTP verification failed for user ${userId}: ${verification.error}`);
          this.logValidationAttempt(userId, code, false, 'totp');
          return { success: false, error: verification.error };
        }
      }

      // Invalid code format
      this.incrementFailedAttempts(userData);
      data[userIndex] = userData;
      this.save2FAData(data);
      
      console.warn(`[2FA] Invalid code format for user ${userId}`);
      this.logValidationAttempt(userId, code, false, 'totp');
      return { success: false, error: 'Invalid code format. Please enter a 6-digit TOTP code or 8-character backup code.' };
      
    } catch (error) {
      console.error(`[2FA] Verification error for user ${userId}:`, error);
      this.logValidationAttempt(userId, code, false, 'totp');
      return { success: false, error: 'Failed to verify 2FA code. Please try again.' };
    }
  }

  static is2FAEnabled(userId: string): boolean {
    const data = this.get2FAData();
    const userData = data.find(item => item.userId === userId);
    return userData?.enabled || false;
  }

  static getBackupCodes(userId: string): string[] {
    const data = this.get2FAData();
    const userData = data.find(item => item.userId === userId);
    return userData?.backupCodes || [];
  }

  static regenerateBackupCodes(userId: string, verificationCode: string): { success: boolean; backupCodes?: string[]; error?: string } {
    try {
      const data = this.get2FAData();
      const userIndex = data.findIndex(item => item.userId === userId);
      
      if (userIndex === -1 || !data[userIndex].enabled) {
        return { success: false, error: '2FA is not enabled for this account.' };
      }
      
      const userData = data[userIndex];
      
      if (!this.verifyTOTP(userData.secret, verificationCode)) {
        return { success: false, error: 'Invalid verification code. Please try again.' };
      }
      
      const newBackupCodes = this.generateBackupCodes();
      userData.backupCodes = newBackupCodes;
      data[userIndex] = userData;
      this.save2FAData(data);
      
      return { success: true, backupCodes: newBackupCodes };
    } catch (error) {
      return { success: false, error: 'Failed to regenerate backup codes. Please try again.' };
    }
  }

  static disable2FA(userId: string, verificationCode: string): { success: boolean; error?: string } {
    try {
      console.log(`[2FA] Disabling 2FA for user ${userId}`);
      
      const data = this.get2FAData();
      const userIndex = data.findIndex(item => item.userId === userId);
      
      if (userIndex === -1 || !data[userIndex].enabled) {
        return { success: false, error: '2FA is not enabled for this account.' };
      }
      
      const userData = data[userIndex];
      
      if (!this.verifyTOTP(userData.secret, verificationCode)) {
        console.warn(`[2FA] Disable verification failed for user ${userId}`);
        return { success: false, error: 'Invalid verification code. Please try again.' };
      }
      
      data.splice(userIndex, 1);
      this.save2FAData(data);
      
      console.log(`[2FA] 2FA disabled successfully for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error(`[2FA] Disable error for user ${userId}:`, error);
      return { success: false, error: 'Failed to disable 2FA. Please try again.' };
    }
  }

  // Enhanced monitoring and management methods
  static getValidationMetrics(): ValidationMetrics {
    return this.getMetrics();
  }

  static getValidationHistory(userId?: string, limit: number = 50): ValidationAttempt[] {
    const log = this.getValidationLog();
    const filtered = userId ? log.filter(attempt => attempt.userId === userId) : log;
    return filtered.slice(-limit);
  }

  static getUserSecurityStatus(userId: string): {
    is2FAEnabled: boolean;
    isLocked: boolean;
    failedAttempts: number;
    lastValidation?: number;
    lockTimeRemaining?: number;
    backupCodesRemaining: number;
  } {
    const data = this.get2FAData();
    const userData = data.find(item => item.userId === userId);
    
    if (!userData) {
      return {
        is2FAEnabled: false,
        isLocked: false,
        failedAttempts: 0,
        backupCodesRemaining: 0
      };
    }

    const isLocked = this.isAccountLocked(userData);
    const lockTimeRemaining = userData.lockedUntil ? Math.max(0, userData.lockedUntil - Date.now()) : 0;

    return {
      is2FAEnabled: userData.enabled,
      isLocked,
      failedAttempts: userData.failedAttempts || 0,
      lastValidation: userData.lastValidation,
      lockTimeRemaining: lockTimeRemaining > 0 ? Math.ceil(lockTimeRemaining / 1000) : undefined,
      backupCodesRemaining: userData.backupCodes?.length || 0
    };
  }

  static unlockAccount(userId: string, adminOverride: boolean = false): { success: boolean; error?: string } {
    try {
      if (!adminOverride) {
        return { success: false, error: 'Admin privileges required to unlock accounts.' };
      }

      const data = this.get2FAData();
      const userIndex = data.findIndex(item => item.userId === userId);
      
      if (userIndex === -1) {
        return { success: false, error: 'User not found.' };
      }

      const userData = data[userIndex];
      userData.failedAttempts = 0;
      userData.lockedUntil = undefined;
      userData.usedCodes = []; // Reset used codes as well
      
      data[userIndex] = userData;
      this.save2FAData(data);

      console.log(`[2FA] Account unlocked for user ${userId} by admin`);
      return { success: true };
    } catch (error) {
      console.error(`[2FA] Unlock error for user ${userId}:`, error);
      return { success: false, error: 'Failed to unlock account.' };
    }
  }

  static clearValidationHistory(): void {
    localStorage.removeItem(this.VALIDATION_LOG_KEY);
    localStorage.removeItem(this.METRICS_KEY);
    console.log('[2FA] Validation history cleared');
  }

  static exportSecurityReport(): {
    metrics: ValidationMetrics;
    recentAttempts: ValidationAttempt[];
    userStatuses: Array<{
      userId: string;
      status: any;
    }>;
    generatedAt: number;
  } {
    const data = this.get2FAData();
    const userStatuses = data.map(userData => ({
      userId: userData.userId,
      status: this.getUserSecurityStatus(userData.userId)
    }));

    return {
      metrics: this.getMetrics(),
      recentAttempts: this.getValidationHistory(undefined, 100),
      userStatuses,
      generatedAt: Date.now()
    };
  }
}
