'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { type Notification, StockAlert, NotificationSettings, Stock, StockData, WhatsAppMessage } from '@/types';
import { notificationDB } from '@/services/notificationDatabase';
import { whatsAppService } from '@/services/whatsappService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  stockAlerts: StockAlert[];
  settings: NotificationSettings | null;
  whatsappMessages: WhatsAppMessage[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addStockAlert: (alert: Omit<StockAlert, 'id' | 'createdAt'>) => Promise<void>;
  updateStockAlert: (alert: StockAlert) => Promise<void>;
  deleteStockAlert: (alertId: string) => Promise<void>;
  updateSettings: (settings: NotificationSettings) => Promise<void>;
  checkPriceAlerts: (stocksData: StockData[]) => Promise<void>;
  checkStockRecommendations: (stocks: Stock[], userPhoneNumber?: string) => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  sendBrowserNotification: (title: string, body: string, icon?: string) => void;
  sendWhatsAppAlert: (stock: Stock, recommendation: 'BUY' | 'HOLD' | 'SELL', phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  sendPortfolioUpdate: (portfolioSummary: string, phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  sendCustomWhatsAppMessage: (message: string, phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  getWhatsAppHistory: () => Promise<WhatsAppMessage[]>;
  validatePhoneNumber: (phoneNumber: string) => boolean;
  }

  const NotificationContext = createContext<NotificationContextType | null>(null);

  export const useNotifications = () => {
    const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  userId: string;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionNotifications] = useState(new Set<string>());

  // Initialize notification permission and load data
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      if (isInitialized) return; // Prevent duplicate initialization
      
      try {
        await notificationDB.init();
        
        if (isMounted) {
          await loadNotifications();
          await loadStockAlerts();
          await loadSettings();
          await loadWhatsAppMessages();
          checkNotificationPermission();
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  };

  const loadNotifications = async () => {
    if (!isInitialized) return; // Only load if properly initialized
    
    try {
      const data = await notificationDB.getNotifications(userId);
      setNotifications(data);
      const count = await notificationDB.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };
  
  const loadStockAlerts = async () => {
    if (!isInitialized) return; // Only load if properly initialized
    
    try {
      const data = await notificationDB.getStockAlerts(userId);
      setStockAlerts(data);
    } catch (error) {
      console.error('Failed to load stock alerts:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await notificationDB.getNotificationSettings(userId);
      if (!data) {
        // Create default settings
        const defaultSettings: NotificationSettings = {
          userId,
          enableBrowserNotifications: false,
          enablePushNotifications: false,
          enableWhatsAppNotifications: true,
          priceChangeThreshold: 5,
          buyThreshold: 10,
          sellThreshold: 15,
          soundEnabled: true,
        };
        await notificationDB.saveNotificationSettings(defaultSettings);
        setSettings(defaultSettings);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const loadWhatsAppMessages = async () => {
    if (!isInitialized) return; // Only load if properly initialized
    
    try {
      const data = await notificationDB.getWhatsAppMessages(userId);
      setWhatsappMessages(data);
    } catch (error) {
      console.error('Failed to load WhatsApp messages:', error);
    }
  };

  const addNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    try {
      // Create unique identifier for duplicate detection
      const duplicateKey = `${notificationData.title}-${notificationData.message}-${notificationData.type}-${notificationData.ticker || 'no-ticker'}`;
      
      // Check if this notification was already shown in this session
      if (sessionNotifications.has(duplicateKey)) {
        console.log('Session duplicate notification prevented:', duplicateKey);
        return;
      }
      
      // Check if similar notification was added in the last 5 seconds
      const recentNotifications = notifications.filter(n => 
        Date.now() - new Date(n.timestamp).getTime() < 5000
      );
      
      const isDuplicate = recentNotifications.some(n => {
        const existingKey = `${n.title}-${n.message}-${n.type}-${n.ticker || 'no-ticker'}`;
        return existingKey === duplicateKey;
      });
      
      if (isDuplicate) {
        console.log('Recent duplicate notification prevented:', duplicateKey);
        return;
      }

      // Add to session tracker
      sessionNotifications.add(duplicateKey);
      
      // Clean up old session notifications (keep only last 100)
      if (sessionNotifications.size > 100) {
        const entries = Array.from(sessionNotifications);
        entries.slice(0, 50).forEach(key => sessionNotifications.delete(key));
      }

      const notification: Notification = {
        ...notificationData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId,
        timestamp: new Date(),
        isRead: false,
      };

      await notificationDB.addNotification(notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Send browser notification if enabled
      if (settings?.enableBrowserNotifications && hasPermission) {
        sendBrowserNotification(notification.title, notification.message);
      }
    } catch (error) {
      console.error('Failed to add notification:', error);
    }
  }, [userId, settings, hasPermission, notifications, sessionNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationDB.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      await notificationDB.clearAllNotifications(userId);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const addStockAlert = async (alertData: Omit<StockAlert, 'id' | 'createdAt'>) => {
    try {
      const alert: StockAlert = {
        ...alertData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId,
        createdAt: new Date(),
        isActive: true,
      };

      await notificationDB.addStockAlert(alert);
      setStockAlerts(prev => [...prev, alert]);

      // Add confirmation notification
      await addNotification({
        title: 'Price Alert Created',
        message: `Alert set for ${alert.ticker} ${alert.type.toLowerCase()} $${alert.targetPrice}`,
        type: 'SUCCESS',
        ticker: alert.ticker,
        userId,
      });
    } catch (error) {
      console.error('Failed to add stock alert:', error);
    }
  };

  const updateStockAlert = async (alert: StockAlert) => {
    try {
      await notificationDB.updateStockAlert(alert);
      setStockAlerts(prev => prev.map(a => a.id === alert.id ? alert : a));
    } catch (error) {
      console.error('Failed to update stock alert:', error);
    }
  };

  const deleteStockAlert = async (alertId: string) => {
    try {
      await notificationDB.deleteStockAlert(alertId);
      setStockAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to delete stock alert:', error);
    }
  };

  const updateSettings = async (newSettings: NotificationSettings) => {
    try {
      await notificationDB.saveNotificationSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  };

  const checkPriceAlerts = useCallback(async (stocksData: StockData[]) => {
    if (!settings) return;

    for (const alert of stockAlerts.filter(a => a.isActive)) {
      const stock = stocksData.find(s => s.symbol === alert.ticker);
      if (!stock) continue;

      const shouldTrigger = 
        (alert.type === 'ABOVE' && stock.currentPrice >= alert.targetPrice) ||
        (alert.type === 'BELOW' && stock.currentPrice <= alert.targetPrice);

      if (shouldTrigger) {
        // Deactivate the alert
        const updatedAlert = { ...alert, isActive: false, triggeredAt: new Date() };
        await updateStockAlert(updatedAlert);

        // Send notification
        await addNotification({
          title: 'Price Alert Triggered!',
          message: `${stock.symbol} has reached $${stock.currentPrice} (target: $${alert.targetPrice})`,
          type: 'ALERT',
          ticker: stock.symbol,
          currentPrice: stock.currentPrice,
          targetPrice: alert.targetPrice,
          userId,
        });
      }
    }

    // Check for significant price changes
    for (const stock of stocksData) {
      const changePercent = Math.abs(stock.changePercent);
      if (changePercent >= settings.priceChangeThreshold) {
        const isPositive = stock.change > 0;
        await addNotification({
          title: `${isPositive ? 'Significant Gain' : 'Significant Drop'} Alert`,
          message: `${stock.symbol} has ${isPositive ? 'gained' : 'dropped'} ${changePercent.toFixed(2)}%`,
          type: isPositive ? 'SUCCESS' : 'WARNING',
          ticker: stock.symbol,
          currentPrice: stock.currentPrice,
          userId,
        });
      }
    }
  }, [stockAlerts, settings, addNotification, updateStockAlert, userId]);

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasPermission(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      return granted;
    }

    return false;
  };

  const sendBrowserNotification = (title: string, body: string, icon?: string) => {
    if (!hasPermission) return;

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'stock-advisor',
        requireInteraction: false,
        silent: !settings?.soundEnabled,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Failed to send browser notification:', error);
    }
  };

  // WhatsApp functionality
  const sendWhatsAppAlert = async (
    stock: Stock, 
    recommendation: 'BUY' | 'HOLD' | 'SELL', 
    phoneNumber: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!settings?.enableWhatsAppNotifications) {
        return { success: false, error: 'WhatsApp notifications are disabled' };
      }

      // Use explicit method call to avoid potential TypeScript issues
      const whatsAppInstance = whatsAppService;
      const result = await whatsAppInstance.sendStockAlert(stock, recommendation, userId, phoneNumber);
      
      if (result.success) {
        await loadWhatsAppMessages(); // Refresh messages
        
        // Add in-app notification for successful WhatsApp send
        await addNotification({
          title: 'WhatsApp Alert Sent',
          message: `${recommendation} alert for ${stock.ticker} sent to ${phoneNumber}`,
          type: 'SUCCESS',
          ticker: stock.ticker,
          userId,
          isWhatsApp: true,
          whatsAppMessageId: result.messageId,
        });
      } else {
        // Add in-app notification for failed WhatsApp send
        await addNotification({
          title: 'WhatsApp Alert Failed',
          message: `Failed to send ${recommendation} alert for ${stock.ticker}: ${result.error}`,
          type: 'ERROR',
          ticker: stock.ticker,
          userId,
        });
      }

      return result;
    } catch (error) {
      console.error('Error sending WhatsApp alert:', error);
      return { success: false, error: 'Failed to send WhatsApp alert' };
    }
  };

  const sendPortfolioUpdate = async (
    portfolioSummary: string, 
    phoneNumber: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!settings?.enableWhatsAppNotifications) {
        return { success: false, error: 'WhatsApp notifications are disabled' };
      }

      const result = await whatsAppService.sendPortfolioUpdate(
        portfolioSummary, 
        userId, 
        phoneNumber
      );
      
      if (result.success) {
        await loadWhatsAppMessages(); // Refresh messages
        
        await addNotification({
          title: 'Portfolio Update Sent',
          message: `Portfolio summary sent to ${phoneNumber}`,
          type: 'SUCCESS',
          userId,
          isWhatsApp: true,
          whatsAppMessageId: result.messageId,
        });
      }

      return result;
    } catch (error) {
      console.error('Error sending portfolio update:', error);
      return { success: false, error: 'Failed to send portfolio update' };
    }
  };

  const sendCustomWhatsAppMessage = async (
    message: string, 
    phoneNumber: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!settings?.enableWhatsAppNotifications) {
        return { success: false, error: 'WhatsApp notifications are disabled' };
      }

      const result = await whatsAppService.sendCustomAlert(
        'Custom Alert',
        message, 
        userId,
        phoneNumber
      );
      
      if (result.success) {
        await loadWhatsAppMessages(); // Refresh messages
        
        await addNotification({
          title: 'Custom Message Sent',
          message: `Message sent to ${phoneNumber}`,
          type: 'SUCCESS',
          userId,
          isWhatsApp: true,
          whatsAppMessageId: result.messageId,
        });
      }

      return result;
    } catch (error) {
      console.error('Error sending custom WhatsApp message:', error);
      return { success: false, error: 'Failed to send custom message' };
    }
  };

  const getWhatsAppHistory = async (): Promise<WhatsAppMessage[]> => {
    try {
      return await notificationDB.getWhatsAppMessages(userId);
    } catch (error) {
      console.error('Error getting WhatsApp history:', error);
      return [];
    }
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    return whatsAppService.validatePhoneNumber(phoneNumber);
  };

  // Check stock recommendations and send WhatsApp alerts
  const checkStockRecommendations = useCallback(async (stocks: Stock[], userPhoneNumber?: string) => {
    if (!settings?.enableWhatsAppNotifications || !userPhoneNumber) return;

    for (const stock of stocks) {
      const currentPrice = stock.currentPrice || stock.buyPrice;
      const changePercent = ((currentPrice - stock.buyPrice) / stock.buyPrice) * 100;

      let recommendation: 'BUY' | 'HOLD' | 'SELL' | null = null;
      let shouldSendAlert = false;

      // Determine recommendation based on performance
      if (changePercent <= -settings.buyThreshold) {
        recommendation = 'BUY';
        shouldSendAlert = true;
      } else if (changePercent >= settings.sellThreshold) {
        recommendation = 'SELL';
        shouldSendAlert = true;
      } else if (Math.abs(changePercent) <= 5 && Math.random() < 0.1) { // Random HOLD alerts
        recommendation = 'HOLD';
        shouldSendAlert = true;
      }

      if (shouldSendAlert && recommendation) {
        try {
          // Send WhatsApp alert using the new service
          const result = await sendWhatsAppAlert(stock, recommendation, userPhoneNumber);
          
          if (!result.success) {
            console.error('Failed to send WhatsApp alert:', result.error);
            
            // Add in-app notification instead
            await addNotification({
              title: `Stock Alert: ${stock.ticker}`,
              message: `${recommendation} recommendation for ${stock.ticker} - WhatsApp failed, showing in-app`,
              type: recommendation,
              ticker: stock.ticker,
              currentPrice,
              action: recommendation,
              userId
            });
          }
        } catch (error) {
          console.error('Error sending WhatsApp alert:', error);
          await addNotification({
            title: 'WhatsApp Alert Failed',
            message: `Failed to send ${recommendation} alert for ${stock.ticker}`,
            type: 'ERROR',
            userId,
          });
        }
      }
    }
  }, [settings, addNotification, userId, sendWhatsAppAlert]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    stockAlerts,
    settings,
    whatsappMessages,
    addNotification,
    markAsRead,
    clearAll,
    addStockAlert,
    updateStockAlert,
    deleteStockAlert,
    updateSettings,
    checkPriceAlerts,
    checkStockRecommendations,
    requestNotificationPermission,
    sendBrowserNotification,
    sendWhatsAppAlert,
    sendPortfolioUpdate,
    sendCustomWhatsAppMessage,
    getWhatsAppHistory,
    validatePhoneNumber,
  };

  return (
    <NotificationContext.Provider value={value}>    
      {children}
    </NotificationContext.Provider>
  );
};
