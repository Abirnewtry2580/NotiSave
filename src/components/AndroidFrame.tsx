import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Bell, ChevronDown, Smartphone, Monitor } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  onOpenShade: () => void;
  unreadCount: number;
  isDeviceMode: boolean;
  onToggleDeviceMode: () => void;
  isOnline: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  onOpenShade,
  unreadCount,
  isDeviceMode,
  onToggleDeviceMode,
  isOnline,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(
        d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col items-center justify-center ${isDeviceMode ? 'p-2 sm:p-4 md:p-6' : 'p-0'}`}>
      {/* Top Floating View Switcher for Desktop Preview */}
      <div className="fixed top-3 right-3 z-50 hidden md:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-full px-3 py-1.5 shadow-xl text-xs">
        <span className="text-slate-400 font-medium hidden sm:inline">Preview Mode:</span>
        <button
          onClick={onToggleDeviceMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition ${
            isDeviceMode
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Switch to Android Phone frame"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android Frame</span>
        </button>
        <button
          onClick={onToggleDeviceMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition ${
            !isDeviceMode
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Switch to full screen responsive viewport"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Full Width</span>
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full bg-slate-950 flex flex-col transition-all duration-300 relative ${
          isDeviceMode
            ? 'max-w-[430px] h-[92vh] max-h-[890px] rounded-[44px] shadow-2xl ring-1 ring-slate-800 border-[10px] border-slate-900 overflow-hidden'
            : 'min-h-screen max-w-full'
        }`}
      >
        {/* Android Status Bar (Clickable to open Notification Shade) */}
        <header
          onClick={onOpenShade}
          className="h-10 bg-slate-950/95 backdrop-blur-md px-5 flex items-center justify-between text-xs font-semibold select-none cursor-pointer z-40 border-b border-slate-800/40 hover:bg-slate-900/50 transition group"
          title="Tap to pull down Android Notification Shade"
        >
          {/* Left: Clock & Notifications Indicator */}
          <div className="flex items-center gap-2 text-slate-200">
            <span className="font-bold tracking-tight text-sm font-sans">{timeStr || '6:28'}</span>
            {unreadCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded-full">
                <Bell className="w-2.5 h-2.5 fill-indigo-400" />
                <span>{unreadCount}</span>
              </span>
            )}
          </div>

          {/* Center: Punch-hole camera simulator */}
          {isDeviceMode && (
            <div className="w-3.5 h-3.5 rounded-full bg-black ring-1 ring-slate-800 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900/80" />
            </div>
          )}

          {/* Right: Network, Wi-Fi, VoLTE, Battery */}
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            {isOnline ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-slate-400">5G</span>
                <Wifi className="w-3.5 h-3.5 text-slate-200" />
              </div>
            ) : (
              <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 text-[9px] rounded font-semibold">
                OFFLINE
              </span>
            )}
            <div className="flex items-center gap-1 bg-slate-900/80 px-1.5 py-0.5 rounded-md border border-slate-800">
              <span className="font-mono text-[10px]">68%</span>
              <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition" />
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>

        {/* Android Navigation Pill / Bottom Handle */}
        {isDeviceMode && (
          <div className="h-5 bg-slate-950 flex items-center justify-center shrink-0">
            <div className="w-28 h-1 rounded-full bg-slate-700/60" />
          </div>
        )}
      </div>
    </div>
  );
};
