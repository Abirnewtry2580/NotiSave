import React, { useState } from 'react';
import { 
  ArrowLeft, 
  EyeOff, 
  ShieldCheck, 
  Search, 
  Copy, 
  Check, 
  Trash2, 
  CheckCheck,
  AlertTriangle,
  Send
} from 'lucide-react';
import { AppNotification } from '../types';

interface ChatReaderViewProps {
  notifications: AppNotification[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onMarkRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
}

export const ChatReaderView: React.FC<ChatReaderViewProps> = ({
  notifications,
  selectedConversationId,
  onSelectConversation,
  onMarkRead,
  onDeleteNotification,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatSearch, setChatSearch] = useState('');

  // Group notifications by conversation
  const chatNotifications = notifications.filter(n => n.category === 'chat' || n.category === 'social');

  const conversationsMap = chatNotifications.reduce((acc, curr) => {
    const key = curr.conversationId || curr.sender;
    if (!acc[key]) {
      acc[key] = {
        id: key,
        sender: curr.sender,
        appId: curr.appId,
        appName: curr.appName,
        appColor: curr.appColor,
        avatarUrl: curr.avatarUrl,
        unreadCount: 0,
        lastMessage: curr,
        messages: [] as AppNotification[],
      };
    }
    acc[key].messages.push(curr);
    if (!curr.read) acc[key].unreadCount++;
    return acc;
  }, {} as Record<string, {
    id: string;
    sender: string;
    appId: string;
    appName: string;
    appColor: string;
    avatarUrl?: string;
    unreadCount: number;
    lastMessage: AppNotification;
    messages: AppNotification[];
  }>);

  const conversationsList = Object.values(conversationsMap).sort(
    (a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp
  );

  const filteredConversations = conversationsList.filter(c => 
    c.sender.toLowerCase().includes(chatSearch.toLowerCase()) ||
    c.messages.some(m => m.message.toLowerCase().includes(chatSearch.toLowerCase()))
  );

  const currentChat = selectedConversationId ? conversationsMap[selectedConversationId] : null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatChatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // If a conversation is active, render chat thread
  if (currentChat) {
    const sortedMessages = [...currentChat.messages].sort((a, b) => a.timestamp - b.timestamp);

    return (
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {/* Chat Thread Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectConversation(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Back to chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0 overflow-hidden"
              style={{ backgroundColor: currentChat.appColor }}
            >
              {currentChat.avatarUrl ? (
                <img src={currentChat.avatarUrl} alt={currentChat.sender} className="w-full h-full object-cover" />
              ) : (
                currentChat.sender.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{currentChat.sender}</h3>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: currentChat.appColor }}
                >
                  {currentChat.appName}
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <EyeOff className="w-3 h-3" />
                Incognito (No Blue Ticks Sent)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                currentChat.messages.forEach(m => onMarkRead(m.id));
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center gap-1"
              title="Mark entire chat read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mark Read</span>
            </button>
          </div>
        </div>

        {/* Incognito Notice Banner */}
        <div className="bg-indigo-950/40 border-b border-indigo-900/30 px-4 py-1.5 flex items-center justify-center gap-1.5 text-[11px] text-indigo-300">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>You are reading saved notifications. The sender will NOT see you online or read.</span>
        </div>

        {/* Message Bubble List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedMessages.map((msg) => (
            <div key={msg.id} className="flex flex-col items-start max-w-[85%]">
              <div
                className={`rounded-2xl p-3 border shadow-sm ${
                  msg.isDeletedBySender
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-100'
                }`}
              >
                {/* Deleted Recovery Flag */}
                {msg.isDeletedBySender && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold mb-1 pb-1 border-b border-amber-500/20">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Sender deleted this message on {msg.appName}!</span>
                  </div>
                )}

                <p className="text-xs font-normal leading-relaxed">
                  {msg.isDeletedBySender
                    ? msg.originalMessage || msg.message
                    : msg.message}
                </p>

                <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-slate-800/40 text-[10px] text-slate-400">
                  <span className="font-mono">{formatChatTime(msg.timestamp)}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(msg.id, msg.originalMessage || msg.message)}
                      className="hover:text-white p-0.5"
                      title="Copy"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteNotification(msg.id)}
                      className="hover:text-rose-400 p-0.5"
                      title="Delete saved message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Read-only explanation */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Notisave Secret Vault • {sortedMessages.length} messages archived</span>
          </div>
          <span className="text-[11px] text-slate-500">Read-Only Mode</span>
        </div>
      </div>
    );
  }

  // Conversation List View
  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-indigo-400" />
              Unseen Chat Reader
            </h2>
            <p className="text-xs text-slate-400">
              Read incoming chats secretly without triggering blue ticks
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {conversationsList.length} chats
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
            placeholder="Search contacts or chat messages..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <EyeOff className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-400">No chat notifications yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Incoming WhatsApp, Telegram, or Messenger chats will automatically appear here for incognito reading.
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:bg-slate-900 hover:border-indigo-500/40 transition cursor-pointer flex items-center gap-3"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shrink-0 overflow-hidden shadow-xs relative"
                style={{ backgroundColor: conv.appColor }}
              >
                {conv.avatarUrl ? (
                  <img src={conv.avatarUrl} alt={conv.sender} className="w-full h-full object-cover" />
                ) : (
                  conv.sender.charAt(0)
                )}
                <span
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-950"
                  style={{ backgroundColor: conv.appColor }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-sm font-bold text-white truncate">{conv.sender}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatChatTime(conv.lastMessage.timestamp)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 truncate pr-2">
                    {conv.lastMessage.isDeletedBySender ? (
                      <span className="text-amber-400 font-medium">
                        [Deleted msg recovered] {conv.lastMessage.originalMessage}
                      </span>
                    ) : (
                      conv.lastMessage.message
                    )}
                  </p>

                  {conv.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px] shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
