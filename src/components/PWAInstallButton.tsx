import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check, QrCode, Copy, ExternalLink, Sparkles } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installedFeedback, setInstalledFeedback] = useState(false);

  // If already running as an installed PWA in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-dev-u2sytzp5zi56u3qkgf6ru3-485257464560.asia-southeast1.run.app';

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstalledFeedback(true);
        setTimeout(() => setInstalledFeedback(false), 3000);
        return;
      }
    }
    // Show download & install modal with QR code & instructions
    setShowModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-indigo-950/40 transition active:scale-95"
        title="Download and install Notisave app"
      >
        {installedFeedback ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            <span>Installed!</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 animate-bounce" />
            <span>Download App</span>
          </>
        )}
      </button>

      {/* Download & Installation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Download & Install Notisave</h3>
                  <p className="text-[11px] text-slate-400">Android PWA with offline & real-time sync</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Install on Android Instructions */}
            <div className="my-4 space-y-3">
              <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-slate-100 shadow-md">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>You are already viewing the app on your phone!</span>
                </div>
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  You don't need to scan the QR code because you already have the app open in your mobile browser.
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
                    <span>Look at the very top right of your Chrome browser</span>
                  </div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
                    <span>Tap the three dots icon (<strong className="text-indigo-400 text-sm">⋮</strong>)</span>
                  </div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">3</span>
                    <span>Tap <strong className="text-emerald-400">"Install app"</strong> or <strong className="text-emerald-400">"Add to Home screen"</strong></span>
                  </div>
                </div>
              </div>

              {/* APK Download Option */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    APK ফাইল ডাউনলোড করতে চান?
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    APK Generator
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  PWABuilder দিয়ে এই অ্যাপটির সরাসরি ইনস্টলেবল Android .APK ফাইল তৈরি করে ডাউনলোড করতে নিচের বাটনে চাপ দিন:
                </p>
                <a
                  href={`https://www.pwabuilder.com/?url=${encodeURIComponent(appUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-950/40"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>PWABuilder এ APK তৈরি করুন (Free)</span>
                </a>
              </div>

              {/* Direct Web Usage */}
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-xs shadow-lg shadow-indigo-950/50 hover:from-indigo-500 hover:to-blue-500 transition active:scale-95"
              >
                Close & Use Notisave in Browser Now
              </button>

              {/* Optional Share / QR Code for other devices */}
              <details className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                <summary className="font-bold text-slate-300 cursor-pointer flex items-center justify-between">
                  <span>Want to install on another device? (Show QR Code)</span>
                </summary>
                <div className="pt-3 flex flex-col items-center text-center">
                  <div className="p-2 bg-white rounded-2xl shadow-inner my-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(appUrl)}`}
                      alt="Scan to open Notisave on mobile"
                      className="w-32 h-32 rounded-lg"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Scan with a second phone's camera to open Notisave
                  </p>
                </div>
              </details>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Works 100% offline with zero setup required. Local notifications, unseen chats, and sync are active right now.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
