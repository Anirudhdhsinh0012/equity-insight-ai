'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Phone, MessageCircle, Send, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';

interface WhatsAppSettingsProps {
  userId: string;
  userPhoneNumber?: string;
  onPhoneNumberUpdate: (phoneNumber: string) => void;
}

const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = ({ 
  userId, 
  userPhoneNumber = '', 
  onPhoneNumberUpdate 
}) => {
  const { theme } = useTheme();
  const { 
    settings, 
    updateSettings, 
    validatePhoneNumber, 
    sendCustomWhatsAppMessage 
  } = useNotifications();
  
  const [phoneNumber, setPhoneNumber] = useState(userPhoneNumber);
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPhoneNumber(userPhoneNumber);
  }, [userPhoneNumber]);

  useEffect(() => {
    if (phoneNumber) {
      setIsValidPhone(validatePhoneNumber(phoneNumber));
    } else {
      setIsValidPhone(false);
    }
  }, [phoneNumber, validatePhoneNumber]);

  const handlePhoneNumberChange = (value: string) => {
    // Auto-format phone number
    let formatted = value.replace(/[^\d+]/g, '');
    if (formatted && !formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    setPhoneNumber(formatted);
    setTestResult(null);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      await updateSettings({
        ...settings,
        enableWhatsAppNotifications: settings.enableWhatsAppNotifications
      });
      
      onPhoneNumberUpdate(phoneNumber);
      setTestResult({ success: true, message: 'Settings saved successfully!' });
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestMessage = async () => {
    if (!phoneNumber || !isValidPhone) return;
    
    setIsTesting(true);
    try {
      const result = await sendCustomWhatsAppMessage(
        'This is a test message from Stock Advisor Pro! 🚀\\n\\nIf you received this, your WhatsApp notifications are working correctly.', 
        phoneNumber
      );
      
      if (result.success) {
        setTestResult({ success: true, message: 'Test message sent successfully!' });
      } else {
        setTestResult({ success: false, message: `Failed to send test message: ${result.error}` });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Error sending test message' });
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handleToggleWhatsApp = async () => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      enableWhatsAppNotifications: !settings.enableWhatsAppNotifications
    };
    
    await updateSettings(newSettings);
  };

  return (
    <div className={`rounded-lg border transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-900 border-slate-700' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-full ${
            theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
          }`}>
            <MessageCircle className={`w-5 h-5 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
          <h3 className={`text-lg font-semibold transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            WhatsApp Notifications
          </h3>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable WhatsApp */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Enable WhatsApp Alerts
              </h4>
              <p className={`text-sm transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Receive stock recommendations and alerts via WhatsApp
              </p>
            </div>
            <button
              onClick={handleToggleWhatsApp}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings?.enableWhatsAppNotifications
                  ? 'bg-green-600' 
                  : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings?.enableWhatsAppNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Phone Number (with country code)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className={`h-4 w-4 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`} />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={`block w-full pl-10 pr-10 py-2 border rounded-md text-sm transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500'
                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {phoneNumber && (
                  isValidPhone ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )
                )}
              </div>
            </div>
            {phoneNumber && !isValidPhone && (
              <p className="text-sm text-red-500">
                Please enter a valid phone number with country code (e.g., +1 for US)
              </p>
            )}
          </div>

          {/* Test Message Button */}
          {isValidPhone && settings?.enableWhatsAppNotifications && (
            <div>
              <button
                onClick={handleTestMessage}
                disabled={isTesting}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-900 text-blue-200 hover:bg-blue-800 disabled:bg-slate-700 disabled:text-slate-400'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-slate-100 disabled:text-slate-400'
                }`}
              >
                <Send className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Sending...' : 'Send Test Message'}
              </button>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-md text-sm ${
                testResult.success
                  ? theme === 'dark'
                    ? 'bg-green-900/30 text-green-400 border border-green-700'
                    : 'bg-green-50 text-green-700 border border-green-200'
                  : theme === 'dark'
                    ? 'bg-red-900/30 text-red-400 border border-red-700'
                    : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {testResult.message}
            </motion.div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving || (!phoneNumber && settings?.enableWhatsAppNotifications)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                theme === 'dark'
                  ? 'bg-green-900 text-green-200 hover:bg-green-800 disabled:bg-slate-700 disabled:text-slate-400'
                  : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-300 disabled:text-slate-500'
              }`}
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Information */}
          <div className={`p-4 rounded-md text-sm ${
            theme === 'dark'
              ? 'bg-slate-800 border border-slate-700'
              : 'bg-slate-50 border border-slate-200'
          }`}>
            <h4 className={`font-medium mb-2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              📱 WhatsApp Integration Info:
            </h4>
            <ul className={`space-y-1 transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <li>• Receive BUY/SELL/HOLD recommendations instantly</li>
              <li>• Get portfolio performance updates</li>
              <li>• Price alert notifications when targets are hit</li>
              <li>• Messages are sent via mock WhatsApp notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSettings;
