'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { whatsAppService } from '@/services/whatsappService';
import { Send, Phone, AlertCircle, CheckCircle, Clock, MessageSquare } from 'lucide-react';

interface TestResult {
  type: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp: Date;
  messageId?: string;
}

export const WhatsAppTestCenter: React.FC = () => {
  const { settings, addNotification } = useNotifications();
  const [phoneNumber, setPhoneNumber] = useState('+919173611252'); // Your number as default
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [isSendingCustom, setIsSendingCustom] = useState(false);

  // Auto-update message status every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      for (const result of testResults) {
        if (result.messageId && result.status === 'pending') {
          try {
            const status = await whatsAppService.getMessageStatus(result.messageId);
            if (status !== 'queued' && status !== 'accepted') {
              setTestResults(prev => 
                prev.map(r => 
                  r.messageId === result.messageId 
                    ? { ...r, status: status === 'delivered' || status === 'read' ? 'success' : 'error', message: `Message ${status}` }
                    : r
                )
              );
              await whatsAppService.updateMessageStatus(result.messageId, status);
            }
          } catch (error) {
            console.error('Error checking message status:', error);
          }
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [testResults]);

  const addTestResult = (type: string, status: 'pending' | 'success' | 'error', message: string, messageId?: string) => {
    const result: TestResult = {
      type,
      status,
      message,
      timestamp: new Date(),
      messageId
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    addTestResult('Connection Test', 'pending', 'Testing WhatsApp connection...');

    try {
      const result = await whatsAppService.testConnection('test-user');
      
      if (result.success) {
        addTestResult('Connection Test', 'success', 'WhatsApp connection successful!');
        await addNotification({
          title: 'WhatsApp Test Successful',
          message: 'Connection to WhatsApp API is working correctly',
          type: 'SUCCESS',
          userId: 'test-user'
        });
      } else {
        addTestResult('Connection Test', 'error', result.error || 'Connection failed');
        await addNotification({
          title: 'WhatsApp Test Failed',
          message: result.error || 'Failed to connect to WhatsApp API',
          type: 'ERROR',
          userId: 'test-user'
        });
      }
    } catch (error) {
      addTestResult('Connection Test', 'error', 'Network error occurred');
      console.error('Connection test error:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const sendTestStockAlert = async () => {
    if (!whatsAppService.validatePhoneNumber(phoneNumber)) {
      addTestResult('Stock Alert', 'error', 'Invalid phone number format');
      return;
    }

    addTestResult('Stock Alert', 'pending', 'Sending test stock alert...');

    const testStock = {
      id: 'test-1',
      ticker: 'AAPL',
      buyDate: new Date(),
      buyPrice: 150,
      quantity: 10,
      currentPrice: 175,
      userId: 'test-user'
    };

    try {
      const result = await whatsAppService.sendStockAlert(testStock, 'BUY', 'test-user', phoneNumber);
      
      if (result.success) {
        addTestResult('Stock Alert', 'pending', 'Stock alert sent successfully', result.messageId);
      } else {
        addTestResult('Stock Alert', 'error', result.error || 'Failed to send stock alert');
      }
    } catch (error) {
      addTestResult('Stock Alert', 'error', 'Error sending stock alert');
      console.error('Stock alert error:', error);
    }
  };

  const sendCustomMessage = async () => {
    if (!customMessage.trim()) {
      addTestResult('Custom Message', 'error', 'Message cannot be empty');
      return;
    }

    if (!whatsAppService.validatePhoneNumber(phoneNumber)) {
      addTestResult('Custom Message', 'error', 'Invalid phone number format');
      return;
    }

    setIsSendingCustom(true);
    addTestResult('Custom Message', 'pending', 'Sending custom message...');

    try {
      const result = await whatsAppService.sendCustomAlert(
        'Custom Alert',
        customMessage,
        'test-user',
        phoneNumber
      );
      
      if (result.success) {
        addTestResult('Custom Message', 'pending', 'Custom message sent successfully', result.messageId);
        setCustomMessage('');
      } else {
        addTestResult('Custom Message', 'error', result.error || 'Failed to send custom message');
      }
    } catch (error) {
      addTestResult('Custom Message', 'error', 'Error sending custom message');
      console.error('Custom message error:', error);
    } finally {
      setIsSendingCustom(false);
    }
  };

  const sendPortfolioUpdate = async () => {
    if (!whatsAppService.validatePhoneNumber(phoneNumber)) {
      addTestResult('Portfolio Update', 'error', 'Invalid phone number format');
      return;
    }

    addTestResult('Portfolio Update', 'pending', 'Sending portfolio update...');

    const portfolioSummary = `
📊 Your Portfolio Summary:
💰 Total Value: $25,350
📈 Total Gain: +$2,850 (+12.7%)
🎯 Best Performer: AAPL (+15.2%)
⚠️ Watch: TSLA (-3.1%)
    `.trim();

    try {
      const result = await whatsAppService.sendPortfolioUpdate(portfolioSummary, 'test-user', phoneNumber);
      
      if (result.success) {
        addTestResult('Portfolio Update', 'pending', 'Portfolio update sent successfully', result.messageId);
      } else {
        addTestResult('Portfolio Update', 'error', result.error || 'Failed to send portfolio update');
      }
    } catch (error) {
      addTestResult('Portfolio Update', 'error', 'Error sending portfolio update');
      console.error('Portfolio update error:', error);
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <MessageSquare className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-900">WhatsApp Test Center</h2>
      </div>

      {/* Phone Number Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Test Phone Number
        </label>
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+919173611252"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className={`text-xs px-2 py-1 rounded ${
            whatsAppService.validatePhoneNumber(phoneNumber) 
              ? 'bg-green-100 text-green-600' 
              : 'bg-red-100 text-red-600'
          }`}>
            {whatsAppService.validatePhoneNumber(phoneNumber) ? 'Valid' : 'Invalid'}
          </span>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={testConnection}
          disabled={isTestingConnection}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTestingConnection ? (
            <Clock className="w-4 h-4 animate-pulse" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Test Connection</span>
        </button>

        <button
          onClick={sendTestStockAlert}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Send className="w-4 h-4" />
          <span>Test Stock Alert</span>
        </button>

        <button
          onClick={sendPortfolioUpdate}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          <Send className="w-4 h-4" />
          <span>Test Portfolio Update</span>
        </button>
      </div>

      {/* Custom Message */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Send Custom Message
        </label>
        <div className="flex items-center space-x-2">
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Enter your custom message here..."
            rows={3}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendCustomMessage}
            disabled={isSendingCustom || !customMessage.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed self-end"
          >
            {isSendingCustom ? (
              <Clock className="w-4 h-4 animate-pulse" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">Test Results</h3>
        <div className="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tests run yet</p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium text-sm">{result.type}</span>
                  </div>
                  <div className="flex-1 mx-4">
                    <p className="text-sm text-gray-600 truncate">{result.message}</p>
                    {result.messageId && (
                      <p className="text-xs text-gray-400">ID: {result.messageId}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTime(result.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTestCenter;
