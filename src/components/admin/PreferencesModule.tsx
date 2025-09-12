'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Monitor, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX,
  Eye,
  EyeOff,
  Globe,
  Clock,
  Database
} from 'lucide-react';

interface PreferencesModuleProps {
  className?: string;
}

const PreferencesModule: React.FC<PreferencesModuleProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [preferences, setPreferences] = useState({
    profile: {
      name: 'Admin User',
      email: 'admin@stockmarket.com',
      timezone: 'America/New_York',
      language: 'en',
      avatar: ''
    },
    notifications: {
      email: true,
      push: true,
      sound: true,
      desktop: false,
      marketing: false
    },
    appearance: {
      theme: 'system',
      sidebarCollapsed: false,
      animations: true,
      fontSize: 'medium',
      primaryColor: '#3B82F6'
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      loginAlerts: true,
      ipWhitelist: false
    },
    system: {
      autoSave: true,
      backupFrequency: 'daily',
      debugMode: false,
      analyticsTracking: true
    }
  });

  const updatePreference = (section: string, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database }
  ];

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={preferences.profile.name}
          onChange={(e) => updatePreference('profile', 'name', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={preferences.profile.email}
          onChange={(e) => updatePreference('profile', 'email', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Timezone
          </label>
          <select
            value={preferences.profile.timezone}
            onChange={(e) => updatePreference('profile', 'timezone', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Language
          </label>
          <select
            value={preferences.profile.language}
            onChange={(e) => updatePreference('profile', 'language', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      {[
        { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
        { key: 'push', label: 'Push Notifications', description: 'Browser push notifications' },
        { key: 'sound', label: 'Sound Alerts', description: 'Play sounds for notifications' },
        { key: 'desktop', label: 'Desktop Notifications', description: 'Show desktop notifications' },
        { key: 'marketing', label: 'Marketing Emails', description: 'Receive marketing communications' }
      ].map((setting) => (
        <div key={setting.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div>
            <h4 className="font-medium text-slate-800 dark:text-white">{setting.label}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">{setting.description}</p>
          </div>
          <button
            onClick={() => updatePreference('notifications', setting.key, !preferences.notifications[setting.key as keyof typeof preferences.notifications])}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.notifications[setting.key as keyof typeof preferences.notifications] 
                ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              preferences.notifications[setting.key as keyof typeof preferences.notifications] 
                ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      ))}
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Theme
        </label>
        <div className="flex gap-3">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Monitor }
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() => updatePreference('appearance', 'theme', theme.value)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                preferences.appearance.theme === theme.value
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

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Primary Color
        </label>
        <div className="flex gap-3">
          {[
            { name: 'Blue', value: '#3B82F6', class: 'bg-blue-500' },
            { name: 'Purple', value: '#8B5CF6', class: 'bg-purple-500' },
            { name: 'Green', value: '#10B981', class: 'bg-green-500' },
            { name: 'Red', value: '#EF4444', class: 'bg-red-500' },
            { name: 'Orange', value: '#F59E0B', class: 'bg-orange-500' }
          ].map((color) => (
            <button
              key={color.name}
              onClick={() => updatePreference('appearance', 'primaryColor', color.value)}
              className={`w-10 h-10 rounded-lg ${color.class} border-2 shadow-lg hover:scale-105 transition-transform ${
                preferences.appearance.primaryColor === color.value 
                  ? 'border-slate-800 dark:border-white' 
                  : 'border-white dark:border-slate-600'
              }`}
              title={color.name}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div>
          <h4 className="font-medium text-slate-800 dark:text-white">Animations</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">Enable smooth transitions</p>
        </div>
        <button
          onClick={() => updatePreference('appearance', 'animations', !preferences.appearance.animations)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            preferences.appearance.animations ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            preferences.appearance.animations ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div>
          <h4 className="font-medium text-slate-800 dark:text-white">Two-Factor Authentication</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">Add an extra layer of security</p>
        </div>
        <button
          onClick={() => updatePreference('security', 'twoFactor', !preferences.security.twoFactor)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            preferences.security.twoFactor ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            preferences.security.twoFactor ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Session Timeout (minutes)
        </label>
        <input
          type="number"
          min="5"
          max="480"
          value={preferences.security.sessionTimeout}
          onChange={(e) => updatePreference('security', 'sessionTimeout', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div>
          <h4 className="font-medium text-slate-800 dark:text-white">Login Alerts</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">Get notified of new logins</p>
        </div>
        <button
          onClick={() => updatePreference('security', 'loginAlerts', !preferences.security.loginAlerts)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            preferences.security.loginAlerts ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            preferences.security.loginAlerts ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-4">
      {[
        { key: 'autoSave', label: 'Auto Save', description: 'Automatically save changes' },
        { key: 'debugMode', label: 'Debug Mode', description: 'Enable debug logging' },
        { key: 'analyticsTracking', label: 'Analytics', description: 'Help improve the platform' }
      ].map((setting) => (
        <div key={setting.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div>
            <h4 className="font-medium text-slate-800 dark:text-white">{setting.label}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">{setting.description}</p>
          </div>
          <button
            onClick={() => updatePreference('system', setting.key, !preferences.system[setting.key as keyof typeof preferences.system])}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.system[setting.key as keyof typeof preferences.system] 
                ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              preferences.system[setting.key as keyof typeof preferences.system] 
                ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Backup Frequency
        </label>
        <select
          value={preferences.system.backupFrequency}
          onChange={(e) => updatePreference('system', 'backupFrequency', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className={`h-full ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-orange-600" />
            Preferences
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Customize your admin experience
          </p>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-slate-200 dark:border-slate-700 p-4">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'profile' && renderProfileSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'appearance' && renderAppearanceSettings()}
            {activeTab === 'security' && renderSecuritySettings()}
            {activeTab === 'system' && renderSystemSettings()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-end gap-3">
            <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              Reset
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PreferencesModule;