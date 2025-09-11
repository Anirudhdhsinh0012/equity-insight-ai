'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Bot,
  User,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Info,
  HelpCircle,
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import finnhubService from '@/services/finnhubService';

// Custom styles for better scrollbar styling
const scrollbarStyles = `
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #4B5563;
    border-radius: 3px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: #6B7280;
  }
`;

// Type declarations for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  metadata?: {
    stockData?: any;
    type?: 'stock' | 'website' | 'general';
  };
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function AIChatbot({ isOpen, onClose, className = '' }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'bot',
      content: "👋 Hi! I'm your AI assistant. I can help you with:\n\n📈 Stock market information\n💬 Website features and navigation\n🎯 Investment insights\n\nTry asking me about any stock symbol or ask 'help' for more options!",
      timestamp: new Date(),
      metadata: { type: 'general' } 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [ttsError, setTtsError] = useState<string | null>(null);
  const [ttsRetryCount, setTtsRetryCount] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const maxRetries = 3;

  // Data validation utility
  const validateStockData = (quote: any): boolean => {
    if (!quote) return false;

    const requiredFields = ['currentPrice', 'change', 'changePercent', 'timestamp'];
    const hasRequiredFields = requiredFields.every(field => quote.hasOwnProperty(field));

    if (!hasRequiredFields) {
      console.warn('Missing required fields in stock data:', Object.keys(quote));
      return false;
    }

    // Validate data types
    if (typeof quote.currentPrice !== 'number' || isNaN(quote.currentPrice)) {
      console.warn('Invalid currentPrice:', quote.currentPrice);
      return false;
    }

    if (typeof quote.change !== 'number' || isNaN(quote.change)) {
      console.warn('Invalid change:', quote.change);
      return false;
    }

    if (typeof quote.changePercent !== 'number' || isNaN(quote.changePercent)) {
      console.warn('Invalid changePercent:', quote.changePercent);
      return false;
    }

    // Check for reasonable values
    if (quote.currentPrice <= 0 || quote.currentPrice > 100000) {
      console.warn('Unreasonable currentPrice:', quote.currentPrice);
      return false;
    }

    return true;
  };

  const finnhubServiceRef = useRef(finnhubService);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
      }
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      // Load available voices
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        setAvailableVoices(voices);

        if (voices.length === 0) {
          console.warn('No speech synthesis voices available');
          setTtsError('No voices available for text-to-speech');
        } else {
          console.log(`Loaded ${voices.length} speech synthesis voices`);
        }
      };

      // Voices might not be loaded immediately
      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    } else {
      console.warn('Speech synthesis not supported in this browser');
      setTtsError('Speech synthesis not supported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = async (text: string, retryCount = 0): Promise<void> => {
    if (!synthRef.current) {
      const error = 'Speech synthesis not available';
      console.error(error);
      setTtsError(error);
      return;
    }

    if (!text || text.trim().length === 0) {
      console.warn('No text provided for speech synthesis');
      return;
    }

    try {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      setTtsError(null);

      const utterance = new SpeechSynthesisUtterance(text);

      // Configure speech settings
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      utterance.lang = 'en-US';

      // Try to select a good voice
      if (availableVoices.length > 0) {
        // Prefer English voices, fallback to any available voice
        const englishVoice = availableVoices.find(voice =>
          voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
        ) || availableVoices.find(voice =>
          voice.lang.startsWith('en')
        ) || availableVoices[0];

        if (englishVoice) {
          utterance.voice = englishVoice;
          console.log(`Using voice: ${englishVoice.name} (${englishVoice.lang})`);
        }
      }

      // Set up event handlers
      utterance.onstart = () => {
        console.log('Speech synthesis started');
        setIsSpeaking(true);
        setTtsError(null);
        setTtsRetryCount(0);
      };

      utterance.onend = () => {
        console.log('Speech synthesis completed');
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);

        const errorMessage = `Speech synthesis failed: ${event.error}`;
        setTtsError(errorMessage);

        // Retry logic
        if (retryCount < maxRetries) {
          console.log(`Retrying speech synthesis (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            speakText(text, retryCount + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff
        } else {
          console.error('Max retries reached for speech synthesis');
        }
      };

      utterance.onpause = () => {
        console.log('Speech synthesis paused');
      };

      utterance.onresume = () => {
        console.log('Speech synthesis resumed');
      };

      // Speak the text
      synthRef.current.speak(utterance);

      // Fallback timeout in case speech doesn't start
      setTimeout(() => {
        if (!synthRef.current?.speaking && !synthRef.current?.pending) {
          console.warn('Speech synthesis did not start within timeout');
          if (retryCount < maxRetries) {
            speakText(text, retryCount + 1);
          }
        }
      }, 3000);

    } catch (error) {
      console.error('Error in speakText:', error);
      setTtsError(`Speech synthesis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSpeaking(false);

      // Final fallback
      if (retryCount < maxRetries) {
        setTimeout(() => {
          speakText(text, retryCount + 1);
        }, 2000);
      }
    }
  };

  const toggleSpeech = async () => {
    if (isSpeaking) {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setIsSpeaking(false);
      setTtsError(null);
    } else {
      const lastBotMessage = messages.filter(m => m.type === 'bot').pop();
      if (lastBotMessage && lastBotMessage.content) {
        try {
          await speakText(lastBotMessage.content);
        } catch (error) {
          console.error('Error in toggleSpeech:', error);
          setTtsError('Failed to start speech synthesis');
        }
      } else {
        setTtsError('No message to speak');
      }
    }
  };

  const processStockQuery = async (ticker: string): Promise<string> => {
    try {
      console.log(`Fetching stock data for: ${ticker.toUpperCase()}`);

      const quote = await finnhubServiceRef.current.getCurrentQuote(ticker.toUpperCase());

      if (!quote) {
        console.warn(`No data found for ticker: ${ticker}`);
        return `❌ Sorry, I couldn't find data for "${ticker}". Please check the ticker symbol and try again.`;
      }

      // Validate quote data
      if (!quote.currentPrice || typeof quote.currentPrice !== 'number') {
        console.error(`Invalid currentPrice for ${ticker}:`, quote.currentPrice);
        return `❌ Sorry, I received invalid price data for "${ticker}". Please try again later.`;
      }

      // Check data freshness (data should be from last 15 minutes)
      const now = new Date();
      const dataAge = now.getTime() - quote.timestamp.getTime();
      const maxAge = 15 * 60 * 1000; // 15 minutes

      if (dataAge > maxAge) {
        console.warn(`Stale data for ${ticker}: ${dataAge / 1000}s old`);
      }

      // Validate all required fields
      const validatedQuote = {
        currentPrice: Number(quote.currentPrice) || 0,
        change: Number(quote.change) || 0,
        changePercent: Number(quote.changePercent) || 0,
        high: Number(quote.high) || 0,
        low: Number(quote.low) || 0,
        open: Number(quote.open) || 0,
        previousClose: Number(quote.previousClose) || 0,
        timestamp: quote.timestamp || new Date()
      };

      const changeIcon = validatedQuote.change >= 0 ? '📈' : '📉';

      const response = `${changeIcon} **${ticker.toUpperCase()}** Stock Information:

💰 **Current Price:** $${validatedQuote.currentPrice.toFixed(2)}
${validatedQuote.change >= 0 ? '📈' : '📉'} **Change:** ${validatedQuote.change >= 0 ? '+' : ''}$${validatedQuote.change.toFixed(2)} (${validatedQuote.changePercent >= 0 ? '+' : ''}${validatedQuote.changePercent.toFixed(2)}%)
📊 **Day Range:** $${validatedQuote.low.toFixed(2)} - $${validatedQuote.high.toFixed(2)}
🏁 **Previous Close:** $${validatedQuote.previousClose.toFixed(2)}
📅 **Open:** $${validatedQuote.open.toFixed(2)}

*Data updated: ${validatedQuote.timestamp.toLocaleTimeString()}*`;

      console.log(`Successfully processed stock data for ${ticker}`);
      return response;

    } catch (error) {
      console.error('Stock query error:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('API')) {
          return `❌ Sorry, there was an API error while fetching data for "${ticker}". Please try again later.`;
        } else if (error.message.includes('network')) {
          return `❌ Sorry, there was a network error while fetching data for "${ticker}". Please check your connection and try again.`;
        } else if (error.message.includes('rate limit')) {
          return `❌ Sorry, we've hit the API rate limit for "${ticker}". Please wait a moment and try again.`;
        }
      }

      return `❌ Sorry, I encountered an error while fetching stock data for "${ticker}". Please try again later.`;
    }
  };

  const processWebsiteQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('help') || lowerQuery.includes('what can you do')) {
      return `🤖 **I'm your AI Assistant!** I can help you with:

📈 **Stock Market Information:**
• Get real-time stock prices (e.g., "What's AAPL price?")
• View market trends and analysis
• Check company fundamentals

💬 **Website Features:**
• Navigate through the platform
• Explain dashboard features
• Help with settings and preferences

🎯 **Investment Insights:**
• Portfolio analysis suggestions
• Market news and updates
• Risk assessment guidance

💡 **Try these commands:**
• "AAPL stock" or "What's Tesla price?"
• "How to add stocks" or "Show me reports"
• "Market trends" or "Investment tips"
• "Help" for this menu

🎤 **Voice Commands:** Click the microphone to speak!`;
    }

    if (lowerQuery.includes('dashboard') || lowerQuery.includes('home')) {
      return `🏠 **Dashboard Overview:**

Your main dashboard shows:
• 📊 **Portfolio Performance** - Track your investments
• 📈 **Stock Cards** - Individual stock details
• 🔔 **Notifications** - Important alerts
• 📋 **Reports** - Detailed analysis
• ⚙️ **Settings** - Customize your experience

💡 **Quick Actions:**
• Click stock cards for detailed views
• Use search to find new investments
• Set up alerts for price changes
• Generate PDF reports`;
    }

    if (lowerQuery.includes('stock') && lowerQuery.includes('add')) {
      return `➕ **Adding Stocks to Your Portfolio:**

1. **Click the "+" button** in the dashboard
2. **Search for stocks** by name or ticker symbol
3. **Select the stock** from search results
4. **Choose quantity** and add to portfolio

💡 **Pro Tips:**
• Use ticker symbols (AAPL, TSLA, GOOGL)
• Search by company name
• Check fundamentals before adding
• Set up price alerts`;
    }

    if (lowerQuery.includes('report') || lowerQuery.includes('pdf')) {
      return `📄 **Generating Reports:**

1. **Go to Reports section** in the sidebar
2. **Select report type:**
   • Portfolio Summary
   • Performance Analysis
   • Risk Assessment
   • Tax Documents
3. **Choose date range**
4. **Click "Generate PDF"**

📊 **Report Features:**
• Professional formatting
• Charts and graphs
• Historical data
• Downloadable PDF`;
    }

    if (lowerQuery.includes('alert') || lowerQuery.includes('notification')) {
      return `🔔 **Setting Up Alerts:**

1. **Go to Settings** → **Notifications**
2. **Choose alert types:**
   • Price alerts (above/below target)
   • Volume changes
   • News mentions
   • Market events
3. **Set thresholds** and conditions
4. **Enable notifications**

📱 **Alert Methods:**
• Browser notifications
• Email alerts
• WhatsApp integration
• Mobile push notifications`;
    }

    if (lowerQuery.includes('market') && lowerQuery.includes('trend')) {
      return `📈 **Market Trends Analysis:**

🔍 **Current Market Overview:**
• Monitor major indices (S&P 500, NASDAQ, DOW)
• Track sector performance
• Analyze volatility indicators

📊 **Trend Indicators:**
• Moving averages (50-day, 200-day)
• RSI (Relative Strength Index)
• MACD (Moving Average Convergence Divergence)
• Volume analysis

💡 **Pro Tips:**
• Use technical analysis tools
• Follow market news
• Diversify across sectors
• Monitor economic indicators`;
    }

    // Default website response
    return `🌐 **About Equity Insight AI:**

This is a comprehensive stock market analysis platform featuring:

🎯 **Key Features:**
• Real-time stock price tracking
• Advanced technical analysis
• Portfolio management
• AI-powered insights
• Risk assessment tools
• PDF report generation

🔧 **Technology Stack:**
• Next.js with TypeScript
• Finnhub API integration
• Real-time WebSocket updates
• Responsive design
• Voice-enabled chatbot

💼 **Perfect for:**
• Individual investors
• Portfolio managers
• Financial analysts
• Day traders

Try asking about specific features or stock symbols!`;
  };

  const processMessage = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();

    // Check for stock ticker patterns (common stock symbols)
    const stockPattern = /\b[A-Z]{1,5}\b/g;
    const potentialTickers = message.match(stockPattern);

    if (potentialTickers) {
      // Filter for likely stock tickers (2-5 characters, all caps)
      const validTickers = potentialTickers.filter(ticker =>
        ticker.length >= 2 && ticker.length <= 5 && ticker === ticker.toUpperCase()
      );

      if (validTickers.length > 0) {
        const ticker = validTickers[0];
        return await processStockQuery(ticker);
      }
    }

    // Check for stock-related keywords
    if (lowerMessage.includes('stock') || lowerMessage.includes('price') ||
        lowerMessage.includes('quote') || lowerMessage.includes('market')) {
      // Extract potential ticker from common patterns
      const tickerPatterns = [
        /what.?s (?:the )?(?:price|stock|quote) (?:of|for) ([A-Z]{1,5})/i,
        /([A-Z]{1,5}) (?:stock|price|quote)/i,
        /(?:tell me about|show me) ([A-Z]{1,5})/i
      ];

      for (const pattern of tickerPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          return await processStockQuery(match[1]);
        }
      }
    }

    // Website information queries
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you') ||
        lowerMessage.includes('how to') || lowerMessage.includes('website') ||
        lowerMessage.includes('dashboard') || lowerMessage.includes('report') ||
        lowerMessage.includes('alert') || lowerMessage.includes('notification') ||
        lowerMessage.includes('trend') || lowerMessage.includes('market')) {
      return processWebsiteQuery(message);
    }

    // General conversation
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `👋 Hello! I'm your AI assistant for Equity Insight AI. I can help you with stock market information, website navigation, and investment insights.

Try asking me:
• "What's AAPL stock price?"
• "How do I add stocks?"
• "Show me market trends"
• Or just say "help" for more options!`;
    }

    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return `🙏 You're welcome! I'm here whenever you need help with stocks, market analysis, or navigating the platform. Feel free to ask anything!`;
    }

    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return `👋 Goodbye! Remember, I'm always here if you need help with your investments or have questions about the platform. Happy trading!`;
    }

    // Default response
    return `🤔 I'm not sure I understand that request. Here are some things I can help you with:

📈 **Stock Information:**
• "What's AAPL price?" or "Show me TSLA stock"
• "Market trends" or "Investment analysis"

💬 **Website Help:**
• "How to add stocks" or "Show me reports"
• "Dashboard overview" or "Settings help"

🎯 **General:**
• "Help" for full command list
• "About the website" for platform info

Try asking about a specific stock symbol or type "help" for more options!`;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await processMessage(inputMessage);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response,
        timestamp: new Date(),
        metadata: {
          type: response.includes('stock') || response.includes('price') ? 'stock' : 'general'
        }
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000); // Simulate typing delay

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Theme toggle function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Theme-aware styles
  const theme = {
    bg: isDarkMode ? 'bg-gray-900/95' : 'bg-white/95',
    border: isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50',
    headerBg: isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50',
    inputBg: isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/50',
    inputBorder: isDarkMode ? 'border-gray-600/50' : 'border-gray-300/50',
    inputFocus: isDarkMode ? 'focus:ring-blue-500/50 focus:border-blue-500/50' : 'focus:ring-blue-500/50 focus:border-blue-500/50',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDarkMode ? 'text-gray-500' : 'text-gray-500',
    buttonBg: isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50',
    buttonHover: isDarkMode ? 'hover:bg-gray-600/50' : 'hover:bg-gray-300/50',
    messageUser: isDarkMode ? 'bg-blue-600' : 'bg-blue-500',
    messageBot: isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50',
    messageBotText: isDarkMode ? 'text-gray-200' : 'text-gray-800',
    messageTimeUser: isDarkMode ? 'text-blue-200' : 'text-blue-100',
    messageTimeBot: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    avatarBg: isDarkMode ? 'bg-gray-600' : 'bg-gray-300',
    avatarText: isDarkMode ? 'text-gray-300' : 'text-gray-700',
    botAvatarBg: isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100/50',
    botAvatarText: isDarkMode ? 'text-blue-400' : 'text-blue-600',
    placeholder: isDarkMode ? 'placeholder-gray-400' : 'placeholder-gray-500',
    scrollbar: 'overflow-y-auto',
    shadow: isDarkMode ? 'shadow-2xl' : 'shadow-xl',
    backdrop: isDarkMode ? 'backdrop-blur-xl' : 'backdrop-blur-lg'
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`fixed bottom-4 right-4 z-50 ${className}`}
      >
        <motion.div
          animate={{ height: isMinimized ? '60px' : '600px' }}
          className={`${theme.bg} ${theme.backdrop} ${theme.border} rounded-2xl ${theme.shadow} overflow-hidden`}
          style={{
            width: 'min(400px, 90vw)',
            maxWidth: '400px',
            minWidth: '320px'
          }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 ${theme.border} border-b ${theme.headerBg}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className={`w-8 h-8 ${theme.botAvatarText}`} />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </motion.div>
              </div>
              <div>
                <h3 className={`${theme.text} font-semibold`}>AI Assistant</h3>
                <p className={`${theme.textSecondary} text-sm`}>
                  {isTyping ? 'Typing...' : 'Online'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${theme.buttonBg} ${theme.buttonHover} ${theme.textSecondary}`}
                title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.button>
              <div className="flex flex-col items-end gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleSpeech}
                  disabled={!availableVoices.length}
                  className={`p-2 rounded-lg transition-colors ${
                    isSpeaking
                      ? 'bg-green-500/20 text-green-400'
                      : ttsError
                      ? 'bg-red-500/20 text-red-400'
                      : !availableVoices.length
                      ? `${theme.buttonBg} ${theme.textMuted} cursor-not-allowed`
                      : `${theme.buttonBg} ${theme.buttonHover} ${theme.textSecondary}`
                  }`}
                  title={
                    !availableVoices.length
                      ? 'Speech synthesis not available'
                      : isSpeaking
                      ? 'Stop speaking'
                      : ttsError
                      ? `Retry speech (${ttsRetryCount}/${maxRetries})`
                      : 'Read last message'
                  }
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </motion.button>

                {ttsError && (
                  <div className={`text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded max-w-32 text-right`}>
                    {ttsError.length > 30 ? `${ttsError.substring(0, 30)}...` : ttsError}
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMinimized(!isMinimized)}
                className={`p-2 rounded-lg transition-colors ${theme.buttonBg} ${theme.buttonHover} ${theme.textSecondary}`}
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${theme.scrollbar}`} style={{ height: '440px' }}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'bot' && (
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 ${theme.botAvatarBg} rounded-full flex items-center justify-center`}>
                        <Bot className={`w-4 h-4 ${theme.botAvatarText}`} />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.type === 'user'
                        ? theme.messageUser
                        : theme.messageBot
                    } ${message.type === 'user' ? 'text-white' : theme.messageBotText}`}
                  >
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? theme.messageTimeUser : theme.messageTimeBot
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 ${theme.avatarBg} rounded-full flex items-center justify-center`}>
                        <User className={`w-4 h-4 ${theme.avatarText}`} />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${theme.botAvatarBg} rounded-full flex items-center justify-center`}>
                      <Bot className={`w-4 h-4 ${theme.botAvatarText}`} />
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl ${theme.messageBot}`}>
                    <div className="flex space-x-1">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 bg-blue-400 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-blue-400 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-blue-400 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          {!isMinimized && (
            <div className={`p-4 ${theme.border} border-t`}>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about stocks, website features, or say 'help'..."
                    className={`w-full px-4 py-3 ${theme.inputBg} ${theme.inputBorder} rounded-xl ${theme.text} ${theme.placeholder} focus:outline-none focus:ring-2 ${theme.inputFocus}`}
                  />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                      isListening
                        ? 'bg-red-500/20 text-red-400 animate-pulse'
                        : `${theme.buttonBg} ${theme.buttonHover} ${theme.textSecondary}`
                    }`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>

              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-center"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Mic className="w-4 h-4" />
                    </motion.div>
                    Listening... Speak now
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
