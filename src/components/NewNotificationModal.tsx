import React, { useState } from 'react';
import { Send, X, Sparkles, AlertTriangle, BellRing } from 'lucide-react';
import { SupportedAppId } from '../types';
import { APP_METADATA } from '../services/notificationSimulator';

interface NewNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    appId: SupportedAppId;
    sender: string;
    message: string;
    isDeleted: boolean;
    originalMessage?: string;
  }) => void;
}

export const NewNotificationModal: React.FC<NewNotificationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [appId, setAppId] = useState<SupportedAppId>('whatsapp');
  const [sender, setSender] = useState('');
  const [message, setMessage] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);
  const [originalMessage, setOriginalMessage] = useState('');

  if (!isOpen) return null;

  const appKeys = Object.keys(APP_METADATA) as SupportedAppId[];

  const handleApplyPreset = (preset: {
    appId: SupportedAppId;
    sender: string;
    message: string;
    isDeleted: boolean;
    originalMessage?: string;
  }) => {
    setAppId(preset.appId);
    setSender(preset.sender);
    setMessage(preset.message);
    setIsDeleted(preset.isDeleted);
    setOriginalMessage(preset.originalMessage || '');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sender.trim() || !message.trim()) return;

    onSubmit({
      appId,
      sender: sender.trim(),
      message: message.trim(),
      isDeleted,
      originalMessage: isDeleted ? (originalMessage.trim() || message.trim()) : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Simulate Incoming Notification</h3>
              <p className="text-[11px] text-slate-400">
                Trigger a live Android push notification to test autosave & recovery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-5 space-y-4">
          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Test Presets
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleApplyPreset({
                  appId: 'whatsapp',
                  sender: 'Jessica Alba',
                  message: 'This message was deleted',
                  isDeleted: true,
                  originalMessage: 'Hey! I bought the concert tickets for tomorrow!',
                })}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-left transition"
              >
                <span className="font-bold text-emerald-400 block">WhatsApp Deleted Msg</span>
                <span className="text-[10px] text-slate-400">Tests Notisave recovery</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset({
                  appId: 'telegram',
                  sender: 'Crypto Whale Alerts',
                  message: '10,000 BTC transferred from unknown wallet to Binance.',
                  isDeleted: false,
                })}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-left transition"
              >
                <span className="font-bold text-sky-400 block">Telegram Alert</span>
                <span className="text-[10px] text-slate-400">Real-time chat push</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset({
                  appId: 'sms',
                  sender: 'Bank 2FA Security',
                  message: 'Your verification code is 952041. Do not share with anyone.',
                  isDeleted: false,
                })}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-left transition"
              >
                <span className="font-bold text-blue-400 block">Bank OTP SMS</span>
                <span className="text-[10px] text-slate-400">Keyword test</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset({
                  appId: 'instagram',
                  sender: 'photo_nomad',
                  message: 'Started a live video: "Sunset over Mount Fuji 🗻"',
                  isDeleted: false,
                })}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-left transition"
              >
                <span className="font-bold text-pink-400 block">Instagram Push</span>
                <span className="text-[10px] text-slate-400">Social feed alert</span>
              </button>
            </div>
          </div>

          {/* App Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Target Application</label>
            <div className="grid grid-cols-4 gap-2">
              {appKeys.map((key) => {
                const meta = APP_METADATA[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAppId(key)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition text-[11px] font-medium ${
                      appId === key
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="truncate w-full text-center">{meta.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sender */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Sender Name / Channel</label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="e.g. Liam Smith, Slack #general"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Notification Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type notification content..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Simulate sender deleting message toggle */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Simulate "Message Deleted by Sender"
              </span>
              <input
                type="checkbox"
                checked={isDeleted}
                onChange={(e) => {
                  setIsDeleted(e.target.checked);
                  if (e.target.checked && !originalMessage) {
                    setOriginalMessage(message);
                  }
                }}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </label>

            {isDeleted && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Original Text Saved by Notisave before deletion:
                </label>
                <input
                  type="text"
                  value={originalMessage}
                  onChange={(e) => setOriginalMessage(e.target.value)}
                  placeholder="Enter the secret original message..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-950/40 flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Fire Notification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
