'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings,
  Users,
  Bell,
  Shield,
  Database,
  Palette,
  Save,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  Archive
} from 'lucide-react';
import { AdminSettings } from '@/types';
import { adminSettingsService } from '@/services/adminSettingsService';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ToastContainer';

interface SettingsModuleProps {
  className?: string;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Settings state
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
  const [originalSettings, setOriginalSettings] = useState<AdminSettings>(settings);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoadingData(true);
      const data = await adminSettingsService.getSettings();
      setSettings(data);
      setOriginalSettings(data);
      toast.addToast({ type: 'success', title: 'Settings loaded successfully' });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.addToast({ type: 'error', title: 'Failed to load settings' });
    } finally {
      setIsLoadingData(false);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      await adminSettingsService.saveSettings(settings);
      setOriginalSettings({ ...settings });
      toast.addToast({ type: 'success', title: 'Settings saved successfully!' });
    } catch (error) {
      toast.addToast({ type: 'error', title: 'Failed to save settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSettings = () => {
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

  const handleImportSettings = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      setSettings(importedSettings);
      toast.addToast({ type: 'success', title: 'Settings imported successfully!' });
    } catch (error) {
      toast.addToast({ type: 'error', title: 'Failed to import settings. Invalid file format.' });
    }
    
    event.target.value = '';
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
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Site Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.general.siteName}
              onChange={(e) => updateSettingsSection('general', { siteName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter site name"
            />
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
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Localization</h3>
          
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
              <option value="UTC">UTC</option>
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
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Theme
            </label>
            <select
              value={settings.general.theme}
              onChange={(e) => updateSettingsSection('general', { theme: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-slate-600 dark:text-slate-400">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Configure and manage system-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <button
            onClick={handleExportSettings}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleImportSettings}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={saveSettings}
            disabled={isLoading || !hasChanges}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'users' && <div>Users settings coming soon...</div>}
          {activeTab === 'notifications' && <div>Notifications settings coming soon...</div>}
          {activeTab === 'security' && <div>Security settings coming soon...</div>}
          {activeTab === 'database' && <div>Database settings coming soon...</div>}
          {activeTab === 'appearance' && <div>Appearance settings coming soon...</div>}
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
