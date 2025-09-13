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
  Moon,
  Star,
  Wand2,
  Brain,
  Activity,
  ArrowUp
} from 'lucide-react';
import finnhubService from '@/services/finnhubService';

// Enhanced custom styles for premium UI
const scrollbarStyles = `
  .premium-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .premium-scrollbar::-webkit-scrollbar-track {
    background: linear-gradient(90deg, rgba(79, 70, 229, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
    border-radius: 4px;
  }
  .premium-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .premium-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  }
  
  .glassmorphism {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }
  
  .glassmorphism-dark {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(148, 163, 184, 0.1);
  }
  
  .message-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .bot-gradient {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
    border: 1px solid rgba(99, 102, 241, 0.2);
  }
  
  .floating-particles {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  }
  
  .particle {
    position: absolute;
    background: linear-gradient(45deg, #667eea, #764ba2);
    border-radius: 50%;
    opacity: 0.6;
    animation: float 6s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
  
  .shimmer {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .pulse-ring {
    animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
  }
  
  @keyframes pulse-ring {
    0% { transform: scale(0.33); }
    80%, 100% { opacity: 0; }
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
      content: "✨ Welcome to the future of AI assistance! I'm your premium AI companion, equipped with:\n\n� Real-time stock market intelligence\n🧠 Advanced investment insights\n🎯 Personalized recommendations\n💎 Premium market analytics\n\nExperience the next generation of financial AI. Ask me anything about stocks or say 'help' to explore my capabilities!",
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
  
  // Premium effects state
  const [showParticles, setShowParticles] = useState(true);
  const [messageCount, setMessageCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const shouldContinueSpeechRef = useRef<boolean>(true);
  const maxRetries = 3;

  // Inject enhanced styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = scrollbarStyles;
    document.head.appendChild(styleElement);
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

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
          setIsListening(false);
          
          // Handle different error types gracefully
          if (event.error === 'not-allowed') {
            console.warn('Speech recognition not allowed by browser/user');
            return;
          }
          
          if (event.error === 'network') {
            console.warn('Speech recognition network error (offline or connectivity issue)');
            return;
          }
          
          if (event.error === 'aborted') {
            console.log('Speech recognition was aborted (normal behavior)');
            return;
          }
          
          if (event.error === 'no-speech') {
            console.log('No speech detected - please try speaking again');
            return;
          }
          
          if (event.error === 'audio-capture') {
            console.warn('Audio capture failed - check microphone permissions');
            return;
          }
          
          // Only log unexpected errors
          console.warn('Speech recognition error:', event.error);
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
      shouldContinueSpeechRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Clean up speech synthesis when chatbot is closed
  useEffect(() => {
    if (!isOpen) {
      shouldContinueSpeechRef.current = false;
      if (synthRef.current && isSpeaking) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      // Also stop speech recognition when chatbot closes
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    } else {
      shouldContinueSpeechRef.current = true;
    }
  }, [isOpen, isSpeaking, isListening]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (error) {
        console.warn('Speech recognition failed to start:', error);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.warn('Speech recognition failed to stop:', error);
        setIsListening(false);
      }
    }
  };

  const speakText = async (text: string, retryCount = 0): Promise<void> => {
    // Don't speak if chatbot is not open or if we should stop
    if (!isOpen || !shouldContinueSpeechRef.current) {
      return;
    }

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
      // Cancel any ongoing speech and wait a bit for cleanup
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
        // Small delay to ensure previous utterance is fully cancelled
        await new Promise(resolve => setTimeout(resolve, 100));
      }
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
        setIsSpeaking(false);

        // Handle different error types gracefully
        if (event.error === 'interrupted') {
          // This is expected when user closes chatbot or navigates away
          console.log('Speech synthesis was interrupted (normal behavior)');
          return;
        }

        if (event.error === 'canceled') {
          // This is expected when new speech starts before previous ends
          console.log('Speech synthesis was canceled (normal behavior)');
          return;
        }

        // Only log and retry for actual errors
        console.warn('Speech synthesis error:', event.error);
        const errorMessage = `Speech synthesis failed: ${event.error}`;
        setTtsError(errorMessage);

        // Retry logic for genuine errors only
        if (retryCount < maxRetries && event.error !== 'not-allowed' && shouldContinueSpeechRef.current) {
          console.log(`Retrying speech synthesis (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            if (shouldContinueSpeechRef.current) {
              speakText(text, retryCount + 1);
            }
          }, 1000 * (retryCount + 1)); // Exponential backoff
        } else {
          if (event.error === 'not-allowed') {
            console.warn('Speech synthesis not allowed by browser/user');
          } else {
            console.error('Max retries reached for speech synthesis');
          }
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
        if (!synthRef.current?.speaking && !synthRef.current?.pending && shouldContinueSpeechRef.current) {
          console.warn('Speech synthesis did not start within timeout');
          if (retryCount < maxRetries && shouldContinueSpeechRef.current) {
            speakText(text, retryCount + 1);
          }
        }
      }, 3000);

    } catch (error) {
      console.error('Error in speakText:', error);
      setTtsError(`Speech synthesis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSpeaking(false);

      // Final fallback
      if (retryCount < maxRetries && shouldContinueSpeechRef.current) {
        setTimeout(() => {
          if (shouldContinueSpeechRef.current) {
            speakText(text, retryCount + 1);
          }
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

  // Enhanced theme configuration with premium styling
  const theme = {
    // Main container styles
    bg: isDarkMode 
      ? 'glassmorphism-dark shadow-2xl shadow-purple-500/20' 
      : 'glassmorphism shadow-2xl shadow-blue-500/20',
    
    // Text colors
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    textMuted: isDarkMode ? 'text-gray-500' : 'text-gray-400',
    
    // Header styles
    headerBg: isDarkMode 
      ? 'bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-b border-white/10' 
      : 'bg-gradient-to-r from-white/90 to-gray-50/90 border-b border-gray-200/50',
    
    // Button styles
    buttonBg: isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20',
    buttonHover: 'transition-all duration-300 hover:scale-105',
    
    // Avatar styles
    avatarBg: 'bg-gradient-to-br from-blue-500 to-purple-600',
    avatarText: 'text-white',
    botAvatarBg: 'bg-gradient-to-br from-purple-500 to-pink-500 relative overflow-hidden',
    botAvatarText: 'text-white',
    
    // Message styles
    messageUser: 'message-gradient text-white shadow-lg',
    messageBot: isDarkMode 
      ? 'bot-gradient text-gray-100 shadow-lg' 
      : 'bg-gradient-to-br from-gray-100 to-white text-gray-800 shadow-lg border border-gray-200/50',
    messageBotText: isDarkMode ? 'text-gray-100' : 'text-gray-800',
    messageTimeUser: 'text-blue-100',
    messageTimeBot: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    
    // Input styles
    inputBg: isDarkMode 
      ? 'bg-white/10 backdrop-blur-sm' 
      : 'bg-white/80 backdrop-blur-sm',
    inputBorder: isDarkMode ? 'border border-white/20' : 'border border-gray-300/50',
    inputFocus: isDarkMode ? 'ring-purple-500/50 border-purple-500/50' : 'ring-blue-500/50 border-blue-500/50',
    placeholder: isDarkMode ? 'placeholder-gray-400' : 'placeholder-gray-500',
    
    // Scrollbar
    scrollbar: 'premium-scrollbar',
    
    // Border
    border: isDarkMode ? 'border-white/10' : 'border-gray-200/50',
    
    // Shadow and backdrop
    shadow: isDarkMode ? 'shadow-2xl shadow-purple-500/20' : 'shadow-2xl shadow-blue-500/20',
    backdrop: 'backdrop-blur-xl'
  };

  // Premium particle background component
  const ParticleBackground = () => (
    <div className="floating-particles">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="particle"
          style={{
            width: Math.random() * 4 + 2 + 'px',
            height: Math.random() * 4 + 2 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`fixed bottom-4 right-4 z-[9999] ${className}`}
        style={{
          maxHeight: 'calc(100vh - 2rem)',
          maxWidth: 'calc(100vw - 2rem)'
        }}
      >
        <motion.div
          animate={{ 
            height: isMinimized ? '80px' : 'min(700px, calc(100vh - 4rem))',
            width: isMinimized ? 'min(350px, calc(100vw - 2rem))' : 'min(420px, calc(100vw - 2rem))'
          }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className={`${theme.bg} ${theme.backdrop} rounded-3xl ${theme.shadow} overflow-hidden relative flex flex-col`}
          style={{
            maxWidth: 'min(420px, calc(100vw - 2rem))',
            minWidth: 'min(320px, calc(100vw - 2rem))',
            maxHeight: 'calc(100vh - 4rem)'
          }}
        >
          {/* Particle Background */}
          {showParticles && <ParticleBackground />}
          
          {/* Header */}
          <div className={`flex items-center justify-between p-6 ${theme.headerBg} relative z-10 flex-shrink-0`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  className={`w-12 h-12 ${theme.botAvatarBg} rounded-2xl flex items-center justify-center relative overflow-hidden`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  <Bot className={`w-6 h-6 ${theme.botAvatarText} z-10`} />
                  <motion.div
                    className="absolute inset-0 shimmer"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-3 h-3 text-white" />
                </motion.div>
                
                {/* Pulse rings */}
                <motion.div
                  className="absolute inset-0 border-2 border-purple-400 rounded-2xl pulse-ring"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              
              <div>
                <motion.h3 
                  className={`${theme.text} font-bold text-lg`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  AI Assistant
                  <Wand2 className="inline w-4 h-4 ml-2 text-purple-400" />
                </motion.h3>
                <motion.p 
                  className={`${theme.textSecondary} text-sm flex items-center gap-2`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {isTyping ? (
                    <>
                      <Activity className="w-3 h-3 text-green-400 animate-pulse" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Premium AI Online
                    </>
                  )}
                </motion.p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Enhanced controls with premium styling */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`p-3 rounded-xl ${theme.buttonBg} ${theme.buttonHover} ${theme.textSecondary} relative overflow-hidden group`}
                title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isDarkMode ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleSpeech}
                disabled={!availableVoices.length}
                className={`p-3 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                  isSpeaking
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 shadow-lg shadow-green-500/25'
                    : ttsError
                    ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 shadow-lg shadow-red-500/25'
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
                <motion.div
                  animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </motion.div>
                {isSpeaking && (
                  <motion.div
                    className="absolute inset-0 border-2 border-green-400/50 rounded-xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMinimized(!isMinimized)}
                className={`p-3 rounded-xl ${theme.buttonBg} ${theme.buttonHover} ${theme.textSecondary} relative overflow-hidden group`}
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                <motion.div
                  animate={{ rotate: isMinimized ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-3 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 relative overflow-hidden group shadow-lg shadow-red-500/25"
                title="Close chat"
              >
                <X className="w-5 h-5" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-300/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              </motion.button>
            </div>
          </div>

          {/* Enhanced Messages Section */}
          {!isMinimized && (
            <div className={`flex-1 overflow-y-auto p-6 space-y-6 premium-scrollbar relative z-10`} 
                 style={{ 
                   maxHeight: 'calc(100% - 180px)', // Account for header and input sections
                   minHeight: '300px' 
                 }}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring", 
                    damping: 20, 
                    stiffness: 300 
                  }}
                  className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'bot' && (
                    <motion.div 
                      className="flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", damping: 15 }}
                    >
                      <div className={`w-10 h-10 ${theme.botAvatarBg} rounded-2xl flex items-center justify-center relative overflow-hidden`}>
                        <Bot className={`w-5 h-5 ${theme.botAvatarText} z-10`} />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-400/30"
                          animate={{ opacity: [0, 0.5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    className={`max-w-[85%] p-4 rounded-3xl relative overflow-hidden group ${
                      message.type === 'user'
                        ? theme.messageUser
                        : theme.messageBot
                    } ${message.type === 'user' ? 'text-white' : theme.messageBotText}`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", damping: 20 }}
                  >
                    {/* Message shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    
                    <div className="whitespace-pre-wrap text-sm leading-relaxed relative z-10">
                      {message.content}
                    </div>
                    
                    <div className={`text-xs mt-3 flex items-center gap-2 ${
                      message.type === 'user' ? theme.messageTimeUser : theme.messageTimeBot
                    }`}>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-current rounded-full opacity-60" />
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                      {message.type === 'bot' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-center gap-1"
                        >
                          <Brain className="w-3 h-3 opacity-60" />
                          <span className="text-xs opacity-60">AI Generated</span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {message.type === 'user' && (
                    <motion.div 
                      className="flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", damping: 15 }}
                    >
                      <div className={`w-10 h-10 ${theme.avatarBg} rounded-2xl flex items-center justify-center`}>
                        <User className={`w-5 h-5 ${theme.avatarText}`} />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {/* Enhanced typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex gap-4 justify-start"
                >
                  <motion.div 
                    className="flex-shrink-0"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className={`w-10 h-10 ${theme.botAvatarBg} rounded-2xl flex items-center justify-center relative overflow-hidden`}>
                      <Bot className={`w-5 h-5 ${theme.botAvatarText}`} />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30"
                        animate={{ opacity: [0, 0.8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  </motion.div>
                  
                  <div className={`p-4 rounded-3xl ${theme.messageBot} relative overflow-hidden`}>
                    <div className="flex items-center space-x-2">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                        className="w-3 h-3 bg-gradient-to-r from-pink-400 to-red-400 rounded-full"
                      />
                    </div>
                    <div className="text-xs mt-2 opacity-60 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      AI is analyzing...
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Enhanced Input Section */}
          {!isMinimized && (
            <div className={`p-6 ${theme.border} border-t backdrop-blur-sm relative z-10 flex-shrink-0`}>
              <div className="flex gap-4 items-end">
                <div className="flex-1 relative">
                  <motion.div
                    className="relative"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", damping: 20 }}
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="✨ Ask me anything about stocks, market insights, or say 'help' for magic..."
                      className={`w-full px-6 py-4 pr-16 ${theme.inputBg} ${theme.inputBorder} rounded-2xl ${theme.text} ${theme.placeholder} focus:outline-none focus:ring-2 ${theme.inputFocus} transition-all duration-300 text-sm`}
                    />

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={isListening ? stopListening : startListening}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-xl transition-all duration-300 ${
                        isListening
                          ? 'bg-gradient-to-r from-red-500/30 to-pink-500/30 text-red-400 shadow-lg shadow-red-500/25'
                          : `${theme.buttonBg} ${theme.buttonHover} ${theme.textSecondary}`
                      }`}
                      title={isListening ? 'Stop listening' : 'Start voice input'}
                    >
                      <motion.div
                        animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </motion.div>
                      {isListening && (
                        <motion.div
                          className="absolute inset-0 border-2 border-red-400/50 rounded-xl"
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  </motion.div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className={`px-6 py-4 rounded-2xl transition-all duration-300 flex items-center gap-3 relative overflow-hidden group ${
                    !inputMessage.trim()
                      ? 'bg-gray-400/20 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25'
                  }`}
                >
                  <motion.div
                    animate={inputMessage.trim() ? { rotate: [0, 360] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Send className="w-5 h-5" />
                  </motion.div>
                  <span className="font-medium">Send</span>
                  {inputMessage.trim() && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  )}
                </motion.button>
              </div>

              {/* Enhanced listening indicator */}
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-4 text-center"
                >
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400 rounded-2xl text-sm backdrop-blur-sm">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="relative"
                    >
                      <Mic className="w-5 h-5" />
                      <motion.div
                        className="absolute inset-0 border-2 border-red-400/50 rounded-full"
                        animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </motion.div>
                    <span className="font-medium">I'm listening... Speak your mind!</span>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="flex gap-1"
                    >
                      <div className="w-1 h-4 bg-red-400 rounded-full" />
                      <div className="w-1 h-4 bg-red-400 rounded-full" />
                      <div className="w-1 h-4 bg-red-400 rounded-full" />
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Quick action buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 flex flex-wrap gap-2 justify-center"
              >
                {[
                  { icon: TrendingUp, text: "Market Overview", action: () => setInputMessage("What's the market overview today?") },
                  { icon: DollarSign, text: "AAPL Stock", action: () => setInputMessage("Show me AAPL stock price") },
                  { icon: HelpCircle, text: "Help", action: () => setInputMessage("help") }
                ].map((btn, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={btn.action}
                    className={`px-3 py-2 ${theme.buttonBg} ${theme.buttonHover} ${theme.textSecondary} rounded-xl text-xs flex items-center gap-2 transition-all duration-300`}
                  >
                    <btn.icon className="w-3 h-3" />
                    {btn.text}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
