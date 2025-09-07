'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX,
  QrCode, 
  Copy, 
  Check, 
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  Smartphone,
  Key,
  Lock,
  X,
  RefreshCw
} from 'lucide-react';
import { TwoFactorAuthService } from '@/services/twoFactorAuthService';

interface TwoFactorSetupProps {
  userId: string;
  onClose: () => void;
  onComplete?: () => void;
}

interface SetupStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export default function TwoFactorSetup({ userId, onClose, onComplete }: TwoFactorSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
  const [downloadedBackupCodes, setDownloadedBackupCodes] = useState(false);

  const steps: SetupStep[] = [
    {
      id: 1,
      title: 'Install Authenticator App',
      description: 'Download and install an authenticator app on your phone',
      completed: currentStep > 1
    },
    {
      id: 2,
      title: 'Scan QR Code',
      description: 'Use your authenticator app to scan the QR code',
      completed: currentStep > 2
    },
    {
      id: 3,
      title: 'Verify Setup',
      description: 'Enter the 6-digit code from your authenticator app',
      completed: currentStep > 3
    },
    {
      id: 4,
      title: 'Save Backup Codes',
      description: 'Download and securely store your backup codes',
      completed: currentStep > 4
    }
  ];

  useEffect(() => {
    initializeSetup();
  }, [userId]);

  const initializeSetup = () => {
    try {
      const data = TwoFactorAuthService.setup2FA(userId, 'Stock Advisor Pro');
      setSetupData(data);
    } catch (error) {
      setError('Failed to initialize 2FA setup. Please try again.');
    }
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackupCodes(true);
        setTimeout(() => setCopiedBackupCodes(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;
    
    const content = `Stock Advisor Pro - Two-Factor Authentication Backup Codes\n\n` +
      `Generated: ${new Date().toLocaleDateString()}\n` +
      `User ID: ${userId}\n\n` +
      `IMPORTANT: Store these codes in a safe place. Each code can only be used once.\n\n` +
      setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n') +
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
    
    setDownloadedBackupCodes(true);
  };

  const handleVerification = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = TwoFactorAuthService.enable2FA(userId, verificationCode);
      
      if (result.success) {
        setSuccess('2FA has been successfully enabled!');
        setCurrentStep(4);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1500);
      } else {
        setError(result.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatSecret = (secret: string) => {
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  };

  if (!setupData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Initializing 2FA setup...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Setup Two-Factor Authentication
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step.completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : currentStep === step.id
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-700 dark:border-gray-600'
                }`}>
                  {step.completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 transition-colors ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {steps[currentStep - 1]?.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {steps[currentStep - 1]?.description}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Install Authenticator App */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Smartphone className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Install an Authenticator App
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Choose one of these recommended authenticator apps for your smartphone:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Google Authenticator', platform: 'iOS & Android' },
                    { name: 'Authy', platform: 'iOS & Android' },
                    { name: 'Microsoft Authenticator', platform: 'iOS & Android' }
                  ].map((app) => (
                    <div key={app.name} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white">{app.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{app.platform}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  I've Installed an Authenticator App
                </button>
              </motion.div>
            )}

            {/* Step 2: Scan QR Code */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <QrCode className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Scan QR Code
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Open your authenticator app and scan the QR code below, or manually enter the secret key.
                  </p>
                </div>

                {/* QR Code Display */}
                <div className="bg-white p-8 rounded-lg border-2 border-gray-200 text-center">
                  <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-gray-400" />
                    <div className="absolute text-xs text-gray-500 mt-32">
                      QR Code placeholder
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Scan this code with your authenticator app
                  </p>
                </div>

                {/* Manual Entry */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Can't scan? Enter this secret key manually:
                  </h4>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-sm font-mono break-all">
                      {formatSecret(setupData.secret)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(setupData.secret, 'secret')}
                      className="p-3 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Copy secret key"
                    >
                      {copiedSecret ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  I've Added the Account
                </button>
              </motion.div>
            )}

            {/* Step 3: Verify Setup */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Key className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Verify Your Setup
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Enter the 6-digit code from your authenticator app to verify the setup.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                        setError('');
                      }}
                      placeholder="000000"
                      className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      maxLength={6}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-red-700 text-sm">{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 text-sm">{success}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleVerification}
                  disabled={verificationCode.length !== 6 || isVerifying}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Verify and Enable 2FA</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Step 4: Save Backup Codes */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <ShieldCheck className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Two-Factor Authentication Enabled!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Important:</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Each backup code can only be used once. Store them securely and don't share them with anyone.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">Backup Codes</h4>
                    <button
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{showBackupCodes ? 'Hide' : 'Show'} Codes</span>
                    </button>
                  </div>

                  {showBackupCodes && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {setupData.backupCodes.map((code, index) => (
                          <code key={code} className="text-sm font-mono bg-white dark:bg-gray-600 p-2 rounded border">
                            {index + 1}. {code}
                          </code>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), 'backup')}
                          className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          {copiedBackupCodes ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedBackupCodes ? 'Copied!' : 'Copy Codes'}</span>
                        </button>
                        
                        <button
                          onClick={downloadBackupCodes}
                          className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Codes</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={onClose}
                    disabled={!downloadedBackupCodes && !copiedBackupCodes}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Complete Setup
                  </button>
                </div>

                {!downloadedBackupCodes && !copiedBackupCodes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Please save your backup codes before completing the setup.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
