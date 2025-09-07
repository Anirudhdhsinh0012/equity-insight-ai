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
}

export class TwoFactorAuthService {
  private static STORAGE_KEY = 'stockAdvisor2FA';
  
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
      const data = this.get2FAData();
      const userIndex = data.findIndex(item => item.userId === userId);
      
      if (userIndex === -1) {
        return { success: false, error: '2FA setup not found. Please start setup again.' };
      }
      
      const userData = data[userIndex];
      
      if (!skipVerification && !this.verifyTOTP(userData.secret, verificationCode)) {
        return { success: false, error: 'Invalid verification code. Please try again.' };
      }
      
      userData.enabled = true;
      data[userIndex] = userData;
      this.save2FAData(data);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to enable 2FA. Please try again.' };
    }
  }

  static verify2FA(userId: string, code: string): { success: boolean; error?: string } {
    try {
      const data = this.get2FAData();
      const userData = data.find(item => item.userId === userId);
      
      if (!userData || !userData.enabled) {
        return { success: false, error: '2FA is not enabled for this account.' };
      }
      
      if (userData.backupCodes.includes(code.toUpperCase())) {
        userData.backupCodes = userData.backupCodes.filter(c => c !== code.toUpperCase());
        const updatedData = data.map(item => item.userId === userId ? userData : item);
        this.save2FAData(updatedData);
        return { success: true };
      }
      
      if (this.verifyTOTP(userData.secret, code)) {
        return { success: true };
      }
      
      return { success: false, error: 'Invalid verification code. Please try again.' };
    } catch (error) {
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
      const data = this.get2FAData();
      const userIndex = data.findIndex(item => item.userId === userId);
      
      if (userIndex === -1 || !data[userIndex].enabled) {
        return { success: false, error: '2FA is not enabled for this account.' };
      }
      
      const userData = data[userIndex];
      
      if (!this.verifyTOTP(userData.secret, verificationCode)) {
        return { success: false, error: 'Invalid verification code. Please try again.' };
      }
      
      data.splice(userIndex, 1);
      this.save2FAData(data);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to disable 2FA. Please try again.' };
    }
  }
}
