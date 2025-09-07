import { Notification, StockAlert, NotificationSettings, WhatsAppMessage } from '@/types';

class NotificationDatabase {
  private dbName = 'StockAdvisorNotifications';
  private version = 3; // Increased version to add positions and position alerts stores
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Notifications store
        if (!db.objectStoreNames.contains('notifications')) {
          const notificationStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notificationStore.createIndex('userId', 'userId', { unique: false });
          notificationStore.createIndex('timestamp', 'timestamp', { unique: false });
          notificationStore.createIndex('isRead', 'isRead', { unique: false });
        }

        // Stock alerts store
        if (!db.objectStoreNames.contains('stockAlerts')) {
          const alertStore = db.createObjectStore('stockAlerts', { keyPath: 'id' });
          alertStore.createIndex('userId', 'userId', { unique: false });
          alertStore.createIndex('ticker', 'ticker', { unique: false });
          alertStore.createIndex('isActive', 'isActive', { unique: false });
        }

        // Notification settings store
        if (!db.objectStoreNames.contains('notificationSettings')) {
          db.createObjectStore('notificationSettings', { keyPath: 'userId' });
        }

        // WhatsApp messages store
        if (!db.objectStoreNames.contains('whatsappMessages')) {
          const whatsappStore = db.createObjectStore('whatsappMessages', { keyPath: 'id' });
          whatsappStore.createIndex('userId', 'userId', { unique: false });
          whatsappStore.createIndex('ticker', 'ticker', { unique: false });
          whatsappStore.createIndex('sentAt', 'sentAt', { unique: false });
          whatsappStore.createIndex('status', 'status', { unique: false });
        }

        // Stock positions store
        if (!db.objectStoreNames.contains('stockPositions')) {
          const positionStore = db.createObjectStore('stockPositions', { keyPath: 'id' });
          positionStore.createIndex('userId', 'userId', { unique: false });
          positionStore.createIndex('ticker', 'ticker', { unique: false });
          positionStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Position alerts store
        if (!db.objectStoreNames.contains('positionAlerts')) {
          const positionAlertStore = db.createObjectStore('positionAlerts', { keyPath: 'id' });
          positionAlertStore.createIndex('userId', 'userId', { unique: false });
          positionAlertStore.createIndex('positionId', 'positionId', { unique: false });
          positionAlertStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // Notification methods
  async addNotification(notification: Notification): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const request = store.add(notification);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notifications'], 'readonly');
      const store = transaction.objectStore('notifications');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const notifications = request.result
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
        resolve(notifications);
      };
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const getRequest = store.get(notificationId);

      getRequest.onsuccess = () => {
        const notification = getRequest.result;
        if (notification) {
          notification.isRead = true;
          const putRequest = store.put(notification);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notifications'], 'readonly');
      const store = transaction.objectStore('notifications');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const unreadCount = request.result.filter(n => !n.isRead).length;
        resolve(unreadCount);
      };
    });
  }

  async clearAllNotifications(userId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const index = store.index('userId');
      const request = index.getAllKeys(userId);

      request.onsuccess = () => {
        const keys = request.result;
        const deletePromises = keys.map(key => {
          return new Promise<void>((deleteResolve, deleteReject) => {
            const deleteRequest = store.delete(key);
            deleteRequest.onsuccess = () => deleteResolve();
            deleteRequest.onerror = () => deleteReject(deleteRequest.error);
          });
        });

        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Stock alert methods
  async addStockAlert(alert: StockAlert): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stockAlerts'], 'readwrite');
      const store = transaction.objectStore('stockAlerts');
      const request = store.add(alert);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getStockAlerts(userId: string): Promise<StockAlert[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stockAlerts'], 'readonly');
      const store = transaction.objectStore('stockAlerts');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async updateStockAlert(alert: StockAlert): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stockAlerts'], 'readwrite');
      const store = transaction.objectStore('stockAlerts');
      const request = store.put(alert);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteStockAlert(alertId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stockAlerts'], 'readwrite');
      const store = transaction.objectStore('stockAlerts');
      const request = store.delete(alertId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Notification settings methods
  async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notificationSettings'], 'readonly');
      const store = transaction.objectStore('notificationSettings');
      const request = store.get(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notificationSettings'], 'readwrite');
      const store = transaction.objectStore('notificationSettings');
      const request = store.put(settings);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // WhatsApp message methods
  async addWhatsAppMessage(message: WhatsAppMessage): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['whatsappMessages'], 'readwrite');
      const store = transaction.objectStore('whatsappMessages');
      const request = store.add(message);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getWhatsAppMessages(userId: string): Promise<WhatsAppMessage[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['whatsappMessages'], 'readonly');
      const store = transaction.objectStore('whatsappMessages');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const messages = request.result || [];
        // Sort by sentAt descending
        messages.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        resolve(messages);
      };
    });
  }

  async updateWhatsAppMessageStatus(messageId: string, status: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['whatsappMessages'], 'readwrite');
      const store = transaction.objectStore('whatsappMessages');
      const getRequest = store.get(messageId);

      getRequest.onsuccess = () => {
        const message = getRequest.result;
        if (message) {
          message.status = status;
          const putRequest = store.put(message);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Position management methods
  async addStockPosition(position: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stockPositions'], 'readwrite');
      const store = transaction.objectStore('stockPositions');
      const request = store.add(position);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getUserPositions(userId: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stockPositions'], 'readonly');
      const store = transaction.objectStore('stockPositions');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      };
    });
  }

  async addPositionAlert(alert: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['positionAlerts'], 'readwrite');
      const store = transaction.objectStore('positionAlerts');
      const request = store.add(alert);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPositionAlerts(userId: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['positionAlerts'], 'readonly');
      const store = transaction.objectStore('positionAlerts');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      };
    });
  }
}

export const notificationDB = new NotificationDatabase();
