'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Clock,
  User,
  Activity,
  Eye,
  Download,
  RefreshCw,
  Lock,
  Unlock,
  BarChart3,
  Calendar,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { AuthService } from '@/services/authService';
import { TwoFactorAuthService } from '@/services/twoFactorAuthService';

interface SecurityMonitoringPanelProps {
  userId?: string;
  className?: string;
}

export default function SecurityMonitoringPanel({ userId, className = '' }: SecurityMonitoringPanelProps) {
  const [validationDetails, setValidationDetails] = useState<any>({});
  const [securityReport, setSecurityReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailedLog, setShowDetailedLog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadValidationDetails = () => {
    try {
      const details = AuthService.get2FAValidationDetails(userId);
      setValidationDetails(details);
      console.log('[SecurityPanel] Loaded validation details:', details);
    } catch (error) {
      console.error('[SecurityPanel] Error loading validation details:', error);
      setError('Failed to load validation details');
    }
  };

  const loadSecurityReport = () => {
    try {
      setIsLoading(true);
      const report = AuthService.generateSecurityReport();
      setSecurityReport(report);
      console.log('[SecurityPanel] Generated security report:', report);
    } catch (error) {
      console.error('[SecurityPanel] Error generating security report:', error);
      setError('Failed to generate security report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockAccount = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      // Note: In real app, this would require admin privileges
      const result = TwoFactorAuthService.unlockAccount(userId, true);
      if (result.success) {
        setSuccess('Account unlocked successfully');
        loadValidationDetails();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to unlock account');
      }
    } catch (error) {
      setError('Failed to unlock account');
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    try {
      const report = AuthService.generateSecurityReport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Security report exported successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to export security report');
    }
  };

  useEffect(() => {
    loadValidationDetails();
    loadSecurityReport();
  }, [userId]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSecurityStatusIcon = (status: any) => {
    if (status?.isLocked) return <ShieldX className="w-5 h-5 text-red-500" />;
    if (status?.is2FAEnabled) return <ShieldCheck className="w-5 h-5 text-green-500" />;
    return <ShieldAlert className="w-5 h-5 text-yellow-500" />;
  };

  const { userSecurityStatus, validationMetrics, recentAttempts } = validationDetails;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Security Monitoring</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadValidationDetails}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportReport}
            className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Security Status */}
      {userSecurityStatus && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>User Security Status</span>
            </h3>
            {getSecurityStatusIcon(userSecurityStatus)}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {userSecurityStatus.is2FAEnabled ? 'Enabled' : 'Disabled'}
              </div>
              <div className="text-sm text-gray-500">2FA Status</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {userSecurityStatus.failedAttempts || 0}
              </div>
              <div className="text-sm text-gray-500">Failed Attempts</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {userSecurityStatus.backupCodesRemaining || 0}
              </div>
              <div className="text-sm text-gray-500">Backup Codes</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {userSecurityStatus.lastValidation ? formatTimestamp(userSecurityStatus.lastValidation).split(' ')[1] : 'Never'}
              </div>
              <div className="text-sm text-gray-500">Last Success</div>
            </div>
          </div>

          {userSecurityStatus.isLocked && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="font-semibold text-red-700">Account Locked</div>
                    <div className="text-sm text-red-600">
                      {userSecurityStatus.lockTimeRemaining 
                        ? `Unlocks in ${userSecurityStatus.lockTimeRemaining} seconds`
                        : 'Account is temporarily locked'
                      }
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleUnlockAccount}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Metrics */}
      {validationMetrics && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>System Validation Metrics</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {validationMetrics.totalAttempts || 0}
              </div>
              <div className="text-sm text-gray-500">Total Attempts</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {validationMetrics.successfulAttempts || 0}
              </div>
              <div className="text-sm text-gray-500">Successful</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {validationMetrics.failedAttempts || 0}
              </div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {validationMetrics.lockedAccounts || 0}
              </div>
              <div className="text-sm text-gray-500">Locked Accounts</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {validationMetrics.totalAttempts > 0 
                  ? `${Math.round((validationMetrics.successfulAttempts / validationMetrics.totalAttempts) * 100)}%`
                  : '0%'
                }
              </div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Attempts */}
      {recentAttempts && recentAttempts.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Recent Validation Attempts</span>
            </h3>
            <button
              onClick={() => setShowDetailedLog(!showDetailedLog)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{showDetailedLog ? 'Hide' : 'Show'} Details</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {recentAttempts.slice(0, showDetailedLog ? 20 : 5).map((attempt: any, index: number) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  attempt.success 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {attempt.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">
                        {attempt.success ? 'Successful' : 'Failed'} {attempt.method.toUpperCase()} validation
                      </div>
                      <div className="text-sm text-gray-500">
                        Code: {attempt.code} • {formatTimestamp(attempt.timestamp)}
                      </div>
                    </div>
                  </div>
                  {showDetailedLog && (
                    <div className="text-xs text-gray-400">
                      {attempt.userAgent?.split(' ')[0]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Report Summary */}
      {securityReport && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Security Report Summary</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {securityReport.userStatuses?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Total Users with 2FA</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {securityReport.recentAttempts?.filter((a: any) => a.success).length || 0}
              </div>
              <div className="text-sm text-gray-500">Recent Successful</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {securityReport.recentAttempts?.filter((a: any) => !a.success).length || 0}
              </div>
              <div className="text-sm text-gray-500">Recent Failed</div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 flex items-center space-x-2">
            <Info className="w-4 h-4" />
            <span>Report generated: {formatTimestamp(securityReport.generatedAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
