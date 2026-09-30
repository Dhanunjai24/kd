import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INITIAL_WORKERS,
  INITIAL_BOOKINGS,
  INITIAL_NOTIFICATIONS,
} from './src/data/initialData';
import {
  Booking,
  WorkerProfile,
  AppNotification,
  BookingStatus,
} from './src/types/kaamdost';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled rejection:', reason);
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

wss.on('error', (err) => {
  console.error('[WSS] Server error:', err);
});

// Explicitly handle HTTP upgrade requests to prevent collisions with Vite or internal proxies
server.on('upgrade', (request, socket, head) => {
  const url = request.url || '';
  const pathname = url.split('?')[0];

  // Route KaamDost real-time bus connections strictly under /ws
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
  }
});

app.use(express.json());

// Server-authoritative in-memory state
let workers: WorkerProfile[] = [...INITIAL_WORKERS];
let bookings: Booking[] = [...INITIAL_BOOKINGS];
let notifications: AppNotification[] = [...INITIAL_NOTIFICATIONS];
let workerOnline = true;
let activeWorkerId = 'worker-1';

function broadcast(type: string, payload: any) {
  const message = JSON.stringify({ type, payload, timestamp: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// REST APIs for inspection, fallback polling, or external API consumption
app.get('/api/state', (req, res) => {
  res.json({
    workers,
    bookings,
    notifications,
    workerOnline,
    activeWorkerId,
  });
});

app.get('/api/workers', (req, res) => {
  res.json(workers);
});

app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  const newBooking: Booking = req.body;
  // Guard idempotency
  if (!bookings.some((b) => b.id === newBooking.id)) {
    bookings = [newBooking, ...bookings];
    broadcast('booking:created', newBooking);
  }
  res.json({ success: true, booking: newBooking });
});

app.patch('/api/bookings/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: BookingStatus };
  const target = bookings.find((b) => b.id === id);

  // Atomic Acceptance check: prevent double acceptance race conditions
  if (status === 'ACCEPTED' && target && target.status !== 'REQUESTED') {
    return res.status(409).json({
      success: false,
      error: 'ALREADY_ACCEPTED',
      message: `Booking #${id} was already accepted by another partner.`,
    });
  }

  bookings = bookings.map((b) => (b.id === id ? { ...b, status } : b));
  broadcast('booking:status', { bookingId: id, status });
  res.json({ success: true });
});

// WebSocket Protocol handling real-time synchronization between Customer and Worker
wss.on('connection', (ws) => {
  console.log('[WS] Client connected to KaamDost real-time bus');

  // 1. Initial State Sync
  ws.send(
    JSON.stringify({
      type: 'init:state',
      payload: {
        workers,
        bookings,
        notifications,
        workerOnline,
        activeWorkerId,
      },
    })
  );

  // 2. Incoming Action Handlers
  ws.on('message', (data) => {
    try {
      const { type, payload } = JSON.parse(data.toString());
      console.log('[WS] Action received:', type);

      switch (type) {
        case 'booking:create': {
          const booking: Booking = payload;
          if (!bookings.some((b) => b.id === booking.id)) {
            bookings = [booking, ...bookings];
            broadcast('booking:created', booking);

            const notifWorker: AppNotification = {
              id: `notif-w-${Date.now()}`,
              recipient: 'WORKER',
              title: `New Job Request: ₹${booking.baseAmount}`,
              body: `${booking.serviceTitle} at ${booking.area} (${booking.distanceKm} km away).`,
              time: 'Just now',
              read: false,
              type: 'BOOKING',
              bookingId: booking.id,
            };
            const notifCust: AppNotification = {
              id: `notif-c-${Date.now()}`,
              recipient: 'CUSTOMER',
              title: `Booking Confirmed (#${booking.id})`,
              body: `${booking.workerBusiness} notified. Share Start OTP ${booking.startOtp} upon arrival.`,
              time: 'Just now',
              read: false,
              type: 'BOOKING',
              bookingId: booking.id,
            };
            notifications = [notifWorker, notifCust, ...notifications];
            broadcast('notifications:updated', notifications);
          }
          break;
        }

        case 'booking:status': {
          const { bookingId, status, workerId } = payload;
          const target = bookings.find((b) => b.id === bookingId);

          // Atomic Acceptance check: prevent double acceptance race conditions
          if (status === 'ACCEPTED' && target && target.status !== 'REQUESTED') {
            ws.send(
              JSON.stringify({
                type: 'booking:already_accepted',
                payload: {
                  bookingId,
                  message: `Job #${bookingId} was already accepted by another partner.`,
                  currentStatus: target.status,
                },
              })
            );
            break;
          }

          bookings = bookings.map((b) =>
            b.id === bookingId ? { ...b, status, ...(workerId ? { workerId } : {}) } : b
          );
          broadcast('booking:status', { bookingId, status, workerId });

          const updatedTarget = bookings.find((b) => b.id === bookingId);
          const notif: AppNotification = {
            id: `notif-${Date.now()}`,
            recipient: 'CUSTOMER',
            title: `Service Status: ${status.replace('_', ' ')}`,
            body: `Booking #${bookingId} (${updatedTarget?.serviceTitle || 'Home Service'}) is now ${status.replace('_', ' ')}.`,
            time: 'Just now',
            read: false,
            type: 'BOOKING',
            bookingId,
          };
          notifications = [notif, ...notifications];
          broadcast('notifications:updated', notifications);
          break;
        }

        case 'extra:request': {
          const { bookingId, extraItem } = payload;
          bookings = bookings.map((b) => {
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
                  text: `Requested approval for additional work: ${extraItem.title} (₹${extraItem.price}).`,
                  timestamp: 'Just now',
                },
              ],
            };
          });
          broadcast('extra:requested', { bookingId, extraItem });

          const notif: AppNotification = {
            id: `notif-${Date.now()}`,
            recipient: 'CUSTOMER',
            title: `Approval Needed: ${extraItem.title} (₹${extraItem.price})`,
            body: `Technician requested approval for additional spare part on Booking #${bookingId}.`,
            time: 'Just now',
            read: false,
            type: 'APPROVAL',
            bookingId,
          };
          notifications = [notif, ...notifications];
          broadcast('notifications:updated', notifications);
          break;
        }

        case 'extra:respond': {
          const { bookingId, extraId, decision } = payload;
          let itemTitle = 'Extra Work';
          let itemPrice = 0;

          bookings = bookings.map((b) => {
            if (b.id !== bookingId) return b;
            const currentExtras = b.extraWorkItems || [];
            const updated = currentExtras.map((item) => {
              if (item.id === extraId) {
                itemTitle = item.title;
                itemPrice = item.price;
                return { ...item, status: decision as 'APPROVED' | 'REJECTED' };
              }
              return item;
            });
            return {
              ...b,
              extraWorkItems: updated,
              messages: [
                ...(b.messages || []),
                {
                  id: `msg-${Date.now()}`,
                  sender: 'CUSTOMER',
                  text: `${decision === 'APPROVED' ? '✅ Approved' : '❌ Declined'}: ${itemTitle} (₹${itemPrice})`,
                  timestamp: 'Just now',
                },
              ],
            };
          });

          broadcast('extra:responded', { bookingId, extraId, decision });

          const notif: AppNotification = {
            id: `notif-${Date.now()}`,
            recipient: 'WORKER',
            title: `Customer ${decision === 'APPROVED' ? 'Approved' : 'Declined'} Extra Work`,
            body: `Customer ${decision.toLowerCase()} ${itemTitle} (₹${itemPrice}) on #${bookingId}.`,
            time: 'Just now',
            type: 'APPROVAL',
            read: false,
            bookingId,
          };
          notifications = [notif, ...notifications];
          broadcast('notifications:updated', notifications);
          break;
        }

        case 'chat:send': {
          const { bookingId, message } = payload;
          bookings = bookings.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  messages: [...b.messages, message],
                }
              : b
          );
          broadcast('chat:message', { bookingId, message });
          break;
        }

        case 'payment:complete': {
          const { bookingId, method, tipAmount } = payload;
          bookings = bookings.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  status: 'PAID',
                  paymentMethod: method,
                  paymentStatus: 'PAID',
                  tipAmount,
                }
              : b
          );
          broadcast('payment:completed', { bookingId, method, tipAmount });

          const notif: AppNotification = {
            id: `notif-${Date.now()}`,
            recipient: 'WORKER',
            title: 'Instant UPI Payout Credited! 🎉',
            body: `Payment received for Booking #${bookingId}${tipAmount > 0 ? ` (includes ₹${tipAmount} customer tip!)` : ''}.`,
            time: 'Just now',
            read: false,
            type: 'PAYMENT',
            bookingId,
          };
          notifications = [notif, ...notifications];
          broadcast('notifications:updated', notifications);
          break;
        }

        case 'review:submit': {
          const { bookingId, rating, reviewText } = payload;
          const target = bookings.find((b) => b.id === bookingId);
          bookings = bookings.map((b) =>
            b.id === bookingId ? { ...b, rating, reviewText } : b
          );

          if (target) {
            workers = workers.map((w) => {
              if (w.id !== target.workerId) return w;
              const newCount = w.reviewCount + 1;
              const newRating = Number(
                ((w.rating * w.reviewCount + rating) / newCount).toFixed(1)
              );
              return {
                ...w,
                rating: newRating,
                reviewCount: newCount,
                completedJobs: w.completedJobs + 1,
                reviews: [
                  {
                    id: `rev-${Date.now()}`,
                    customerName: 'Alex Carter',
                    rating,
                    date: 'Just now',
                    comment:
                      reviewText ||
                      'Excellent professional service, punctual and transparent pricing.',
                    serviceBooked: target.serviceTitle,
                  },
                  ...w.reviews,
                ],
              };
            });
          }
          broadcast('review:submitted', { bookingId, rating, reviewText, workers });
          break;
        }

        case 'worker:duty': {
          workerOnline = payload.online;
          broadcast('worker:duty', { online: workerOnline });
          break;
        }

        case 'worker:profile': {
          const { updates } = payload;
          workers = workers.map((w) =>
            w.id === activeWorkerId ? { ...w, ...updates } : w
          );
          broadcast('worker:profile', { workers });
          break;
        }

        case 'notifications:read': {
          const { recipient } = payload;
          notifications = notifications.map((n) =>
            n.recipient === recipient ? { ...n, read: true } : n
          );
          broadcast('notifications:updated', notifications);
          break;
        }
      }
    } catch (err) {
      console.error('[WS] Error processing message:', err);
    }
  });

  (ws as any).isAlive = true;
  ws.on('pong', () => {
    (ws as any).isAlive = true;
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

// Periodic heartbeat to prevent proxy timeouts (Cloud Run / load balancers)
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((client: any) => {
    if (client.isAlive === false) {
      return client.terminate();
    }
    client.isAlive = false;
    client.ping();
  });
}, 25000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Vite Middleware integration for dev mode or static files for production
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Dev server must run strictly on port 3000 in AI Studio environment.
  // Nginx reverse proxy listens on 8080 and forwards to localhost:3000.
  // Never attempt to bind to process.env.PORT if it is 8080 (which collides with Nginx).
  const PORT = 3000;

  // Bind Express/Vite app strictly to port 3000 using dual-stack IPv4/IPv6 '::'
  // (or fallback '0.0.0.0') so both localhost and 127.0.0.1 resolve without ECONNREFUSED from Nginx proxy
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} already in use. Exiting for clean restart.`, err);
      process.exit(1);
    } else if (err.code === 'EAFNOSUPPORT' || err.code === 'EADDRNOTAVAIL') {
      console.warn(`[Server] Dual-stack IPv6 '::' not supported, falling back to '0.0.0.0':${PORT}`);
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`KaamDost full-stack server running with WebSocket on 0.0.0.0:${PORT}`);
      });
    } else {
      console.error('[Server] Unexpected server error:', err);
    }
  });

  server.listen(PORT, '::', () => {
    console.log(`KaamDost full-stack server running with WebSocket on [::]:${PORT} (dual-stack)`);
  });
}

startServer();
