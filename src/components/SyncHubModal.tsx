import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Shield, 
  Radio, 
  X,
  Server,
  Layers
} from 'lucide-react';
import { SyncState, SyncMutation } from '../types';
import { syncEngine } from '../services/syncEngine';
import { notisaveDB } from '../db/indexedDb';

interface SyncHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: SyncState;
  isOnline: boolean;
}

export const SyncHubModal: React.FC<SyncHubModalProps> = ({
  isOpen,
  onClose,
  syncState,
  isOnline,
}) => {
  const [queuedMutations, setQueuedMutations] = useState<SyncMutation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadQueue();
    }
  }, [isOpen, syncState.pendingCount]);

  const loadQueue = async () => {
    const queue = await notisaveDB.getSyncQueue();
    setQueuedMutations(queue);
  };

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsProcessing(true);
    setBackupMessage(null);
    try {
      const res = await syncEngine.processSyncQueue();
      if (res.success) {
        setBackupMessage(`Sync complete! Processed ${res.processed} mutations.`);
      } else {
        setBackupMessage(`Sync finished with ${res.errors} retries queued.`);
      }
      await loadQueue();
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePullCloud = async () => {
    setIsProcessing(true);
    try {
      const res = await syncEngine.pullFromCloud();
      setBackupMessage(`Pulled ${res.count} records from cloud backup replica.`);
      await loadQueue();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    const json = await syncEngine.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notisave-cloud-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage('Cloud backup exported successfully!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const res = await syncEngine.importBackup(content);
      if (res.success) {
        setBackupMessage(`Restored ${res.count} notifications from file!`);
      } else {
        setBackupMessage(`Import failed: ${res.error}`);
      }
      await loadQueue();
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isOnline ? 'bg-indigo-600/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Real-Time Data Sync Hub
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                IndexedDB offline store with zero-loss background syncing
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

        {/* Feedback message */}
        {backupMessage && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{backupMessage}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Real-time Status Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Engine State:</span>
              <span className="font-mono font-bold text-white flex items-center gap-1.5">
                {syncState.status === 'syncing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span className="text-amber-400">Syncing in background</span>
                  </>
                ) : syncState.status === 'synced' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">All data in sync</span>
                  </>
                ) : syncState.status === 'offline' ? (
                  <>
                    <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400">Queuing mutations locally</span>
                  </>
                ) : (
                  <span className="text-slate-200">{syncState.status}</span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-center">
              <div className="p-2 rounded-xl bg-slate-900/80">
                <span className="text-[10px] text-slate-500 block uppercase">Pending Queue</span>
                <span className="text-sm font-extrabold text-amber-400">{queuedMutations.length}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80">
                <span className="text-[10px] text-slate-500 block uppercase">Synced Total</span>
                <span className="text-sm font-extrabold text-emerald-400">{syncState.totalSyncedCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80">
                <span className="text-[10px] text-slate-500 block uppercase">Conflicts Resolved</span>
                <span className="text-sm font-extrabold text-indigo-400">{syncState.conflictCount}</span>
              </div>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isProcessing || !isOnline}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                isOnline
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Synchronizing Queue...' : 'Force Sync Now'}</span>
            </button>
          </div>

          {/* Conflict Resolution Strategy */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Conflict Resolution Policy
            </span>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              {[
                { id: 'last-write-wins', label: 'Last Write Wins (Timestamp)', desc: 'Auto-merges latest change based on high-precision clock.' },
                { id: 'client-authoritative', label: 'Device Local Authoritative', desc: 'Always prioritizes Android device edits over remote.' },
                { id: 'cloud-authoritative', label: 'Cloud Authoritative', desc: 'Remote server backup takes precedence.' },
              ].map(opt => (
                <label
                  key={opt.id}
                  onClick={() => syncEngine.setConflictStrategy(opt.id as any)}
                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                    syncState.conflictStrategy === opt.id
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="conflict"
                    checked={syncState.conflictStrategy === opt.id}
                    onChange={() => {}}
                    className="mt-0.5 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold block">{opt.label}</span>
                    <span className="text-[11px] text-slate-400">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Multi-Tab Real-time Broadcast Status */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <span className="text-xs font-semibold text-white">BroadcastChannel Relay</span>
                <span className="text-[11px] text-slate-400 block">Instant sync between tabs & devices</span>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              ACTIVE
            </span>
          </div>

          {/* Backup & Restore Controls */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Cloud Snapshot & Backup
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export JSON</span>
              </button>

              <label className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer">
                <ArrowUpFromLine className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restore Backup</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>

            <button
              onClick={handlePullCloud}
              disabled={isProcessing}
              className="w-full py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-center gap-1.5"
            >
              <Server className="w-3 h-3 text-slate-400" />
              <span>Pull Latest Cloud Replica</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
          >
            Close Sync Hub
          </button>
        </div>
      </div>
    </div>
  );
};
