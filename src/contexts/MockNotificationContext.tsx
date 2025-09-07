'use client';

import React, { createContext, useContext, useState } from 'react';
import { type Notification, StockAlert, NotificationSettings } from '@/types';

interface MockNotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  stockAlerts: StockAlert[];
  settings: NotificationSettings | null;
  addNotification: (notification: any) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addStockAlert: (alert: any) => Promise<void>;
  updateStockAlert: (alert: StockAlert) => Promise<void>;
  deleteStockAlert: (alertId: string) => Promise<void>;
  updateSettings: (settings: NotificationSettings) => Promise<void>;
  checkPriceAlerts: (stocksData: any[]) => Promise<void>;
  checkStockRecommendations: (stocks: any[], userPhoneNumber?: string) => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  sendBrowserNotification: (title: string, body: string, icon?: string) => void;
  sendWhatsAppAlert: (stock: any, recommendation: 'BUY' | 'HOLD' | 'SELL', phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  sendPortfolioUpdate: (portfolioSummary: string, phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  sendCustomWhatsAppMessage: (message: string, phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  getWhatsAppHistory: () => Promise<any[]>;
  validatePhoneNumber: (phoneNumber: string) => boolean;
}

const MockNotificationContext = createContext<MockNotificationContextType | null>(null);

export const useMockNotifications = () => {
  const context = useContext(MockNotificationContext);
  if (!context) {
    throw new Error('useMockNotifications must be used within a MockNotificationProvider');
  }
  return context;
};

interface MockNotificationProviderProps {
  children: React.ReactNode;
  userId: string;
}

export const MockNotificationProvider: React.FC<MockNotificationProviderProps> = ({ children, userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  const mockAsyncFunction = async () => {};
  const mockAsyncFunctionWithResult = async () => ({ success: true });
  const mockAsyncFunctionWithArray = async () => [];
  const mockAsyncFunctionWithBoolean = async () => true;

  const contextValue: MockNotificationContextType = {
    notifications,
    unreadCount,
    stockAlerts,
    settings,
    addNotification: mockAsyncFunction,
    markAsRead: mockAsyncFunction,
    clearAll: mockAsyncFunction,
    addStockAlert: mockAsyncFunction,
    updateStockAlert: mockAsyncFunction,
    deleteStockAlert: mockAsyncFunction,
    updateSettings: mockAsyncFunction,
    checkPriceAlerts: mockAsyncFunction,
    checkStockRecommendations: mockAsyncFunction,
    requestNotificationPermission: mockAsyncFunctionWithBoolean,
    sendBrowserNotification: () => {},
    sendWhatsAppAlert: mockAsyncFunctionWithResult,
    sendPortfolioUpdate: mockAsyncFunctionWithResult,
    sendCustomWhatsAppMessage: mockAsyncFunctionWithResult,
    getWhatsAppHistory: mockAsyncFunctionWithArray,
    validatePhoneNumber: () => true,
  };

  return (
    <MockNotificationContext.Provider value={contextValue}>
      {children}
    </MockNotificationContext.Provider>
  );
};
