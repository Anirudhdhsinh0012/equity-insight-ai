import React, { useState, useEffect } from 'react';
import { activityLogger } from '@/services/activityLoggingService';
import { Activity, Users, BarChart3, Eye } from 'lucide-react';

interface ActivityData {
  navigation: any[];
  userEngagement: any[];
  newsViews: any[];
  quizAttempts: any[];
  summary: {
    totalActivities: number;
    uniqueUsers: number;
    mostActiveSection: string;
    mostViewedContent: string;
  };
}

const AdminActivityDashboard = () => {
  const [activityData, setActivityData] = useState<ActivityData>({
    navigation: [],
    userEngagement: [],
    newsViews: [],
    quizAttempts: [],
    summary: {
      totalActivities: 0,
      uniqueUsers: 0,
      mostActiveSection: '',
      mostViewedContent: ''
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivityData();
    
    // Subscribe to real-time updates
    const unsubscribe = activityLogger.subscribe(() => {
      loadActivityData();
    });

    // Refresh every 5 seconds
    const interval = setInterval(loadActivityData, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadActivityData = () => {
    try {
      // Get all activities from the logging service
      const navigation = activityLogger.getNavigationActivities();
      const userEngagement = activityLogger.getUserEngagementActivities();
      const newsViews = activityLogger.getNewsViewActivities();
      const quizAttempts = activityLogger.getQuizAttemptActivities();

      // Calculate summary statistics
      const totalActivities = navigation.length + userEngagement.length + newsViews.length + quizAttempts.length;
      const uniqueUsers = new Set([
        ...navigation.map(a => a.userId),
        ...userEngagement.map(a => a.userId),
        ...newsViews.map(a => a.userId),
        ...quizAttempts.map(a => a.userId)
      ]).size;

      // Find most active section
      const sectionCounts = navigation.reduce((acc, activity) => {
        acc[activity.toPage] = (acc[activity.toPage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const mostActiveSection = Object.entries(sectionCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

      // Find most viewed content
      const contentCounts = userEngagement.reduce((acc, activity) => {
        acc[activity.targetElement] = (acc[activity.targetElement] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const mostViewedContent = Object.entries(contentCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

      setActivityData({
        navigation,
        userEngagement,
        newsViews,
        quizAttempts,
        summary: {
          totalActivities,
          uniqueUsers,
          mostActiveSection,
          mostViewedContent
        }
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading activity data:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading activity data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Real-Time User Activity Dashboard</h1>
          <p className="text-gray-600">Monitor live user interactions and engagement</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{activityData.summary.totalActivities}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{activityData.summary.uniqueUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Most Active Section</p>
                <p className="text-lg font-bold text-gray-900">{activityData.summary.mostActiveSection}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Most Viewed</p>
                <p className="text-lg font-bold text-gray-900">{activityData.summary.mostViewedContent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Navigation Activities */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Navigation</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From → To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activityData.navigation.slice(0, 10).map((activity, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activity.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.fromPage} → {activity.toPage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(activity.navigatedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Engagement */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">User Engagement</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activityData.userEngagement.slice(0, 10).map((activity, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activity.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {activity.engagementType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.targetElement}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(activity.engagedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Update Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            Live updates active
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityDashboard;
