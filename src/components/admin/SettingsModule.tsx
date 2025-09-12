'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Key,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Server,
  Monitor,
  Smartphone,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Loader2,
  FileUp,
  HardDrive
} from 'lucide-react';
import { adminSettingsService, AdminSettings } from '@/services/adminSettingsService';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ToastContainer';

interface SettingsModuleProps {
  className?: string;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Settings state - Updated to match backend interface
  const [settings, setSettings] = useState<AdminSettings>({
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
      databaseSize: '124.5 MB'
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
  });

  // Track original settings for change detection
  const [originalSettings, setOriginalSettings] = useState<AdminSettings>({
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
      maxAPIRequests: 100,
      enableAuditLog: true,
      dataRetention: 90
    },
    database: {
      autoBackup: true,
      backupFrequency: 'daily',
      maxBackupFiles: 30,
      enableCompression: true,
      lastBackup: new Date().toISOString(),
      databaseSize: '124.5 MB'
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
  });

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  // Handle export button click
  const handleExportButtonClick = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.addToast({ type: 'success', title: 'Settings exported successfully!' });
  };

  // Handle import button click  
  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Save settings with validation
  const handleSaveButtonClick = async () => {
    if (!hasChanges) return;
    
    setIsLoading(true);
    try {
      await saveSettings();
      setOriginalSettings({ ...settings }); // Update original after save
      toast.addToast({ type: 'success', title: 'Settings saved successfully!' });
    } catch (error) {
      toast.addToast({ type: 'error', title: 'Failed to save settings. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection for import
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      setSettings(importedSettings);
      setOriginalSettings(importedSettings);
      toast.addToast({ type: 'success', title: 'Settings imported successfully!' });
    } catch (error) {
      toast.addToast({ type: 'error', title: 'Failed to import settings. Invalid file format.' });
    }
    
    // Reset the input
    event.target.value = '';
  };

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoadingData(true);
      const data = await adminSettingsService.getSettings();
      setSettings(data);
      // Removed automatic success toast on load - only show on user actions
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingData(false);
    }
  };

  const updateSettingsSection = <K extends keyof AdminSettings>(
    section: K,
    updates: Partial<AdminSettings[K]>
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    }));
    
    // Clear validation errors for this section
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(section)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const validateSettings = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate general settings
    if (!settings.general.siteName?.trim()) {
      errors['general.siteName'] = 'Site name is required';
    } else if (settings.general.siteName.length > 100) {
      errors['general.siteName'] = 'Site name must be less than 100 characters';
    }

    // Validate user settings
    if (settings.users.maxLoginAttempts < 1 || settings.users.maxLoginAttempts > 20) {
      errors['users.maxLoginAttempts'] = 'Must be between 1 and 20';
    }
    if (settings.users.sessionTimeout < 5 || settings.users.sessionTimeout > 480) {
      errors['users.sessionTimeout'] = 'Must be between 5 and 480 minutes';
    }
    if (settings.users.passwordMinLength < 6 || settings.users.passwordMinLength > 50) {
      errors['users.passwordMinLength'] = 'Must be between 6 and 50 characters';
    }

    // Validate security settings
    if (settings.security.maxAPIRequests < 100 || settings.security.maxAPIRequests > 10000) {
      errors['security.maxAPIRequests'] = 'Must be between 100 and 10,000';
    }
    if (settings.security.dataRetention < 1 || settings.security.dataRetention > 365) {
      errors['security.dataRetention'] = 'Must be between 1 and 365 days';
    }

    // Validate database settings
    if (settings.database.maxBackupFiles < 1 || settings.database.maxBackupFiles > 100) {
      errors['database.maxBackupFiles'] = 'Must be between 1 and 100';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveSettings = async () => {
    if (!validateSettings()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      setIsSaving(true);
      const savedSettings = await adminSettingsService.saveSettings(settings);
      setSettings(savedSettings);
      toast.success('Settings saved successfully', 'All changes have been applied');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all settings to defaults? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      setIsLoading(true);
      const defaultSettings = await adminSettingsService.resetSettings();
      setSettings(defaultSettings);
      setValidationErrors({});
      toast.success('Settings reset to defaults', 'All settings have been restored to their default values');
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const exportSettings = () => {
    try {
      adminSettingsService.exportSettings(settings);
      toast.success('Settings exported', 'Settings file downloaded successfully');
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast.error('Failed to export settings', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const importedSettings = await adminSettingsService.importSettings(file);
      setSettings(importedSettings);
      setValidationErrors({});
      toast.success('Settings imported successfully', 'All settings have been updated from the imported file');
    } catch (error) {
      console.error('Error importing settings:', error);
      toast.error('Failed to import settings', error instanceof Error ? error.message : 'Please check the file format');
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const createBackup = async () => {
    try {
      setIsBackingUp(true);
      const backup = await adminSettingsService.createBackup(
        settings.database.enableCompression,
        settings.database.maxBackupFiles
      );
      
      // Update last backup time in settings
      const updatedSettings = {
        ...settings,
        database: {
          ...settings.database,
          lastBackup: new Date().toISOString()
        }
      };
      setSettings(updatedSettings);
      
      toast.success('Backup created successfully', `Backup file: ${backup.filename} (${backup.size})`);
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'users', label: 'User Management', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  const getFieldError = (field: string): string | undefined => {
    return validationErrors[field];
  };

  const renderFieldError = (field: string) => {
    const error = getFieldError(field);
    if (!error) return null;
    
    return (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
        <AlertTriangle className="w-4 h-4" />
        {error}
      </p>
    );
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Site Name
        </label>
        <input
          type="text"
          value={settings.general.siteName}
          onChange={(e) => updateSettingsSection('general', { siteName: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            getFieldError('general.siteName') 
              ? 'border-red-300 dark:border-red-600' 
              : 'border-slate-300 dark:border-slate-600'
          }`}
          placeholder="Enter site name"
        />
        {renderFieldError('general.siteName')}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Site Description
        </label>
        <textarea
          value={settings.general.siteDescription}
          onChange={(e) => updateSettingsSection('general', { siteDescription: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter site description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Timezone
          </label>
          <select
            value={settings.general.timezone}
            onChange={(e) => updateSettingsSection('general', { timezone: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Language
          </label>
          <select
            value={settings.general.language}
            onChange={(e) => updateSettingsSection('general', { language: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Default Theme
        </label>
        <div className="flex gap-4">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Monitor }
          ].map(theme => (
            <button
              key={theme.value}
              onClick={() => updateSettingsSection('general', { theme: theme.value })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                settings.general.theme === theme.value
                  ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
                  : 'bg-white border-slate-300 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              <theme.icon className="w-4 h-4" />
              {theme.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-800 dark:text-white">Allow User Registration</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Enable new users to create accounts</p>
            </div>
            <button
              onClick={() => updateSettingsSection('users', { allowRegistration: !settings.users.allowRegistration })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.users.allowRegistration ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.users.allowRegistration ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-800 dark:text-white">Email Verification Required</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Users must verify email to activate account</p>
            </div>
            <button
              onClick={() => updateSettingsSection('users', { requireEmailVerification: !settings.users.requireEmailVerification })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.users.requireEmailVerification ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.users.requireEmailVerification ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-800 dark:text-white">Two-Factor Authentication</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Require 2FA for all users</p>
            </div>
            <button
              onClick={() => updateSettingsSection('users', { enableTwoFactor: !settings.users.enableTwoFactor })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.users.enableTwoFactor ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.users.enableTwoFactor ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Max Login Attempts
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.users.maxLoginAttempts}
              onChange={(e) => updateSettingsSection('users', { maxLoginAttempts: parseInt(e.target.value) || 1 })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('users.maxLoginAttempts') 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {renderFieldError('users.maxLoginAttempts')}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="480"
              value={settings.users.sessionTimeout}
              onChange={(e) => updateSettingsSection('users', { sessionTimeout: parseInt(e.target.value) || 5 })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('users.sessionTimeout') 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {renderFieldError('users.sessionTimeout')}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Minimum Password Length
            </label>
            <input
              type="number"
              min="6"
              max="50"
              value={settings.users.passwordMinLength}
              onChange={(e) => updateSettingsSection('users', { passwordMinLength: parseInt(e.target.value) || 6 })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('users.passwordMinLength') 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {renderFieldError('users.passwordMinLength')}
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Notification Channels</h3>
          
          {[
            { key: 'emailNotifications', label: 'Email Notifications', icon: Mail },
            { key: 'pushNotifications', label: 'Push Notifications', icon: Bell },
            { key: 'smsNotifications', label: 'SMS Notifications', icon: Phone },
            { key: 'soundEnabled', label: 'Sound Alerts', icon: Volume2 }
          ].map(setting => (
            <div key={setting.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <setting.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-800 dark:text-white">{setting.label}</span>
              </div>
              <button
                onClick={() => updateSettingsSection('notifications', { 
                  [setting.key]: !settings.notifications[setting.key as keyof typeof settings.notifications] 
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications[setting.key as keyof typeof settings.notifications] 
                    ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications[setting.key as keyof typeof settings.notifications] 
                    ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Content Types</h3>
          
          {[
            { key: 'marketAlerts', label: 'Market Alerts', description: 'Price movements and market changes' },
            { key: 'newsUpdates', label: 'News Updates', description: 'Financial news and announcements' },
            { key: 'systemMaintenance', label: 'System Maintenance', description: 'Platform updates and downtime' }
          ].map(setting => (
            <div key={setting.key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-800 dark:text-white">{setting.label}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{setting.description}</div>
              </div>
              <button
                onClick={() => updateSettingsSection('notifications', { 
                  [setting.key]: !settings.notifications[setting.key as keyof typeof settings.notifications] 
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications[setting.key as keyof typeof settings.notifications] 
                    ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications[setting.key as keyof typeof settings.notifications] 
                    ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Security Features</h3>
          
          {[
            { key: 'enableSSL', label: 'SSL/TLS Encryption', description: 'Encrypt all data transmissions' },
            { key: 'enableFirewall', label: 'Web Application Firewall', description: 'Block malicious requests' },
            { key: 'blockSuspiciousIPs', label: 'Block Suspicious IPs', description: 'Auto-block suspicious activity' },
            { key: 'enableAuditLog', label: 'Audit Logging', description: 'Log all admin actions' }
          ].map(setting => (
            <div key={setting.key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-800 dark:text-white">{setting.label}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{setting.description}</div>
              </div>
              <button
                onClick={() => updateSettingsSection('security', { 
                  [setting.key]: !settings.security[setting.key as keyof typeof settings.security] 
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.security[setting.key as keyof typeof settings.security] 
                    ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.security[setting.key as keyof typeof settings.security] 
                    ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">API & Data Settings</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              API Rate Limit (requests/hour)
            </label>
            <input
              type="number"
              min="100"
              max="10000"
              value={settings.security.maxAPIRequests}
              onChange={(e) => updateSettingsSection('security', { maxAPIRequests: parseInt(e.target.value) || 100 })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('security.maxAPIRequests') 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {renderFieldError('security.maxAPIRequests')}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Data Retention Period (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={settings.security.dataRetention}
              onChange={(e) => updateSettingsSection('security', { dataRetention: parseInt(e.target.value) || 1 })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('security.dataRetention') 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {renderFieldError('security.dataRetention')}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-800 dark:text-white">API Rate Limiting</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Limit API requests per user</div>
            </div>
            <button
              onClick={() => updateSettingsSection('security', { enableAPIRateLimit: !settings.security.enableAPIRateLimit })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.security.enableAPIRateLimit ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.security.enableAPIRateLimit ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Backup Configuration</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-800 dark:text-white">Automatic Backups</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Enable scheduled database backups</div>
            </div>
            <button
              onClick={() => updateSettingsSection('database', { autoBackup: !settings.database.autoBackup })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.database.autoBackup ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.database.autoBackup ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Backup Frequency
            </label>
            <select
              value={settings.database.backupFrequency}
              onChange={(e) => updateSettingsSection('database', { backupFrequency: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Maximum Backup Files
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.database.maxBackupFiles}
              onChange={(e) => updateSettingsSection('database', { maxBackupFiles: parseInt(e.target.value) || 1 })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('database.maxBackupFiles') 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {renderFieldError('database.maxBackupFiles')}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-800 dark:text-white">Compression</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Compress backup files to save space</div>
            </div>
            <button
              onClick={() => updateSettingsSection('database', { enableCompression: !settings.database.enableCompression })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.database.enableCompression ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.database.enableCompression ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Database Status</h3>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Database Size</span>
              <span className="font-medium text-slate-800 dark:text-white">{settings.database.databaseSize}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">Last Backup</span>
              <span className="font-medium text-slate-800 dark:text-white">
                {new Date(settings.database.lastBackup).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={createBackup}
                disabled={isBackingUp}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
              >
                {isBackingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                {isBackingUp ? 'Creating...' : 'Backup Now'}
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors text-sm">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-300">Database Healthy</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400">
              All database operations are running normally with no detected issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Interface Customization</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Primary Color
            </label>
            <div className="flex gap-3">
              {[
                { name: 'Blue', value: '#3B82F6', class: 'bg-blue-500' },
                { name: 'Purple', value: '#8B5CF6', class: 'bg-purple-500' },
                { name: 'Green', value: '#10B981', class: 'bg-green-500' },
                { name: 'Red', value: '#EF4444', class: 'bg-red-500' },
                { name: 'Orange', value: '#F59E0B', class: 'bg-orange-500' }
              ].map(color => (
                <button
                  key={color.name}
                  onClick={() => updateSettingsSection('appearance', { primaryColor: color.value })}
                  className={`w-10 h-10 rounded-lg ${color.class} border-2 shadow-lg hover:scale-105 transition-transform ${
                    settings.appearance.primaryColor === color.value 
                      ? 'border-slate-800 dark:border-white' 
                      : 'border-white dark:border-slate-600'
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Font Family
            </label>
            <select 
              value={settings.appearance.fontFamily}
              onChange={(e) => updateSettingsSection('appearance', { fontFamily: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="inter">Inter (Default)</option>
              <option value="roboto">Roboto</option>
              <option value="poppins">Poppins</option>
              <option value="system">System Font</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Sidebar Width: {settings.appearance.sidebarWidth}px
            </label>
            <input
              type="range"
              min="200"
              max="320"
              value={settings.appearance.sidebarWidth}
              onChange={(e) => updateSettingsSection('appearance', { sidebarWidth: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mt-1">
              <span>Narrow</span>
              <span>Wide</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Display Options</h3>
          
          <div className="space-y-3">
            {[
              { key: 'compactMode', label: 'Compact Mode', description: 'Reduce spacing between elements' },
              { key: 'animations', label: 'Animations', description: 'Enable smooth transitions and effects' },
              { key: 'showTooltips', label: 'Show Tooltips', description: 'Display helpful tooltips on hover' },
              { key: 'highContrast', label: 'High Contrast', description: 'Increase contrast for accessibility' }
            ].map((option) => (
              <div key={option.key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800 dark:text-white">{option.label}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{option.description}</div>
                </div>
                <button 
                  onClick={() => updateSettingsSection('appearance', { 
                    [option.key]: !settings.appearance[option.key as keyof typeof settings.appearance] 
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.appearance[option.key as keyof typeof settings.appearance] 
                      ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.appearance[option.key as keyof typeof settings.appearance] 
                      ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-300">Theme Preview</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Changes will be applied immediately and affect all admin interfaces.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toast Container - positioned at top level for proper placement */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">System Settings</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Configure and manage system-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <button
            onClick={handleExportButtonClick}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleImportButtonClick}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleSaveButtonClick}
            disabled={isLoading || !hasChanges}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Settings Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-slate-600 dark:text-slate-400">Loading settings...</span>
            </div>
          )}
          
          {!isLoading && (
            <>
              {activeTab === 'general' && renderGeneralSettings()}
              {activeTab === 'users' && renderUserSettings()}
              {activeTab === 'notifications' && renderNotificationSettings()}
              {activeTab === 'security' && renderSecuritySettings()}
              {activeTab === 'database' && renderDatabaseSettings()}
              {activeTab === 'appearance' && renderAppearanceSettings()}
            </>
          )}
        </div>
      </motion.div>
      
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default SettingsModule;
