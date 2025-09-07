'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, Check, CheckCheck, X, AlertCircle, RefreshCw } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { WhatsAppMessage } from '@/types';

interface WhatsAppHistoryProps {
  userId: string;
}

export default function WhatsAppHistory({ userId }: WhatsAppHistoryProps) {
  const { theme } = useTheme();
  const { getWhatsAppHistory, whatsappMessages } = useNotifications();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'HOLD' | 'CUSTOM'>('ALL');

  useEffect(() => {
    loadWhatsAppHistory();
  }, [userId, whatsappMessages]);

  const loadWhatsAppHistory = async () => {
    try {
      setLoading(true);
      const history = await getWhatsAppHistory();
      setMessages(history.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
    } catch (error) {
      console.error('Error loading WhatsApp history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Check className="w-4 h-4 text-slate-500" />;
      case 'DELIVERED':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case 'READ':
        return <CheckCheck className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY':
        return 'text-green-500';
      case 'SELL':
        return 'text-red-500';
      case 'HOLD':
        return 'text-yellow-500';
      default:
        return theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
    }
  };

  const getRecommendationEmoji = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY':
        return '�';
      case 'SELL':
        return '�';
      case 'HOLD':
        return '⚡';
      default:
        return '�';
    }
  };

  const filteredMessages = filter === 'ALL' 
    ? messages 
    : messages.filter(msg => msg.recommendation === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
          theme === 'dark' ? 'border-white' : 'border-slate-900'
        }`}></div>
        <span className={`ml-3 transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          Loading WhatsApp history...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className={`w-6 h-6 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
          <h2 className={`text-2xl font-bold transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            WhatsApp Alert History
          </h2>
        </div>
        <button
          onClick={loadWhatsAppHistory}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            theme === 'dark' 
              ? 'text-blue-400 hover:text-blue-300 hover:bg-slate-800' 
              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'BUY', 'SELL', 'HOLD', 'CUSTOM'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType as any)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === filterType
                ? theme === 'dark'
                  ? 'bg-blue-900 text-blue-200'
                  : 'bg-blue-100 text-blue-800'
                : theme === 'dark'
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {filterType} {filterType !== 'ALL' && getRecommendationEmoji(filterType)}
          </button>
        ))}
      </div>

      {filteredMessages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-center py-12 rounded-lg border-2 border-dashed transition-colors duration-300 ${
            theme === 'dark' 
              ? 'border-slate-700 bg-slate-900/30' 
              : 'border-slate-300 bg-slate-50'
          }`}
        >
          <MessageCircle className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
          }`} />
          <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {filter === 'ALL' ? 'No WhatsApp alerts sent yet' : `No ${filter} alerts found`}
          </h3>
          <p className={`transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
          }`}>
            {filter === 'ALL' 
              ? 'WhatsApp notifications will appear here when stock recommendations are triggered.'
              : `Try selecting a different filter to see other types of alerts.`
            }
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-lg ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
                  }`}>
                    <MessageCircle className={`w-4 h-4 ${
                      theme === 'dark' ? 'text-green-400' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        {message.ticker}
                      </span>
                      <span className={`font-bold ${getRecommendationColor(message.recommendation)}`}>
                        {getRecommendationEmoji(message.recommendation)} {message.recommendation}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {new Date(message.sentAt).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(message.status)}
                        <span className={`text-xs capitalize transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                        }`}>
                          {message.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`text-sm leading-relaxed whitespace-pre-line transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {message.message}
              </div>

              <div className={`mt-3 pt-3 border-t text-xs transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'border-slate-800 text-slate-500' 
                  : 'border-slate-200 text-slate-500'
              }`}>
                Sent to: {message.phoneNumber} • Message ID: {message.twilioMessageId}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
