'use client';

import { type Stock, type WhatsAppMessage, type StockAlert } from '@/types';
import { notificationDB } from './notificationDatabase';

/**
 * WhatsApp Service - Mock Implementation
 * This service simulates WhatsApp notifications without external API dependencies
 */
class WhatsAppService {
  constructor() {
    // No external API configuration needed for mock implementation
  }

  /**
   * Send WhatsApp notification (Mock Implementation)
   * Simulates sending a WhatsApp message and stores it in the database
   */
  async sendWhatsAppMessage(
    to: string,
    alertType: string,
    mainContent: string,
    price: string,
    change: string,
    additionalInfo: string,
    userId: string,
    messageType: string = 'ALERT',
    recommendation: 'BUY' | 'HOLD' | 'SELL' = 'HOLD'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Simulate message sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate a mock message ID
      const messageId = `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create WhatsApp message record for database
      const whatsAppMessage: WhatsAppMessage = {
        id: messageId,
        userId,
        phoneNumber: to,
        message: `${alertType}: ${mainContent}`,
        ticker: messageType,
        recommendation,
        sentAt: new Date(),
        twilioMessageId: messageId,
        status: 'SENT',
      };

      // Store message in database
      await notificationDB.addWhatsAppMessage(whatsAppMessage);

      console.log('📱 WhatsApp notification simulated:', {
        to,
        alertType,
        messageId,
        status: 'SENT'
      });

      return { success: true, messageId };
    } catch (error) {
      console.error('Error simulating WhatsApp message:', error);
      return { success: false, error: 'Failed to process WhatsApp notification' };
    }
  }

  /**
   * Send stock alert using universal template
   */
  async sendStockAlert(
    stock: Stock,
    recommendation: 'BUY' | 'HOLD' | 'SELL',
    userId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const alertType = `${stock.ticker} Stock Alert`;
      const mainContent = `${recommendation} recommendation detected!\n\nStock: ${stock.ticker}\nAnalysis suggests ${recommendation.toLowerCase()} action.`;
      const price = (stock.currentPrice || stock.buyPrice).toString();
      const changePercent = stock.currentPrice 
        ? (((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100).toFixed(2)
        : '0.00';
      const change = `${changePercent > '0' ? '+' : ''}${changePercent}%`;
      const additionalInfo = recommendation === 'BUY' 
        ? '🎯 Consider adding to position'
        : recommendation === 'SELL'
        ? '💰 Consider taking profits'
        : '📊 Monitor closely';

      return await this.sendWhatsAppMessage(
        phoneNumber,
        alertType,
        mainContent,
        price,
        change,
        additionalInfo,
        userId,
        'STOCK_ALERT',
        recommendation
      );
    } catch (error) {
      console.error('Error sending stock alert:', error);
      return { success: false, error: 'Failed to send stock alert' };
    }
  }

  /**
   * Send portfolio update using universal template
   */
  async sendPortfolioUpdate(
    portfolioSummary: string,
    userId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const alertType = "Portfolio Update";
      const mainContent = `Daily portfolio summary:\n\n${portfolioSummary}`;
      const price = "Portfolio"; // Will be filled with actual portfolio value
      const change = "Updated"; // Will be filled with P&L
      const additionalInfo = "📊 Check your dashboard for detailed analysis";

      return await this.sendWhatsAppMessage(
        phoneNumber,
        alertType,
        mainContent,
        price,
        change,
        additionalInfo,
        userId,
        'PORTFOLIO',
        'HOLD'
      );
    } catch (error) {
      console.error('Error sending portfolio update:', error);
      return { success: false, error: 'Failed to send portfolio update' };
    }
  }

  /**
   * Send price alert using universal template
   */
  async sendPriceAlert(
    alert: StockAlert,
    currentPrice: number,
    userId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const alertType = `${alert.ticker} Price Alert`;
      const mainContent = `Price alert triggered!\n\n${alert.ticker} has reached your target price.\nAlert type: ${alert.type}`;
      const price = currentPrice.toString();
      const change = `Target: $${alert.targetPrice} (${alert.type === 'ABOVE' ? 'Hit!' : 'Reached!'})`;
      const additionalInfo = `🎯 Consider your trading strategy for ${alert.ticker}`;

      return await this.sendWhatsAppMessage(
        phoneNumber,
        alertType,
        mainContent,
        price,
        change,
        additionalInfo,
        userId,
        'PRICE_ALERT',
        'HOLD'
      );
    } catch (error) {
      console.error('Error sending price alert:', error);
      return { success: false, error: 'Failed to send price alert' };
    }
  }

  /**
   * Send custom alert using universal template
   */
  async sendCustomAlert(
    title: string,
    message: string,
    userId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const alertType = title;
      const mainContent = message;
      const price = "N/A";
      const change = "Custom Alert";
      const additionalInfo = "📱 This is a custom notification from Stock Advisor Pro";

      return await this.sendWhatsAppMessage(
        phoneNumber,
        alertType,
        mainContent,
        price,
        change,
        additionalInfo,
        userId,
        'CUSTOM',
        'HOLD'
      );
    } catch (error) {
      console.error('Error sending custom alert:', error);
      return { success: false, error: 'Failed to send custom alert' };
    }
  }

  /**
   * Send market update alert using universal template
   */
  async sendMarketUpdateAlert(
    marketData: string,
    userId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const alertType = "Market Update";
      const mainContent = `Latest market information:\n\n${marketData}`;
      const price = "Market";
      const change = "Live Update";
      const additionalInfo = "📊 Stay informed with real-time market data";

      return await this.sendWhatsAppMessage(
        phoneNumber,
        alertType,
        mainContent,
        price,
        change,
        additionalInfo,
        userId,
        'MARKET_UPDATE',
        'HOLD'
      );
    } catch (error) {
      console.error('Error sending market update:', error);
      return { success: false, error: 'Failed to send market update' };
    }
  }

  /**
   * Test WhatsApp connection with universal template
   */
  async testConnection(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const testPhoneNumber = '+919173611252'; // Your phone number
      const alertType = "Connection Test";
      const mainContent = "WhatsApp integration is working perfectly!\n\nYour Stock Advisor Pro notifications are now active.";
      const price = "Connected";
      const change = "✅ Success";
      const additionalInfo = "🚀 You'll now receive real-time stock alerts here!";

      return await this.sendWhatsAppMessage(
        testPhoneNumber,
        alertType,
        mainContent,
        price,
        change,
        additionalInfo,
        userId,
        'TEST',
        'HOLD'
      );
    } catch (error) {
      console.error('Error testing connection:', error);
      return { success: false, error: 'Connection test failed' };
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check if it's a valid international format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Format phone number for WhatsApp
   */
  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
  }

  /**
   * Get message status (Mock Implementation)
   */
  async getMessageStatus(messageSid: string): Promise<string> {
    try {
      // Simulate checking message status
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock status - in real implementation this would be 'delivered' or 'failed'
      return 'delivered';
    } catch (error) {
      console.error('Error getting message status:', error);
      return 'error';
    }
  }

  /**
   * Update message status in database
   */
  async updateMessageStatus(messageSid: string, status: string): Promise<void> {
    try {
      await notificationDB.updateWhatsAppMessageStatus(messageSid, status);
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }
}

export const whatsAppService = new WhatsAppService();
export default whatsAppService;
