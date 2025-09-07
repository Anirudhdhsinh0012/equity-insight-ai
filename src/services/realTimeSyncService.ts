'use client';

import React from 'react';
import { EventEmitter } from 'events';

// Event types for real-time updates
export interface RealTimeEvent {
  type: 'NEWS_VIEW' | 'QUIZ_ATTEMPT' | 'USER_LOGIN' | 'ACTIVITY_UPDATE';
  data: any;
  timestamp: Date;
  userId: string;
}

// Real-time subscription callback type
export type RealTimeCallback = (event: RealTimeEvent) => void;

class RealTimeSyncService extends EventEmitter {
  private subscribers: Map<string, Set<RealTimeCallback>> = new Map();
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: RealTimeEvent[] = [];

  constructor() {
    super();
    this.initializeConnection();
  }

  // Initialize the real-time connection
  private initializeConnection() {
    try {
      this.connectionStatus = 'connecting';
      
      // In a real implementation, this would be WebSocket or Server-Sent Events
      // For now, we'll simulate real-time updates with periodic polling
      this.simulateRealTimeConnection();
      
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      
      // Start heartbeat to maintain connection
      this.startHeartbeat();
      
      console.log('Real-time sync service connected');
    } catch (error) {
      console.error('Failed to initialize real-time connection:', error);
      this.handleConnectionError();
    }
  }

  // Simulate real-time connection (in production, use WebSocket)
  private simulateRealTimeConnection() {
    // Set up periodic checking for new events
    setInterval(() => {
      this.processQueuedEvents();
    }, 1000);

    // Listen for storage events (cross-tab communication)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'realtime_event') {
          try {
            const event = JSON.parse(e.newValue || '{}');
            this.handleIncomingEvent(event);
          } catch (error) {
            console.error('Error parsing storage event:', error);
          }
        }
      });
    }
  }

  // Start heartbeat to monitor connection
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Every 30 seconds
  }

  // Send heartbeat to maintain connection
  private sendHeartbeat() {
    if (this.connectionStatus === 'connected') {
      // In production, send heartbeat to server
      console.log('Heartbeat sent');
    }
  }

  // Handle connection errors
  private handleConnectionError() {
    this.connectionStatus = 'disconnected';
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.initializeConnection();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached. Connection failed.');
      this.emit('connection_failed');
    }
  }

  // Subscribe to specific event types
  subscribe(eventType: string, callback: RealTimeCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType)!.add(callback);
    
    console.log(`Subscribed to ${eventType} events`);
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(eventType, callback);
    };
  }

  // Unsubscribe from events
  unsubscribe(eventType: string, callback: RealTimeCallback) {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(eventType);
      }
    }
    
    console.log(`Unsubscribed from ${eventType} events`);
  }

  // Broadcast event to all subscribers
  broadcast(event: RealTimeEvent) {
    // Add to queue for processing
    this.messageQueue.push(event);
    
    // Broadcast to local subscribers immediately
    this.notifySubscribers(event);
    
    // Broadcast to other tabs/windows via localStorage
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('realtime_event', JSON.stringify(event));
        // Clear after a short delay to trigger storage event
        setTimeout(() => {
          window.localStorage.removeItem('realtime_event');
        }, 100);
      } catch (error) {
        console.error('Error broadcasting event:', error);
      }
    }
    
    console.log('Event broadcasted:', event.type);
  }

  // Notify local subscribers
  private notifySubscribers(event: RealTimeEvent) {
    const subscribers = this.subscribers.get(event.type);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }

    // Also notify 'ALL' subscribers
    const allSubscribers = this.subscribers.get('ALL');
    if (allSubscribers) {
      allSubscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in all-events subscriber callback:', error);
        }
      });
    }
  }

  // Handle incoming events from other sources
  private handleIncomingEvent(event: RealTimeEvent) {
    if (event && event.type && event.data) {
      this.notifySubscribers(event);
    }
  }

  // Process queued events
  private processQueuedEvents() {
    if (this.messageQueue.length > 0) {
      const events = [...this.messageQueue];
      this.messageQueue = [];
      
      // In production, send batched events to server
      console.log(`Processing ${events.length} queued events`);
    }
  }

  // Emit news view event
  emitNewsView(userId: string, newsData: any) {
    const event: RealTimeEvent = {
      type: 'NEWS_VIEW',
      data: {
        userId,
        newsId: newsData.id,
        title: newsData.title,
        category: newsData.category,
        timestamp: new Date(),
        readingTime: newsData.readingTime || 0,
        source: newsData.source
      },
      timestamp: new Date(),
      userId
    };
    
    this.broadcast(event);
  }

  // Emit quiz attempt event
  emitQuizAttempt(userId: string, quizData: any) {
    const event: RealTimeEvent = {
      type: 'QUIZ_ATTEMPT',
      data: {
        userId,
        quizId: quizData.id,
        quizTitle: quizData.title,
        difficulty: quizData.difficulty,
        score: quizData.score,
        completionTime: quizData.completionTime,
        correctAnswers: quizData.correctAnswers,
        totalQuestions: quizData.totalQuestions,
        timestamp: new Date()
      },
      timestamp: new Date(),
      userId
    };
    
    this.broadcast(event);
  }

  // Emit user login event
  emitUserLogin(userId: string, userData: any) {
    const event: RealTimeEvent = {
      type: 'USER_LOGIN',
      data: {
        userId,
        loginTime: new Date(),
        device: userData.device || 'Unknown',
        browser: userData.browser || 'Unknown',
        location: userData.location || 'Unknown'
      },
      timestamp: new Date(),
      userId
    };
    
    this.broadcast(event);
  }

  // Emit general activity update
  emitActivityUpdate(userId: string, activityData: any) {
    const event: RealTimeEvent = {
      type: 'ACTIVITY_UPDATE',
      data: {
        userId,
        activityType: activityData.type,
        details: activityData.details,
        timestamp: new Date()
      },
      timestamp: new Date(),
      userId
    };
    
    this.broadcast(event);
  }

  // Get connection status
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    return this.connectionStatus;
  }

  // Force reconnection
  reconnect() {
    if (this.connectionStatus === 'disconnected') {
      this.reconnectAttempts = 0;
      this.initializeConnection();
    }
  }

  // Get subscriber count for debugging
  getSubscriberCount(eventType?: string): number {
    if (eventType) {
      return this.subscribers.get(eventType)?.size || 0;
    }
    
    let total = 0;
    this.subscribers.forEach(subscribers => {
      total += subscribers.size;
    });
    return total;
  }

  // Clean up resources
  destroy() {
    this.connectionStatus = 'disconnected';
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.subscribers.clear();
    this.messageQueue = [];
    this.removeAllListeners();
    
    console.log('Real-time sync service destroyed');
  }
}

// Create singleton instance
export const realTimeSyncService = new RealTimeSyncService();

// React hook for using real-time events
export const useRealTimeEvents = (eventTypes: string[], callback: RealTimeCallback) => {
  const [isConnected, setIsConnected] = React.useState(
    realTimeSyncService.getConnectionStatus() === 'connected'
  );

  React.useEffect(() => {
    const unsubscribeFunctions: (() => void)[] = [];

    // Subscribe to each event type
    eventTypes.forEach(eventType => {
      const unsubscribe = realTimeSyncService.subscribe(eventType, callback);
      unsubscribeFunctions.push(unsubscribe);
    });

    // Listen for connection status changes
    const handleConnectionChange = () => {
      setIsConnected(realTimeSyncService.getConnectionStatus() === 'connected');
    };

    realTimeSyncService.on('connection_failed', handleConnectionChange);
    realTimeSyncService.on('connected', handleConnectionChange);

    // Cleanup on unmount
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      realTimeSyncService.off('connection_failed', handleConnectionChange);
      realTimeSyncService.off('connected', handleConnectionChange);
    };
  }, [eventTypes, callback]);

  return {
    isConnected,
    reconnect: () => realTimeSyncService.reconnect(),
    connectionStatus: realTimeSyncService.getConnectionStatus()
  };
};

export default realTimeSyncService;
