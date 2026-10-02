import React, { useState, useRef } from 'react';
import { getAccessToken } from '../services/auth';
import { loadSheetConfig } from '../services/storage';
import { loadCardsFromSheet, type CardsByLast4 } from '../config/cards';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Copy,
  Download,
  Trash2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  ExternalLink,
} from 'lucide-react';
import { CardTransaction } from '../types';
import {
  parseChaseCSV,
  ChaseParsedResult,
  formatTransactionsForClipboard,
  formatTransactionsToCSV,
} from '../services/chaseImporter';

interface ChaseCsvImporterProps {
  theme?: 'light' | 'dark';
  onImportToDashboard?: (transactions: CardTransaction[]) => void;
}

export const ChaseCsvImporter: React.FC<ChaseCsvImporterProps> = ({
  theme = 'light',
  onImportToDashboard,
}) => {
  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedFiles, setParsedFiles] = useState<ChaseParsedResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [importedSuccess, setImportedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Card names from the connected sheet's Cards tab, offered when correcting a file's card.
  const [cards, setCards] = useState<CardsByLast4>({});

  // Handle file uploads
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setCopiedSuccess(false);
    setImportedSuccess(false);

    try {
      const results: ChaseParsedResult[] = [];
      // Card names from the connected sheet's Cards tab; without one, cards show as "Chase (...1234)".
      const token = await getAccessToken();
      const sheet = loadSheetConfig();
      const cards = token && sheet ? await loadCardsFromSheet(token, sheet.spreadsheetId) : {};
      setCards(cards);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.toLowerCase().endsWith('.csv')) {
          continue;
        }

        const text = await file.text();
        const parsed = parseChaseCSV(text, file.name, undefined, cards);
        results.push(parsed);
      }

      if (results.length === 0) {
        setErrorMsg('No valid .CSV files found. Please upload the CSV files downloaded from Chase.com.');
      } else {
        setParsedFiles((prev) => [...prev, ...results]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse Chase CSV file.';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Combine all valid transactions from all parsed files
  const allTransactions = parsedFiles.flatMap((f) => f.validTransactions);
  const totalSpend = allTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalExcludedPayments = parsedFiles.reduce((acc, f) => acc + f.skippedPaymentsCount, 0);

  // Update card name for a specific file
  const handleUpdateCardName = (index: number, newName: string) => {
    setParsedFiles((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;

      const updatedTxs = target.validTransactions.map((t) => ({
        ...t,
        cardName: newName,
      }));

      next[index] = {
        ...target,
        cardName: newName,
        validTransactions: updatedTxs,
      };
      return next;
    });
  };

  // Remove a parsed file
  const handleRemoveFile = (index: number) => {
    setParsedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Copy rows to clipboard
  const handleCopyRows = () => {
    if (allTransactions.length === 0) return;
    const tsv = formatTransactionsForClipboard(allTransactions);
    navigator.clipboard.writeText(tsv);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // Download merged CSV
  const handleDownloadCSV = () => {
    if (allTransactions.length === 0) return;
    const csvContent = formatTransactionsToCSV(allTransactions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Chase_AllCards_Combined_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import directly into dashboard
  const handleSyncToDashboard = () => {
    if (allTransactions.length === 0 || !onImportToDashboard) return;
    onImportToDashboard(allTransactions);
    setImportedSuccess(true);
    setTimeout(() => setImportedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Overview & Instructions Header */}
      <div className={`p-4 rounded-2xl border ${isLight ? 'bg-forest-50/60 border-forest-200 text-forest-900' : 'bg-forest-800/30 border-forest-600/20 text-forest-200'}`}>
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-forest-600 dark:text-forest-300 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Chase Historical Data Sync Tool</h4>
            <p className="leading-relaxed opacity-90">
              Drop all your downloaded Chase card CSVs below. This tool will auto-clean them, filter out credit card payment transfers (like <em>&quot;Payment Thank You&quot;</em>), label your cards, and generate clean rows ready to paste or import into your Google Sheet!
            </p>
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
          isLight
            ? 'border-forest-300 hover:border-forest-600 hover:bg-forest-50/40 bg-stone-50'
            : 'border-forest-700 hover:border-forest-600 hover:bg-forest-900/20 bg-forest-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-2xl bg-forest-600/10 text-forest-600 dark:text-forest-300 flex items-center justify-center">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <h4 className={`text-sm font-semibold ${isLight ? 'text-stone-800' : 'text-white'}`}>
            Click to upload or drag &amp; drop Chase CSVs
          </h4>
          <p className={`text-xs mt-1 ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
            You can select multiple files at once (one CSV per card)
          </p>
        </div>
        <button
          type="button"
          disabled={isProcessing}
          className="px-4 py-2 bg-forest-700 hover:bg-forest-600 text-white font-semibold rounded-xl text-xs transition pointer-events-none"
        >
          {isProcessing ? 'Processing files...' : 'Select Chase CSV Files'}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta-dark dark:text-terracotta-light flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Parsed files summary */}
      {parsedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-stone-200 dark:border-forest-700/60">
            <div>
              <h4 className={`font-bold text-sm ${isLight ? 'text-stone-900' : 'text-white'}`}>
                Parsed {parsedFiles.length} Card File{parsedFiles.length > 1 ? 's' : ''} ({allTransactions.length} Total Charges)
              </h4>
              <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
                ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total spend · Filtered out {totalExcludedPayments} payment transfers
              </p>
            </div>

            <button
              onClick={() => setParsedFiles([])}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-terracotta-dark dark:hover:text-terracotta-light flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>

          {/* Cards List */}
          <div className="grid gap-2.5 max-h-60 overflow-y-auto pr-1">
            {parsedFiles.map((file, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-white border-stone-200' : 'bg-forest-800/60 border-forest-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-forest-700/10 text-forest-600 dark:text-forest-300 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold truncate ${isLight ? 'text-stone-900' : 'text-white'}`}>
                        {file.fileName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-600/20 text-forest-700 dark:text-forest-300 font-bold shrink-0">
                        {file.validTransactions.length} charges
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      <span>${file.totalSpent.toFixed(2)}</span>
                      <span>·</span>
                      <span>{file.dateRange.start} to {file.dateRange.end}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={file.cardName}
                    onChange={(e) => handleUpdateCardName(idx, e.target.value)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border focus:outline-hidden focus:ring-1 focus:ring-forest-600 ${
                      isLight ? 'bg-stone-50 border-stone-300 text-stone-800' : 'bg-forest-800 border-forest-700 text-stone-200'
                    }`}
                  >
                    {[...new Set([file.cardName, ...Object.values(cards)])].map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-terracotta-dark dark:hover:text-terracotta-light rounded-lg hover:bg-stone-100 dark:hover:bg-forest-800 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-forest-800/40 border-forest-700'}`}>
            <h5 className={`font-semibold text-xs ${isLight ? 'text-stone-800' : 'text-stone-200'}`}>
              Sync to Google Sheet or Dashboard:
            </h5>

            <div className="grid sm:grid-cols-3 gap-2.5">
              {/* Option 1: Copy to clipboard for instant paste into Google Sheets */}
              <button
                onClick={handleCopyRows}
                className={`px-3 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition cursor-pointer border ${
                  copiedSuccess
                    ? 'bg-forest-600 text-white border-forest-200 dark:border-forest-600'
                    : 'bg-forest-700 hover:bg-forest-600 text-white border-transparent'
                }`}
              >
                {copiedSuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSuccess ? 'Copied to Clipboard!' : '1. Copy Rows for Sheet'}</span>
              </button>

              {/* Option 2: Download merged CSV file */}
              <button
                onClick={handleDownloadCSV}
                className={`px-3 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition cursor-pointer border ${
                  isLight
                    ? 'bg-white hover:bg-stone-100 text-stone-800 border-stone-300'
                    : 'bg-forest-900 hover:bg-forest-700 text-stone-200 border-forest-700'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>2. Download Merged CSV</span>
              </button>

              {/* Option 3: Direct app dashboard sync */}
              {onImportToDashboard && (
                <button
                  onClick={handleSyncToDashboard}
                  className={`px-3 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition cursor-pointer border ${
                    importedSuccess
                      ? 'bg-forest-600 text-white border-forest-200 dark:border-forest-600'
                      : isLight
                      ? 'bg-forest-50 hover:bg-forest-100 text-forest-700 border-forest-300'
                      : 'bg-forest-800/60 hover:bg-forest-900/60 text-forest-300 border-forest-700/60'
                  }`}
                >
                  {importedSuccess ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-forest-700 dark:text-forest-300" />}
                  <span>{importedSuccess ? 'Added to Dashboard!' : '3. Sync to Dashboard Now'}</span>
                </button>
              )}
            </div>

            {copiedSuccess && (
              <div className="p-2.5 rounded-xl bg-forest-500/10 border border-forest-500/30 text-forest-700 dark:text-forest-300 text-[11px] flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Copied {allTransactions.length} formatted rows!</strong> Open your Google Sheet, click in cell <strong>A2</strong> (or the first empty row), and press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong>).
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2 Simple Ways to Add to Google Sheet Guide */}
      <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-forest-800/30 border-forest-700'}`}>
        <h4 className={`font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-stone-900' : 'text-white'}`}>
          <ShieldCheck className="w-4 h-4 text-forest-600 dark:text-forest-300" />
          <span>How to put this data into your Google Sheet (Two Easy Ways):</span>
        </h4>

        <div className="grid sm:grid-cols-2 gap-3 text-[11px] leading-relaxed">
          {/* Way 1: Google Sheet Native Import */}
          <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-stone-200 text-stone-700' : 'bg-forest-800 border-forest-700 text-stone-300'}`}>
            <strong className="block font-semibold text-forest-600 dark:text-forest-300 mb-1">
              Method A: Google Sheets &quot;Append to Sheet&quot; (Fastest)
            </strong>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Click <strong>&quot;2. Download Merged CSV&quot;</strong> above (or use your Chase CSVs directly).</li>
              <li>Open your Google Sheet in your browser.</li>
              <li>Click <strong>File</strong> &rarr; <strong>Import</strong> &rarr; <strong>Upload</strong>.</li>
              <li>Drag in the CSV file.</li>
              <li>Under <em>Import location</em>, select <strong className="text-terracotta-dark dark:text-terracotta-light">&quot;Append to current sheet&quot;</strong> &rarr; click <strong>Import data</strong>!</li>
            </ol>
          </div>

          {/* Way 2: Direct Copy & Paste */}
          <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-stone-200 text-stone-700' : 'bg-forest-800 border-forest-700 text-stone-300'}`}>
            <strong className="block font-semibold text-forest-600 dark:text-forest-300 mb-1">
              Method B: 1-Click Copy &amp; Paste
            </strong>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Upload your Chase CSV files into the box above.</li>
              <li>Click <strong>&quot;1. Copy Rows for Sheet&quot;</strong>.</li>
              <li>Switch to your Google Sheet tab.</li>
              <li>Click on the first empty row under column <strong>A</strong>.</li>
              <li>Press <strong>Ctrl+V</strong> (Windows) or <strong>Cmd+V</strong> (Mac) to paste!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
