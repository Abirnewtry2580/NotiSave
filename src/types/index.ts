export type AppCategory = 'all' | 'chat' | 'social' | 'email' | 'work' | 'system';

export type SupportedAppId = 
  | 'whatsapp'
  | 'telegram'
  | 'messenger'
  | 'instagram'
  | 'gmail'
  | 'slack'
  | 'sms'
  | 'twitter'
  | 'system';

export interface AppNotification {
  id: string;
  appId: SupportedAppId;
  appName: string;
  appColor: string;
  sender: string;
  message: string;
  subtext?: string;
  timestamp: number;
  read: boolean;
  pinned: boolean;
  favorite: boolean;
  isDeletedBySender: boolean;
  originalMessage?: string;
  category: AppCategory;
  conversationId: string;
  avatarUrl?: string;
  syncStatus: 'synced' | 'pending' | 'syncing' | 'conflict';
  version: number;
  updatedAt: number;
}

export type MutationType = 'INSERT' | 'UPDATE' | 'DELETE' | 'MARK_READ' | 'CLEAR_ALL';

export interface SyncMutation {
  id: string;
  type: MutationType;
  entityId: string;
  entity: 'notification' | 'app_rule' | 'settings';
  payload?: any;
  timestamp: number;
  attempts: number;
}

export interface SyncState {
  status: 'online' | 'offline' | 'syncing' | 'error' | 'synced';
  lastSyncedAt: number | null;
  pendingCount: number;
  totalSyncedCount: number;
  conflictCount: number;
  conflictStrategy: 'last-write-wins' | 'cloud-authoritative' | 'client-authoritative';
  bandwidthMode: 'high' | 'eco';
}

export interface AppRule {
  appId: SupportedAppId;
  appName: string;
  blockedFromStatusBar: boolean;
  muted: boolean;
  saveDeletedMessages: boolean;
  keywordFilters: string[];
}

export interface AppSettings {
  passcodeEnabled: boolean;
  passcode: string;
  isLocked: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoSyncIntervalMs: number;
  cloudBackupEnabled: boolean;
  deviceViewMode: boolean; // phone frame vs full screen
  autoSaveStatus: boolean;
}

export interface CloudBackupSnapshot {
  snapshotId: string;
  createdAt: number;
  deviceName: string;
  notificationsCount: number;
  data: {
    notifications: AppNotification[];
    rules: Record<string, AppRule>;
  };
}
