import React, { useState } from 'react';
import { 
  Pin, 
  Trash2, 
  CheckCheck, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  CloudCheck, 
  CloudOff, 
  RefreshCw,
  MoreVertical,
  MessageSquare
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCardProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenChat: (conversationId: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
  onTogglePin,
  onDelete,
  onOpenChat,
}) => {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = notification.isDeletedBySender && notification.originalMessage
      ? notification.originalMessage
      : notification.message;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (ts: number) => {
    const diffMs = Date.now() - ts;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <div
      onClick={() => onMarkRead(notification.id)}
      className={`relative group rounded-2xl p-3.5 border transition-all duration-200 cursor-pointer ${
        notification.pinned
          ? 'bg-slate-900/90 border-indigo-500/40 shadow-md shadow-indigo-950/20 ring-1 ring-indigo-500/20'
          : notification.read
          ? 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/70'
          : 'bg-slate-900/90 border-slate-700/80 shadow-sm hover:border-slate-600'
      }`}
    >
      {/* Top Meta Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* App color pill */}
          <span
            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white shadow-xs tracking-wide"
            style={{ backgroundColor: notification.appColor }}
          >
            {notification.appName}
          </span>

          {/* Sync indicator */}
          <span title={notification.syncStatus === 'synced' ? 'Synced to Cloud' : 'Queued offline'}>
            {notification.syncStatus === 'synced' ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span className="hidden sm:inline">Synced</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            )}
          </span>

          {notification.pinned && (
            <Pin className="w-3 h-3 text-indigo-400 fill-indigo-400 rotate-45" />
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>{formatTime(notification.timestamp)}</span>

          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" title="Unread" />
          )}

          {/* Action Popover Trigger */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-30 text-xs"
              >
                <button
                  onClick={() => {
                    onTogglePin(notification.id);
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{notification.pinned ? 'Unpin' : 'Pin to top'}</span>
                </button>
                <button
                  onClick={() => {
                    onOpenChat(notification.conversationId);
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Read Unseen</span>
                </button>
                <button
                  onClick={() => {
                    onDelete(notification.id);
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Sender & Content */}
      <div className="flex items-start gap-3">
        {/* Avatar or App Letter */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 overflow-hidden shadow-xs ring-1 ring-white/10"
          style={{ backgroundColor: notification.appColor }}
        >
          {notification.avatarUrl ? (
            <img src={notification.avatarUrl} alt={notification.sender} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm">{notification.sender.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-0.5">
            <h4 className="text-sm font-bold text-white truncate">{notification.sender}</h4>
            {notification.subtext && (
              <span className="text-[10px] text-slate-500 truncate ml-2 font-mono">
                {notification.subtext}
              </span>
            )}
          </div>

          {/* Deleted Message Recovery Banner (Notisave killer feature!) */}
          {notification.isDeletedBySender ? (
            <div className="mt-1 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>Message was deleted by sender</span>
              </div>
              
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Notisave Recovered Text:
                </span>
                <p className="text-xs text-slate-200 mt-0.5 font-medium leading-relaxed">
                  "{notification.originalMessage || notification.message}"
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-300 font-normal leading-relaxed break-words line-clamp-3">
              {notification.message}
            </p>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 mt-2.5 pt-1.5 border-t border-slate-800/50">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-slate-300 transition"
              title="Copy message to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {notification.category === 'chat' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChat(notification.conversationId);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-[11px] text-indigo-300 border border-indigo-800/40 transition"
              >
                <MessageSquare className="w-3 h-3 text-indigo-400" />
                <span>Read Incognito</span>
              </button>
            )}

            {!notification.read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                className="ml-auto text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark Read</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
