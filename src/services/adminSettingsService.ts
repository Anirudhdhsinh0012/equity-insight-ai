// Admin Settings Service
export interface AdminSettings {
  general: {
    siteName: string;
    siteDescription: string;
    timezone: string;
    language: string;
    theme: string;
    companyLogo?: string;
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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string[];
}

export interface BackupInfo {
  filename: string;
  size: string;
  date: string;
}

export interface DatabaseStatus {
  lastBackup: string | null;
  backupCount: number;
  databaseSize: string;
}

class AdminSettingsService {
  private baseUrl = '/api/admin';

  // Fetch all settings
  async getSettings(): Promise<AdminSettings> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`);
      const result: ApiResponse<AdminSettings> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch settings');
      }
      
      return result.data!;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  // Save all settings
  async saveSettings(settings: AdminSettings): Promise<AdminSettings> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });
      
      const result: ApiResponse<AdminSettings> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }
      
      return result.data!;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // Update specific settings section
  async updateSettingsSection<K extends keyof AdminSettings>(
    section: K,
    data: Partial<AdminSettings[K]>
  ): Promise<AdminSettings> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section, data }),
      });
      
      const result: ApiResponse<AdminSettings> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update settings section');
      }
      
      return result.data!;
    } catch (error) {
      console.error('Error updating settings section:', error);
      throw error;
    }
  }

  // Reset settings to defaults
  async resetSettings(): Promise<AdminSettings> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset' }),
      });
      
      const result: ApiResponse<AdminSettings> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset settings');
      }
      
      return result.data!;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  // Database backup operations
  async createBackup(compress: boolean = true, maxFiles: number = 30): Promise<BackupInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create', compress, maxFiles }),
      });
      
      const result: ApiResponse<BackupInfo> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create backup');
      }
      
      return result.data!;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  // Get backup list
  async getBackupList(): Promise<{ backups: BackupInfo[]; databaseSize: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/backup?action=list`);
      const result: ApiResponse<{ backups: BackupInfo[]; databaseSize: string }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch backup list');
      }
      
      return result.data!;
    } catch (error) {
      console.error('Error fetching backup list:', error);
      throw error;
    }
  }

  // Get database status
  async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/backup?action=status`);
      const result: ApiResponse<DatabaseStatus> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch database status');
      }
      
      return result.data!;
    } catch (error) {
      console.error('Error fetching database status:', error);
      throw error;
    }
  }

  // Delete backup
  async deleteBackup(filename: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/backup?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete backup');
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  }

  // Cleanup old backups
  async cleanupBackups(maxFiles: number = 30): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cleanup', maxFiles }),
      });
      
      const result: ApiResponse<{ deletedCount: number }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to cleanup backups');
      }
      
      return result.data!.deletedCount;
    } catch (error) {
      console.error('Error cleaning up backups:', error);
      throw error;
    }
  }

  // Export settings
  exportSettings(settings: AdminSettings): void {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Import settings
  async importSettings(file: File): Promise<AdminSettings> {
    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      
      // Validate that it's a valid settings object
      if (!settings.general || !settings.users || !settings.notifications || !settings.security || !settings.database) {
        throw new Error('Invalid settings file format');
      }
      
      return await this.saveSettings(settings);
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }
}

export const adminSettingsService = new AdminSettingsService();
