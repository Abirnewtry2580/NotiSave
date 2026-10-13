import { notisaveDB } from '../db/indexedDb';
import { syncEngine } from './syncEngine';
import { AppNotification, SupportedAppId } from '../types';
import { soundEffects } from '../utils/audio';

export const APP_METADATA: Record<SupportedAppId, {
  name: string;
  color: string;
  bgLight: string;
  category: 'chat' | 'social' | 'email' | 'work' | 'system';
  iconType: string;
}> = {
  whatsapp: {
    name: 'WhatsApp',
    color: '#25D366',
    bgLight: 'rgba(37, 211, 102, 0.15)',
    category: 'chat',
    iconType: 'whatsapp',
  },
  telegram: {
    name: 'Telegram',
    color: '#229ED9',
    bgLight: 'rgba(34, 158, 217, 0.15)',
    category: 'chat',
    iconType: 'telegram',
  },
  messenger: {
    name: 'Messenger',
    color: '#0084FF',
    bgLight: 'rgba(0, 132, 255, 0.15)',
    category: 'chat',
    iconType: 'messenger',
  },
  instagram: {
    name: 'Instagram',
    color: '#E1306C',
    bgLight: 'rgba(225, 48, 108, 0.15)',
    category: 'social',
    iconType: 'instagram',
  },
  gmail: {
    name: 'Gmail',
    color: '#EA4335',
    bgLight: 'rgba(234, 67, 53, 0.15)',
    category: 'email',
    iconType: 'gmail',
  },
  slack: {
    name: 'Slack',
    color: '#4A154B',
    bgLight: 'rgba(74, 21, 75, 0.15)',
    category: 'work',
    iconType: 'slack',
  },
  sms: {
    name: 'Messages',
    color: '#1A73E8',
    bgLight: 'rgba(26, 115, 232, 0.15)',
    category: 'chat',
    iconType: 'sms',
  },
  twitter: {
    name: 'X (Twitter)',
    color: '#000000',
    bgLight: 'rgba(15, 23, 42, 0.15)',
    category: 'social',
    iconType: 'twitter',
  },
  system: {
    name: 'Android System',
    color: '#3DDC84',
    bgLight: 'rgba(61, 220, 132, 0.15)',
    category: 'system',
    iconType: 'system',
  },
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_seed_1',
    appId: 'whatsapp',
    appName: 'WhatsApp',
    appColor: '#25D366',
    sender: 'Sarah Miller',
    message: 'This message was deleted',
    originalMessage: 'Hey, are you free for dinner at 8pm? Let me know before I reserve!',
    subtext: 'Personal',
    timestamp: Date.now() - 1000 * 60 * 3, // 3 mins ago
    read: false,
    pinned: true,
    favorite: true,
    isDeletedBySender: true,
    category: 'chat',
    conversationId: 'conv_sarah',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    syncStatus: 'synced',
    version: 1,
    updatedAt: Date.now() - 1000 * 60 * 3,
  },
  {
    id: 'notif_seed_2',
    appId: 'whatsapp',
    appName: 'WhatsApp',
    appColor: '#25D366',
    sender: 'Sarah Miller',
    message: 'Just sent the new presentation slides over email. Check slide 4!',
    subtext: 'Personal',
    timestamp: Date.now() - 1000 * 60 * 15,
    read: true,
    pinned: false,
    favorite: false,
    isDeletedBySender: false,
    category: 'chat',
    conversationId: 'conv_sarah',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    syncStatus: 'synced',
    version: 1,
    updatedAt: Date.now() - 1000 * 60 * 15,
  },
  {
    id: 'notif_seed_3',
    appId: 'telegram',
    appName: 'Telegram',
    appColor: '#229ED9',
    sender: 'DevOps & Cloud Core',
    message: 'Production deploy v3.12.0 finished cleanly. All health checks 100% green.',
    subtext: 'Channel (1,420 members)',
    timestamp: Date.now() - 1000 * 60 * 42,
    read: false,
    pinned: false,
    favorite: false,
    isDeletedBySender: false,
    category: 'chat',
    conversationId: 'conv_devops',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    syncStatus: 'synced',
    version: 1,
    updatedAt: Date.now() - 1000 * 60 * 42,
  },
  {
    id: 'notif_seed_4',
    appId: 'instagram',
    appName: 'Instagram',
    appColor: '#E1306C',
    sender: 'alex_visuals',
    message: 'Sent a reel: "Wait until the end 🤯"',
    subtext: 'Direct Message',
    timestamp: Date.now() - 1000 * 60 * 85,
    read: false,
    pinned: false,
    favorite: true,
    isDeletedBySender: false,
    category: 'social',
    conversationId: 'conv_alex',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    syncStatus: 'synced',
    version: 1,
    updatedAt: Date.now() - 1000 * 60 * 85,
  },
  {
    id: 'notif_seed_5',
    appId: 'gmail',
    appName: 'Gmail',
    appColor: '#EA4335',
    sender: 'Google Security Alert',
    message: 'New sign-in detected from Pixel 9 Pro. If this was you, no action is needed.',
    subtext: 'security-noreply@google.com',
    timestamp: Date.now() - 1000 * 3600 * 3,
    read: true,
    pinned: false,
    favorite: false,
    isDeletedBySender: false,
    category: 'email',
    conversationId: 'conv_gmail_sec',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    syncStatus: 'synced',
    version: 1,
    updatedAt: Date.now() - 1000 * 3600 * 3,
  },
  {
    id: 'notif_seed_6',
    appId: 'sms',
    appName: 'Messages',
    appColor: '#1A73E8',
    sender: 'Chase Bank Alerts',
    message: 'Card ending in 4102: Purchase of $24.50 at Blue Bottle Coffee approved.',
    subtext: 'SMS 72401',
    timestamp: Date.now() - 1000 * 3600 * 5,
    read: true,
    pinned: false,
    favorite: false,
    isDeletedBySender: false,
    category: 'chat',
    conversationId: 'conv_chase',
    syncStatus: 'synced',
    version: 1,
    updatedAt: Date.now() - 1000 * 3600 * 5,
  },
  {
    id: 'notif_seed_7',
    appId: 'system',
    appName: 'Android System',
    appColor: '#3DDC84',
    sender: 'System Update',
    message: 'Android 15 Security Patch installed. Tap to restart device.',
    subtext: 'Build AP2A.240905.003',
    timestamp: Date.now() - 1000 * 3600 * 12,
    read: true,
    pinned: false,
    favorite: false,
    isDeletedBySender: false,
    category: 'system',
    conversationId: 'conv_system',
    syncStatus: 'synced',
    version: 1,
    updatedAt: Date.now() - 1000 * 3600 * 12,
  },
];

const SIMULATED_STREAMS = [
  {
    appId: 'whatsapp' as SupportedAppId,
    sender: 'Marcus Brody',
    messages: [
      'Did you see the latest Figma prototype? Looks super crisp!',
      'Can you review the wireframes before 3pm?',
      'Let me know when you are back at your desk.',
    ],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    canBeDeleted: true,
  },
  {
    appId: 'telegram' as SupportedAppId,
    sender: 'Elena Rostova',
    messages: [
      'Sending the encrypted file bundle now.',
      'Password sent over Signal.',
      'Confirmed receipt on our server side.',
    ],
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    canBeDeleted: false,
  },
  {
    appId: 'instagram' as SupportedAppId,
    sender: 'design_daily',
    messages: [
      'Mentioned you in a comment: "This layout is pure genius!"',
      'Shared a new story: "Behind the scenes of our dark mode redesign"',
    ],
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    canBeDeleted: false,
  },
  {
    appId: 'slack' as SupportedAppId,
    sender: 'Product Lead (#sprint-planning)',
    messages: [
      'PR #142 has been approved and merged into main.',
      'Reminder: Standup meeting starts in 10 minutes.',
      'Check the updated release notes for v4.0.',
    ],
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    canBeDeleted: false,
  },
  {
    appId: 'messenger' as SupportedAppId,
    sender: 'Jessica Alba (Family)',
    messages: [
      'Are you coming over for Sunday barbecue?',
      'Dad made his special lemon pie!',
    ],
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    canBeDeleted: true,
  },
];

class NotificationSimulator {
  private autoInterval: any = null;
  private isAutoRunning = false;

  async initSeedDataIfNeeded() {
    const existing = await notisaveDB.getAllNotifications();
    if (existing.length === 0) {
      await notisaveDB.saveNotificationsBulk(INITIAL_NOTIFICATIONS);
      // Also register in cloud replica
      localStorage.setItem('notisave_cloud_replica', JSON.stringify({
        notifications: INITIAL_NOTIFICATIONS,
        rules: {},
      }));
    }
  }

  startLiveSimulation(onNewNotification: (notif: AppNotification) => void, intervalSec = 15) {
    if (this.isAutoRunning) return;
    this.isAutoRunning = true;

    this.autoInterval = setInterval(async () => {
      const generated = await this.generateRandomNotification();
      if (generated) {
        onNewNotification(generated);
      }
    }, intervalSec * 1000);
  }

  stopLiveSimulation() {
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }
    this.isAutoRunning = false;
  }

  isSimulating(): boolean {
    return this.isAutoRunning;
  }

  async generateRandomNotification(): Promise<AppNotification | null> {
    const pool = SIMULATED_STREAMS;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    const msg = choice.messages[Math.floor(Math.random() * choice.messages.length)];
    const meta = APP_METADATA[choice.appId];

    // Check if app is blocked
    const rules = await notisaveDB.getAppRules();
    const appRule = rules[choice.appId];

    const isDeleted = choice.canBeDeleted && Math.random() < 0.25;

    const notif: AppNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      appId: choice.appId,
      appName: meta.name,
      appColor: meta.color,
      sender: choice.sender,
      message: isDeleted ? 'This message was deleted' : msg,
      originalMessage: isDeleted ? msg : undefined,
      isDeletedBySender: isDeleted,
      subtext: isDeleted ? 'Deleted message recovered' : 'Real-time alert',
      timestamp: Date.now(),
      read: false,
      pinned: false,
      favorite: false,
      category: meta.category,
      conversationId: 'conv_' + choice.sender.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      avatarUrl: choice.avatarUrl,
      syncStatus: 'pending',
      version: 1,
      updatedAt: Date.now(),
    };

    // Save to IndexedDB
    await notisaveDB.saveNotification(notif);

    // Queue for cloud sync
    await syncEngine.queueMutation({
      type: 'INSERT',
      entity: 'notification',
      entityId: notif.id,
      payload: notif,
    });

    // Play chime if not muted by rules
    if (!appRule || !appRule.muted) {
      soundEffects.playNotificationChime();
    }

    return notif;
  }

  async createCustomNotification(params: {
    appId: SupportedAppId;
    sender: string;
    message: string;
    isDeleted?: boolean;
    originalMessage?: string;
  }): Promise<AppNotification> {
    const meta = APP_METADATA[params.appId] || APP_METADATA.whatsapp;
    const notif: AppNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      appId: params.appId,
      appName: meta.name,
      appColor: meta.color,
      sender: params.sender || 'Test User',
      message: params.isDeleted ? 'This message was deleted' : params.message,
      originalMessage: params.isDeleted ? (params.originalMessage || params.message) : undefined,
      isDeletedBySender: !!params.isDeleted,
      subtext: params.isDeleted ? 'Recovered by Notisave' : 'Manual Test',
      timestamp: Date.now(),
      read: false,
      pinned: false,
      favorite: false,
      category: meta.category,
      conversationId: 'conv_' + params.sender.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      syncStatus: 'pending',
      version: 1,
      updatedAt: Date.now(),
    };

    await notisaveDB.saveNotification(notif);
    await syncEngine.queueMutation({
      type: 'INSERT',
      entity: 'notification',
      entityId: notif.id,
      payload: notif,
    });

    soundEffects.playNotificationChime();
    return notif;
  }
}

export const notificationSimulator = new NotificationSimulator();
