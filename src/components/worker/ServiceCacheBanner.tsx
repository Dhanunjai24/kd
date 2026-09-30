import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useKaamDost } from '../../context/KaamDostContext';
import { ServiceCacheItem } from '../../utils/serviceCache';

export const ServiceCacheBanner: React.FC = () => {
  const {
    isConnectedWs,
    isOnlineEffective,
    isOfflineSimulated,
    toggleOfflineSimulation,
    serviceCacheItems,
    pendingCacheCount,
    syncServiceCacheNow,
    clearAllServiceCache,
    removeCacheItem,
    showToast,
    triggerHaptic,
  } = useKaamDost();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleManualSync = () => {
    if (!isConnectedWs || isOfflineSimulated) {
      showToast(
        'Cannot Sync: Connection Inactive',
        'Turn off Offline Simulation or check WebSocket connection to sync.',
        'warning'
      );
      return;
    }

    setIsSyncing(true);
    triggerHaptic([40, 40]);
    setTimeout(() => {
      const result = syncServiceCacheNow();
      setIsSyncing(false);
      if (result.syncedCount > 0) {
        showToast(
          `⚡ Service Cache Synced (${result.syncedCount})`,
          'All pending status updates & messages dispatched to WebSocket bus.',
          'success'
        );
      } else {
        showToast('Cache is already in sync', 'No pending items to flush.', 'info');
      }
    }, 400);
  };

  return (
    <>
      {/* Top Inline Network & Service Cache Status Strip */}
      <div className="bg-slate-900/90 text-white px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isOnlineEffective ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Wifi className="w-3.5 h-3.5" />
              <span>Live Synced</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold animate-pulse">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isOfflineSimulated ? 'Offline Simulated' : 'Offline / Poor Signal'}
              </span>
            </div>
          )}

          <span className="text-slate-500 text-[11px]">·</span>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(30);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Database className="w-3 h-3 text-sky-400" />
            <span>
              Service Cache: <strong>{pendingCacheCount}</strong> queued
            </span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Quick Offline Simulation Toggle */}
          <button
            type="button"
            onClick={() => {
              toggleOfflineSimulation();
            }}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
              isOfflineSimulated
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Simulate entering a basement parking or elevator shaft with zero network"
          >
            {isOfflineSimulated ? (
              <>
                <WifiOff className="w-2.5 h-2.5" />
                <span>Exit Offline</span>
              </>
            ) : (
              <>
                <Zap className="w-2.5 h-2.5 text-amber-400" />
                <span>Test Offline</span>
              </>
            )}
          </button>

          {pendingCacheCount > 0 && isOnlineEffective && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Pending Items Alert Banner (when items are waiting in localStorage) */}
      {pendingCacheCount > 0 && (
        <div className="bg-gradient-to-r from-amber-900/90 to-amber-950 text-amber-200 px-4 py-2 border-b border-amber-800/80 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30 shrink-0">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-white text-[11px] leading-tight">
                {pendingCacheCount} Offline Action{pendingCacheCount > 1 ? 's' : ''} Cached
              </p>
              <p className="text-[10px] text-amber-300/80">
                {isOnlineEffective
                  ? 'Ready to auto-sync to WebSocket bus'
                  : 'Saved safely in localStorage · Will sync once reconnected'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isOnlineEffective ? (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 cursor-pointer shadow-xs transition"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-800/60 hover:bg-amber-800 text-amber-100 border border-amber-700/60 cursor-pointer"
              >
                View Items
              </button>
            )}
          </div>
        </div>
      )}

      {/* Service Cache Inspector Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 text-white border border-slate-700/80 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    Service Cache & Offline Queue
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Durable localStorage persistence for technicians
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Connection Status Pill Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3">
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Network State
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-bold">
                    {isOnlineEffective ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-emerald-400">Online & Connected</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-amber-400">
                          {isOfflineSimulated ? 'Offline (Simulated)' : 'Offline'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3">
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Cached in LocalStorage
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-bold">
                    <span className="text-white tabular-nums text-base">
                      {pendingCacheCount}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      pending ({serviceCacheItems.length} total)
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulation Mode Toggle Card */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simulate Network Loss (Basement Mode)</span>
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Cuts WebSocket transport to test offline status and chat queueing
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      toggleOfflineSimulation();
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      isOfflineSimulated ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isOfflineSimulated ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Cached Items Queue List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">
                    Queue Timeline ({serviceCacheItems.length})
                  </span>
                  {serviceCacheItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        clearAllServiceCache();
                        showToast('Service Cache Cleared', 'All stored actions removed.', 'info');
                      }}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {serviceCacheItems.length === 0 ? (
                  <div className="bg-slate-800/30 border border-dashed border-slate-700/80 rounded-2xl p-6 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                    <p className="text-xs font-bold text-white">Service Cache is Clear</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      All status updates and chat messages are synced with the WebSocket server.
                      Toggle &ldquo;Test Offline&rdquo; above and change an active job status or send a chat to see the queue in action.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {serviceCacheItems.map((item: ServiceCacheItem) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl p-3 border text-xs space-y-1.5 transition ${
                          item.status === 'SYNCED'
                            ? 'bg-slate-800/30 border-slate-700/50 text-slate-400'
                            : 'bg-slate-800/90 border-slate-700 text-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {item.type === 'STATUS_UPDATE' ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                STATUS
                              </span>
                            ) : item.type === 'CHAT_MESSAGE' ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                CHAT
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                EXTRA WORK
                              </span>
                            )}
                            <span className="font-semibold text-slate-200">
                              #{item.bookingId}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {item.formattedTime}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeCacheItem(item.id)}
                              className="text-slate-500 hover:text-rose-400 cursor-pointer p-0.5"
                              title="Delete from cache"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Payload Detail */}
                        <div className="bg-slate-900/60 rounded-xl p-2 text-[11px] font-mono">
                          {item.type === 'STATUS_UPDATE' && (
                            <div className="flex items-center gap-1 text-sky-300">
                              <ArrowRight className="w-3 h-3" />
                              <span>
                                New Status: <strong>{(item.payload as any).status}</strong>
                              </span>
                            </div>
                          )}
                          {item.type === 'CHAT_MESSAGE' && (
                            <div className="text-slate-200">
                              <span className="text-slate-400">Message: </span>
                              &ldquo;{(item.payload as any).message?.text}&rdquo;
                            </div>
                          )}
                          {item.type === 'EXTRA_WORK_REQUEST' && (
                            <div className="text-amber-300">
                              <span>Part: {(item.payload as any).extraItem?.title}</span>{' '}
                              <span>(₹{(item.payload as any).extraItem?.price})</span>
                            </div>
                          )}
                        </div>

                        {/* Item Status */}
                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                          <span className="text-slate-400">
                            {item.bookingTitle || 'Service Job'}
                          </span>
                          <span
                            className={`font-bold ${
                              item.status === 'SYNCED'
                                ? 'text-emerald-400'
                                : item.status === 'FAILED'
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {item.status === 'SYNCED'
                              ? '✓ Synced to WebSocket'
                              : item.status === 'FAILED'
                              ? 'Failed (Will Retry)'
                              : 'Queued in LocalStorage'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Informative Guarantee Callout */}
              <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-3 text-[11px] text-emerald-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-emerald-300">
                    Zero Data Loss Guarantee
                  </span>
                  <p className="text-slate-300 text-[10px] leading-relaxed">
                    KaamDost Service Cache ensures every status update and customer chat message is immediately persisted in browser storage and seamlessly forwarded the moment your connection recovers.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
              <span className="text-[11px] text-slate-400">
                Key: <code>kaamdost_service_cache_v1</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  Close
                </button>
                {pendingCacheCount > 0 && isOnlineEffective && (
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync All ({pendingCacheCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
