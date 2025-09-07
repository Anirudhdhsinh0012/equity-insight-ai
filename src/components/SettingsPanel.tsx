'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Mail, 
  Phone, 
  Globe, 
  Monitor,
  Moon,
  Sun,
  Camera,
  Lock,
  Save,
  Eye,
  EyeOff,
  Smartphone,
  MessageSquare,
  Volume2,
  VolumeX,
  Layout,
  BarChart3,
  RefreshCw,
  Download,
  Trash2
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import TwoFactorManagement from './TwoFactorManagement';

interface SettingsPanelProps {
  onClose?: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { theme, toggleTheme, colors } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Monish',
    lastName: 'Khandelwal',
    email: 'monish@stockadvisorpro.com',
    phone: '+91 9876543210',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    whatsapp: true,
    sound: true,
    priceAlerts: true,
    newsUpdates: true,
    weeklyReports: true,
  });

  const [displaySettings, setDisplaySettings] = useState({
    autoRefresh: true,
    animationsEnabled: true,
    compactMode: false,
    showAdvancedCharts: true,
    defaultTimeframe: '1D',
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleDisplayToggle = (key: string) => {
    setDisplaySettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSave = () => {
    // Implement save functionality
    console.log('Settings saved:', { formData, notifications, displaySettings });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`w-full max-w-4xl mx-auto ${colors.primary.background} min-h-screen`}
    >
      {/* Header */}
      <div className={`${colors.primary.surface} backdrop-blur-xl ${colors.primary.border} border-b sticky top-0 z-10`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${colors.text.primary}`}>Settings</h1>
              <p className={`${colors.text.secondary} mt-1`}>Manage your account preferences and configurations</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className={`px-4 py-2 ${colors.primary.accent} text-white rounded-lg font-medium flex items-center gap-2 hover:${colors.primary.accentHover} transition-all`}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </motion.button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ y: -1 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? `${colors.text.accent} border-current`
                    : `${colors.text.secondary} border-transparent hover:${colors.text.primary}`
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Picture */}
                <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                  <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Profile Picture</h3>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        MK
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-2 rounded-full shadow-lg"
                      >
                        <Camera className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <div>
                      <h4 className={`font-medium ${colors.text.primary}`}>Upload new picture</h4>
                      <p className={`text-sm ${colors.text.secondary} mt-1`}>JPG, PNG or GIF. Max 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                  <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`w-full px-3 py-2 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`w-full px-3 py-2 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3 py-2 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full px-3 py-2 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Password Change */}
                <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                  <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                          className={`w-full px-3 py-2 pr-10 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${colors.text.secondary}`}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>New Password</label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => handleInputChange('newPassword', e.target.value)}
                          className={`w-full px-3 py-2 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>Confirm Password</label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className={`w-full px-3 py-2 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                {/* Communication Preferences */}
                <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                  <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Communication Preferences</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email', icon: Mail },
                      { key: 'push', label: 'Push Notifications', desc: 'Browser and mobile push notifications', icon: Bell },
                      { key: 'whatsapp', label: 'WhatsApp Alerts', desc: 'Stock alerts via WhatsApp', icon: MessageSquare },
                      { key: 'sound', label: 'Sound Notifications', desc: 'Play sound for important alerts', icon: Volume2 },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${colors.primary.accent} bg-opacity-10`}>
                            <item.icon className={`w-4 h-4 ${colors.text.accent}`} />
                          </div>
                          <div>
                            <p className={`font-medium ${colors.text.primary}`}>{item.label}</p>
                            <p className={`text-sm ${colors.text.secondary}`}>{item.desc}</p>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleNotificationToggle(item.key)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            notifications[item.key as keyof typeof notifications] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <motion.div
                            animate={{
                              x: notifications[item.key as keyof typeof notifications] ? 20 : 2,
                            }}
                            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                          />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alert Types */}
                <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                  <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Alert Types</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'priceAlerts', label: 'Price Alerts', desc: 'Get notified when stock prices change significantly' },
                      { key: 'newsUpdates', label: 'News Updates', desc: 'Breaking news and market updates' },
                      { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Portfolio performance summaries' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium ${colors.text.primary}`}>{item.label}</p>
                          <p className={`text-sm ${colors.text.secondary}`}>{item.desc}</p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleNotificationToggle(item.key)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            notifications[item.key as keyof typeof notifications] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <motion.div
                            animate={{
                              x: notifications[item.key as keyof typeof notifications] ? 20 : 2,
                            }}
                            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                          />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Theme Selection */}
                <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                  <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Theme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={theme === 'dark' ? toggleTheme : undefined}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === 'light' 
                          ? `border-blue-500 ${colors.primary.surface}` 
                          : `${colors.primary.border} ${colors.primary.surface} hover:${colors.primary.surfaceHover}`
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Sun className={`w-5 h-5 ${theme === 'light' ? colors.text.accent : colors.text.secondary}`} />
                        <span className={`font-medium ${theme === 'light' ? colors.text.accent : colors.text.primary}`}>Light Theme</span>
                      </div>
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 h-20 rounded-lg border flex items-center justify-center">
                        <div className="bg-white rounded shadow-sm p-2 text-xs text-slate-600">Preview</div>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={theme === 'light' ? toggleTheme : undefined}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === 'dark' 
                          ? `border-purple-500 ${colors.primary.surface}` 
                          : `${colors.primary.border} ${colors.primary.surface} hover:${colors.primary.surfaceHover}`
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Moon className={`w-5 h-5 ${theme === 'dark' ? colors.text.accent : colors.text.secondary}`} />
                        <span className={`font-medium ${theme === 'dark' ? colors.text.accent : colors.text.primary}`}>Dark Theme</span>
                      </div>
                      <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800 h-20 rounded-lg border border-slate-700 flex items-center justify-center">
                        <div className="bg-slate-800 rounded shadow-sm p-2 text-xs text-slate-200">Preview</div>
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* Display Options */}
                <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                  <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Display Options</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'autoRefresh', label: 'Auto Refresh', desc: 'Automatically refresh market data', icon: RefreshCw },
                      { key: 'animationsEnabled', label: 'Animations', desc: 'Enable smooth animations and transitions', icon: Layout },
                      { key: 'compactMode', label: 'Compact Mode', desc: 'Show more content in less space', icon: BarChart3 },
                      { key: 'showAdvancedCharts', label: 'Advanced Charts', desc: 'Display detailed technical indicators', icon: BarChart3 },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${colors.primary.accent} bg-opacity-10`}>
                            <item.icon className={`w-4 h-4 ${colors.text.accent}`} />
                          </div>
                          <div>
                            <p className={`font-medium ${colors.text.primary}`}>{item.label}</p>
                            <p className={`text-sm ${colors.text.secondary}`}>{item.desc}</p>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDisplayToggle(item.key)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            displaySettings[item.key as keyof typeof displaySettings] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <motion.div
                            animate={{
                              x: displaySettings[item.key as keyof typeof displaySettings] ? 20 : 2,
                            }}
                            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                          />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Two-Factor Authentication */}
                <TwoFactorManagement userId="mock-user-id" />

                {/* Login Sessions */}
                <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                  <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Active Sessions</h3>
                  <div className="space-y-3">
                    {[
                      { device: 'Windows PC', location: 'Mumbai, India', time: 'Current session', current: true },
                      { device: 'iPhone 13', location: 'Mumbai, India', time: '2 hours ago', current: false },
                      { device: 'MacBook Pro', location: 'Delhi, India', time: '1 day ago', current: false },
                    ].map((session, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${colors.primary.surface}`}>
                        <div className="flex items-center gap-3">
                          <Monitor className={`w-5 h-5 ${colors.text.secondary}`} />
                          <div>
                            <p className={`font-medium ${colors.text.primary}`}>{session.device}</p>
                            <p className={`text-sm ${colors.text.secondary}`}>{session.location} • {session.time}</p>
                          </div>
                        </div>
                        {!session.current && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Export */}
                <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                  <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Data & Privacy</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${colors.text.primary}`}>Export Data</p>
                        <p className={`text-sm ${colors.text.secondary}`}>Download your account data and trading history</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`px-4 py-2 ${colors.primary.accent} text-white rounded-lg font-medium hover:${colors.primary.accentHover} transition-all flex items-center gap-2`}
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </motion.button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${colors.text.primary}`}>Delete Account</p>
                        <p className={`text-sm ${colors.text.secondary}`}>Permanently delete your account and all data</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all flex items-center gap-2`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
