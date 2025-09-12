'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react';

interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  type: 'meeting' | 'maintenance' | 'review' | 'other';
  attendees?: string[];
  location?: string;
  priority: 'high' | 'medium' | 'low';
}

interface ScheduleModuleProps {
  className?: string;
}

const ScheduleModule: React.FC<ScheduleModuleProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showEventModal, setShowEventModal] = useState(false);

  const [events] = useState<ScheduleEvent[]>([
    {
      id: '1',
      title: 'Weekly Team Meeting',
      description: 'Review progress and plan for next week',
      date: '2025-09-15',
      time: '10:00',
      duration: '1 hour',
      type: 'meeting',
      attendees: ['John Smith', 'Sarah Johnson', 'Mike Wilson'],
      location: 'Conference Room A',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Database Maintenance',
      description: 'Scheduled database optimization and backup',
      date: '2025-09-16',
      time: '02:00',
      duration: '2 hours',
      type: 'maintenance',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Quarterly Review',
      description: 'Q3 performance review and Q4 planning',
      date: '2025-09-18',
      time: '14:00',
      duration: '3 hours',
      type: 'review',
      attendees: ['All Stakeholders'],
      location: 'Main Conference Room',
      priority: 'high'
    },
    {
      id: '4',
      title: 'Security Audit',
      description: 'Monthly security systems check',
      date: '2025-09-20',
      time: '09:00',
      duration: '4 hours',
      type: 'review',
      priority: 'high'
    }
  ]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'maintenance': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
      case 'review': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Filter events for the current month
  const currentMonthEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === currentDate.getMonth() &&
           eventDate.getFullYear() === currentDate.getFullYear();
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
              <Calendar className="w-6 h-6 text-purple-600" />
              Schedule
            </h1>
            <button 
              onClick={() => setShowEventModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Event
            </button>
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                {formatDate(currentDate)}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <div className="flex gap-2">
              {['month', 'week', 'day'].map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    view === viewType
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {viewType}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                Upcoming Events ({currentMonthEvents.length})
              </h3>
              
              {currentMonthEvents.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No events scheduled for this month</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {currentMonthEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${getPriorityColor(event.priority)}`} />
                            <h4 className="font-semibold text-slate-800 dark:text-white">
                              {event.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                              {event.type}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            {event.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {event.time} ({event.duration})
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                              </div>
                            )}
                            {event.attendees && (
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {event.attendees.length} attendees
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                            <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ScheduleModule;