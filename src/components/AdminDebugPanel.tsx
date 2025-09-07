'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Copy, RefreshCw, User, Shield, Clock } from 'lucide-react';
import { TwoFactorAuthService } from '@/services/twoFactorAuthService';

export default function AdminDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentCodes, setCurrentCodes] = useState<{ [key: string]: string }>({});
  const [copied, setCopied] = useState<string>('');

  const testUsers = [
    {
      id: 'test-user-no-2fa',
      email: 'demo@test.com',
      password: 'password123',
      name: 'Demo User (No 2FA)',
      has2FA: false
    },
    {
      id: 'test-user-with-2fa',
      email: 'demo2fa@test.com',
      password: 'password123',
      name: 'Demo User (With 2FA)',
      has2FA: true
    }
  ];

  // Update TOTP codes every second
  useEffect(() => {
    const updateCodes = () => {
      const codes: { [key: string]: string } = {};
      testUsers.forEach(user => {
        if (user.has2FA) {
          // Get the user's secret and generate current TOTP
          const data = TwoFactorAuthService.get2FADataForDebug();
          const userData = data.find((item: any) => item.userId === user.id);
          if (userData && userData.enabled) {
            const currentTime = Date.now();
            const timeWindow = Math.floor(currentTime / 30000);
            const code = TwoFactorAuthService.generateTOTPForDebug(userData.secret, currentTime);
            const nextRefresh = 30 - Math.floor((currentTime / 1000) % 30);
            codes[user.id] = `${code} (${nextRefresh}s)`;
          }
        }
      });
      setCurrentCodes(codes);
    };

    updateCodes();
    const interval = setInterval(updateCodes, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getBackupCodes = (userId: string) => {
    const data = TwoFactorAuthService.get2FADataForDebug();
    const userData = data.find((item: any) => item.userId === userId);
    return userData?.backupCodes || [];
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Show Debug Panel"
        >
          <Shield className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-2xl max-w-md w-96"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Debug Panel</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white"
          >
            <EyeOff className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-yellow-400 mb-3 p-2 bg-yellow-400/10 rounded border border-yellow-400/20">
            ⚠️ This is a debug panel for testing 2FA features
          </div>

          {testUsers.map(user => (
            <div key={user.id} className="border border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-white font-medium">{user.name}</span>
                {user.has2FA && (
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                    2FA Enabled
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">{user.email}</span>
                    <button
                      onClick={() => copyToClipboard(user.email, `email-${user.id}`)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {copied === `email-${user.id}` && (
                      <span className="text-green-400 text-xs">Copied!</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">{user.password}</span>
                    <button
                      onClick={() => copyToClipboard(user.password, `password-${user.id}`)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {copied === `password-${user.id}` && (
                      <span className="text-green-400 text-xs">Copied!</span>
                    )}
                  </div>
                </div>

                {user.has2FA && currentCodes[user.id] && (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-green-400" />
                        <span className="text-gray-400">Current TOTP:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-mono text-lg">
                          {currentCodes[user.id]}
                        </span>
                        <button
                          onClick={() => copyToClipboard(currentCodes[user.id].split(' ')[0], `totp-${user.id}`)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copied === `totp-${user.id}` && (
                          <span className="text-green-400 text-xs">Copied!</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      <details className="text-xs">
                        <summary className="text-gray-400 cursor-pointer hover:text-white">
                          Show backup codes
                        </summary>
                        <div className="mt-2 p-2 bg-gray-800 rounded text-gray-300 font-mono">
                          {getBackupCodes(user.id).map((code: string, idx: number) => (
                            <div key={idx} className="flex justify-between items-center py-1">
                              <span>{code}</span>
                              <button
                                onClick={() => copyToClipboard(code, `backup-${user.id}-${idx}`)}
                                className="text-gray-400 hover:text-white ml-2"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          <div className="text-xs text-gray-400 border-t border-gray-700 pt-3">
            <div className="space-y-1">
              <div>📝 Use these credentials to test login</div>
              <div>🔐 For 2FA user, enter password then TOTP code</div>
              <div>⚙️ Access settings to manage 2FA features</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
