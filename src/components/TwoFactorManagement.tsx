'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Settings,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertTriangle,
  Key,
  Smartphone,
  Trash2,
  Plus
} from 'lucide-react';
import { TwoFactorAuthService } from '@/services/twoFactorAuthService';
import TwoFactorSetup from './TwoFactorSetup';

interface TwoFactorManagementProps {
  userId: string;
  className?: string;
}

export default function TwoFactorManagement({ userId, className = '' }: TwoFactorManagementProps) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = () => {
    const enabled = TwoFactorAuthService.is2FAEnabled(userId);
    setIs2FAEnabled(enabled);
    
    if (enabled) {
      const codes = TwoFactorAuthService.getBackupCodes(userId);
      setBackupCodes(codes);
    }
  };

  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = TwoFactorAuthService.disable2FA(userId, disableCode);
      
      if (result.success) {
        setSuccess('Two-factor authentication has been disabled');
        setShowDisableModal(false);
        setDisableCode('');
        checkStatus();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      setError('Failed to disable 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (regenerateCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = TwoFactorAuthService.regenerateBackupCodes(userId, regenerateCode);
      
      if (result.success && result.backupCodes) {
        setBackupCodes(result.backupCodes);
        setSuccess('Backup codes have been regenerated');
        setShowRegenerateModal(false);
        setRegenerateCode('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to regenerate backup codes');
      }
    } catch (error) {
      setError('Failed to regenerate backup codes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    try {
      const codesText = backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n');
      await navigator.clipboard.writeText(codesText);
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch (error) {
      console.error('Failed to copy backup codes:', error);
    }
  };

  const downloadBackupCodes = () => {
    const content = `Stock Advisor Pro - Two-Factor Authentication Backup Codes\n\n` +
      `Generated: ${new Date().toLocaleDateString()}\n` +
      `User ID: ${userId}\n\n` +
      `IMPORTANT: Store these codes in a safe place. Each code can only be used once.\n\n` +
      backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n') +
      `\n\nIf you lose access to your authenticator app, you can use these codes to sign in.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-advisor-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Display */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${
              is2FAEnabled 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-600' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {is2FAEnabled ? <ShieldCheck className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {is2FAEnabled 
                  ? 'Your account is protected with 2FA' 
                  : 'Add an extra layer of security to your account'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {is2FAEnabled ? (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-sm font-medium rounded-full">
                Enabled
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full">
                Disabled
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          {!is2FAEnabled ? (
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Enable 2FA</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showBackupCodes ? 'Hide' : 'View'} Backup Codes</span>
              </button>
              
              <button
                onClick={() => setShowRegenerateModal(true)}
                className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate Codes</span>
              </button>
              
              <button
                onClick={() => setShowDisableModal(true)}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <ShieldX className="w-4 h-4" />
                <span>Disable 2FA</span>
              </button>
            </>
          )}
        </div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-2"
            >
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2"
            >
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Backup Codes Display */}
      <AnimatePresence>
        {is2FAEnabled && showBackupCodes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Backup Codes
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={copyBackupCodes}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {copiedCodes ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCodes ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={downloadBackupCodes}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    <strong>Important:</strong> Each backup code can only be used once. 
                    Store them securely and don't share them with anyone.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={code} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {index + 1}. {code}
                  </code>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
              You have {backupCodes.length} backup codes remaining.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Setup Modal */}
      <AnimatePresence>
        {showSetup && (
          <TwoFactorSetup
            userId={userId}
            onClose={() => setShowSetup(false)}
            onComplete={() => {
              setShowSetup(false);
              checkStatus();
              setSuccess('Two-factor authentication has been enabled successfully!');
              setTimeout(() => setSuccess(''), 3000);
            }}
          />
        )}
      </AnimatePresence>

      {/* Disable 2FA Modal */}
      <AnimatePresence>
        {showDisableModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldX className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Disable Two-Factor Authentication
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your authenticator code to disable 2FA. This will make your account less secure.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={disableCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setDisableCode(value);
                      setError('');
                    }}
                    placeholder="000000"
                    className="w-full px-4 py-3 text-center text-lg font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                    maxLength={6}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowDisableModal(false);
                    setDisableCode('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisable2FA}
                  disabled={disableCode.length !== 6 || isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Disabling...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Disable 2FA</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Regenerate Backup Codes Modal */}
      <AnimatePresence>
        {showRegenerateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Regenerate Backup Codes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your authenticator code to generate new backup codes. Your old codes will no longer work.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={regenerateCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setRegenerateCode(value);
                      setError('');
                    }}
                    placeholder="000000"
                    className="w-full px-4 py-3 text-center text-lg font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                    maxLength={6}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRegenerateModal(false);
                    setRegenerateCode('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerateBackupCodes}
                  disabled={regenerateCode.length !== 6 || isLoading}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Regenerate</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
