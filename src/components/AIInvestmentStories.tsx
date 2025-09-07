'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Clock, 
  BarChart3, 
  Newspaper,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  Bookmark,
  BookmarkCheck,
  Settings,
  Eye,
  Share2
} from 'lucide-react';

// Types for AI Investment Stories
interface StoryData {
  id: string;
  title: string;
  content: string;
  ticker: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  emoji: string;
  readTime: string;
  timestamp: Date;
  priceData: {
    currentPrice: number;
    change: number;
    changePercent: number;
  };
  tags: string[];
  aiConfidence: number;
}

interface AIInvestmentStoriesProps {
  userId?: string;
  className?: string;
}

const AIInvestmentStories = React.memo<AIInvestmentStoriesProps>(({ userId, className = "" }) => {
  const [stories, setStories] = useState<StoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<StoryData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [storyTone, setStoryTone] = useState<'professional' | 'casual' | 'funny'>('professional');
  const [bookmarkedStories, setBookmarkedStories] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    preferredTickers: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
    autoGenerate: true,
    showBookmarkedOnly: false,
    notifyDaily: true
  });

  // Cache for API responses to reduce load
  const cacheRef = useRef(new Map<string, { data: StoryData[]; timestamp: number }>());
  const CACHE_DURATION = 300000; // 5 minutes cache for stories

  // Sample stories data (will be replaced with API calls)
  const sampleStories: StoryData[] = [
    {
      id: '1',
      title: 'Apple Surges on AI Innovation Rumors',
      content: 'Apple Inc. (AAPL) witnessed a remarkable surge today as whispers of groundbreaking AI integration in upcoming products sent investors into a buying frenzy. The tech giant\'s stock climbed 3.2% amid speculation about revolutionary AI features in the next iPhone series. Market analysts suggest this could be the catalyst Apple needs to reclaim its position as the most innovative tech company.',
      ticker: 'AAPL',
      sentiment: 'bullish',
      emoji: '🚀',
      readTime: '2 min',
      timestamp: new Date(),
      priceData: {
        currentPrice: 185.43,
        change: 5.67,
        changePercent: 3.16
      },
      tags: ['AI', 'Innovation', 'iPhone', 'Technology'],
      aiConfidence: 92
    },
    {
      id: '2',
      title: 'Tesla Faces Headwinds Despite Strong Deliveries',
      content: 'Tesla (TSLA) reported impressive delivery numbers this quarter, yet the stock tumbled 2.1% as investors remained concerned about increasing competition in the EV space. While the company delivered 484,507 vehicles, beating estimates, growing competition from traditional automakers and new EV startups continues to pressure margins and market share.',
      ticker: 'TSLA',
      sentiment: 'bearish',
      emoji: '⚡',
      readTime: '3 min',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      priceData: {
        currentPrice: 248.92,
        change: -5.33,
        changePercent: -2.10
      },
      tags: ['EV', 'Deliveries', 'Competition', 'Automotive'],
      aiConfidence: 87
    },
    {
      id: '3',
      title: 'Microsoft Cloud Services Drive Steady Growth',
      content: 'Microsoft Corporation (MSFT) continues its steady ascent as cloud services revenue showed robust growth in the latest earnings report. Azure\'s 27% year-over-year growth, combined with strong Office 365 adoption, has positioned the company as a dominant force in enterprise technology. Investors are particularly bullish on the company\'s AI integration across its product suite.',
      ticker: 'MSFT',
      sentiment: 'bullish',
      emoji: '☁️',
      readTime: '2 min',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      priceData: {
        currentPrice: 378.85,
        change: 8.22,
        changePercent: 2.22
      },
      tags: ['Cloud', 'Azure', 'Enterprise', 'AI'],
      aiConfidence: 94
    }
  ];

  useEffect(() => {
    loadUserPreferences();
  }, [userId]);

  // Optimized load stories with caching
  const loadStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create cache key based on current settings
      const cacheKey = `${userId || 'default'}-${storyTone}-${userPreferences.showBookmarkedOnly}`;
      const now = Date.now();
      
      // Check cache first
      const cached = cacheRef.current.get(cacheKey);
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setStories(cached.data);
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams({
        userId: userId || '',
        tone: storyTone,
        limit: '6'
      });
      
      if (userPreferences.showBookmarkedOnly) {
        params.append('bookmarked', 'true');
      }
      
      if (userPreferences.preferredTickers.length > 0) {
        params.append('tickers', userPreferences.preferredTickers.join(','));
      }
      
      const response = await fetch(`/api/ai-stories?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load stories');
      }
      
      if (data.success && data.stories) {
        const storiesWithDates = data.stories.map((story: any) => ({
          ...story,
          timestamp: new Date(story.timestamp)
        }));
        
        setStories(storiesWithDates);
        // Cache the result
        cacheRef.current.set(cacheKey, { data: storiesWithDates, timestamp: now });
        
        // Load bookmark status
        const bookmarked = new Set<string>();
        storiesWithDates.forEach((story: StoryData) => {
          // In a real app, this would come from the database
          if (Math.random() > 0.7) { // Mock some bookmarked stories
            bookmarked.add(story.id);
          }
        });
        setBookmarkedStories(bookmarked);
      } else {
        // Fallback to sample data if API fails
        setStories(sampleStories);
      }
    } catch (err) {
      setError('Failed to load AI investment stories');
      console.error('Error loading stories:', err);
      // Fallback to sample data
      setStories(sampleStories);
    } finally {
      setIsLoading(false);
    }
  }, [userId, storyTone, userPreferences.showBookmarkedOnly, userPreferences.preferredTickers]);

  const refreshStories = useCallback(async () => {
    setRefreshing(true);
    // Clear cache to force fresh data
    cacheRef.current.clear();
    await loadStories();
    setRefreshing(false);
  }, [loadStories]);

  // Optimized useEffect to load stories with proper cleanup
  useEffect(() => {
    loadStories();
    
    return () => {
      // Clear cache when component unmounts or dependencies change
      cacheRef.current.clear();
    };
  }, [loadStories]);

  const toggleBookmark = async (storyId: string) => {
    try {
      const response = await fetch('/api/ai-stories/database?action=toggle-bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId })
      });
      
      const data = await response.json();
      if (data.success) {
        setBookmarkedStories(prev => {
          const newSet = new Set(prev);
          if (data.isBookmarked) {
            newSet.add(storyId);
          } else {
            newSet.delete(storyId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const trackStoryView = async (storyId: string) => {
    try {
      await fetch('/api/ai-stories/database?action=update-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          engagement: { views: 1 }
        })
      });
    } catch (error) {
      console.error('Error tracking story view:', error);
    }
  };

  const shareStory = async (story: StoryData) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: story.title,
          text: `${story.content.substring(0, 100)}...`,
          url: window.location.href
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `${story.title}\n\n${story.content}\n\nGenerated by AI Stock Advisor`
        );
        alert('Story copied to clipboard!');
      }
      
      // Track share event
      await fetch('/api/ai-stories/database?action=update-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: story.id,
          engagement: { shared: true }
        })
      });
    } catch (error) {
      console.error('Error sharing story:', error);
    }
  };

  const saveUserPreferences = async () => {
    try {
      if (!userId) return;
      
      const preferences = {
        userId,
        storyTone,
        preferredTickers: userPreferences.preferredTickers,
        notificationSettings: {
          dailyStories: userPreferences.notifyDaily,
          breakingNews: true,
          portfolioAlerts: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await fetch('/api/ai-stories/database?action=save-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });
      
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const loadUserPreferences = async () => {
    try {
      if (!userId) return;
      
      const response = await fetch(`/api/ai-stories/database?action=preferences&userId=${userId}`);
      const data = await response.json();
      
      if (data.success && data.preferences) {
        setStoryTone(data.preferences.storyTone || 'professional');
        setUserPreferences(prev => ({
          ...prev,
          preferredTickers: data.preferences.preferredTickers || prev.preferredTickers,
          notifyDaily: data.preferences.notificationSettings?.dailyStories ?? prev.notifyDaily
        }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const getSentimentIcon = (sentiment: StoryData['sentiment']) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: StoryData['sentiment']) => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'bearish':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours >= 24) {
      return `${Math.floor(diffHours / 24)}d ago`;
    } else if (diffHours >= 1) {
      return `${diffHours}h ago`;
    } else if (diffMinutes >= 1) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  if (isLoading) {
    return (
      <div className={`${className} p-6`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} p-6`}>
        <div className="text-center py-12">
          <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Stories
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadStories}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} p-6 space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Investment Stories
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Personalized market insights powered by artificial intelligence
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Show Bookmarked Filter */}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={userPreferences.showBookmarkedOnly}
              onChange={(e) => setUserPreferences(prev => ({
                ...prev,
                showBookmarkedOnly: e.target.checked
              }))}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span>Bookmarked Only</span>
          </label>

          {/* Story Tone Selector */}
          <select
            value={storyTone}
            onChange={(e) => setStoryTone(e.target.value as typeof storyTone)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="funny">Funny</option>
          </select>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={refreshStories}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {stories.map((story, index) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 ${getSentimentColor(story.sentiment)}`}
            onClick={() => {
              setSelectedStory(story);
              trackStoryView(story.id);
            }}
          >
            {/* Story Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{story.emoji}</span>
                <div className="flex items-center space-x-2">
                  {getSentimentIcon(story.sentiment)}
                  <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {story.ticker}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    story.priceData.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {story.priceData.change >= 0 ? '+' : ''}
                    {story.priceData.changePercent.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ${story.priceData.currentPrice.toFixed(2)}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(story.id);
                    }}
                    className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    title={bookmarkedStories.has(story.id) ? 'Remove bookmark' : 'Bookmark story'}
                  >
                    {bookmarkedStories.has(story.id) ? 
                      <BookmarkCheck className="w-4 h-4 text-yellow-500" /> : 
                      <Bookmark className="w-4 h-4" />
                    }
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareStory(story);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Share story"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Story Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
              {story.title}
            </h3>

            {/* Story Preview */}
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
              {story.content}
            </p>

            {/* Story Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{story.readTime}</span>
                </div>
                <span>{formatTimeAgo(story.timestamp)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Sparkles className="w-4 h-4" />
                <span>{story.aiConfidence}%</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-3">
              {story.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Story Preferences
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Preferred Tickers */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Stocks (comma separated)
                  </label>
                  <input
                    type="text"
                    value={userPreferences.preferredTickers.join(', ')}
                    onChange={(e) => setUserPreferences(prev => ({
                      ...prev,
                      preferredTickers: e.target.value.split(',').map(t => t.trim().toUpperCase()).filter(t => t)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="AAPL, GOOGL, MSFT, TSLA"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Stories will prioritize these stocks in your daily feed
                  </p>
                </div>

                {/* Auto Generate */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Auto-generate daily stories
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Automatically create new stories each day
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={userPreferences.autoGenerate}
                    onChange={(e) => setUserPreferences(prev => ({
                      ...prev,
                      autoGenerate: e.target.checked
                    }))}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </div>

                {/* Daily Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Daily notifications
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Get notified when new stories are available
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={userPreferences.notifyDaily}
                    onChange={(e) => setUserPreferences(prev => ({
                      ...prev,
                      notifyDaily: e.target.checked
                    }))}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </div>

                {/* Save Button */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveUserPreferences}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Detailed Story Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{selectedStory.emoji}</span>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      {getSentimentIcon(selectedStory.sentiment)}
                      <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                        {selectedStory.ticker}
                      </span>
                      <span className={`text-sm font-semibold ${
                        selectedStory.priceData.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedStory.priceData.change >= 0 ? '+' : ''}
                        {selectedStory.priceData.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ${selectedStory.priceData.currentPrice.toFixed(2)} • {selectedStory.readTime} • {formatTimeAgo(selectedStory.timestamp)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedStory.title}
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedStory.content}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedStory.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* AI Confidence */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>AI Confidence Score</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${selectedStory.aiConfidence}%` }}
                        ></div>
                      </div>
                      <span>{selectedStory.aiConfidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
});

AIInvestmentStories.displayName = 'AIInvestmentStories';

export default AIInvestmentStories;
