import React, { useState } from 'react';
import { 
  Settings, 
  Lock, 
  Volume2, 
  Trash2, 
  Radio, 
  Smartphone, 
  X, 
  ShieldCheck, 
  Info,
  Check,
  Bell
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearAll: () => void;
  isSimulating: boolean;
  onToggleSimulator: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearAll,
  isSimulating,
  onToggleSimulator,
}) => {
  const [newPin, setNewPin] = useState(settings.passcode);
  const [pinSaved, setPinSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleSavePin = () => {
    if (newPin.length === 4) {
      onUpdateSettings({ passcode: newPin, passcodeEnabled: true });
      setPinSaved(true);
      setTimeout(() => setPinSaved(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Notisave Settings</h3>
              <p className="text-[11px] text-slate-400">Security, playback, and offline sync preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* App Lock & Security */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-indigo-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">App Lock (Passcode Protection)</h4>
                  <p className="text-[11px] text-slate-400">Lock saved messages with a 4-digit PIN</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.passcodeEnabled}
                onChange={(e) => onUpdateSettings({ passcodeEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </div>

            {settings.passcodeEnabled && (
              <div className="pt-2 border-t border-slate-900 flex items-center gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Set 4-digit PIN"
                  className="w-32 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-center font-mono tracking-widest text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSavePin}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500 flex items-center gap-1"
                >
                  {pinSaved ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{pinSaved ? 'Saved' : 'Update PIN'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Sound & Haptics */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Notification Chime</h4>
                <p className="text-[11px] text-slate-400">Play Android Material sound when notifications arrive</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
            />
          </div>

          {/* Live Notification Auto-Emitter */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className={`w-4 h-4 ${isSimulating ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
              <div>
                <h4 className="text-xs font-bold text-white">Live Notification Feed</h4>
                <p className="text-[11px] text-slate-400">Automatically simulate realistic Android alerts every 15s</p>
              </div>
            </div>
            <button
              onClick={onToggleSimulator}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                isSimulating
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {isSimulating ? 'Stop' : 'Start'}
            </button>
          </div>

          {/* Device Frame View Mode */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Android Phone Shell View</h4>
                <p className="text-[11px] text-slate-400">Display within Android phone mockup frame</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.deviceViewMode}
              onChange={(e) => onUpdateSettings({ deviceViewMode: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
            />
          </div>

          {/* Clear Notifications Database */}
          <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <div>
                  <h4 className="text-xs font-bold text-rose-300">Clear Notification Archive</h4>
                  <p className="text-[11px] text-rose-400/80">Wipes local IndexedDB and sync queue</p>
                </div>
              </div>
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 text-xs font-bold transition"
                >
                  Clear All
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onClearAll();
                      setConfirmClear(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* About Notisave Pro */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Notisave Android Edition</span>
            <span className="font-mono text-indigo-400">v4.2.0 • Offline Ready</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
