import React, { useState } from 'react';
import { HouseholdSettings } from '../types';
import { X, Sliders, DollarSign, Plus, RotateCcw, Check, Sun, Moon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: HouseholdSettings;
  onSaveSettings: (settings: HouseholdSettings) => void;
  onResetToDemoData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetToDemoData,
}) => {
  const [formData, setFormData] = useState<HouseholdSettings>({ ...settings });
  const [newKeyword, setNewKeyword] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const isLight = formData.theme === 'light';

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const clean = newKeyword.trim().toLowerCase();
    if (!formData.ignoredKeywords.includes(clean)) {
      setFormData({
        ...formData,
        ignoredKeywords: [...formData.ignoredKeywords, clean],
      });
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kw: string) => {
    setFormData({
      ...formData,
      ignoredKeywords: formData.ignoredKeywords.filter((k) => k !== kw),
    });
  };

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn">
      <div
        className={`border rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${
          isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-forest-800 border-forest-700 text-stone-100'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${isLight ? 'border-stone-200' : 'border-forest-700'}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isLight ? 'bg-forest-50 border-forest-200 text-forest-700' : 'bg-forest-600/20 border-forest-600/30 text-forest-300'
              }`}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-stone-900' : 'text-white'}`}>
                Household Settings
              </h2>
              <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
                Customize theme, budget target, display name & card filters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isLight ? 'text-stone-500 hover:text-stone-700 hover:bg-stone-100' : 'text-stone-400 hover:text-white hover:bg-forest-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Display Theme (Bright / Dark) */}
          <div>
            <label className={`block text-xs font-semibold mb-2 ${isLight ? 'text-stone-700' : 'text-stone-300'}`}>
              Display Appearance & Lighting
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: 'light', ambientModeTheme: 'light' })}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition cursor-pointer text-left ${
                  formData.theme === 'light'
                    ? 'border-forest-700 bg-forest-50/70 text-forest-900 font-semibold ring-2 ring-forest-600/30'
                    : isLight
                    ? 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    : 'border-forest-700 bg-forest-800 hover:bg-forest-800 text-stone-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-terracotta-light/70 text-terracotta-dark flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Light (Bright Room)</div>
                  <div className="text-[10px] opacity-75">Ideal for kitchen & daylight</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: 'dark', ambientModeTheme: 'dark' })}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition cursor-pointer text-left ${
                  formData.theme === 'dark'
                    ? 'border-forest-600 bg-forest-900/40 text-forest-200 font-semibold ring-2 ring-forest-600/30'
                    : isLight
                    ? 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    : 'border-forest-700 bg-forest-800 hover:bg-forest-800 text-stone-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-forest-900/60 text-forest-300 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Dark / Night</div>
                  <div className="text-[10px] opacity-75">Dim ambient / evening</div>
                </div>
              </button>
            </div>
          </div>

          {/* Monthly Budget Target */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-stone-700' : 'text-stone-300'}`}>
              Monthly Credit Card Budget Goal
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
                {formData.currencySymbol}
              </span>
              <input
                type="number"
                value={formData.monthlyBudget}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyBudget: parseFloat(e.target.value) || 0 })
                }
                className={`w-full rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-forest-600 border ${
                  isLight
                    ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400'
                    : 'bg-forest-800 border-forest-700 text-white placeholder:text-stone-500'
                }`}
              />
            </div>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
              Your household target for card charges (every card in the sheet).
            </p>
          </div>

          {/* Household Display Name */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-stone-700' : 'text-stone-300'}`}>
              Household Display Name
            </label>
            <input
              type="text"
              value={formData.householdName}
              onChange={(e) => setFormData({ ...formData, householdName: e.target.value })}
              className={`w-full rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-forest-600 border ${
                isLight
                  ? 'bg-stone-50 border-stone-300 text-stone-900'
                  : 'bg-forest-800 border-forest-700 text-white'
              }`}
            />
          </div>

          {/* Ignored Keywords (Debit / Rent / Mortgage suppression) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-xs font-semibold ${isLight ? 'text-stone-700' : 'text-stone-300'}`}>
                Excluded Debit & Payment Keywords
              </label>
              <span className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
                Filtered automatically
              </span>
            </div>
            <p className={`text-[11px] mb-2 ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
              Any transactions containing these words (e.g. mortgage, rent, card payments) will not count toward card spending:
            </p>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.ignoredKeywords.map((kw) => (
                <span
                  key={kw}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border ${
                    isLight
                      ? 'bg-stone-100 text-stone-700 border-stone-200'
                      : 'bg-forest-900 text-stone-300 border-forest-700'
                  }`}
                >
                  <span>{kw}</span>
                  <button
                    onClick={() => handleRemoveKeyword(kw)}
                    className="text-stone-400 hover:text-terracotta-dark dark:hover:text-terracotta-light cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add keyword (e.g. hoa, escrow)..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                className={`flex-1 rounded-xl px-3 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-forest-600 border ${
                  isLight
                    ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400'
                    : 'bg-forest-800 border-forest-700 text-white placeholder:text-stone-500'
                }`}
              />
              <button
                onClick={handleAddKeyword}
                className={`px-3 py-1.5 text-xs rounded-xl flex items-center gap-1 transition cursor-pointer border ${
                  isLight
                    ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200'
                    : 'bg-forest-900 hover:bg-forest-700 text-stone-300 border-forest-700'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className={`pt-4 border-t flex items-center justify-between ${isLight ? 'border-stone-200' : 'border-forest-700'}`}>
            <div>
              <div className={`text-xs font-semibold ${isLight ? 'text-stone-800' : 'text-stone-300'}`}>
                Sample Card Data
              </div>
              <div className={`text-[11px] ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
                Reload sample transactions
              </div>
            </div>
            <button
              onClick={() => {
                onResetToDemoData();
                onClose();
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition cursor-pointer ${
                isLight
                  ? 'border-stone-200 hover:bg-stone-100 text-stone-700'
                  : 'border-forest-700 hover:bg-forest-800 text-stone-300'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Demo</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-6 border-t flex items-center justify-end gap-3 ${
            isLight ? 'bg-stone-50 border-stone-200' : 'bg-forest-800/80 border-forest-700'
          }`}
        >
          <span className={`mr-auto text-xs tabular-nums ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
            Huishouden Spending {import.meta.env.VITE_APP_VERSION} ({import.meta.env.VITE_BUILD_SHA})
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs transition cursor-pointer ${
              isLight
                ? 'text-stone-600 hover:text-stone-900 bg-stone-200/80 hover:bg-stone-200'
                : 'text-stone-400 hover:text-white bg-forest-900 hover:bg-forest-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-forest-700 hover:bg-forest-600 transition cursor-pointer flex items-center gap-1.5"
          >
            {savedToast ? <Check className="w-4 h-4 text-forest-300" /> : null}
            <span>{savedToast ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
