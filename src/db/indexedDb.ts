import { AppNotification, AppRule, SyncMutation } from '../types';

const DB_NAME = 'NotisaveOfflineDB';
const DB_VERSION = 2;

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private isSupported: boolean = typeof window !== 'undefined' && 'indexedDB' in window;

  async init(): Promise<IDBDatabase | null> {
    if (!this.isSupported) return null;
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Notifications store
        if (!db.objectStoreNames.contains('notifications')) {
          const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notifStore.createIndex('timestamp', 'timestamp', { unique: false });
          notifStore.createIndex('appId', 'appId', { unique: false });
          notifStore.createIndex('conversationId', 'conversationId', { unique: false });
          notifStore.createIndex('read', 'read', { unique: false });
          notifStore.createIndex('pinned', 'pinned', { unique: false });
        }

        // App Rules store
        if (!db.objectStoreNames.contains('app_rules')) {
          db.createObjectStore('app_rules', { keyPath: 'appId' });
        }

        // Offline Sync Queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.warn('IndexedDB failed to open, fallback to localStorage', event);
        resolve(null);
      };
    });
  }

  // --- Notifications Operations ---

  async getAllNotifications(): Promise<AppNotification[]> {
    const db = await this.init();
    if (!db) {
      const local = localStorage.getItem('notisave_notifications');
      return local ? JSON.parse(local) : [];
    }

    return new Promise((resolve) => {
      const tx = db.transaction('notifications', 'readonly');
      const store = tx.objectStore('notifications');
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as AppNotification[];
        // Sort descending by timestamp
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  }

  async saveNotification(item: AppNotification): Promise<void> {
    const db = await this.init();
    if (!db) {
      const items = await this.getAllNotifications();
      const idx = items.findIndex(n => n.id === item.id);
      if (idx >= 0) items[idx] = item;
      else items.unshift(item);
      localStorage.setItem('notisave_notifications', JSON.stringify(items));
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveNotificationsBulk(items: AppNotification[]): Promise<void> {
    const db = await this.init();
    if (!db) {
      localStorage.setItem('notisave_notifications', JSON.stringify(items));
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteNotification(id: string): Promise<void> {
    const db = await this.init();
    if (!db) {
      const items = await this.getAllNotifications();
      const filtered = items.filter(n => n.id !== id);
      localStorage.setItem('notisave_notifications', JSON.stringify(filtered));
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllNotifications(): Promise<void> {
    const db = await this.init();
    if (!db) {
      localStorage.removeItem('notisave_notifications');
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Offline Sync Queue Operations ---

  async getSyncQueue(): Promise<SyncMutation[]> {
    const db = await this.init();
    if (!db) {
      const raw = localStorage.getItem('notisave_sync_queue');
      return raw ? JSON.parse(raw) : [];
    }

    return new Promise((resolve) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result as SyncMutation[];
        items.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
      request.onerror = () => resolve([]);
    });
  }

  async addToSyncQueue(mutation: SyncMutation): Promise<void> {
    const db = await this.init();
    if (!db) {
      const queue = await this.getSyncQueue();
      queue.push(mutation);
      localStorage.setItem('notisave_sync_queue', JSON.stringify(queue));
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.put(mutation);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async removeFromSyncQueue(mutationId: string): Promise<void> {
    const db = await this.init();
    if (!db) {
      const queue = await this.getSyncQueue();
      const updated = queue.filter(q => q.id !== mutationId);
      localStorage.setItem('notisave_sync_queue', JSON.stringify(updated));
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.delete(mutationId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.init();
    if (!db) {
      localStorage.removeItem('notisave_sync_queue');
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- App Rules Operations ---

  async getAppRules(): Promise<Record<string, AppRule>> {
    const db = await this.init();
    if (!db) {
      const raw = localStorage.getItem('notisave_rules');
      return raw ? JSON.parse(raw) : {};
    }

    return new Promise((resolve) => {
      const tx = db.transaction('app_rules', 'readonly');
      const store = tx.objectStore('app_rules');
      const request = store.getAll();
      request.onsuccess = () => {
        const rules = request.result as AppRule[];
        const map: Record<string, AppRule> = {};
        for (const r of rules) {
          map[r.appId] = r;
        }
        resolve(map);
      };
      request.onerror = () => resolve({});
    });
  }

  async saveAppRule(rule: AppRule): Promise<void> {
    const db = await this.init();
    if (!db) {
      const map = await this.getAppRules();
      map[rule.appId] = rule;
      localStorage.setItem('notisave_rules', JSON.stringify(map));
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('app_rules', 'readwrite');
      const store = tx.objectStore('app_rules');
      const req = store.put(rule);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const notisaveDB = new IndexedDBManager();
