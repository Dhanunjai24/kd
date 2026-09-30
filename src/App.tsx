import React, { useState } from 'react';
import { KaamDostProvider, useKaamDost } from './context/KaamDostContext';
import { CustomerApp } from './components/customer/CustomerApp';
import { WorkerApp } from './components/worker/WorkerApp';
import {
  Smartphone,
  Columns2,
  HardHat,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Sparkles,
  Layers,
  Wifi,
  WifiOff,
} from 'lucide-react';

type ViewMode = 'CUSTOMER' | 'WORKER' | 'DUAL_SYNC';

function getInitialViewMode(): ViewMode {
  try {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role') || params.get('app') || params.get('view');
    if (roleParam === 'customer') return 'CUSTOMER';
    if (roleParam === 'worker') return 'WORKER';
    if (roleParam === 'dual' || roleParam === 'split') return 'DUAL_SYNC';
    const globalRole = (window as any).APP_ROLE;
    if (globalRole === 'customer') return 'CUSTOMER';
    if (globalRole === 'worker') return 'WORKER';
    // Default to DUAL_SYNC on desktop screens, or CUSTOMER on small mobile screens
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'CUSTOMER';
    }
  } catch {
    // fallback safe
  }
  return 'DUAL_SYNC';
}

const KaamDostShell: React.FC = () => {
  const {
    toasts,
    dismissToast,
    uiDemoState,
    setUiDemoState,
    simulateIncomingJobForWorker,
    isConnectedWs,
  } = useKaamDost();

  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [showStateBar, setShowStateBar] = useState<boolean>(false);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      const url = new URL(window.location.href);
      if (mode === 'CUSTOMER') url.searchParams.set('role', 'customer');
      else if (mode === 'WORKER') url.searchParams.set('role', 'worker');
      else url.searchParams.set('role', 'dual');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // safe fallback
    }
  };

  React.useEffect(() => {
    const handlePopState = () => {
      setViewMode(getInitialViewMode());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex flex-col">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Zone 1: Brand Wordmark + WebSocket Live Status Indicator */}
        <div className="flex items-center gap-3">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              changeViewMode('CUSTOMER');
            }}
            className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap hover:text-blue-600 transition"
          >
            KaamDost
          </a>
          <div
            title={
              isConnectedWs
                ? 'WebSocket Real-Time Bus Connected'
                : 'Connecting to Real-Time Bus...'
            }
            className="flex items-center gap-1.5 text-xs"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnectedWs ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
              {isConnectedWs ? 'Live Sync' : 'Syncing...'}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation / App Switcher */}
        <nav
          aria-label="App Experience Switcher"
          className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-xl"
        >
          <button
            type="button"
            onClick={() => changeViewMode('CUSTOMER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              viewMode === 'CUSTOMER'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Customer App</span>
          </button>

          <button
            type="button"
            onClick={() => changeViewMode('WORKER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              viewMode === 'WORKER'
                ? 'bg-[#0F172A] text-amber-400 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Worker App</span>
          </button>

          <button
            type="button"
            onClick={() => changeViewMode('DUAL_SYNC')}
            className={`hidden md:flex px-3 py-1.5 rounded-lg text-xs font-bold transition-colors items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              viewMode === 'DUAL_SYNC'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Split View (Live WS Sync)</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowStateBar(!showStateBar)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              uiDemoState !== 'normal' || showStateBar
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">UI States:</span>
            <span className="capitalize">{uiDemoState}</span>
          </button>

          <button
            type="button"
            onClick={() => simulateIncomingJobForWorker()}
            className="hidden sm:flex px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold items-center gap-1.5 whitespace-nowrap transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Test Job</span>
          </button>
        </div>
      </header>

      {/* UI State System Inspector Bar */}
      {showStateBar && (
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="font-bold text-slate-600 mr-1">
            Preview Reusable UI States:
          </span>
          {(
            [
              { id: 'normal', label: 'Live Data (Normal)' },
              { id: 'skeleton', label: 'Skeleton Shimmer Loading' },
              { id: 'empty', label: 'Empty State' },
              { id: 'error', label: 'Error + Retry State' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setUiDemoState(st.id)}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                uiDemoState === st.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto sm:py-6 sm:px-4 flex justify-center items-start">
        {viewMode === 'CUSTOMER' && (
          <div className="w-full max-w-[428px] bg-[#F7F9FD] sm:rounded-[44px] sm:shadow-2xl sm:border-[8px] sm:border-slate-900 overflow-hidden">
            <CustomerApp onSwitchToWorkerApp={() => changeViewMode('WORKER')} />
          </div>
        )}

        {viewMode === 'WORKER' && (
          <div className="w-full max-w-[428px] bg-[#F7F9FD] sm:rounded-[44px] sm:shadow-2xl sm:border-[8px] sm:border-slate-900 overflow-hidden">
            <WorkerApp onSwitchToCustomerApp={() => changeViewMode('CUSTOMER')} />
          </div>
        )}

        {viewMode === 'DUAL_SYNC' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start justify-items-center">
            {/* Split Screen Left: Customer App */}
            <div className="w-full max-w-[428px] flex flex-col items-center">
              <div className="mb-2.5 hidden sm:flex items-center justify-between w-full px-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Customer App (Alex Carter)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  WebSocket Live
                </span>
              </div>
              <div className="w-full bg-[#F7F9FD] sm:rounded-[44px] sm:shadow-2xl sm:border-[8px] sm:border-slate-900 overflow-hidden">
                <CustomerApp
                  onSwitchToWorkerApp={() => changeViewMode('WORKER')}
                />
              </div>
            </div>

            {/* Split Screen Right: Worker Partner App */}
            <div className="w-full max-w-[428px] flex flex-col items-center">
              <div className="mb-2.5 hidden sm:flex items-center justify-between w-full px-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Worker App (Daniel Walker)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Real-Time Dispatch
                </span>
              </div>
              <div className="w-full bg-[#F7F9FD] sm:rounded-[44px] sm:shadow-2xl sm:border-[8px] sm:border-slate-900 overflow-hidden">
                <WorkerApp
                  onSwitchToCustomerApp={() => changeViewMode('CUSTOMER')}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Floating Toast Feedback System */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-[#0F172A] text-white rounded-2xl p-3.5 shadow-xl border border-slate-700 flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-150"
          >
            {t.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {t.type === 'warning' && (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            {t.type === 'info' && (
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-snug">{t.title}</p>
              {t.subtitle && (
                <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                  {t.subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-white cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <KaamDostProvider>
      <KaamDostShell />
    </KaamDostProvider>
  );
}
