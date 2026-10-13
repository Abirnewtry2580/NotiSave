import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  MessageSquare, 
  BellOff, 
  Cloud, 
  Settings, 
  Search, 
  Plus, 
  CheckCheck, 
  Lock, 
  ShieldCheck, 
  Filter, 
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react';

import { AppNotification, AppCategory, AppRule, AppSettings, SyncState, SupportedAppId } from './types';
import { notisaveDB } from './db/indexedDb';
import { syncEngine } from './services/syncEngine';
import { notificationSimulator } from './services/notificationSimulator';
import { soundEffects } from './utils/audio';
import { useOnlineStatus } from './hooks/useOnlineStatus';

import { AndroidFrame } from './components/AndroidFrame';
import { NotificationCard } from './components/NotificationCard';
import { NotificationShade } from './components/NotificationShade';
import { ChatReaderView } from './components/ChatReaderView';
import { BlockRulesTab } from './components/BlockRulesTab';
import { SyncHubModal } from './components/SyncHubModal';
import { AppLockModal } from './components/AppLockModal';
import { NewNotificationModal } from './components/NewNotificationModal';
import { SettingsModal } from './components/SettingsModal';
import { PWAInstallButton } from './components/PWAInstallButton';

export default function App() {
  const isOnline = useOnlineStatus();

  // Primary Data State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [rules, setRules] = useState<Record<string, AppRule>>({});
  const [syncState, setSyncState] = useState<SyncState>(syncEngine.getSyncState());
  const [activeTab, setActiveTab] = useState<'notifications' | 'chats' | 'rules' | 'sync' | 'settings'>('notifications');
  
  // Navigation & Filtering
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'pinned' | 'deleted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Modals & Panels
  const [isShadeOpen, setIsShadeOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNewNotifModalOpen, setIsNewNotifModalOpen] = useState(false);
  const [isSimulatingFeed, setIsSimulatingFeed] = useState(false);

  // App Settings & Lock State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('notisave_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      passcodeEnabled: false,
      passcode: '1234',
      isLocked: false,
      soundEnabled: true,
      vibrationEnabled: true,
      autoSyncIntervalMs: 30000,
      cloudBackupEnabled: true,
      deviceViewMode: typeof window !== 'undefined' ? window.innerWidth >= 768 : false,
      autoSaveStatus: true,
    };
  });

  // Load initial notifications & rules from IndexedDB
  useEffect(() => {
    const bootstrap = async () => {
      await notificationSimulator.initSeedDataIfNeeded();
      const loadedNotifs = await notisaveDB.getAllNotifications();
      const loadedRules = await notisaveDB.getAppRules();
      setNotifications(loadedNotifs);
      setRules(loadedRules);
    };

    bootstrap();

    // Subscribe to Sync Engine updates
    const unsubSync = syncEngine.subscribeSyncState((state) => {
      setSyncState(state);
    });

    const unsubData = syncEngine.subscribeDataChanges(async () => {
      const refreshed = await notisaveDB.getAllNotifications();
      setNotifications(refreshed);
    });

    return () => {
      unsubSync();
      unsubData();
      notificationSimulator.stopLiveSimulation();
    };
  }, []);

  // Save settings updates
  const updateSettings = (partial: Partial<AppSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    localStorage.setItem('notisave_settings', JSON.stringify(next));
  };

  // Toggle Live Simulation
  const handleToggleSimulator = () => {
    if (isSimulatingFeed) {
      notificationSimulator.stopLiveSimulation();
      setIsSimulatingFeed(false);
    } else {
      notificationSimulator.startLiveSimulation((newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
      }, 12);
      setIsSimulatingFeed(true);
    }
  };

  // Notification Operations
  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const item = notifications.find((n) => n.id === id);
    if (item) {
      const updated = { ...item, read: true, updatedAt: Date.now() };
      await notisaveDB.saveNotification(updated);
      await syncEngine.queueMutation({
        type: 'UPDATE',
        entity: 'notification',
        entityId: id,
        payload: updated,
      });
    }
  };

  const handleMarkAllRead = async () => {
    soundEffects.playPopSound();
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    await notisaveDB.saveNotificationsBulk(updated);
    for (const item of updated) {
      await syncEngine.queueMutation({
        type: 'UPDATE',
        entity: 'notification',
        entityId: item.id,
        payload: item,
      });
    }
  };

  const handleTogglePin = async (id: string) => {
    soundEffects.playPopSound();
    const item = notifications.find((n) => n.id === id);
    if (!item) return;
    const nextPinned = !item.pinned;
    const updated = { ...item, pinned: nextPinned, updatedAt: Date.now() };

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? updated : n))
    );
    await notisaveDB.saveNotification(updated);
    await syncEngine.queueMutation({
      type: 'UPDATE',
      entity: 'notification',
      entityId: id,
      payload: updated,
    });
  };

  const handleDeleteNotification = async (id: string) => {
    soundEffects.playPopSound();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await notisaveDB.deleteNotification(id);
    await syncEngine.queueMutation({
      type: 'DELETE',
      entity: 'notification',
      entityId: id,
    });
  };

  const handleClearAll = async () => {
    setNotifications([]);
    await notisaveDB.clearAllNotifications();
    await syncEngine.queueMutation({
      type: 'CLEAR_ALL',
      entity: 'notification',
      entityId: 'all',
    });
  };

  const handleUpdateRule = async (rule: AppRule) => {
    soundEffects.playPopSound();
    setRules((prev) => ({ ...prev, [rule.appId]: rule }));
    await notisaveDB.saveAppRule(rule);
    await syncEngine.queueMutation({
      type: 'UPDATE',
      entity: 'app_rule',
      entityId: rule.appId,
      payload: rule,
    });
  };

  const handleCreateCustomNotif = async (params: {
    appId: SupportedAppId;
    sender: string;
    message: string;
    isDeleted: boolean;
    originalMessage?: string;
  }) => {
    const created = await notificationSimulator.createCustomNotification(params);
    setNotifications((prev) => [created, ...prev]);
  };

  // Unread Count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.sender.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.appName.toLowerCase().includes(q) ||
          (n.originalMessage && n.originalMessage.toLowerCase().includes(q))
      );
    }

    if (selectedCategory === 'pinned') {
      result = result.filter((n) => n.pinned);
    } else if (selectedCategory === 'deleted') {
      result = result.filter((n) => n.isDeletedBySender);
    } else if (selectedCategory !== 'all') {
      result = result.filter((n) => n.category === selectedCategory);
    }

    // Sort: Pinned first, then descending timestamp
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.timestamp - a.timestamp;
    });
  }, [notifications, selectedCategory, searchQuery]);

  return (
    <AndroidFrame
      isDeviceMode={settings.deviceViewMode}
      onToggleDeviceMode={() => updateSettings({ deviceViewMode: !settings.deviceViewMode })}
      unreadCount={unreadCount}
      onOpenShade={() => setIsShadeOpen(true)}
      isOnline={isOnline}
    >
      {/* App Lock Screen Overlay */}
      {settings.passcodeEnabled && settings.isLocked && (
        <AppLockModal
          isLocked={settings.isLocked}
          correctPin={settings.passcode}
          onUnlock={() => updateSettings({ isLocked: false })}
        />
      )}

      {/* Android Notification Shade (Pull-Down) */}
      <NotificationShade
        isOpen={isShadeOpen}
        onClose={() => setIsShadeOpen(false)}
        syncState={syncState}
        onTriggerSync={() => setIsSyncModalOpen(true)}
        notifications={notifications}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
        onSelectNotification={(n) => {
          if (n.category === 'chat') {
            setSelectedConversationId(n.conversationId);
            setActiveTab('chats');
          } else {
            handleMarkRead(n.id);
          }
        }}
      />

      {/* Main Notisave Shell */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden text-slate-100 select-none">
        {/* Notisave Top App Bar */}
        <header className="px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Play Store Style Notisave Icon (Bell with pink/indigo ring) */}
            <div className="relative w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-md shadow-indigo-950/40 p-1">
              <div className="absolute inset-0 rounded-xl border border-indigo-400/40" />
              <Bell className="w-5 h-5 text-blue-600 fill-blue-500" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-pink-500 border-2 border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold tracking-tight text-white">Notisave</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Notification Vault & Sync</p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Real-time Cloud Sync Pill */}
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                syncState.status === 'syncing'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : isOnline
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
              title="Open Real-Time Cloud Sync Hub"
            >
              <Cloud className={`w-3 h-3 ${syncState.status === 'syncing' ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">
                {syncState.status === 'syncing'
                  ? 'Syncing'
                  : isOnline
                  ? 'Cloud Synced'
                  : 'Offline'}
              </span>
              {syncState.pendingCount > 0 && (
                <span className="px-1 py-0.2 text-[9px] rounded-full bg-amber-500 text-slate-950 font-black">
                  {syncState.pendingCount}
                </span>
              )}
            </button>

            {/* App Lock trigger */}
            {settings.passcodeEnabled && (
              <button
                onClick={() => updateSettings({ isLocked: true })}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Lock Vault"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Offline Banner if disconnected */}
        {!isOnline && (
          <div className="bg-amber-600/90 text-white text-xs px-4 py-1.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Mode: All notifications stored locally in IndexedDB. Sync will resume automatically.</span>
            </div>
            <span className="text-[10px] font-mono bg-amber-700/60 px-1.5 py-0.5 rounded">AUTO-RETRY</span>
          </div>
        )}

        {/* Tab Content Rendering */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'notifications' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search & Actions Bar */}
              <div className="p-3 bg-slate-950 border-b border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search notifications, chats, or apps..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 shrink-0 transition"
                      title="Mark all notifications as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="hidden sm:inline">Mark All</span>
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {[
                    { id: 'all', label: 'All Alerts', count: notifications.length },
                    { id: 'chat', label: 'Chats', count: notifications.filter(n => n.category === 'chat').length },
                    { id: 'deleted', label: 'Recovered Deleted', count: notifications.filter(n => n.isDeletedBySender).length },
                    { id: 'pinned', label: 'Pinned', count: notifications.filter(n => n.pinned).length },
                    { id: 'social', label: 'Social', count: notifications.filter(n => n.category === 'social').length },
                    { id: 'email', label: 'Email', count: notifications.filter(n => n.category === 'email').length },
                    { id: 'system', label: 'System', count: notifications.filter(n => n.category === 'system').length },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => setSelectedCategory(chip.id as any)}
                      className={`px-3 py-1 rounded-full whitespace-nowrap font-medium text-xs transition flex items-center gap-1.5 ${
                        selectedCategory === chip.id
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/40'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>{chip.label}</span>
                      <span className={`text-[10px] px-1 rounded-full ${
                        selectedCategory === chip.id ? 'bg-indigo-800/80 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {chip.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications Scroll List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-20 px-4">
                    <Bell className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-400">No notifications found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      {searchQuery
                        ? 'Try clearing the search query or selecting a different category filter.'
                        : 'New notifications from WhatsApp, Telegram, or other apps will be saved automatically here.'}
                    </p>
                    <button
                      onClick={() => setIsNewNotifModalOpen(true)}
                      className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition"
                    >
                      Inject Test Notification
                    </button>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <NotificationCard
                      key={notif.id}
                      notification={notif}
                      onMarkRead={handleMarkRead}
                      onTogglePin={handleTogglePin}
                      onDelete={handleDeleteNotification}
                      onOpenChat={(convId) => {
                        setSelectedConversationId(convId);
                        setActiveTab('chats');
                      }}
                    />
                  ))
                )}
              </div>

              {/* Floating Action Button for Test Simulation */}
              <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 items-end">
                {/* Auto live emitter badge */}
                <button
                  onClick={handleToggleSimulator}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 transition ${
                    isSimulatingFeed
                      ? 'bg-rose-600 text-white ring-2 ring-rose-400/50 animate-pulse'
                      : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle continuous realistic notification feed"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSimulatingFeed ? 'Live Feed ON' : 'Start Live Feed'}</span>
                </button>

                <button
                  onClick={() => setIsNewNotifModalOpen(true)}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white flex items-center justify-center shadow-xl shadow-indigo-950/60 active:scale-95 transition"
                  title="Inject custom notification"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <ChatReaderView
              notifications={notifications}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              onMarkRead={handleMarkRead}
              onDeleteNotification={handleDeleteNotification}
            />
          )}

          {activeTab === 'rules' && (
            <BlockRulesTab
              rules={rules}
              onUpdateRule={handleUpdateRule}
            />
          )}
        </div>

        {/* Android Material 3 Bottom Navigation Bar */}
        <nav className="h-16 bg-slate-950 border-t border-slate-800/80 px-2 flex items-center justify-around shrink-0 z-30">
          <button
            onClick={() => {
              soundEffects.playPopSound();
              setActiveTab('notifications');
            }}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition ${
              activeTab === 'notifications'
                ? 'text-indigo-400 font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-black flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">Inbox</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playPopSound();
              setActiveTab('chats');
            }}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition ${
              activeTab === 'chats'
                ? 'text-indigo-400 font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px]">Unseen Chats</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playPopSound();
              setActiveTab('rules');
            }}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition ${
              activeTab === 'rules'
                ? 'text-indigo-400 font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <BellOff className="w-5 h-5" />
            <span className="text-[10px]">Clean Bar</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playPopSound();
              setIsSyncModalOpen(true);
            }}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-slate-500 hover:text-slate-300 transition"
          >
            <div className="relative">
              <Cloud className="w-5 h-5" />
              {syncState.pendingCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
            <span className="text-[10px]">Sync Hub</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playPopSound();
              setIsSettingsModalOpen(true);
            }}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-slate-500 hover:text-slate-300 transition"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px]">Settings</span>
          </button>
        </nav>
      </div>

      {/* Sync Hub Modal */}
      <SyncHubModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncState={syncState}
        isOnline={isOnline}
      />

      {/* New Notification Simulator Modal */}
      <NewNotificationModal
        isOpen={isNewNotifModalOpen}
        onClose={() => setIsNewNotifModalOpen(false)}
        onSubmit={handleCreateCustomNotif}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onClearAll={handleClearAll}
        isSimulating={isSimulatingFeed}
        onToggleSimulator={handleToggleSimulator}
      />
    </AndroidFrame>
  );
}
