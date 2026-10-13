import React, { useState } from 'react';
import { 
  BellOff, 
  VolumeX, 
  Volume2, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Sliders, 
  Info,
  Check
} from 'lucide-react';
import { AppRule, SupportedAppId } from '../types';
import { APP_METADATA } from '../services/notificationSimulator';

interface BlockRulesTabProps {
  rules: Record<string, AppRule>;
  onUpdateRule: (rule: AppRule) => void;
}

export const BlockRulesTab: React.FC<BlockRulesTabProps> = ({
  rules,
  onUpdateRule,
}) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<SupportedAppId>('whatsapp');

  const appKeys = Object.keys(APP_METADATA) as SupportedAppId[];

  const getRule = (appId: SupportedAppId): AppRule => {
    return (
      rules[appId] || {
        appId,
        appName: APP_METADATA[appId].name,
        blockedFromStatusBar: false,
        muted: false,
        saveDeletedMessages: true,
        keywordFilters: [],
      }
    );
  };

  const handleToggleBlock = (appId: SupportedAppId) => {
    const cur = getRule(appId);
    onUpdateRule({
      ...cur,
      blockedFromStatusBar: !cur.blockedFromStatusBar,
    });
  };

  const handleToggleMute = (appId: SupportedAppId) => {
    const cur = getRule(appId);
    onUpdateRule({
      ...cur,
      muted: !cur.muted,
    });
  };

  const handleAddKeyword = (appId: SupportedAppId) => {
    if (!newKeyword.trim()) return;
    const cur = getRule(appId);
    const existing = cur.keywordFilters || [];
    if (!existing.includes(newKeyword.trim())) {
      onUpdateRule({
        ...cur,
        keywordFilters: [...existing, newKeyword.trim().toLowerCase()],
      });
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (appId: SupportedAppId, kw: string) => {
    const cur = getRule(appId);
    onUpdateRule({
      ...cur,
      keywordFilters: (cur.keywordFilters || []).filter(k => k !== kw),
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BellOff className="w-5 h-5 text-indigo-400" />
              Clean Status Bar & App Blocker
            </h2>
            <p className="text-xs text-slate-400">
              Keep your Android status bar clean by silencing noisy app alerts while keeping them safely saved in Notisave
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-indigo-950/30 border-b border-indigo-900/30 flex items-start gap-2.5 text-xs text-indigo-300">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Blocked notifications will bypass the Android heads-up popup and save straight to your Notisave inbox.
        </p>
      </div>

      {/* App rules list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Installed Applications ({appKeys.length})
        </h3>

        {appKeys.map((appId) => {
          const meta = APP_METADATA[appId];
          const rule = getRule(appId);

          return (
            <div
              key={appId}
              className={`p-3.5 rounded-2xl border transition ${
                rule.blockedFromStatusBar
                  ? 'bg-slate-900/90 border-amber-500/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm"
                    style={{ backgroundColor: meta.color }}
                  >
                    {meta.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{meta.name}</h4>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {rule.blockedFromStatusBar ? (
                        <span className="text-amber-400 font-semibold">Clean Bar Active (Silent)</span>
                      ) : (
                        `${meta.category} app`
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mute button */}
                  <button
                    onClick={() => handleToggleMute(appId)}
                    className={`p-2 rounded-xl transition ${
                      rule.muted
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title={rule.muted ? 'Unmute chime' : 'Mute chime'}
                  >
                    {rule.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* Toggle Block from Status Bar */}
                  <button
                    onClick={() => handleToggleBlock(appId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      rule.blockedFromStatusBar
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <BellOff className="w-3.5 h-3.5" />
                    <span>{rule.blockedFromStatusBar ? 'Blocked' : 'Allow'}</span>
                  </button>
                </div>
              </div>

              {/* Keyword Filters Section */}
              {rule.keywordFilters && rule.keywordFilters.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Filtered:</span>
                  {rule.keywordFilters.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1"
                    >
                      <span>{kw}</span>
                      <button
                        onClick={() => handleRemoveKeyword(appId, kw)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Custom Keyword Filter Box */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 mt-6">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Add Keyword Mute Rule
          </h4>
          <p className="text-[11px] text-slate-400">
            Automatically silence notifications containing promo codes, OTPs, or marketing keywords.
          </p>

          <div className="flex gap-2">
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value as SupportedAppId)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {appKeys.map(k => (
                <option key={k} value={k}>{APP_METADATA[k].name}</option>
              ))}
            </select>

            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="e.g. discount, loan, urgent"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword(selectedAppId)}
            />

            <button
              onClick={() => handleAddKeyword(selectedAppId)}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
