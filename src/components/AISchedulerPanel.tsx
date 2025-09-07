'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Settings, 
  RefreshCw, 
  Clock,
  TrendingUp,
  Database,
  Bell
} from 'lucide-react';

interface SchedulerStatus {
  isRunning: boolean;
  nextDailyRun: string;
  activeIntervals: string[];
  config: {
    dailyGenerationTime: string;
    timezone: string;
    maxStoriesPerDay: number;
    retryAttempts: number;
    retryDelay: number;
  };
}

interface AISchedulerPanelProps {
  className?: string;
}

export default function AISchedulerPanel({ className = "" }: AISchedulerPanelProps) {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperating, setIsOperating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({
    dailyGenerationTime: '07:00',
    timezone: 'America/New_York',
    maxStoriesPerDay: 10,
    retryAttempts: 3,
    retryDelay: 300
  });

  useEffect(() => {
    loadStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/ai-stories/scheduler?action=status');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
        setConfig(data.status.config);
      }
    } catch (error) {
      console.error('Error loading scheduler status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startScheduler = async () => {
    setIsOperating(true);
    try {
      const response = await fetch('/api/ai-stories/scheduler?action=start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      if (data.success) {
        await loadStatus();
      }
    } catch (error) {
      console.error('Error starting scheduler:', error);
    } finally {
      setIsOperating(false);
    }
  };

  const stopScheduler = async () => {
    setIsOperating(true);
    try {
      const response = await fetch('/api/ai-stories/scheduler?action=stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      if (data.success) {
        await loadStatus();
      }
    } catch (error) {
      console.error('Error stopping scheduler:', error);
    } finally {
      setIsOperating(false);
    }
  };

  const triggerDaily = async () => {
    setIsOperating(true);
    try {
      const response = await fetch('/api/ai-stories/scheduler?action=trigger-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Daily story generation triggered successfully!');
      }
    } catch (error) {
      console.error('Error triggering daily generation:', error);
      alert('Failed to trigger daily generation');
    } finally {
      setIsOperating(false);
    }
  };

  const updateConfig = async () => {
    setIsOperating(true);
    try {
      const response = await fetch('/api/ai-stories/scheduler?action=update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowConfig(false);
        await loadStatus();
        alert('Configuration updated successfully!');
      }
    } catch (error) {
      console.error('Error updating config:', error);
      alert('Failed to update configuration');
    } finally {
      setIsOperating(false);
    }
  };

  const formatNextRun = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className={`${className} p-6`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} p-6 space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Story Scheduler
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Automated story generation and notifications
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </button>
          
          <button
            onClick={loadStatus}
            disabled={isOperating}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isOperating ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Scheduler Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status</h3>
            <div className={`w-3 h-3 rounded-full ${
              status?.isRunning ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </div>
          <p className={`text-sm font-medium ${
            status?.isRunning ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {status?.isRunning ? 'Running' : 'Stopped'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {status?.activeIntervals.length || 0} active tasks
          </p>
        </div>

        {/* Next Daily Run */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Next Run</h3>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {status?.nextDailyRun ? formatNextRun(status.nextDailyRun) : 'Not scheduled'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Daily generation time
          </p>
        </div>

        {/* Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Config</h3>
            <Settings className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {status?.config.dailyGenerationTime || 'N/A'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Max {status?.config.maxStoriesPerDay || 0} stories/day
          </p>
        </div>

        {/* Active Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {status?.activeIntervals.length || 0} Running
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Scheduled intervals
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-4">
        {status?.isRunning ? (
          <button
            onClick={stopScheduler}
            disabled={isOperating}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Pause className="w-5 h-5" />
            <span>Stop Scheduler</span>
          </button>
        ) : (
          <button
            onClick={startScheduler}
            disabled={isOperating}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
            <span>Start Scheduler</span>
          </button>
        )}
        
        <button
          onClick={triggerDaily}
          disabled={isOperating}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Bell className="w-5 h-5" />
          <span>Trigger Daily Stories</span>
        </button>
      </div>

      {/* Active Intervals List */}
      {status?.activeIntervals && status.activeIntervals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Tasks</h3>
          <div className="space-y-2">
            {status.activeIntervals.map((interval, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {interval.replace('_', ' ')}
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Scheduler Configuration
                </h2>
                <button
                  onClick={() => setShowConfig(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Settings className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Daily Generation Time
                  </label>
                  <input
                    type="time"
                    value={config.dailyGenerationTime}
                    onChange={(e) => setConfig(prev => ({ ...prev, dailyGenerationTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Max Stories Per Day
                  </label>
                  <input
                    type="number"
                    value={config.maxStoriesPerDay}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxStoriesPerDay: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    max="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Retry Attempts
                  </label>
                  <input
                    type="number"
                    value={config.retryAttempts}
                    onChange={(e) => setConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    max="10"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowConfig(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateConfig}
                    disabled={isOperating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Save Config
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
