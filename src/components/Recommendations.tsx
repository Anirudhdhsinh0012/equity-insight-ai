'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, Shield, Zap, Youtube, RefreshCw, Activity, Users, Clock, Brain, BarChart3, PieChart, LineChart } from 'lucide-react';
import { RecommendedStock } from '@/types';
import PriceChart from './PriceChart';
import TechnicalIndicators from './TechnicalIndicators';
import PerformanceMetrics from './PerformanceMetrics';

interface YouTubeRecommendation {
  ticker: string;
  companyName: string;
  finalScore: number;
  confidence: number;
  explanation: string;
  breakdown: {
    consensusScore: number;
    sentimentScore: number;
    recencyScore: number;
    trustScore: number;
    marketMomentumScore: number;
    riskAdjustment: number;
  };
  analytics: {
    totalMentions: number;
    uniqueChannels: number;
    avgSentiment: number;
    recentMentions: number;
    priceChange7d: number;
    riskFlags: any[];
  };
  marketData: any;
}

export default function Recommendations() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [youtubeRecommendations, setYoutubeRecommendations] = useState<YouTubeRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [useYouTubeData, setUseYouTubeData] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'chart' | 'technicals' | 'performance'>('chart');
  
  // Rate limiting state
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [showRateLimitToast, setShowRateLimitToast] = useState(false);
  const REFRESH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  // Fallback static recommendations
  const staticRecommendations: RecommendedStock[] = [
    {
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      currentPrice: 432.50,
      reason: 'AI revolution leader with strong GPU demand and expanding data center business.',
      potentialGain: 25.5,
      riskLevel: 'MEDIUM',
      sector: 'Technology',
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      currentPrice: 378.90,
      reason: 'Cloud computing dominance and AI integration across product suite.',
      potentialGain: 18.2,
      riskLevel: 'LOW',
      sector: 'Technology',
    },
    {
      ticker: 'JNJ',
      name: 'Johnson & Johnson',
      currentPrice: 165.40,
      reason: 'Defensive healthcare play with stable dividends and pharmaceutical pipeline.',
      potentialGain: 12.8,
      riskLevel: 'LOW',
      sector: 'Healthcare',
    },
  ];

  // Check if refresh is allowed (rate limiting)
  const canRefresh = () => {
    if (!lastRefreshTime) return true;
    const timeSinceLastRefresh = Date.now() - lastRefreshTime.getTime();
    return timeSinceLastRefresh >= REFRESH_COOLDOWN_MS;
  };

  // Get remaining cooldown time
  const getRemainingCooldown = () => {
    if (!lastRefreshTime) return 0;
    const timeSinceLastRefresh = Date.now() - lastRefreshTime.getTime();
    const remainingMs = REFRESH_COOLDOWN_MS - timeSinceLastRefresh;
    return Math.max(0, Math.ceil(remainingMs / 1000)); // Return in seconds
  };

  // Show rate limit toast
  const showRateLimitWarning = () => {
    setShowRateLimitToast(true);
    setTimeout(() => setShowRateLimitToast(false), 4000); // Hide after 4 seconds
  };

  // Fetch YouTube recommendations with rate limiting
  const fetchYouTubeRecommendations = async (bypassRateLimit = false) => {
    // Check rate limit unless bypassed (for initial load)
    if (!bypassRateLimit && !canRefresh()) {
      showRateLimitWarning();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/recommendations/youtube?format=analytics&maxRecommendations=5');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter out invalid data (prices <= 0 or NaN)
      const validRecommendations = (data.recommendations || []).filter((rec: YouTubeRecommendation) => {
        const price = rec.marketData?.c;
        return price && !isNaN(price) && price > 0;
      });
      
      setYoutubeRecommendations(validRecommendations);
      setLastUpdate(new Date());
      setLastRefreshTime(new Date());
      
      // Show appropriate message based on data source
      if (data.metadata?.dataSource) {
        switch (data.metadata.dataSource) {
          case 'youtube-api':
            console.log('✅ Using YouTube API data');
            break;
          case 'market-fallback':
            setError('YouTube data temporarily unavailable. Showing live market recommendations instead.');
            break;
          case 'demo-fallback':
            setError('Market data services temporarily unavailable. Showing demo recommendations.');
            break;
        }
      }
      
    } catch (err) {
      console.error('Error fetching YouTube recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      setUseYouTubeData(false); // Fallback to static data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYouTubeRecommendations(true); // Bypass rate limit for initial load
  }, []);

  // Convert YouTube recommendation to RecommendedStock format
  const convertYouTubeToStock = (ytRec: YouTubeRecommendation): RecommendedStock => {
    const riskFlags = ytRec.analytics?.riskFlags || [];
    const riskLevel = riskFlags.length > 2 ? 'HIGH' : 
                      riskFlags.length > 0 ? 'MEDIUM' : 'LOW';
    
    // Extract price from marketData
    const price = ytRec.marketData?.c || 0;
    
    return {
      ticker: ytRec.ticker,
      name: ytRec.companyName,
      currentPrice: price,
      reason: ytRec.explanation,
      potentialGain: Math.max(5, Math.min(50, (ytRec.finalScore || 0) * 0.6)), // Convert score to gain estimate
      riskLevel,
      sector: ytRec.marketData?.sector || 'Unknown',
    };
  };

  const recommendations = useYouTubeData && youtubeRecommendations.length > 0 
    ? youtubeRecommendations.map(convertYouTubeToStock)
    : staticRecommendations;

  const nextRecommendation = () => {
    setCurrentIndex((prev) => (prev + 1) % recommendations.length);
  };

  const prevRecommendation = () => {
    setCurrentIndex((prev) => (prev - 1 + recommendations.length) % recommendations.length);
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return <Shield className="h-5 w-5 text-emerald-600 dark:text-green-400" />;
      case 'MEDIUM':
        return <TrendingUp className="h-5 w-5 text-amber-600 dark:text-yellow-400" />;
      case 'HIGH':
        return <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Shield className="h-5 w-5 text-slate-500 dark:text-gray-400" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'text-emerald-600 dark:text-green-400 bg-emerald-600 dark:bg-green-400';
      case 'MEDIUM':
        return 'text-amber-600 dark:text-yellow-400 bg-amber-600 dark:bg-yellow-400';
      case 'HIGH':
        return 'text-red-600 dark:text-red-400 bg-red-600 dark:bg-red-400';
      default:
        return 'text-slate-500 dark:text-gray-400 bg-slate-500 dark:bg-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Data Source Status */}
      {useYouTubeData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${error ? 'bg-amber-500' : 'bg-green-500'}`}></div>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {error ? 'Using Market Data' : 'YouTube API Active'}
              </span>
            </div>
            {lastUpdate && (
              <span className="text-xs text-blue-700 dark:text-blue-300">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          {error && (
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              YouTube data temporarily unavailable. Showing live market recommendations instead.
            </p>
          )}
        </div>
      )}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Youtube className="h-8 w-8 text-red-600 mr-3" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">
            {useYouTubeData ? 'YouTube AI Stock Recommendations' : 'AI Stock Recommendations'}
          </h2>
        </div>
        <p className="text-slate-600 dark:text-gray-400 transition-colors duration-300">
          {useYouTubeData 
            ? 'AI-powered analysis of 20+ top finance YouTube channels' 
            : 'Curated picks based on market analysis and trends'
          }
        </p>
        
        {/* Data Source Info */}
        {useYouTubeData && (
          <div className="flex items-center justify-center mt-4 space-x-6 text-sm text-slate-500 dark:text-gray-400">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>20+ Channels</span>
            </div>
            <div className="flex items-center">
              <Brain className="h-4 w-4 mr-1" />
              <span>AI Sentiment</span>
            </div>
            <div className="flex items-center">
              <Activity className="h-4 w-4 mr-1" />
              <span>Real-time Data</span>
            </div>
            {lastUpdate && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>Updated {lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Refresh Button */}
        {useYouTubeData && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchYouTubeRecommendations(false)}
            disabled={loading || !canRefresh()}
            className={`mt-4 px-4 py-2 rounded-lg flex items-center mx-auto transition-all duration-300 ${
              canRefresh() 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading 
              ? 'Updating...' 
              : canRefresh() 
                ? 'Refresh Data' 
                : `Wait ${Math.floor(getRemainingCooldown() / 60)}:${(getRemainingCooldown() % 60).toString().padStart(2, '0')}`
            }
          </motion.button>
        )}

        {/* Rate Limit Toast */}
        {showRateLimitToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-amber-500 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            <div className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-2" />
              <span>Please wait before refreshing again to avoid rate limits. Next refresh in {Math.floor(getRemainingCooldown() / 60)}:{(getRemainingCooldown() % 60).toString().padStart(2, '0')}</span>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">
              {error}. Showing fallback recommendations.
            </p>
          </div>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <div className="overflow-hidden">
          <motion.div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {recommendations.map((stock, index) => (
              <motion.div
                key={stock.ticker}
                className="w-full flex-shrink-0 px-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: index === currentIndex ? 1 : 0.7,
                  scale: index === currentIndex ? 1 : 0.95
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-slate-200/50 dark:border-white/20 max-w-2xl mx-auto shadow-lg hover:shadow-xl dark:shadow-none transition-all duration-300">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">{stock.ticker}</h3>
                      <p className="text-slate-600 dark:text-gray-400 transition-colors duration-300">{stock.name}</p>
                      <p className="text-sm text-slate-500 dark:text-gray-500 mt-1 transition-colors duration-300">{stock.sector}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-900 dark:text-white transition-colors duration-300">
                        ${stock.currentPrice}
                      </div>
                      <div className="flex items-center justify-end mt-2">
                        {getRiskIcon(stock.riskLevel)}
                        <span className={`ml-2 text-sm font-medium ${getRiskColor(stock.riskLevel).split(' ')[0]} ${getRiskColor(stock.riskLevel).split(' ')[1]} transition-colors duration-300`}>
                          {stock.riskLevel} RISK
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Potential Gain */}
                  <div className="bg-slate-50/80 dark:bg-black/30 rounded-lg p-4 mb-6 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-gray-400 transition-colors duration-300">Potential Gain</span>
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-green-400 mr-2 transition-colors duration-300" />
                        <span className="text-2xl font-bold text-emerald-600 dark:text-green-400 transition-colors duration-300">
                          +{stock.potentialGain}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 bg-slate-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(stock.potentialGain * 2, 100)}%` }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="h-full bg-emerald-500 dark:bg-green-400"
                      />
                    </div>
                  </div>

                  {/* Analysis */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 transition-colors duration-300">Why We Recommend This Stock</h4>
                    <p className="text-slate-700 dark:text-gray-300 leading-relaxed transition-colors duration-300">{stock.reason}</p>
                    
                    {/* YouTube Analytics (if available) */}
                    {useYouTubeData && youtubeRecommendations.length > 0 && youtubeRecommendations[currentIndex] && (
                      <div className="mt-4 p-4 bg-slate-50 dark:bg-black/20 rounded-lg">
                        <h5 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">YouTube Analysis</h5>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-gray-400">Mentions: </span>
                            <span className="font-medium">{youtubeRecommendations[currentIndex].analytics.totalMentions}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-gray-400">Channels: </span>
                            <span className="font-medium">{youtubeRecommendations[currentIndex].analytics.uniqueChannels}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-gray-400">Score: </span>
                            <span className="font-medium">{Math.round(youtubeRecommendations[currentIndex].finalScore)}/100</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-gray-400">Confidence: </span>
                            <span className="font-medium">{Math.round(youtubeRecommendations[currentIndex].confidence * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Market Analytics Toggle */}
                  <div className="mb-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowAnalytics(!showAnalytics)}
                      className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300 flex items-center justify-center"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {showAnalytics ? 'Hide Market Analytics' : 'Show Market Analytics'}
                    </motion.button>

                    {/* Analytics Panel */}
                    {showAnalytics && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 space-y-4"
                      >
                        {/* Analytics Tabs */}
                        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                          {[
                            { id: 'chart', label: 'Price Chart', icon: LineChart },
                            { id: 'technicals', label: 'Technicals', icon: BarChart3 },
                            { id: 'performance', label: 'Analytics', icon: PieChart },
                          ].map(({ id, label, icon: Icon }) => (
                            <button
                              key={id}
                              onClick={() => setActiveAnalyticsTab(id as any)}
                              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
                                activeAnalyticsTab === id
                                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              <Icon className="h-4 w-4 mr-1" />
                              {label}
                            </button>
                          ))}
                        </div>

                        {/* Analytics Content */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                          {activeAnalyticsTab === 'chart' && (
                            <PriceChart
                              ticker={stock.ticker}
                              height={300}
                              timeframe="1M"
                              showTechnicals={true}
                            />
                          )}
                          
                          {activeAnalyticsTab === 'technicals' && (
                            <TechnicalIndicators
                              ticker={stock.ticker}
                              height={300}
                              indicators={['RSI', 'MACD', 'Stochastic']}
                            />
                          )}
                          
                          {activeAnalyticsTab === 'performance' && (
                            <PerformanceMetrics
                              ticker={stock.ticker}
                              showDetailed={true}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Action Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:bg-gray-200 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Add {stock.ticker} to Watchlist
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevRecommendation}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full border border-slate-300/50 dark:border-white/20 hover:bg-white/30 dark:hover:bg-white/20 transition-all"
        >
          <ChevronLeft className="h-6 w-6 text-slate-700 dark:text-white" />
        </button>
        
        <button
          onClick={nextRecommendation}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full border border-slate-300/50 dark:border-white/20 hover:bg-white/30 dark:hover:bg-white/20 transition-all"
        >
          <ChevronRight className="h-6 w-6 text-slate-700 dark:text-white" />
        </button>
      </div>

      {/* Indicators */}
      <div className="flex justify-center space-x-2">
        {recommendations.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-blue-600 dark:bg-white' 
                : 'bg-slate-300 dark:bg-white/30 hover:bg-slate-400 dark:hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Additional Info */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-white/20 shadow-lg dark:shadow-none transition-all duration-300">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
          {useYouTubeData ? '🎯 YouTube AI Insights' : '💡 Investment Tips'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {useYouTubeData ? (
            <>
              <div className="text-center">
                <div className="text-2xl mb-2">�</div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-1 transition-colors duration-300">Video Analysis</h4>
                <p className="text-sm text-slate-600 dark:text-gray-400 transition-colors duration-300">AI processes 1000+ finance videos daily</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🧠</div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-1 transition-colors duration-300">Sentiment AI</h4>
                <p className="text-sm text-slate-600 dark:text-gray-400 transition-colors duration-300">FinBERT analyzes market sentiment</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-1 transition-colors duration-300">Real-time</h4>
                <p className="text-sm text-slate-600 dark:text-gray-400 transition-colors duration-300">Updated every 5 minutes</p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="text-2xl mb-2">�🎯</div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-1 transition-colors duration-300">Diversify</h4>
                <p className="text-sm text-slate-600 dark:text-gray-400 transition-colors duration-300">Spread investments across sectors</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">⏰</div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-1 transition-colors duration-300">Long-term</h4>
                <p className="text-sm text-slate-600 dark:text-gray-400 transition-colors duration-300">Hold for sustained growth</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-1 transition-colors duration-300">Research</h4>
                <p className="text-sm text-slate-600 dark:text-gray-400 transition-colors duration-300">Always do your due diligence</p>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
