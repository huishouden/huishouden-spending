import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  ExternalLink,
  Layers,
  HelpCircle,
  CreditCard,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mail,
  Play,
  Clock,
  CheckCircle2,
  FileCode,
  BellRing,
} from 'lucide-react';
import { GMAIL_APPS_SCRIPT_CODE } from '../services/appsScriptCode';

interface GoogleSheetGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSyncModal?: () => void;
  theme?: 'light' | 'dark';
  initialTab?: 'quickstart' | 'gmail_sync' | 'columns' | 'chase_robinhood' | 'template';
}

const SAMPLE_CSV_ROWS = [
  ['Date', 'Description', 'Amount', 'Category', 'Card', 'Type'],
  ['2026-09-25', 'Whole Foods Market', '142.80', 'Groceries', 'Example Card', 'Sale'],
  ['2026-09-24', 'Chevron Fuel', '58.40', 'Gas & Fuel', 'Example Card', 'Sale'],
  ['2026-09-23', 'The French Bistro', '128.50', 'Dining & Food', 'Example Card', 'Sale'],
  ['2026-09-22', 'Target', '89.15', 'Shopping', 'Example Card', 'Sale'],
  ['2026-09-20', 'Netflix Subscription', '22.99', 'Entertainment', 'Example Card', 'Sale'],
  ['2026-09-18', 'Trader Joe\'s', '76.40', 'Groceries', 'Example Card', 'Sale'],
  ['2026-09-16', 'Delta Air Lines', '340.00', 'Travel', 'Example Card', 'Sale'],
  ['2026-09-15', 'AUTOMATIC PAYMENT - THANK YOU', '1250.00', 'Payment', 'Example Card', 'Payment'],
  ['2026-09-14', 'CVS Pharmacy', '32.18', 'Medical', 'Example Card', 'Sale'],
  ['2026-09-12', 'Home Depot', '115.60', 'Home & Maintenance', 'Example Card', 'Sale'],
];

export const GoogleSheetGuideModal: React.FC<GoogleSheetGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenSyncModal,
  theme = 'light',
  initialTab = 'quickstart',
}) => {
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'quickstart' | 'gmail_sync' | 'columns' | 'chase_robinhood' | 'template'>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const generateTSV = () => {
    return SAMPLE_CSV_ROWS.map((row) => row.join('\t')).join('\n');
  };

  const generateCSV = () => {
    return SAMPLE_CSV_ROWS.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const handleCopyTemplate = () => {
    const tsv = generateTSV();
    navigator.clipboard.writeText(tsv);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GMAIL_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([GMAIL_APPS_SCRIPT_CODE], { type: 'application/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Chase_Robinhood_Gmail_Sync.gs');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCSV = () => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'household_card_spend_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div
        className={`border rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Google Sheet Setup & Sync Guide
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  Gmail Auto-Sync Included
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                How to connect your card transactions, columns, and free Chase & Robinhood automation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-6 pt-3 gap-5 text-sm overflow-x-auto ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`pb-3 font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'quickstart'
                ? isLight
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-indigo-400 border-b-2 border-indigo-500'
                : isLight
                ? 'text-slate-500 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Where & How to Create
          </button>

          <button
            onClick={() => setActiveTab('gmail_sync')}
            className={`pb-3 font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'gmail_sync'
                ? isLight
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-amber-400 border-b-2 border-amber-500'
                : isLight
                ? 'text-slate-600 hover:text-amber-600'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>2. ⚡ Free Gmail Auto-Sync</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold">
              Chase & RH
            </span>
          </button>

          <button
            onClick={() => setActiveTab('columns')}
            className={`pb-3 font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'columns'
                ? isLight
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-indigo-400 border-b-2 border-indigo-500'
                : isLight
                ? 'text-slate-500 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Required Columns
          </button>

          <button
            onClick={() => setActiveTab('chase_robinhood')}
            className={`pb-3 font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'chase_robinhood'
                ? isLight
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-indigo-400 border-b-2 border-indigo-500'
                : isLight
                ? 'text-slate-500 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Manual CSV Exports
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`pb-3 font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'template'
                ? isLight
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-indigo-400 border-b-2 border-indigo-500'
                : isLight
                ? 'text-slate-500 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5. Starter Template & CSV
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed">
          {/* TAB 1: QUICKSTART */}
          {activeTab === 'quickstart' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border ${isLight ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950' : 'bg-indigo-950/30 border-indigo-800 text-indigo-200'}`}>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm">Where does the data live?</h3>
                    <p className="text-xs mt-1 leading-normal opacity-90">
                      The data lives securely in a regular <strong>Google Sheet</strong> inside your personal Google Drive. The app reads your sheet via Google OAuth and formats it into this kitchen/ambient display.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Follow these 4 simple steps:
                </h3>

                <div className="grid gap-3.5">
                  <div className={`p-4 rounded-2xl border flex items-start gap-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/60'}`}>
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm">Open Google Drive</h4>
                        <a
                          href="https://drive.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-semibold"
                        >
                          drive.google.com <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        In your browser, go to Google Drive signed into the Google account that owns the spreadsheet.
                      </p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-start gap-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/60'}`}>
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">Create a New Google Sheet</h4>
                      <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Click <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>+ New</strong> in the upper left of Google Drive &rarr; Select <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Google Sheets</strong> &rarr; <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Blank spreadsheet</strong>. Name it <code className="px-1 py-0.5 bg-slate-200/60 dark:bg-slate-800 rounded text-xs font-mono">Household Card Spend 2026</code>.
                      </p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-start gap-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/60'}`}>
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">Add Headers & Transactions</h4>
                      <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Add the 6 standard headers across Row 1: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Date, Description, Amount, Category, Card, Type</strong>. Or automate it via Tab 2 (Gmail Sync) or paste our template in Tab 5!
                      </p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-start gap-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/60'}`}>
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">Connect in This Dashboard</h4>
                      <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Click <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Connect Google Sheet</strong> in the top header. You can pick your sheet directly from your Google Drive list with 1 tap, or paste its browser URL.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GMAIL AUTO-SYNC */}
          {activeTab === 'gmail_sync' && (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-950' : 'bg-gradient-to-r from-amber-950/40 to-orange-950/30 border-amber-800/80 text-amber-100'}`}>
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base">Automatic Sync: Gmail &rarr; Google Sheet</h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        Newest Data at Top (Row 2)
                      </span>
                    </div>
                    <p className="text-xs mt-1 opacity-90 leading-relaxed">
                      Whenever you swipe your <strong>Visa</strong>, <strong>Chase</strong> or <strong>Robinhood</strong> card, the bank sends an email purchase alert to your Gmail. Install the trigger while signed in as the account that receives those alerts. This updated Google Apps Script runs directly inside your Google Sheet on a 15-minute background schedule, parses the transaction, and inserts it at the <strong>very top of the spreadsheet (Row 2)</strong> so newest charges are always immediately visible without scrolling!
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Steps Setup Walkthrough */}
              <div className="space-y-3">
                <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Quick Setup (Takes ~2 minutes):
                </h3>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'}`}>
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                      1
                    </div>
                    <h4 className="font-bold text-xs">Open Apps Script</h4>
                    <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      In your Google Sheet, click <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Extensions</strong> in the top menu &rarr; <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Apps Script</strong>.
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'}`}>
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                      2
                    </div>
                    <h4 className="font-bold text-xs">Paste the Script</h4>
                    <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Select all code in the script editor, replace with the code below, and click <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Save</strong> (floppy disk).
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'}`}>
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                      3
                    </div>
                    <h4 className="font-bold text-xs">Run setupAutoSyncTrigger</h4>
                    <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Select <code className="font-mono text-[10px] bg-slate-200/60 dark:bg-slate-700 px-1 py-0.5 rounded">setupAutoSyncTrigger</code> in the dropdown &rarr; Click <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Run</strong>. Authorize permissions once.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Alerts Checklist */}
              <div className="grid sm:grid-cols-3 gap-3.5">
                <div className={`p-4 rounded-2xl border ${isLight ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-950/20 border-purple-900/60'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-lg bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">VI</span>
                    <h4 className="font-bold text-xs text-purple-900 dark:text-purple-200">Visa Purchase Alerts</h4>
                  </div>
                  <p className={`text-[11px] leading-normal ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Scans <strong>alerts@cardalerts.visa.com</strong>, Visa Purchase Alerts, and cards with &quot;Visa ending in XXXX&quot;.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${isLight ? 'bg-blue-50/50 border-blue-200' : 'bg-blue-950/20 border-blue-900/60'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">CH</span>
                    <h4 className="font-bold text-xs text-blue-900 dark:text-blue-200">Chase Transaction Alerts</h4>
                  </div>
                  <p className={`text-[11px] leading-normal ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Chase card single-transaction alerts sent to email.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-900/60'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">RH</span>
                    <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">Robinhood</h4>
                  </div>
                  <p className={`text-[11px] leading-normal ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Robinhood card purchase notifications sent to your Gmail.
                  </p>
                </div>
              </div>

              {/* Bonus Helper Tip: Sort Existing Rows */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isLight ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-emerald-950/20 border-emerald-800 text-emerald-200'}`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="font-bold">Have existing thousands of transactions at the bottom?</strong>
                  <p className="mt-0.5 opacity-90">
                    In Apps Script, select the function <code className="font-mono text-[11px] bg-emerald-200/50 dark:bg-emerald-900/50 px-1 py-0.5 rounded font-bold">sortEntireSheetNewestFirst</code> from the dropdown and click <strong>Run</strong>. It will instantly organize all your thousands of rows with the newest dates at the very top of Row 2!
                  </p>
                </div>
              </div>

              {/* Script Copy / Download Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-xs">Ready-to-Use Google Apps Script</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyScript}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                        copiedScript
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : isLight
                          ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                          : 'bg-amber-950/60 border-amber-800 text-amber-200 hover:bg-amber-900/60'
                      }`}
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'Copied Apps Script!' : 'Copy Script Code'}</span>
                    </button>

                    <button
                      onClick={handleDownloadScript}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .gs File</span>
                    </button>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-300 font-mono text-[11px] max-h-72 overflow-y-auto p-4 leading-relaxed">
                  <pre className="whitespace-pre">{GMAIL_APPS_SCRIPT_CODE}</pre>
                </div>
              </div>

              {/* Multi-Account or Different Gmail Account Instructions */}
              <div className={`p-4 rounded-2xl border ${isLight ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950' : 'bg-indigo-950/20 border-indigo-800 text-indigo-200'}`}>
                <h4 className="font-bold text-xs flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span>Are your card alerts going to a different Gmail account?</span>
                </h4>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  If the Gmail account receiving your Chase or Robinhood alerts is different from the Google account that owns your Google Sheet, choose either option:
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5 mt-2.5">
                  <div className={`p-3 rounded-xl border text-[11px] ${isLight ? 'bg-white border-indigo-200' : 'bg-slate-900 border-indigo-900/60'}`}>
                    <strong className="block font-semibold text-indigo-600 dark:text-indigo-400">Option 1: 1-Click Gmail Forwarding Filter (Easiest)</strong>
                    <span className="opacity-80">
                      In the alert Gmail account: Go to <em>Settings &rarr; Filters &rarr; Create new filter</em> with <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">from: alerts@chase.com OR notifications@robinhood.com</code> &rarr; check <strong>Forward to</strong> your sheet&apos;s email address.
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border text-[11px] ${isLight ? 'bg-white border-indigo-200' : 'bg-slate-900 border-indigo-900/60'}`}>
                    <strong className="block font-semibold text-indigo-600 dark:text-indigo-400">Option 2: Standalone Script with Sheet ID</strong>
                    <span className="opacity-80">
                      Share your Google Sheet with your alert email as <strong>Editor</strong>. In <a href="https://script.google.com" target="_blank" rel="noreferrer" className="underline font-semibold">script.google.com</a> under your alert account, paste this script and put your sheet ID into <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">SPREADSHEET_ID: &apos;...&apos;</code>.
                    </span>
                  </div>
                </div>
              </div>

              {/* Feature Safeguards */}
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/30 border-slate-700/60'}`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Never Duplicates</strong>
                    <span className="opacity-80 text-[11px]">Labels processed emails &amp; checks existing row fingerprints.</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/30 border-slate-700/60'}`}>
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Auto-Categorizes</strong>
                    <span className="opacity-80 text-[11px]">Maps merchants into Groceries, Dining, Gas, Travel, etc.</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/30 border-slate-700/60'}`}>
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Runs Every 15 Min</strong>
                    <span className="opacity-80 text-[11px]">Completely automated background sync via Google cloud triggers.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLUMNS */}
          {activeTab === 'columns' && (
            <div className="space-y-5">
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                The app uses flexible, smart column matching. You do not need to worry about exact casing or column order:
              </p>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'}>
                    <tr>
                      <th className="p-3 font-bold border-b border-slate-200 dark:border-slate-700">Column Name</th>
                      <th className="p-3 font-bold border-b border-slate-200 dark:border-slate-700">Recognized Aliases</th>
                      <th className="p-3 font-bold border-b border-slate-200 dark:border-slate-700">Example Values</th>
                      <th className="p-3 font-bold border-b border-slate-200 dark:border-slate-700">Purpose in Dashboard</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-700' : 'divide-slate-800 text-slate-300'}`}>
                    <tr>
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">Date</td>
                      <td className="p-3 opacity-80">Transaction Date, Post Date</td>
                      <td className="p-3 font-mono text-[11px]">2026-09-24, 09/24/2026</td>
                      <td className="p-3">Filters by current month &amp; pacing days elapsed.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">Description</td>
                      <td className="p-3 opacity-80">Merchant, Payee, Vendor, Name</td>
                      <td className="p-3 font-mono text-[11px]">Whole Foods, Chevron, Netflix</td>
                      <td className="p-3">Shown on recent activity feeds &amp; card drills.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">Amount</td>
                      <td className="p-3 opacity-80">Cost, Charge, Spend, Price</td>
                      <td className="p-3 font-mono text-[11px]">142.50 or $142.50</td>
                      <td className="p-3">Total card spend and budget pacing math.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">Category</td>
                      <td className="p-3 opacity-80">Type, Group, Classification</td>
                      <td className="p-3 font-mono text-[11px]">Groceries, Dining, Gas, Travel</td>
                      <td className="p-3">Powers the category breakdown &amp; visual bars.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">Card</td>
                      <td className="p-3 opacity-80">Account, Card Name, Account Name</td>
                      <td className="p-3 font-mono text-[11px]">Names from the Cards tab</td>
                      <td className="p-3">Splits spending between Chase, Robinhood, etc.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-slate-500">Type (Optional)</td>
                      <td className="p-3 opacity-80">Transaction Type, Trans Type</td>
                      <td className="p-3 font-mono text-[11px]">Sale, Debit, Payment</td>
                      <td className="p-3">Credit card payment rows are automatically ignored.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-800 text-amber-300'}`}>
                <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold">Automatic Keyword Filtering:</div>
                  <p className="mt-0.5 opacity-90">
                    If your bank statement includes payments (e.g. <em>&quot;AUTOMATIC PAYMENT - THANK YOU&quot;</em> or <em>&quot;CHASE CREDIT CRD EPAY&quot;</em>), the app automatically filters them so they don&apos;t skew your spending totals.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHASE & ROBINHOOD EXPORTS */}
          {activeTab === 'chase_robinhood' && (
            <div className="space-y-6">
              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    CH
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Chase credit cards</h4>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Importing older historical CSV exports into your Google Sheet</p>
                  </div>
                </div>

                {/* Built-in tool callout */}
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-3 my-2">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span><strong>Built-in Chase CSV Cleaner:</strong> Use the &quot;Import Chase CSVs&quot; tab in the Connect Sheet window to drop multiple card CSVs, filter out payments, and copy formatted rows directly into your sheet!</span>
                  </div>
                  {onOpenSyncModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSyncModal();
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs whitespace-nowrap cursor-pointer transition shrink-0"
                    >
                      Open Importer
                    </button>
                  )}
                </div>

                <div className="space-y-2 mt-3">
                  <strong className="block text-xs font-semibold">How to sync your downloaded Chase CSVs to your Google Sheet:</strong>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700/60'}`}>
                      <strong className="text-indigo-400 block mb-1">Method 1: Google Sheets &quot;Append to Sheet&quot;</strong>
                      <ol className="list-decimal pl-4 space-y-1 text-[11px] opacity-90">
                        <li>Open your credit card Google Sheet.</li>
                        <li>Click <strong>File</strong> &rarr; <strong>Import</strong> &rarr; <strong>Upload</strong>.</li>
                        <li>Select your Chase CSV.</li>
                        <li>Choose <strong>&quot;Append to current sheet&quot;</strong> &rarr; click <strong>Import data</strong>.</li>
                        <li>The app automatically filters out <em>&quot;Payment Thank You&quot;</em> rows!</li>
                      </ol>
                    </div>

                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700/60'}`}>
                      <strong className="text-indigo-400 block mb-1">Method 2: 1-Click Copy &amp; Paste</strong>
                      <ol className="list-decimal pl-4 space-y-1 text-[11px] opacity-90">
                        <li>Open our app&apos;s <strong>&quot;Import Chase CSVs&quot;</strong> tab.</li>
                        <li>Drop your Chase CSV files.</li>
                        <li>Click <strong>&quot;Copy Rows for Sheet&quot;</strong>.</li>
                        <li>Go to your Google Sheet &rarr; click first empty row &rarr; press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong>)!</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                    RH
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Robinhood</h4>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Exporting transactions from Robinhood</p>
                  </div>
                </div>
                <ol className={`list-decimal list-inside space-y-2 text-xs mt-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <li>Open the <strong className={isLight ? 'text-slate-900' : 'text-white'}>Robinhood</strong> app or log into robinhood.com.</li>
                  <li>Navigate to the <strong className={isLight ? 'text-slate-900' : 'text-white'}>Credit Card</strong> tab.</li>
                  <li>Scroll to <strong className={isLight ? 'text-slate-900' : 'text-white'}>Recent Activity</strong> or click <strong className={isLight ? 'text-slate-900' : 'text-white'}>Statements &amp; Documents</strong>.</li>
                  <li>Export your latest monthly statement as a CSV / spreadsheet.</li>
                  <li>Include <strong>Robinhood</strong> in the card's name in the <strong>Cards</strong> tab to get its badge.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 5: STARTER TEMPLATE */}
          {activeTab === 'template' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Ready-to-Use Spreadsheet Template
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Copy to clipboard or download as a .CSV file ready to upload to Google Drive.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyTemplate}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                      copiedTemplate
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : isLight
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                        : 'bg-indigo-950/60 border-indigo-800 text-indigo-300 hover:bg-indigo-900'
                    }`}
                  >
                    {copiedTemplate ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedTemplate ? 'Copied to Clipboard!' : 'Copy Template Rows'}</span>
                  </button>

                  <button
                    onClick={handleDownloadCSV}
                    className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .CSV</span>
                  </button>
                </div>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-64 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className={`sticky top-0 ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'}`}>
                    <tr>
                      {SAMPLE_CSV_ROWS[0].map((header, i) => (
                        <th key={i} className="p-2.5 font-bold border-b border-slate-200 dark:border-slate-700">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-700' : 'divide-slate-800 text-slate-300'}`}>
                    {SAMPLE_CSV_ROWS.slice(1).map((row, rIndex) => (
                      <tr key={rIndex} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}>
                        <td className="p-2 font-mono">{row[0]}</td>
                        <td className="p-2 font-medium">{row[1]}</td>
                        <td className="p-2 font-mono font-semibold">${row[2]}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'}`}>
                            {row[3]}
                          </span>
                        </td>
                        <td className="p-2 text-[11px] font-semibold">{row[4]}</td>
                        <td className="p-2 text-[10px] opacity-70">{row[5]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`p-4 rounded-xl border text-xs ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}>
                <strong>How to paste into Google Sheets:</strong> Click cell <strong>A1</strong> in a new Google Sheet and press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px]">Ctrl + V</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px]">Cmd + V</kbd> on Mac). All headers and transactions will format across columns A through F automatically.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-5 border-t flex items-center justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'}`}>
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
              Auto-syncs every 15 mins with Google Sheet &amp; Gmail
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs transition cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-200/80 hover:bg-slate-200' : 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700'
              }`}
            >
              Close Guide
            </button>

            {onOpenSyncModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSyncModal();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <span>Connect Google Sheet Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
