import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  WorkerProfile,
  Booking,
  BookingStatus,
  AppNotification,
  ExtraWorkItem,
  ChatMessage,
  ServerSyncState,
} from '../types/kaamdost';
import {
  INITIAL_WORKERS,
  INITIAL_BOOKINGS,
  INITIAL_NOTIFICATIONS,
  BENGALURU_LOCATIONS,
} from '../data/initialData';
import { triggerHaptic, HAPTIC_PATTERNS } from '../utils/haptics';
import { isTopRecommended100Match } from '../utils/jobRanking';
import {
  getServiceCache,
  enqueueServiceCacheItem,
  syncPendingServiceCache,
  clearAllServiceCache,
  removeCacheItem,
  isOfflineModeSimulated,
  setOfflineModeSimulated,
  ServiceCacheItem,
} from '../utils/serviceCache';

export interface ToastItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface KaamDostContextType {
  workers: WorkerProfile[];
  bookings: Booking[];
  notifications: AppNotification[];
  customerLocation: typeof BENGALURU_LOCATIONS[0];
  setCustomerLocation: (loc: typeof BENGALURU_LOCATIONS[0]) => void;
  workerOnline: boolean;
  setWorkerOnline: (online: boolean) => void;
  activeWorkerId: string;
  setActiveWorkerId: (id: string) => void;
  activeWorker: WorkerProfile;
  isConnectedWs: boolean;
  isOnlineEffective: boolean;
  isOfflineSimulated: boolean;
  setOfflineSimulated: (simulated: boolean) => void;
  toggleOfflineSimulation: () => void;
  serviceCacheItems: ServiceCacheItem[];
  pendingCacheCount: number;
  syncServiceCacheNow: () => { syncedCount: number; failedCount: number; syncedItems: ServiceCacheItem[] };
  clearAllServiceCache: () => void;
  removeCacheItem: (id: string) => void;
  updateWorkerProfile: (updates: Partial<WorkerProfile>) => void;
  toggleBookmarkWorker: (workerId: string) => void;
  createBooking: (params: {
    worker: WorkerProfile;
    serviceTitle: string;
    problemDescription: string;
    address: string;
    area: string;
    scheduledDate: string;
    scheduledTime: string;
    baseAmount: number;
    discountAmount: number;
    distanceKm?: number;
    etaMinutes?: number;
  }) => Booking;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  requestExtraWork: (
    bookingId: string,
    title: string,
    price: number,
    description?: string
  ) => void;
  respondExtraWork: (
    bookingId: string,
    extraId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => void;
  sendChatMessage: (
    bookingId: string,
    sender: 'CUSTOMER' | 'WORKER',
    text: string
  ) => void;
  completePayment: (
    bookingId: string,
    method: 'UPI_GPAY' | 'UPI_PHONEPE' | 'UPI_PAYTM' | 'CASH',
    tipAmount: number
  ) => void;
  submitReview: (
    bookingId: string,
    rating: number,
    reviewText: string
  ) => void;
  simulateIncomingJobForWorker: (force100Match?: boolean) => Booking;
  markNotificationsRead: (recipient: 'CUSTOMER' | 'WORKER') => void;
  toasts: ToastItem[];
  showToast: (
    title: string,
    subtitle?: string,
    type?: 'success' | 'info' | 'warning' | 'error'
  ) => void;
  dismissToast: (id: string) => void;
  uiDemoState: 'normal' | 'skeleton' | 'empty' | 'error';
  setUiDemoState: (state: 'normal' | 'skeleton' | 'empty' | 'error') => void;
  triggerHaptic: (pattern?: number | readonly number[] | number[]) => boolean;
}

const KaamDostContext = createContext<KaamDostContextType | undefined>(
  undefined
);

export const KaamDostProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [workers, setWorkers] = useState<WorkerProfile[]>(INITIAL_WORKERS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    INITIAL_NOTIFICATIONS
  );
  const [customerLocation, setCustomerLocation] = useState(
    BENGALURU_LOCATIONS[0]
  );
  const [workerOnline, setWorkerOnlineState] = useState<boolean>(true);
  const [activeWorkerId, setActiveWorkerId] = useState<string>('worker-1');
  const [isConnectedWs, setIsConnectedWs] = useState<boolean>(false);
  const [isNetworkOnline, setIsNetworkOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(() =>
    isOfflineModeSimulated()
  );
  const [serviceCacheItems, setServiceCacheItems] = useState<ServiceCacheItem[]>(() =>
    getServiceCache()
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [uiDemoState, setUiDemoState] = useState<
    'normal' | 'skeleton' | 'empty' | 'error'
  >('normal');

  const wsRef = useRef<WebSocket | null>(null);

  const isOnlineEffective = isNetworkOnline && !isOfflineSimulated && isConnectedWs;
  const pendingCacheCount = serviceCacheItems.filter(
    (i) => i.status === 'QUEUED' || i.status === 'FAILED'
  ).length;

  const activeWorker =
    workers.find((w) => w.id === activeWorkerId) || workers[0];

  const showToast = (
    title: string,
    subtitle?: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, title, subtitle, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const sendWs = (type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  // Connect to authoritative WebSocket Server
  useEffect(() => {
    let reconnectTimeout: any;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      console.log('[KaamDost] Connecting to Real-Time WebSocket at:', wsUrl);

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('[KaamDost] Connected to Real-Time Bus');
        setIsConnectedWs(true);

        // Automatically sync pending Service Cache items upon socket connection
        if (!isOfflineModeSimulated()) {
          setTimeout(() => {
            const pending = getServiceCache().filter(
              (i) => i.status === 'QUEUED' || i.status === 'FAILED'
            );
            if (pending.length > 0) {
              const res = syncPendingServiceCache((type, payload) => {
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({ type, payload }));
                }
              });
              if (res.syncedCount > 0) {
                showToast(
                  `⚡ Service Cache Synced (${res.syncedCount})`,
                  'Cached offline updates restored and delivered to WebSocket bus.',
                  'success'
                );
                triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
              }
            }
          }, 350);
        }
      };

      socket.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);

          switch (type) {
            case 'init:state': {
              const state: ServerSyncState = payload;
              if (state.workers) setWorkers(state.workers);
              if (state.bookings) setBookings(state.bookings);
              if (state.notifications) setNotifications(state.notifications);
              if (typeof state.workerOnline === 'boolean') {
                setWorkerOnlineState(state.workerOnline);
              }
              if (state.activeWorkerId) {
                setActiveWorkerId(state.activeWorkerId);
              }
              break;
            }

            case 'booking:created': {
              const newBooking: Booking = payload;
              setBookings((prev) => {
                if (prev.some((b) => b.id === newBooking.id)) return prev;
                return [newBooking, ...prev];
              });

              // Check if Recommended Jobs algorithm identifies a Top Recommended (100% match) job request
              if (activeWorker && isTopRecommended100Match(newBooking, activeWorker)) {
                triggerHaptic(HAPTIC_PATTERNS.TOP_RECOMMENDED_100_MATCH);
              } else {
                // Urgent incoming dispatch pulse pattern for standard new job requests
                triggerHaptic(HAPTIC_PATTERNS.NEW_JOB_REQUEST);
              }
              break;
            }

            case 'booking:status': {
              const { bookingId, status } = payload;
              setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
              );
              break;
            }

            case 'extra:requested': {
              const { bookingId, extraItem } = payload;
              setBookings((prev) =>
                prev.map((b) => {
                  if (b.id !== bookingId) return b;
                  const currentExtras = b.extraWorkItems || [];
                  if (currentExtras.some((e) => e.id === extraItem.id)) {
                    return b;
                  }
                  return {
                    ...b,
                    extraWorkItems: [...currentExtras, extraItem],
                  };
                })
              );
              break;
            }

            case 'extra:responded': {
              const { bookingId, extraId, decision } = payload;
              setBookings((prev) =>
                prev.map((b) => {
                  if (b.id !== bookingId) return b;
                  const currentExtras = b.extraWorkItems || [];
                  return {
                    ...b,
                    extraWorkItems: currentExtras.map((e) =>
                      e.id === extraId ? { ...e, status: decision } : e
                    ),
                  };
                })
              );
              break;
            }

            case 'chat:message': {
              const { bookingId, message } = payload;
              setBookings((prev) =>
                prev.map((b) => {
                  if (b.id !== bookingId) return b;
                  if (b.messages.some((m) => m.id === message.id)) return b;
                  return {
                    ...b,
                    messages: [...b.messages, message],
                  };
                })
              );
              break;
            }

            case 'payment:completed': {
              const { bookingId, method, tipAmount } = payload;
              setBookings((prev) =>
                prev.map((b) =>
                  b.id === bookingId
                    ? {
                        ...b,
                        status: 'PAID',
                        paymentMethod: method,
                        paymentStatus: 'PAID',
                        tipAmount,
                      }
                    : b
                )
              );
              break;
            }

            case 'review:submitted': {
              const { bookingId, rating, reviewText, workers: updatedWorkers } =
                payload;
              setBookings((prev) =>
                prev.map((b) =>
                  b.id === bookingId ? { ...b, rating, reviewText } : b
                )
              );
              if (updatedWorkers) {
                setWorkers(updatedWorkers);
              }
              break;
            }

            case 'worker:duty': {
              setWorkerOnlineState(payload.online);
              break;
            }

            case 'worker:profile': {
              if (payload.workers) {
                setWorkers(payload.workers);
              }
              break;
            }

            case 'notifications:updated': {
              setNotifications(payload);
              break;
            }
          }
        } catch (e) {
          console.error('[KaamDost] WebSocket message parse error:', e);
        }
      };

      socket.onclose = () => {
        console.log('[KaamDost] WebSocket closed. Auto-reconnecting in 2s...');
        setIsConnectedWs(false);
        reconnectTimeout = setTimeout(connectWebSocket, 2000);
      };

      socket.onerror = (err) => {
        console.warn('[KaamDost] WebSocket issue:', err);
      };
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Browser Network and Service Cache Event Listeners
  useEffect(() => {
    const handleOnline = () => {
      console.log('[KaamDost] Browser online event detected');
      setIsNetworkOnline(true);
    };
    const handleOffline = () => {
      console.log('[KaamDost] Browser offline event detected');
      setIsNetworkOnline(false);
    };
    const handleCacheUpdate = (e: any) => {
      if (e?.detail?.items) {
        setServiceCacheItems(e.detail.items);
      } else {
        setServiceCacheItems(getServiceCache());
      }
    };
    const handleSimUpdate = (e: any) => {
      setIsOfflineSimulated(e?.detail?.isOfflineSimulated ?? isOfflineModeSimulated());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('kaamdost:service-cache-updated', handleCacheUpdate);
    window.addEventListener('kaamdost:network-simulation-changed', handleSimUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('kaamdost:service-cache-updated', handleCacheUpdate);
      window.removeEventListener('kaamdost:network-simulation-changed', handleSimUpdate);
    };
  }, []);

  // Automatic Reconnection Sync Effect: flushes pending items whenever connection is restored
  const prevOnlineEffectiveRef = useRef(isOnlineEffective);
  useEffect(() => {
    if (isOnlineEffective && pendingCacheCount > 0) {
      console.log(
        `[KaamDost] Connection active. Automatically syncing ${pendingCacheCount} Service Cache items...`
      );
      const timer = setTimeout(() => {
        const result = syncPendingServiceCache((type, payload) => {
          sendWs(type, payload);
        });
        setServiceCacheItems(getServiceCache());
        if (result.syncedCount > 0) {
          showToast(
            `⚡ Service Cache Synced (${result.syncedCount})`,
            'Pending status updates & messages delivered to WebSocket bus.',
            'success'
          );
          triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
        }
      }, 400);

      return () => clearTimeout(timer);
    }
    prevOnlineEffectiveRef.current = isOnlineEffective;
  }, [isOnlineEffective, pendingCacheCount]);

  const setOfflineSimulated = (simulated: boolean) => {
    setIsOfflineSimulated(simulated);
    setOfflineModeSimulated(simulated);
  };

  const toggleOfflineSimulation = () => {
    const next = !isOfflineSimulated;
    setIsOfflineSimulated(next);
    setOfflineModeSimulated(next);
    triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
    showToast(
      next ? 'Basement / Offline Mode Active' : 'Online Mode Restored',
      next
        ? 'Simulating zero network in underground parking. Updates will be saved to Service Cache.'
        : 'Network reconnected. Auto-syncing queued actions...',
      next ? 'warning' : 'success'
    );
  };

  const syncServiceCacheNow = () => {
    if (!isOnlineEffective) {
      return { syncedCount: 0, failedCount: 0, syncedItems: [] };
    }
    const result = syncPendingServiceCache(sendWs);
    setServiceCacheItems(getServiceCache());
    return result;
  };

  const setWorkerOnline = (online: boolean) => {
    setWorkerOnlineState(online);
    sendWs('worker:duty', { online });
  };

  const toggleBookmarkWorker = (workerId: string) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === workerId) {
          const next = !w.isBookmarked;
          showToast(
            next
              ? `${w.name} saved to your favorites`
              : `Removed ${w.name} from saved list`,
            w.businessName,
            'info'
          );
          return { ...w, isBookmarked: next };
        }
        return w;
      })
    );
  };

  const updateWorkerProfile = (updates: Partial<WorkerProfile>) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === activeWorkerId ? { ...w, ...updates } : w))
    );
    sendWs('worker:profile', { updates });
    showToast(
      'Worker Profile Updated',
      'Synced across all connected apps via Real-Time Bus',
      'success'
    );
  };

  const createBooking = (params: {
    worker: WorkerProfile;
    serviceTitle: string;
    problemDescription: string;
    address: string;
    area: string;
    scheduledDate: string;
    scheduledTime: string;
    baseAmount: number;
    discountAmount: number;
    distanceKm?: number;
    etaMinutes?: number;
  }): Booking => {
    const bookingId = `KD-${Math.floor(10000 + Math.random() * 89999)}`;
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: Booking = {
      id: bookingId,
      customerId: 'cust-1',
      customerName: 'Alex Carter',
      customerPhone: '+91 98450 72109',
      workerId: params.worker.id,
      workerName: params.worker.name,
      workerBusiness: params.worker.businessName,
      workerTrade: params.worker.trade,
      workerAvatar: params.worker.avatarUrl,
      serviceTitle: params.serviceTitle,
      problemDescription: params.problemDescription,
      address: params.address,
      area: params.area,
      lat: customerLocation.lat,
      lng: customerLocation.lng,
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      status: 'REQUESTED',
      startOtp: otp,
      baseAmount: params.baseAmount,
      discountAmount: params.discountAmount,
      extraWorkItems: [],
      tipAmount: 0,
      paymentStatus: 'PENDING',
      invoiceNumber: `INV-KD-2026-${bookingId.split('-')[1]}`,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'CUSTOMER',
          text: `Hi ${params.worker.name}, booked ${params.serviceTitle} for ${params.scheduledDate} (${params.scheduledTime}).`,
          timestamp: 'Just now',
        },
      ],
      createdAt: 'Just now',
      distanceKm:
        typeof params.distanceKm === 'number'
          ? params.distanceKm
          : params.worker.distanceKm,
      etaMinutes:
        typeof params.etaMinutes === 'number'
          ? params.etaMinutes
          : params.worker.etaMinutes,
    };

    // Optimistic update + WebSocket emission
    setBookings((prev) => [newBooking, ...prev]);
    sendWs('booking:create', newBooking);

    showToast(
      `Booking #${bookingId} Created!`,
      `Live dispatched to ${params.worker.name} (Worker App)`,
      'success'
    );

    return newBooking;
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    // Optimistic local update so UI responds instantly
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );

    const targetJob = bookings.find((b) => b.id === bookingId);
    const labelMap: Record<BookingStatus, string> = {
      REQUESTED: 'Booking Requested',
      ACCEPTED: 'Worker Accepted Job & Assigned',
      EN_ROUTE: 'Worker is En Route to Customer Location',
      ARRIVED: 'Worker has Arrived at Doorstep',
      IN_PROGRESS: 'Service Started (OTP Verified)',
      COMPLETED: 'Service Marked Completed — Ready for Payment',
      PAID: 'Payment Settled & GST Invoice Generated',
      CANCELLED: 'Booking Cancelled',
    };
    const statusLabel = labelMap[status];

    // Check if offline (or simulated offline or WebSocket disconnected)
    if (!isOnlineEffective) {
      enqueueServiceCacheItem({
        type: 'STATUS_UPDATE',
        bookingId,
        bookingTitle: targetJob?.serviceTitle || `Booking #${bookingId}`,
        payload: {
          bookingId,
          status,
          statusLabel,
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      });

      showToast(
        'Offline: Stored in Service Cache',
        `Status '${status.replace('_', ' ')}' saved in localStorage. Will auto-sync when online.`,
        'warning'
      );
      triggerHaptic(HAPTIC_PATTERNS.WARNING);
      return;
    }

    sendWs('booking:status', { bookingId, status });

    showToast(
      statusLabel,
      `Booking #${bookingId} synced in real-time between apps`,
      status === 'CANCELLED' ? 'warning' : 'success'
    );

    // Tactile haptic feedback for status updates
    if (status === 'COMPLETED' || status === 'IN_PROGRESS') {
      triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
    } else if (status === 'CANCELLED') {
      triggerHaptic(HAPTIC_PATTERNS.WARNING);
    } else {
      triggerHaptic(HAPTIC_PATTERNS.STATUS_UPDATE);
    }
  };

  const requestExtraWork = (
    bookingId: string,
    title: string,
    price: number,
    description?: string
  ) => {
    const extraItem: ExtraWorkItem = {
      id: `extra-${Date.now()}`,
      title,
      description:
        description || 'Additional spare part / labor required after inspection.',
      price,
      status: 'PENDING',
      requestedAt: 'Just now',
    };

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const currentExtras = b.extraWorkItems || [];
        return {
          ...b,
          extraWorkItems: [...currentExtras, extraItem],
          messages: [
            ...(b.messages || []),
            {
              id: `msg-${Date.now()}`,
              sender: 'WORKER',
              text: `Requested approval for additional work: ${title} (₹${price}).`,
              timestamp: 'Just now',
            },
          ],
        };
      })
    );

    const targetJob = bookings.find((b) => b.id === bookingId);

    if (!isOnlineEffective) {
      enqueueServiceCacheItem({
        type: 'EXTRA_WORK_REQUEST',
        bookingId,
        bookingTitle: targetJob?.serviceTitle || `Booking #${bookingId}`,
        payload: {
          bookingId,
          extraItem,
        },
      });

      showToast(
        'Offline: Approval Request Cached',
        `Spare part request saved in localStorage. Will broadcast once reconnected.`,
        'warning'
      );
      return;
    }

    sendWs('extra:request', { bookingId, extraItem });

    showToast(
      `Approval Request Sent (₹${price})`,
      'Customer App will see instant approval prompt',
      'info'
    );
  };

  const respondExtraWork = (
    bookingId: string,
    extraId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const currentExtras = b.extraWorkItems || [];
        return {
          ...b,
          extraWorkItems: currentExtras.map((e) =>
            e.id === extraId ? { ...e, status: decision } : e
          ),
        };
      })
    );

    sendWs('extra:respond', { bookingId, extraId, decision });

    showToast(
      decision === 'APPROVED' ? 'Approved Spare Part' : 'Declined Extra Work',
      'Live synchronized to Worker App',
      decision === 'APPROVED' ? 'success' : 'warning'
    );
  };

  const sendChatMessage = (
    bookingId: string,
    sender: 'CUSTOMER' | 'WORKER',
    text: string
  ) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const isOffline = !isOnlineEffective;

    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      sender,
      text: text.trim(),
      timestamp: now,
      isCachedOffline: isOffline,
    };

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              messages: [...b.messages, message],
            }
          : b
      )
    );

    const targetJob = bookings.find((b) => b.id === bookingId);

    if (isOffline) {
      enqueueServiceCacheItem({
        type: 'CHAT_MESSAGE',
        bookingId,
        bookingTitle: targetJob?.serviceTitle || `Booking #${bookingId}`,
        payload: {
          bookingId,
          message,
        },
      });

      showToast(
        'Offline: Message Queued in Cache',
        `Stored locally. Will auto-sync to WebSocket once connected.`,
        'warning'
      );
      triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
      return;
    }

    sendWs('chat:send', { bookingId, message });
  };

  const completePayment = (
    bookingId: string,
    method: 'UPI_GPAY' | 'UPI_PHONEPE' | 'UPI_PAYTM' | 'CASH',
    tipAmount: number
  ) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'PAID',
              paymentMethod: method,
              paymentStatus: 'PAID',
              tipAmount,
            }
          : b
      )
    );

    sendWs('payment:complete', { bookingId, method, tipAmount });

    showToast(
      'Payment Successful!',
      `Instant UPI payout credited to Worker App via ${method.replace('UPI_', '')}`,
      'success'
    );
  };

  const submitReview = (
    bookingId: string,
    rating: number,
    reviewText: string
  ) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, rating, reviewText } : b))
    );

    sendWs('review:submit', { bookingId, rating, reviewText });

    showToast(
      'Review Submitted!',
      `Rated ${rating} ★ — Live synced to worker profile`,
      'success'
    );
  };

  const simulateIncomingJobForWorker = (force100Match?: boolean): Booking => {
    const samples = [
      {
        title: 'Emergency Tap Burst & Main Valve Shutoff',
        desc: 'Main inlet angle cock cracked under pressure, water gushing into kitchen cabinet.',
        address: 'House #88, 100 Feet Road, 12th Main',
        area: 'Indiranagar, Bengaluru',
        distanceKm: 0.7,
        etaMinutes: 8,
        amount: 499,
      },
      {
        title: 'Bathroom Wall Mixer Gasket & Diverter Cartridge Replacement',
        desc: 'Jaguar single-lever diverter cartridge stuck and leaking into false ceiling.',
        address: 'Flat 202, Wind Tunnel Rd, Domlur Layout',
        area: 'Domlur, Bengaluru',
        distanceKm: 1.8,
        etaMinutes: 16,
        amount: 649,
      },
      {
        title: 'Balcony Floor Drain Trap Hydro-Jet Cleaning',
        desc: 'Balcony rain pipe blocked with leaves and silt, water backing up toward living hall.',
        address: 'Villa 14, 80 Feet Road, 4th Block',
        area: 'Koramangala, Bengaluru',
        distanceKm: 3.2,
        etaMinutes: 25,
        amount: 799,
      },
      {
        title: 'Rooftop Solar Water Heater Pressure Pipe Fitting',
        desc: 'Hot water return line joint cracked near solar collector tank on terrace.',
        address: 'Plot 31, 27th Main, Sector 1',
        area: 'HSR Layout, Bengaluru',
        distanceKm: 5.8,
        etaMinutes: 40,
        amount: 1100,
      },
    ];

    const pick = force100Match
      ? samples[0]
      : samples[Math.floor(Math.random() * samples.length)];

    const created = createBooking({
      worker: activeWorker,
      serviceTitle: pick.title,
      problemDescription: pick.desc,
      address: pick.address,
      area: pick.area,
      scheduledDate: 'Today (Immediate)',
      scheduledTime: `Within ${pick.etaMinutes} mins`,
      baseAmount: pick.amount,
      discountAmount: 0,
      distanceKm: pick.distanceKm,
      etaMinutes: pick.etaMinutes,
    });

    // Check if Recommended Jobs algorithm identifies a Top Recommended (100% match) job
    if (activeWorker && isTopRecommended100Match(created, activeWorker)) {
      triggerHaptic(HAPTIC_PATTERNS.TOP_RECOMMENDED_100_MATCH);
    } else {
      triggerHaptic(HAPTIC_PATTERNS.NEW_JOB_REQUEST);
    }

    return created;
  };

  const markNotificationsRead = (recipient: 'CUSTOMER' | 'WORKER') => {
    setNotifications((prev) =>
      prev.map((n) => (n.recipient === recipient ? { ...n, read: true } : n))
    );
    sendWs('notifications:read', { recipient });
  };

  return (
    <KaamDostContext.Provider
      value={{
        workers,
        bookings,
        notifications,
        customerLocation,
        setCustomerLocation,
        workerOnline,
        setWorkerOnline,
        activeWorkerId,
        setActiveWorkerId,
        activeWorker,
        isConnectedWs,
        isOnlineEffective,
        isOfflineSimulated,
        setOfflineSimulated,
        toggleOfflineSimulation,
        serviceCacheItems,
        pendingCacheCount,
        syncServiceCacheNow,
        clearAllServiceCache,
        removeCacheItem,
        updateWorkerProfile,
        toggleBookmarkWorker,
        createBooking,
        updateBookingStatus,
        requestExtraWork,
        respondExtraWork,
        sendChatMessage,
        completePayment,
        submitReview,
        simulateIncomingJobForWorker,
        markNotificationsRead,
        toasts,
        showToast,
        dismissToast,
        uiDemoState,
        setUiDemoState,
        triggerHaptic,
      }}
    >
      {children}
    </KaamDostContext.Provider>
  );
};

export const useKaamDost = () => {
  const ctx = useContext(KaamDostContext);
  if (!ctx) {
    throw new Error('useKaamDost must be used within a KaamDostProvider');
  }
  return ctx;
};
