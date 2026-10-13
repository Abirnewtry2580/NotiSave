import { notisaveDB } from '../db/indexedDb';
import { AppNotification, AppRule, CloudBackupSnapshot, SyncMutation, SyncState } from '../types';

type SyncListener = (state: SyncState) => void;
type DataChangeListener = () => void;

class RealTimeSyncEngine {
  private syncState: SyncState = {
    status: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
    lastSyncedAt: Date.now() - 3600000,
    pendingCount: 0,
    totalSyncedCount: 42,
    conflictCount: 0,
    conflictStrategy: 'last-write-wins',
    bandwidthMode: 'high',
  };

  private syncListeners: Set<SyncListener> = new Set();
  private dataChangeListeners: Set<DataChangeListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isProcessingQueue = false;
  private syncIntervalTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Setup BroadcastChannel for real-time inter-tab sync
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('notisave_realtime_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'REMOTE_MUTATION') {
            this.notifyDataChange();
          } else if (event.data?.type === 'CLOUD_SYNC_PING') {
            this.notifySyncState();
          }
        };
      }

      // Online/Offline network monitoring
      window.addEventListener('online', () => {
        this.syncState.status = 'online';
        this.notifySyncState();
        this.processSyncQueue();
      });

      window.addEventListener('offline', () => {
        this.syncState.status = 'offline';
        this.notifySyncState();
      });

      // Periodic cloud sync check (every 30 seconds when online)
      this.syncIntervalTimer = setInterval(() => {
        if (navigator.onLine && !this.isProcessingQueue) {
          this.processSyncQueue();
        }
      }, 30000);
    }
  }

  subscribeSyncState(listener: SyncListener) {
    this.syncListeners.add(listener);
    listener(this.syncState);
    return () => this.syncListeners.delete(listener);
  }

  subscribeDataChanges(listener: DataChangeListener) {
    this.dataChangeListeners.add(listener);
    return () => this.dataChangeListeners.delete(listener);
  }

  private notifySyncState() {
    for (const listener of this.syncListeners) {
      listener({ ...this.syncState });
    }
  }

  private notifyDataChange() {
    for (const listener of this.dataChangeListeners) {
      listener();
    }
  }

  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  setConflictStrategy(strategy: 'last-write-wins' | 'cloud-authoritative' | 'client-authoritative') {
    this.syncState.conflictStrategy = strategy;
    this.notifySyncState();
  }

  setBandwidthMode(mode: 'high' | 'eco') {
    this.syncState.bandwidthMode = mode;
    this.notifySyncState();
  }

  /**
   * Enqueues a local mutation. If online, tries to sync immediately.
   * If offline, stores in IndexedDB sync queue for automatic background replay.
   */
  async queueMutation(mutation: Omit<SyncMutation, 'id' | 'timestamp' | 'attempts'>) {
    const fullMutation: SyncMutation = {
      ...mutation,
      id: 'mut_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
      attempts: 0,
    };

    // Store mutation in IndexedDB queue
    await notisaveDB.addToSyncQueue(fullMutation);

    // Update state pending count
    const queue = await notisaveDB.getSyncQueue();
    this.syncState.pendingCount = queue.length;
    this.notifySyncState();

    // Broadcast mutation to other open tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'REMOTE_MUTATION',
        mutation: fullMutation,
      });
    }

    // If online, process right away
    if (navigator.onLine) {
      this.processSyncQueue();
    }
  }

  /**
   * Processes all pending mutations in the sync queue.
   */
  async processSyncQueue(): Promise<{ success: boolean; processed: number; errors: number }> {
    if (this.isProcessingQueue) return { success: true, processed: 0, errors: 0 };
    if (!navigator.onLine) {
      this.syncState.status = 'offline';
      this.notifySyncState();
      return { success: false, processed: 0, errors: 0 };
    }

    this.isProcessingQueue = true;
    this.syncState.status = 'syncing';
    this.notifySyncState();

    let processed = 0;
    let errors = 0;

    try {
      const queue = await notisaveDB.getSyncQueue();
      this.syncState.pendingCount = queue.length;

      // Small network roundtrip simulation delay
      await new Promise(r => setTimeout(r, 600));

      for (const item of queue) {
        try {
          // Simulate syncing with cloud API endpoint or cloud storage
          await this.syncMutationToCloud(item);
          await notisaveDB.removeFromSyncQueue(item.id);
          processed++;
          this.syncState.totalSyncedCount++;
        } catch {
          errors++;
          item.attempts += 1;
          await notisaveDB.addToSyncQueue(item);
        }
      }

      this.syncState.lastSyncedAt = Date.now();
      const remainingQueue = await notisaveDB.getSyncQueue();
      this.syncState.pendingCount = remainingQueue.length;
      this.syncState.status = errors > 0 ? 'error' : 'synced';
    } catch {
      this.syncState.status = 'error';
    } finally {
      this.isProcessingQueue = false;
      this.notifySyncState();
      this.notifyDataChange();
    }

    return { success: errors === 0, processed, errors };
  }

  /**
   * Cloud sync replica updater (emulates cloud storage persistence)
   */
  private async syncMutationToCloud(mutation: SyncMutation): Promise<void> {
    const rawCloud = localStorage.getItem('notisave_cloud_replica');
    let cloudData: { notifications: AppNotification[]; rules: Record<string, AppRule> } = rawCloud
      ? JSON.parse(rawCloud)
      : { notifications: [], rules: {} };

    if (mutation.entity === 'notification') {
      if (mutation.type === 'INSERT' || mutation.type === 'UPDATE') {
        const item: AppNotification = mutation.payload;
        const existingIdx = cloudData.notifications.findIndex(n => n.id === item.id);
        if (existingIdx >= 0) {
          // Check conflict resolution
          const existing = cloudData.notifications[existingIdx];
          if (this.syncState.conflictStrategy === 'cloud-authoritative' && existing.updatedAt > item.updatedAt) {
            // Cloud version is kept
            this.syncState.conflictCount++;
          } else {
            cloudData.notifications[existingIdx] = { ...item, syncStatus: 'synced' };
          }
        } else {
          cloudData.notifications.unshift({ ...item, syncStatus: 'synced' });
        }
      } else if (mutation.type === 'DELETE') {
        cloudData.notifications = cloudData.notifications.filter(n => n.id !== mutation.entityId);
      } else if (mutation.type === 'CLEAR_ALL') {
        cloudData.notifications = [];
      } else if (mutation.type === 'MARK_READ') {
        const n = cloudData.notifications.find(i => i.id === mutation.entityId);
        if (n) n.read = true;
      }
    } else if (mutation.entity === 'app_rule') {
      const rule: AppRule = mutation.payload;
      cloudData.rules[rule.appId] = rule;
    }

    // Keep cloud replica to max 200 items for storage hygiene
    if (cloudData.notifications.length > 200) {
      cloudData.notifications = cloudData.notifications.slice(0, 200);
    }

    localStorage.setItem('notisave_cloud_replica', JSON.stringify(cloudData));
  }

  /**
   * Force pull latest snapshot from simulated Cloud
   */
  async pullFromCloud(): Promise<{ count: number }> {
    this.syncState.status = 'syncing';
    this.notifySyncState();

    await new Promise(r => setTimeout(r, 800));

    const rawCloud = localStorage.getItem('notisave_cloud_replica');
    if (!rawCloud) {
      this.syncState.status = 'synced';
      this.notifySyncState();
      return { count: 0 };
    }

    const cloudData: { notifications: AppNotification[]; rules: Record<string, AppRule> } = JSON.parse(rawCloud);
    if (cloudData.notifications && cloudData.notifications.length > 0) {
      await notisaveDB.saveNotificationsBulk(cloudData.notifications);
    }

    this.syncState.lastSyncedAt = Date.now();
    this.syncState.status = 'synced';
    this.notifySyncState();
    this.notifyDataChange();

    return { count: cloudData.notifications.length };
  }

  /**
   * Export all notifications and settings as a downloadable backup
   */
  async exportBackup(): Promise<string> {
    const notifications = await notisaveDB.getAllNotifications();
    const rules = await notisaveDB.getAppRules();

    const snapshot: CloudBackupSnapshot = {
      snapshotId: 'backup_' + Date.now(),
      createdAt: Date.now(),
      deviceName: 'Pixel 9 Pro (Android 15)',
      notificationsCount: notifications.length,
      data: {
        notifications,
        rules,
      },
    };

    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Import backup snapshot
   */
  async importBackup(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const parsed: CloudBackupSnapshot = JSON.parse(jsonString);
      if (!parsed.data || !Array.isArray(parsed.data.notifications)) {
        return { success: false, count: 0, error: 'Invalid backup file structure' };
      }

      await notisaveDB.saveNotificationsBulk(parsed.data.notifications);

      if (parsed.data.rules) {
        for (const appId in parsed.data.rules) {
          await notisaveDB.saveAppRule(parsed.data.rules[appId]);
        }
      }

      this.notifyDataChange();
      await this.processSyncQueue();
      return { success: true, count: parsed.data.notifications.length };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Parse error' };
    }
  }
}

export const syncEngine = new RealTimeSyncEngine();
