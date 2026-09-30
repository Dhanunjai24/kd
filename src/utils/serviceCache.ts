/**
 * Service Cache Engine for KaamDost Worker App
 * --------------------------------------------
 * Provides durable local storage persistence for pending technician status updates
 * and chat messages when mobile internet or WebSocket connectivity is lost (e.g.,
 * in underground parking basements, elevator shafts, or low-connectivity zones).
 *
 * Automatically flushes and synchronizes all queued operations to the authoritative
 * WebSocket bus once network connectivity is re-established.
 */

import { BookingStatus, ChatMessage, ExtraWorkItem } from '../types/kaamdost';

export const SERVICE_CACHE_STORAGE_KEY = 'kaamdost_service_cache_v1';
export const NETWORK_SIMULATION_KEY = 'kaamdost_offline_simulation_active';

export type CacheActionType = 'STATUS_UPDATE' | 'CHAT_MESSAGE' | 'EXTRA_WORK_REQUEST';

export interface CachedStatusPayload {
  bookingId: string;
  status: BookingStatus;
  statusLabel?: string;
  updatedAt?: string;
}

export interface CachedChatPayload {
  bookingId: string;
  message: ChatMessage;
}

export interface CachedExtraWorkPayload {
  bookingId: string;
  extraItem: ExtraWorkItem;
}

export interface ServiceCacheItem {
  id: string;
  timestamp: number;
  formattedTime: string;
  type: CacheActionType;
  bookingId: string;
  bookingTitle?: string;
  payload: CachedStatusPayload | CachedChatPayload | CachedExtraWorkPayload;
  status: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError?: string;
}

/**
 * Reads all cached items from localStorage.
 */
export function getServiceCache(): ServiceCacheItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SERVICE_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[ServiceCache] Failed to read from localStorage:', err);
    return [];
  }
}

/**
 * Writes the cached items array to localStorage and notifies listeners.
 */
export function saveServiceCache(items: ServiceCacheItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SERVICE_CACHE_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('kaamdost:service-cache-updated', { detail: { items } }));
  } catch (err) {
    console.error('[ServiceCache] Failed to write to localStorage:', err);
  }
}

/**
 * Enqueues a new operation into localStorage.
 */
export function enqueueServiceCacheItem(
  params: Omit<ServiceCacheItem, 'id' | 'timestamp' | 'formattedTime' | 'status' | 'retryCount'>
): ServiceCacheItem {
  const current = getServiceCache();
  const now = Date.now();
  const formattedTime = new Date(now).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const newItem: ServiceCacheItem = {
    ...params,
    id: `cache-${now}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now,
    formattedTime,
    status: 'QUEUED',
    retryCount: 0,
  };

  const updated = [newItem, ...current];
  saveServiceCache(updated);
  console.log(`[ServiceCache] Queued item [${newItem.type}] for booking #${newItem.bookingId}`);
  return newItem;
}

/**
 * Updates status of a cached item.
 */
export function updateCacheItemStatus(
  id: string,
  status: ServiceCacheItem['status'],
  error?: string
): void {
  const current = getServiceCache();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        retryCount: status === 'FAILED' ? item.retryCount + 1 : item.retryCount,
        lastError: error,
      };
    }
    return item;
  });
  saveServiceCache(updated);
}

/**
 * Removes an item from the cache.
 */
export function removeCacheItem(id: string): void {
  const current = getServiceCache();
  const updated = current.filter((item) => item.id !== id);
  saveServiceCache(updated);
}

/**
 * Clears all items in the Service Cache.
 */
export function clearAllServiceCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SERVICE_CACHE_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent('kaamdost:service-cache-updated', { detail: { items: [] } })
    );
  } catch (err) {
    console.warn('[ServiceCache] Failed to clear localStorage:', err);
  }
}

/**
 * Clears only already synced items from localStorage.
 */
export function clearSyncedServiceCache(): void {
  const current = getServiceCache();
  const remaining = current.filter((item) => item.status !== 'SYNCED');
  saveServiceCache(remaining);
}

/**
 * Returns pending items (QUEUED or FAILED).
 */
export function getPendingCacheItems(): ServiceCacheItem[] {
  return getServiceCache().filter(
    (item) => item.status === 'QUEUED' || item.status === 'FAILED'
  );
}

/**
 * Returns count of pending items.
 */
export function getPendingCacheCount(): number {
  return getPendingCacheItems().length;
}

/**
 * Checks whether offline simulation mode is active.
 */
export function isOfflineModeSimulated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(NETWORK_SIMULATION_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets offline simulation mode.
 */
export function setOfflineModeSimulated(simulated: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (simulated) {
      localStorage.setItem(NETWORK_SIMULATION_KEY, 'true');
    } else {
      localStorage.removeItem(NETWORK_SIMULATION_KEY);
    }
    window.dispatchEvent(
      new CustomEvent('kaamdost:network-simulation-changed', {
        detail: { isOfflineSimulated: simulated },
      })
    );
  } catch (err) {
    console.warn('[ServiceCache] Failed to set network simulation flag:', err);
  }
}

/**
 * Synchronizes all pending cached actions to the authoritative WebSocket bus.
 * Processes items in strict chronological order (oldest first).
 */
export function syncPendingServiceCache(
  sendWs: (type: string, payload: any) => boolean | void
): { syncedCount: number; failedCount: number; syncedItems: ServiceCacheItem[] } {
  const allItems = getServiceCache();
  const pending = allItems
    .filter((item) => item.status === 'QUEUED' || item.status === 'FAILED')
    .sort((a, b) => a.timestamp - b.timestamp); // FIFO chronological order

  if (pending.length === 0) {
    return { syncedCount: 0, failedCount: 0, syncedItems: [] };
  }

  console.log(`[ServiceCache] Syncing ${pending.length} pending items to WebSocket bus...`);

  let syncedCount = 0;
  let failedCount = 0;
  const syncedItems: ServiceCacheItem[] = [];

  const updatedItems = allItems.map((item) => {
    const isTarget = pending.some((p) => p.id === item.id);
    if (!isTarget) return item;

    try {
      switch (item.type) {
        case 'STATUS_UPDATE': {
          const payload = item.payload as CachedStatusPayload;
          sendWs('booking:status', {
            bookingId: payload.bookingId,
            status: payload.status,
          });
          syncedCount++;
          syncedItems.push(item);
          return { ...item, status: 'SYNCED' as const };
        }

        case 'CHAT_MESSAGE': {
          const payload = item.payload as CachedChatPayload;
          sendWs('chat:send', {
            bookingId: payload.bookingId,
            message: payload.message,
          });
          syncedCount++;
          syncedItems.push(item);
          return { ...item, status: 'SYNCED' as const };
        }

        case 'EXTRA_WORK_REQUEST': {
          const payload = item.payload as CachedExtraWorkPayload;
          sendWs('extra:request', {
            bookingId: payload.bookingId,
            extraItem: payload.extraItem,
          });
          syncedCount++;
          syncedItems.push(item);
          return { ...item, status: 'SYNCED' as const };
        }

        default:
          return item;
      }
    } catch (err: any) {
      console.error(`[ServiceCache] Error syncing item ${item.id}:`, err);
      failedCount++;
      return {
        ...item,
        status: 'FAILED' as const,
        retryCount: item.retryCount + 1,
        lastError: err?.message || 'WebSocket transmission failure',
      };
    }
  });

  saveServiceCache(updatedItems);
  return { syncedCount, failedCount, syncedItems };
}
