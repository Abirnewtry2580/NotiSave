import React from 'react';
import { Wifi, Bluetooth, Volume2, VolumeX, Moon, Zap, RefreshCw, X, ChevronUp, Bell } from 'lucide-react';
import { AppNotification, SyncState } from '../types';

interface NotificationShadeProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: SyncState;
  onTriggerSync: () => void;
  notifications: AppNotification[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectNotification: (notif: AppNotification) => void;
}

export const NotificationShade: React.FC<NotificationShadeProps> = ({
  isOpen,
  onClose,
  syncState,
  onTriggerSync,
  notifications,
  soundEnabled,
  onToggleSound,
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  const recentUnread = notifications.filter(n => !n.read).slice(0, 4);

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col animate-in slide-in-from-top-full duration-200">
      {/* Top Drag Handle */}
      <div className="pt-2 pb-1 flex justify-center">
        <button
          onClick={onClose}
          className="w-12 h-1.5 rounded-full bg-slate-600/80 hover:bg-slate-400 transition"
          title="Close notification shade"
        />
      </div>

      <div className="px-5 py-3 flex items-center justify-between border-b border-slate-800/80">
        <div>
          <span className="text-xs font-semibold text-slate-400">Android System Shade</span>
          <h2 className="text-base font-bold text-white flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-indigo-400" />
            Quick Settings & Alerts
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Settings Grid */}
      <div className="p-4 grid grid-cols-4 gap-2.5 bg-slate-900/60 border-b border-slate-800/60">
        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Wifi className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium text-slate-200">Wi-Fi</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300">
            <Bluetooth className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium text-slate-400">Bluetooth</span>
        </div>

        <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={onToggleSound}>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition ${soundEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </div>
          <span className="text-[11px] font-medium text-slate-200">{soundEnabled ? 'Sound' : 'Mute'}</span>
        </div>

        <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={onTriggerSync}>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white transition ${syncState.status === 'syncing' ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600'}`}>
            <RefreshCw className={`w-5 h-5 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
          </div>
          <span className="text-[11px] font-medium text-slate-200">
            {syncState.status === 'syncing' ? 'Syncing' : 'Sync Hub'}
          </span>
        </div>
      </div>

      {/* Active Notifications Preview in Shade */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active System Notifications ({recentUnread.length})
          </span>
          <span className="text-[11px] text-indigo-400 font-medium">Autosaved to Notisave</span>
        </div>

        {recentUnread.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p className="text-xs">No active unread alerts in shade.</p>
            <p className="text-[11px] text-slate-600 mt-1">All messages safely preserved in Notisave drawer.</p>
          </div>
        ) : (
          recentUnread.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                onSelectNotification(n);
                onClose();
              }}
              className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer flex items-start gap-3 shadow-sm"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden"
                style={{ backgroundColor: n.appColor }}
              >
                {n.avatarUrl ? (
                  <img src={n.avatarUrl} alt={n.sender} className="w-full h-full object-cover" />
                ) : (
                  n.sender.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-white truncate">{n.sender}</span>
                  <span className="text-[10px] text-slate-500">{n.appName}</span>
                </div>
                <p className="text-xs text-slate-300 truncate">
                  {n.isDeletedBySender ? (
                    <span className="text-amber-400 font-medium italic">
                      [Deleted message recovered] {n.originalMessage}
                    </span>
                  ) : (
                    n.message
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>Sync Status: <strong className="text-emerald-400">{syncState.status.toUpperCase()}</strong></span>
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
        >
          Dismiss Shade
        </button>
      </div>
    </div>
  );
};
