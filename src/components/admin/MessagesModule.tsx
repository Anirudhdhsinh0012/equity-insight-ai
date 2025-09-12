'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Send, 
  Search, 
  Filter, 
  Star, 
  Archive, 
  Trash2, 
  Reply, 
  Forward,
  MoreHorizontal,
  User,
  Clock
} from 'lucide-react';

interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  starred: boolean;
  avatar?: string;
  priority: 'high' | 'normal' | 'low';
}

interface MessagesModuleProps {
  className?: string;
}

const MessagesModule: React.FC<MessagesModuleProps> = ({ className = '' }) => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');

  const [messages] = useState<Message[]>([
    {
      id: '1',
      from: 'John Smith',
      subject: 'Stock Analysis Report Q3',
      preview: 'Please find attached the quarterly stock analysis report with market insights...',
      time: '2 hours ago',
      read: false,
      starred: true,
      priority: 'high'
    },
    {
      id: '2',
      from: 'Sarah Johnson',
      subject: 'System Maintenance Scheduled',
      preview: 'We have scheduled system maintenance for this weekend. Expected downtime...',
      time: '5 hours ago',
      read: true,
      starred: false,
      priority: 'normal'
    },
    {
      id: '3',
      from: 'Mike Wilson',
      subject: 'User Registration Spike',
      preview: 'We noticed a significant increase in user registrations this week...',
      time: '1 day ago',
      read: false,
      starred: false,
      priority: 'normal'
    },
    {
      id: '4',
      from: 'Emily Chen',
      subject: 'API Rate Limit Alert',
      preview: 'Multiple users are approaching the API rate limit. We should consider...',
      time: '2 days ago',
      read: true,
      starred: true,
      priority: 'high'
    }
  ]);

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !message.read) ||
                         (filter === 'starred' && message.starred);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`h-full ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              Messages
            </h1>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Send className="w-4 h-4" />
              Compose
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'starred', label: 'Starred' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption.key
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                <div className="text-center">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No messages found</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                      !message.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => setSelectedMessage(message.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium ${!message.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                              {message.from}
                            </h3>
                            {message.priority === 'high' && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 text-xs rounded-full">
                                High Priority
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {message.starred && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {message.time}
                            </span>
                          </div>
                        </div>
                        <h4 className={`text-sm mb-1 ${!message.read ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {message.subject}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {message.preview}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MessagesModule;