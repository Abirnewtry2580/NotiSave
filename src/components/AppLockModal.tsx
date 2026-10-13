import React, { useState } from 'react';
import { Lock, Fingerprint, ShieldCheck, Delete, KeyRound } from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface AppLockModalProps {
  isLocked: boolean;
  correctPin: string;
  onUnlock: () => void;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({
  isLocked,
  correctPin,
  onUnlock,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState(false);

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    soundEffects.playPopSound();
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setErrorMsg(false);

      if (next.length === 4) {
        if (next === correctPin) {
          soundEffects.playSuccessChime();
          onUnlock();
          setEnteredPin('');
        } else {
          setErrorMsg(true);
          setTimeout(() => {
            setEnteredPin('');
            setErrorMsg(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    soundEffects.playPopSound();
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleBiometricSim = () => {
    soundEffects.playSuccessChime();
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
      {/* Top Lock Icon & Branding */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-3 shadow-lg shadow-indigo-950/50">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-white">Notisave Vault Locked</h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter 4-digit PIN to access private notifications
        </p>
        <p className="text-[10px] text-indigo-400/80 font-mono mt-0.5">
          (Default PIN: 1234)
        </p>
      </div>

      {/* PIN Dots Indicator */}
      <div className="flex items-center gap-4 mb-8">
        {[0, 1, 2, 3].map((idx) => {
          const filled = idx < enteredPin.length;
          return (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                errorMsg
                  ? 'bg-rose-500 animate-shake'
                  : filled
                  ? 'bg-indigo-500 scale-125 shadow-md shadow-indigo-500/50'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          );
        })}
      </div>

      {errorMsg && (
        <span className="text-xs text-rose-400 font-semibold mb-4 animate-shake">
          Incorrect PIN. Try again.
        </span>
      )}

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            className="w-18 h-18 mx-auto rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-indigo-600/30 text-xl font-bold text-white flex items-center justify-center transition shadow-sm active:scale-95"
          >
            {digit}
          </button>
        ))}

        {/* Biometrics button */}
        <button
          onClick={handleBiometricSim}
          className="w-18 h-18 mx-auto rounded-full bg-slate-900/60 border border-slate-800 hover:bg-slate-800 text-indigo-400 flex flex-col items-center justify-center transition active:scale-95"
          title="Simulate Fingerprint Biometrics"
        >
          <Fingerprint className="w-6 h-6" />
          <span className="text-[9px] font-bold mt-0.5">FINGERPRINT</span>
        </button>

        <button
          onClick={() => handleDigit('0')}
          className="w-18 h-18 mx-auto rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-indigo-600/30 text-xl font-bold text-white flex items-center justify-center transition shadow-sm active:scale-95"
        >
          0
        </button>

        {/* Backspace button */}
        <button
          onClick={handleDelete}
          className="w-18 h-18 mx-auto rounded-full bg-slate-900/60 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {/* Security notice */}
      <div className="mt-8 flex items-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
        <span>Hardware-backed encryption simulated</span>
      </div>
    </div>
  );
};
