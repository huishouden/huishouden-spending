import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Tablet,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Download,
  ShieldAlert,
  Sliders,
  Maximize2,
  Tv,
  CheckCircle2,
} from 'lucide-react';
import { usePWAInstall } from '../usePWAInstall';

interface PixelInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const PixelInstallModal: React.FC<PixelInstallModalProps> = ({
  isOpen,
  onClose,
  theme = 'light',
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // App URL for the tablet
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(
        appUrl,
        {
          width: 240,
          margin: 1.5,
          color: {
            dark: '#1b4332',
            light: '#ffffff',
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrCodeDataUrl(url);
          }
        }
      );
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div
        className={`border rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${
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
              <Tablet className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-stone-900' : 'text-white'}`}>
                Install on Google Pixel Tablet
              </h2>
              <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
                Add as a standalone fullscreen app on your kitchen dock
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed">
          {/* Note about direct installation */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              isLight ? 'bg-terracotta-light/35 border-terracotta/30 text-terracotta-dark' : 'bg-terracotta/10 border-terracotta/40 text-terracotta-light'
            }`}
          >
            <ShieldAlert className="w-5 h-5 shrink-0 text-terracotta-dark dark:text-terracotta-light mt-0.5" />
            <div className="text-xs">
              <div className="font-bold">Can it be installed remotely/directly?</div>
              <p className="mt-1 leading-normal opacity-90">
                For security reasons, Google Android and Chrome do not allow websites or cloud agents to install software onto your hardware tablet without your direct tap. However, you can add it in <strong>under 15 seconds</strong> by scanning the QR code below!
              </p>
            </div>
          </div>

          {/* Quick QR Code Scan Section */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-6 ${
              isLight ? 'bg-stone-50 border-stone-200' : 'bg-forest-900/40 border-forest-700/60'
            }`}
          >
            {qrCodeDataUrl ? (
              <div className="p-2.5 bg-white rounded-2xl shadow-md border border-stone-200 shrink-0">
                <img src={qrCodeDataUrl} alt="Scan to open on Pixel Tablet" className="w-36 h-36 rounded-lg" />
              </div>
            ) : (
              <div className="w-36 h-36 bg-stone-200 rounded-2xl flex items-center justify-center shrink-0">
                <QrCode className="w-10 h-10 text-stone-400 animate-pulse" />
              </div>
            )}

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-forest-600/10 text-forest-700 dark:text-forest-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Tablet Connect</span>
              </div>
              <h3 className={`font-bold text-base ${isLight ? 'text-stone-900' : 'text-white'}`}>
                Point your Pixel Tablet camera here
              </h3>
              <p className={`text-xs ${isLight ? 'text-stone-600' : 'text-stone-400'}`}>
                Open the Camera app on your Pixel Tablet and hold it up to this QR code to open the dashboard immediately.
              </p>

              {/* Copy URL */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className={`flex-1 rounded-xl px-3 py-1.5 text-xs font-mono border truncate ${
                    isLight
                      ? 'bg-white border-stone-300 text-stone-700'
                      : 'bg-forest-800 border-forest-700 text-stone-300'
                  }`}
                />
                <button
                  onClick={handleCopyUrl}
                  className={`px-3 py-1.5 text-xs rounded-xl flex items-center gap-1 font-semibold transition cursor-pointer border ${
                    copied
                      ? 'bg-forest-600 text-white border-forest-600'
                      : isLight
                      ? 'bg-stone-200/80 hover:bg-stone-200 text-stone-700 border-stone-300'
                      : 'bg-forest-700 hover:bg-stone-600 text-stone-200 border-stone-600'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* If browser supports 1-click install prompt */}
          {isInstallable && !isInstalled && (
            <div className="p-4 rounded-2xl bg-forest-700 text-white flex items-center justify-between shadow-lg">
              <div>
                <div className="font-bold text-sm">Install directly on this device?</div>
                <div className="text-xs text-forest-100">
                  Your browser supports 1-tap installation right now.
                </div>
              </div>
              <button
                onClick={install}
                className="px-4 py-2 rounded-xl bg-white text-forest-700 font-bold text-xs hover:bg-forest-50 shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Install App</span>
              </button>
            </div>
          )}

          {/* Step-by-Step Instructions */}
          <div className="space-y-4">
            <h3 className={`font-bold text-sm uppercase tracking-wider ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
              3-Step Installation on Pixel Tablet
            </h3>

            <div className="space-y-3">
              <div className={`p-4 rounded-2xl border flex items-start gap-4 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-forest-900/40 border-forest-700/60'}`}>
                <div className="w-7 h-7 rounded-xl bg-forest-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-sm">Open in Chrome</h4>
                  <p className={`text-xs mt-1 ${isLight ? 'text-stone-600' : 'text-stone-400'}`}>
                    Open Google Chrome on your Pixel Tablet and visit the link above (or scan the QR code).
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border flex items-start gap-4 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-forest-900/40 border-forest-700/60'}`}>
                <div className="w-7 h-7 rounded-xl bg-forest-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-sm">Tap the 3 dots (⋮) &gt; &quot;Install app&quot;</h4>
                  <p className={`text-xs mt-1 ${isLight ? 'text-stone-600' : 'text-stone-400'}`}>
                    In the top-right corner of Chrome, tap the <strong>three dots (⋮)</strong> menu and select <strong className="text-forest-700 dark:text-forest-300">&quot;Install app&quot;</strong> (or &quot;Add to Home screen&quot;). Tap <strong>&quot;Install&quot;</strong> when prompted.
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border flex items-start gap-4 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-forest-900/40 border-forest-700/60'}`}>
                <div className="w-7 h-7 rounded-xl bg-forest-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-sm">Launch Fullscreen & Dock Tablet</h4>
                  <p className={`text-xs mt-1 ${isLight ? 'text-stone-600' : 'text-stone-400'}`}>
                    Tap the new <strong className={isLight ? 'text-stone-800' : 'text-stone-200'}>Card Spend</strong> icon on your Pixel Tablet home screen. It will open in a borderless fullscreen kiosk view without browser tabs or address bars!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Tips for Pixel Tablet Speaker Dock */}
          <div className={`p-5 rounded-2xl border space-y-3 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-forest-900/40 border-forest-700/60'}`}>
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-forest-600 dark:text-forest-300" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-forest-700 dark:text-forest-300">
                Pixel Tablet Dock & Ambient Mode Tips
              </h4>
            </div>

            <ul className={`space-y-2 text-xs ${isLight ? 'text-stone-600' : 'text-stone-300'}`}>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-700 dark:text-forest-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Keep Screen Awake while Docked:</strong> In Android Settings &rarr; Display &rarr; Screen timeout, or in Developer Options turn on <em>&quot;Stay awake while charging&quot;</em> so the tablet acts as an always-on dashboard.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-700 dark:text-forest-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Toggle Ambient Mode:</strong> Click the <strong>Ambient Mode (Dock)</strong> button in the top bar to switch to high-visibility large typography with clock, monthly budget status, and card summary.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-700 dark:text-forest-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy Mode:</strong> If guests visit your kitchen, tap the <strong>Privacy Eye</strong> to blur out monetary dollar values with a single tap.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-5 border-t flex items-center justify-between ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-forest-800/80 border-forest-700'}`}>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-forest-500" />
            <span className={isLight ? 'text-stone-600' : 'text-stone-400'}>
              PWA Service Worker & Offline Cache Active
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-forest-700 hover:bg-forest-600 text-white transition cursor-pointer shadow-sm"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
