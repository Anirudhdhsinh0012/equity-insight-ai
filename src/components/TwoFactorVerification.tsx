'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ArrowLeft, 
  AlertTriangle, 
  RefreshCw,
  Smartphone,
  Key,
  HelpCircle
} from 'lucide-react';

interface TwoFactorVerificationProps {
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
  email: string;
  isLoading?: boolean;
}

export default function TwoFactorVerification({ 
  onVerify, 
  onBack, 
  email, 
  isLoading = false 
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerification(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      setError('');
      
      // Auto-submit pasted code
      setTimeout(() => {
        handleVerification(pastedData);
      }, 100);
    }
  };

  const handleVerification = async (verificationCode: string) => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await onVerify(verificationCode);
      if (!result.success) {
        setError(result.error || 'Invalid verification code');
        // Clear the code on error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Failed to verify code. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackupCodeSubmit = async () => {
    if (!backupCode.trim()) {
      setError('Please enter a backup code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await onVerify(backupCode.trim().toUpperCase());
      if (!result.success) {
        setError(result.error || 'Invalid backup code');
        setBackupCode('');
      }
    } catch (error) {
      setError('Failed to verify backup code. Please try again.');
      setBackupCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const currentCode = code.join('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            Two-Factor Authentication
          </h1>
          <p className="text-slate-300 text-sm">
            Enter the 6-digit code from your authenticator app
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Signing in as {email}
          </p>
        </div>

        {!showBackupCode ? (
          /* Authenticator Code Input */
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-center space-x-3">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-14 text-center text-xl font-mono bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    maxLength={1}
                    autoComplete="off"
                  />
                ))}
              </div>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-red-300 text-sm">{error}</span>
                </motion.div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={() => handleVerification(currentCode)}
              disabled={currentCode.length !== 6 || isVerifying}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Verify Code</span>
                </>
              )}
            </button>

            {/* Help Options */}
            <div className="space-y-3">
              <div className="text-center">
                <button
                  onClick={() => setShowBackupCode(true)}
                  className="text-slate-300 hover:text-white text-sm underline transition-colors"
                >
                  Use backup code instead
                </button>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-slate-400 text-xs">
                <Smartphone className="w-4 h-4" />
                <span>Check your authenticator app for the current code</span>
              </div>
            </div>
          </div>
        ) : (
          /* Backup Code Input */
          <div className="space-y-6">
            <div className="text-center">
              <Key className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">
                Enter Backup Code
              </h2>
              <p className="text-slate-300 text-sm">
                Enter one of the backup codes you saved when setting up 2FA
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => {
                    setBackupCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="Enter backup code"
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono text-center"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-red-300 text-sm">{error}</span>
                </motion.div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleBackupCodeSubmit}
                disabled={!backupCode.trim() || isVerifying}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    <span>Verify Backup Code</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={() => {
                    setShowBackupCode(false);
                    setBackupCode('');
                    setError('');
                    setCode(['', '', '', '', '', '']);
                    setTimeout(() => inputRefs.current[0]?.focus(), 100);
                  }}
                  className="text-slate-300 hover:text-white text-sm underline transition-colors"
                >
                  Use authenticator app instead
                </button>
              </div>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <HelpCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-300 text-sm">
                    <strong>Note:</strong> Each backup code can only be used once. 
                    After using this code, make sure you still have other backup codes available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <button
            onClick={onBack}
            disabled={isVerifying}
            className="w-full flex items-center justify-center space-x-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
