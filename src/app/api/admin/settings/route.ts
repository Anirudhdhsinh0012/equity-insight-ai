import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Settings interface
interface AdminSettings {
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

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'admin-settings.json');
const DATA_DIR = path.join(process.cwd(), 'data');

// Default settings
const DEFAULT_SETTINGS: AdminSettings = {
  general: {
    siteName: 'Stock Advisor Pro',
    siteDescription: 'Professional stock trading advisor platform',
    timezone: 'America/New_York',
    language: 'en',
    theme: 'system'
  },
  users: {
    allowRegistration: true,
    requireEmailVerification: true,
    enableTwoFactor: false,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    passwordMinLength: 8
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    soundEnabled: true,
    marketAlerts: true,
    newsUpdates: true,
    systemMaintenance: true
  },
  security: {
    enableSSL: true,
    enableFirewall: true,
    blockSuspiciousIPs: true,
    enableAPIRateLimit: true,
    maxAPIRequests: 1000,
    enableAuditLog: true,
    dataRetention: 90
  },
  database: {
    autoBackup: true,
    backupFrequency: 'daily',
    maxBackupFiles: 30,
    enableCompression: true,
    lastBackup: new Date().toISOString(),
    databaseSize: '2.4 GB'
  },
  appearance: {
    primaryColor: '#3B82F6',
    fontFamily: 'inter',
    sidebarWidth: 280,
    compactMode: false,
    animations: true,
    showTooltips: true,
    highContrast: false
  }
};

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// Read settings from file
async function readSettings(): Promise<AdminSettings> {
  try {
    await ensureDataDir();
    if (existsSync(SETTINGS_FILE)) {
      const data = await readFile(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(data);
      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_SETTINGS,
        ...settings,
        general: { ...DEFAULT_SETTINGS.general, ...settings.general },
        users: { ...DEFAULT_SETTINGS.users, ...settings.users },
        notifications: { ...DEFAULT_SETTINGS.notifications, ...settings.notifications },
        security: { ...DEFAULT_SETTINGS.security, ...settings.security },
        database: { ...DEFAULT_SETTINGS.database, ...settings.database },
        appearance: { ...DEFAULT_SETTINGS.appearance, ...settings.appearance }
      };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error reading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Write settings to file
async function writeSettings(settings: AdminSettings): Promise<void> {
  try {
    await ensureDataDir();
    await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing settings:', error);
    throw new Error('Failed to save settings');
  }
}

// Validate settings
function validateSettings(settings: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate general settings
  if (!settings.general?.siteName || settings.general.siteName.trim().length === 0) {
    errors.push('Site name is required');
  }
  if (settings.general?.siteName && settings.general.siteName.length > 100) {
    errors.push('Site name must be less than 100 characters');
  }

  // Validate user settings
  if (typeof settings.users?.maxLoginAttempts !== 'number' || settings.users.maxLoginAttempts < 1 || settings.users.maxLoginAttempts > 20) {
    errors.push('Max login attempts must be between 1 and 20');
  }
  if (typeof settings.users?.sessionTimeout !== 'number' || settings.users.sessionTimeout < 5 || settings.users.sessionTimeout > 480) {
    errors.push('Session timeout must be between 5 and 480 minutes');
  }
  if (typeof settings.users?.passwordMinLength !== 'number' || settings.users.passwordMinLength < 6 || settings.users.passwordMinLength > 50) {
    errors.push('Password minimum length must be between 6 and 50 characters');
  }

  // Validate security settings
  if (typeof settings.security?.maxAPIRequests !== 'number' || settings.security.maxAPIRequests < 100 || settings.security.maxAPIRequests > 10000) {
    errors.push('Max API requests must be between 100 and 10,000');
  }
  if (typeof settings.security?.dataRetention !== 'number' || settings.security.dataRetention < 1 || settings.security.dataRetention > 365) {
    errors.push('Data retention must be between 1 and 365 days');
  }

  // Validate database settings
  if (typeof settings.database?.maxBackupFiles !== 'number' || settings.database.maxBackupFiles < 1 || settings.database.maxBackupFiles > 100) {
    errors.push('Max backup files must be between 1 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function GET() {
  try {
    const settings = await readSettings();
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch settings'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings, action } = body;

    if (action === 'reset') {
      await writeSettings(DEFAULT_SETTINGS);
      return NextResponse.json({
        success: true,
        message: 'Settings reset to defaults successfully',
        data: DEFAULT_SETTINGS
      });
    }

    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          error: 'Settings data is required'
        },
        { status: 400 }
      );
    }

    // Validate settings
    const validation = validateSettings(settings);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid settings data',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Save settings
    await writeSettings(settings);

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save settings'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Section and data are required'
        },
        { status: 400 }
      );
    }

    const currentSettings = await readSettings();
    const updatedSettings = {
      ...currentSettings,
      [section]: {
        ...currentSettings[section as keyof AdminSettings],
        ...data
      }
    };

    // Validate updated settings
    const validation = validateSettings(updatedSettings);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid settings data',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    await writeSettings(updatedSettings);

    return NextResponse.json({
      success: true,
      message: `${section} settings updated successfully`,
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating settings section:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update settings section'
      },
      { status: 500 }
    );
  }
}
