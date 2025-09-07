'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Send,
  Paperclip,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  BookOpen,
  Video,
  Download,
  ExternalLink,
  Users,
  Zap,
  Shield,
  BarChart3,
  Activity
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface HelpSupportProps {
  onClose?: () => void;
}

export default function HelpSupport({ onClose }: HelpSupportProps) {
  const { theme, colors } = useTheme();
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [ticketForm, setTicketForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
    attachment: null as File | null,
  });

  const tabs = [
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'contact', label: 'Contact Support', icon: MessageSquare },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'status', label: 'System Status', icon: Activity },
  ];

  const faqData = [
    {
      category: 'Getting Started',
      questions: [
        {
          question: 'How do I add stocks to my watchlist?',
          answer: 'To add stocks to your watchlist, go to the Watchlist section and click the "+" button. You can search for stocks by name or symbol and add them to track their performance.',
        },
        {
          question: 'How often is the market data updated?',
          answer: 'Our market data is updated in real-time during market hours. We provide live quotes, price movements, and technical indicators that refresh every few seconds.',
        },
        {
          question: 'Can I customize my dashboard layout?',
          answer: 'Yes! You can customize your dashboard by rearranging widgets, changing chart timeframes, and selecting which metrics to display. Go to Settings > Appearance to personalize your experience.',
        },
      ],
    },
    {
      category: 'Trading & Analysis',
      questions: [
        {
          question: 'How do I interpret the AI recommendations?',
          answer: 'Our AI analyzes market trends, technical indicators, and news sentiment to provide buy/sell/hold recommendations. Each recommendation comes with a confidence score and detailed reasoning.',
        },
        {
          question: 'What technical indicators are available?',
          answer: 'We provide a comprehensive set of technical indicators including Moving Averages, RSI, MACD, Bollinger Bands, Stochastic Oscillator, and many more. You can customize which indicators to display on your charts.',
        },
        {
          question: 'How accurate are the price predictions?',
          answer: 'Our AI models analyze historical data and market patterns to make predictions. While we strive for accuracy, all predictions should be considered as guidance only and not as financial advice.',
        },
      ],
    },
    {
      category: 'Account & Security',
      questions: [
        {
          question: 'How do I enable two-factor authentication?',
          answer: 'Go to Settings > Security and click "Enable" next to Two-Factor Authentication. Follow the setup instructions to add an extra layer of security to your account.',
        },
        {
          question: 'Can I export my trading data?',
          answer: 'Yes, you can export your trading history, portfolio data, and reports from the Settings > Security section. Data can be downloaded in CSV or PDF format.',
        },
        {
          question: 'How do I change my notification preferences?',
          answer: 'Visit Settings > Notifications to customize your alert preferences. You can enable/disable email, push, WhatsApp notifications, and set custom price alert thresholds.',
        },
      ],
    },
  ];

  const resources = [
    {
      title: 'User Guide',
      description: 'Complete guide to using all features',
      icon: BookOpen,
      type: 'PDF',
      url: '#',
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video walkthroughs',
      icon: Video,
      type: 'Videos',
      url: '#',
    },
    {
      title: 'API Documentation',
      description: 'For developers and advanced users',
      icon: FileText,
      type: 'Web',
      url: '#',
    },
    {
      title: 'Trading Strategies',
      description: 'Learn proven trading strategies',
      icon: BarChart3,
      type: 'PDF',
      url: '#',
    },
  ];

  const systemStatus = [
    { service: 'Market Data Feed', status: 'operational', uptime: '99.9%' },
    { service: 'AI Recommendations', status: 'operational', uptime: '99.8%' },
    { service: 'WhatsApp Alerts', status: 'degraded', uptime: '98.5%' },
    { service: 'Real-time Charts', status: 'operational', uptime: '99.9%' },
  ];

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Support ticket submitted:', ticketForm);
    // Reset form
    setTicketForm({
      name: '',
      email: '',
      subject: '',
      category: '',
      priority: 'medium',
      description: '',
      attachment: null,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'outage':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`w-full max-w-6xl mx-auto ${colors.primary.background} min-h-screen`}
    >
      {/* Header */}
      <div className={`${colors.primary.surface} backdrop-blur-xl ${colors.primary.border} border-b sticky top-0 z-10`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${colors.text.primary}`}>Help & Support</h1>
              <p className={`${colors.text.secondary} mt-1`}>Get answers to your questions and contact our support team</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 ${colors.primary.surface} rounded-lg ${colors.primary.border} border`}>
                <Clock className={`w-4 h-4 ${colors.text.secondary}`} />
                <span className={`text-sm ${colors.text.secondary}`}>24/7 Support</span>
              </div>
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
            {activeTab === 'faq' && (
              <div className="space-y-6">
                {/* Search */}
                <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${colors.text.secondary}`} />
                    <input
                      type="text"
                      placeholder="Search frequently asked questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                    />
                  </div>
                </div>

                {/* FAQ Categories */}
                <div className="space-y-4">
                  {filteredFAQ.map((category, categoryIndex) => (
                    <div key={categoryIndex} className={`${colors.primary.surface} backdrop-blur-xl rounded-xl ${colors.primary.border} border overflow-hidden`}>
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className={`text-lg font-semibold ${colors.text.primary}`}>{category.category}</h3>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {category.questions.map((faq, index) => (
                          <div key={index}>
                            <motion.button
                              whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(71, 85, 105, 0.3)' : 'rgba(248, 250, 252, 0.8)' }}
                              onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                              className="w-full p-4 text-left flex items-center justify-between transition-colors"
                            >
                              <span className={`font-medium ${colors.text.primary}`}>{faq.question}</span>
                              {expandedFAQ === index ? (
                                <ChevronUp className={`w-5 h-5 ${colors.text.secondary}`} />
                              ) : (
                                <ChevronDown className={`w-5 h-5 ${colors.text.secondary}`} />
                              )}
                            </motion.button>
                            <AnimatePresence>
                              {expandedFAQ === index && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className={`p-4 pt-0 ${colors.text.secondary}`}>
                                    {faq.answer}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Methods */}
                <div className="space-y-4">
                  <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                    <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Contact Methods</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colors.primary.accent} bg-opacity-10`}>
                          <Mail className={`w-4 h-4 ${colors.text.accent}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${colors.text.primary}`}>Email</p>
                          <p className={`text-sm ${colors.text.secondary}`}>support@stockadvisor.com</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colors.primary.accent} bg-opacity-10`}>
                          <Phone className={`w-4 h-4 ${colors.text.accent}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${colors.text.primary}`}>Phone</p>
                          <p className={`text-sm ${colors.text.secondary}`}>+91 1800-123-4567</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colors.primary.accent} bg-opacity-10`}>
                          <MessageSquare className={`w-4 h-4 ${colors.text.accent}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${colors.text.primary}`}>Live Chat</p>
                          <p className={`text-sm ${colors.text.secondary}`}>Available 24/7</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                    <h4 className={`font-semibold ${colors.text.primary} mb-2`}>Response Times</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={colors.text.secondary}>Email:</span>
                        <span className={colors.text.primary}>2-4 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={colors.text.secondary}>Live Chat:</span>
                        <span className={colors.text.primary}>Instant</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={colors.text.secondary}>Phone:</span>
                        <span className={colors.text.primary}>&lt; 5 minutes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support Ticket Form */}
                <div className="lg:col-span-2">
                  <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                    <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Submit Support Ticket</h3>
                    <form onSubmit={handleTicketSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>Name</label>
                          <input
                            type="text"
                            required
                            value={ticketForm.name}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, name: e.target.value }))}
                            className={`w-full px-3 py-2 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>Email</label>
                          <input
                            type="email"
                            required
                            value={ticketForm.email}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, email: e.target.value }))}
                            className={`w-full px-3 py-2 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>Subject</label>
                        <input
                          type="text"
                          required
                          value={ticketForm.subject}
                          onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                          className={`w-full px-3 py-2 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>Category</label>
                          <select
                            required
                            value={ticketForm.category}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                            className={`w-full px-3 py-2 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                          >
                            <option value="">Select category</option>
                            <option value="technical">Technical Issue</option>
                            <option value="account">Account Help</option>
                            <option value="billing">Billing Question</option>
                            <option value="feature">Feature Request</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>Priority</label>
                          <select
                            value={ticketForm.priority}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                            className={`w-full px-3 py-2 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>Description</label>
                        <textarea
                          rows={4}
                          required
                          value={ticketForm.description}
                          onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Please describe your issue in detail..."
                          className={`w-full px-3 py-2 ${colors.primary.surface} ${colors.primary.border} border rounded-lg focus:ring-2 focus:ring-blue-500 ${colors.text.primary}`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>Attachment (Optional)</label>
                        <div className={`border-2 border-dashed ${colors.primary.border} rounded-lg p-4 text-center`}>
                          <Paperclip className={`w-8 h-8 ${colors.text.secondary} mx-auto mb-2`} />
                          <p className={`text-sm ${colors.text.secondary}`}>Drop files here or click to browse</p>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setTicketForm(prev => ({ ...prev, attachment: e.target.files?.[0] || null }))}
                          />
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className={`w-full px-4 py-3 ${colors.primary.accent} text-white rounded-lg font-medium hover:${colors.primary.accentHover} transition-all flex items-center justify-center gap-2`}
                      >
                        <Send className="w-4 h-4" />
                        Submit Ticket
                      </motion.button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {resources.map((resource, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border cursor-pointer`}
                  >
                    <div className={`p-3 rounded-lg ${colors.primary.accent} bg-opacity-10 w-fit mb-4`}>
                      <resource.icon className={`w-6 h-6 ${colors.text.accent}`} />
                    </div>
                    <h3 className={`font-semibold ${colors.text.primary} mb-2`}>{resource.title}</h3>
                    <p className={`text-sm ${colors.text.secondary} mb-4`}>{resource.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded ${colors.primary.accent} bg-opacity-10 ${colors.text.accent}`}>
                        {resource.type}
                      </span>
                      <ExternalLink className={`w-4 h-4 ${colors.text.secondary}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'status' && (
              <div className="space-y-6">
                <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-semibold ${colors.text.primary}`}>System Status</h3>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={`text-sm ${colors.text.secondary}`}>All systems operational</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {systemStatus.map((service, index) => (
                      <div key={index} className={`p-4 rounded-lg ${colors.primary.surface} ${colors.primary.border} border`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-medium ${colors.text.primary}`}>{service.service}</h4>
                          {getStatusIcon(service.status)}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={`capitalize ${colors.text.secondary}`}>{service.status}</span>
                          <span className={colors.text.secondary}>Uptime: {service.uptime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${colors.primary.surface} backdrop-blur-xl rounded-xl p-6 ${colors.primary.border} border`}>
                  <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Recent Updates</h3>
                  <div className="space-y-4">
                    {[
                      { date: '2025-09-03', title: 'Enhanced AI Recommendations', type: 'Feature' },
                      { date: '2025-09-02', title: 'Performance Improvements', type: 'Update' },
                      { date: '2025-09-01', title: 'WhatsApp Alert System', type: 'New' },
                    ].map((update, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colors.primary.accent} bg-opacity-10`}>
                          <Zap className={`w-4 h-4 ${colors.text.accent}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium ${colors.text.primary}`}>{update.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${colors.primary.accent} bg-opacity-10 ${colors.text.accent}`}>
                              {update.type}
                            </span>
                          </div>
                          <p className={`text-sm ${colors.text.secondary}`}>{update.date}</p>
                        </div>
                      </div>
                    ))}
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
