import React, { useState, useRef, useEffect } from 'react';
import { Booking, WorkerProfile } from '../../types/kaamdost';
import { useKaamDost } from '../../context/KaamDostContext';
import { SmartImage, StatefulButton } from '../ui/StateSystem';
import { BENGALURU_LOCATIONS } from '../../data/initialData';
import { triggerHaptic, HAPTIC_PATTERNS } from '../../utils/haptics';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  FileText,
  Star,
  Send,
  Calendar,
  Clock,
  Tag,
  Sparkles,
  Navigation,
  AlertCircle,
  X,
  IndianRupee,
  Mic,
  MicOff,
  Volume2,
  Radio,
  Plus,
  Zap,
} from 'lucide-react';

interface BookingScheduleModalProps {
  worker: WorkerProfile;
  initialServiceTitle?: string;
  initialPrice?: number;
  onClose: () => void;
  onBooked: (booking: Booking) => void;
}

export const BookingScheduleModal: React.FC<BookingScheduleModalProps> = ({
  worker,
  initialServiceTitle,
  initialPrice,
  onClose,
  onBooked,
}) => {
  const { customerLocation, setCustomerLocation, createBooking } = useKaamDost();
  const [selectedService, setSelectedService] = useState(
    initialServiceTitle ||
      worker.rateCard[0]?.title ||
      `${worker.trade} Standard Visit & Inspection`
  );
  const [basePrice, setBasePrice] = useState(initialPrice || worker.rate);
  const [problemDesc, setProblemDesc] = useState(
    `Need ${worker.trade.toLowerCase()} assistance for ${selectedService.toLowerCase()}.`
  );
  const [selectedDate, setSelectedDate] = useState('Today, 29 Sep');
  const [selectedSlot, setSelectedSlot] = useState('Within 30 mins (Express)');
  const [applyPromo, setApplyPromo] = useState(true);

  const dates = [
    'Today, 29 Sep',
    'Tomorrow, 30 Sep',
    'Thu, 01 Oct',
    'Fri, 02 Oct',
  ];
  const slots = [
    'Within 30 mins (Express)',
    '05:30 PM - 06:30 PM',
    '07:00 PM - 08:00 PM',
    '10:00 AM - 11:00 AM',
  ];

  const discount = applyPromo ? Math.round(basePrice * 0.25) : 0;
  const finalEstimate = basePrice - discount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-[428px] rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Schedule & Confirm Booking
            </h3>
            <p className="text-xs text-slate-500">
              {worker.businessName} • {worker.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar flex-1">
          {/* Transparent Service Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              1. Select Service & Upfront Rate
            </label>
            <div className="space-y-2">
              {worker.rateCard.map((rc) => {
                const active = selectedService === rc.title;
                return (
                  <button
                    key={rc.id}
                    type="button"
                    onClick={() => {
                      setSelectedService(rc.title);
                      setBasePrice(rc.price);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      active
                        ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {rc.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Est. {rc.timeEstimate} • {rc.warrantyDays}-Day KaamDost
                        Warranty
                      </p>
                    </div>
                    <span className="text-sm font-extrabold text-blue-600 tabular-nums">
                      ₹{rc.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Map & Location Pin Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              2. Service Location & Map Pin
            </label>
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
              <div className="relative h-28 bg-gradient-to-br from-[#E0F2FE] via-[#F0F9FF] to-[#E2E8F0] p-3 flex flex-col justify-between overflow-hidden">
                <div
                  className="absolute inset-0 opacity-25 pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(#0284c7 1px, transparent 1px)',
                    backgroundSize: '14px 14px',
                  }}
                />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[11px] font-semibold bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-slate-700 shadow-xs flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-blue-600" />
                    GPS Pin Locked ({worker.distanceKm} km from worker)
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ETA ~{worker.etaMinutes} mins
                  </span>
                </div>
                <div className="relative z-10 flex items-center gap-2 bg-white/95 p-2 rounded-xl shadow-xs border border-slate-100">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {customerLocation.area}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {customerLocation.address}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-2.5 bg-white flex gap-1.5 overflow-x-auto no-scrollbar">
                {BENGALURU_LOCATIONS.map((loc) => (
                  <button
                    key={loc.tag}
                    type="button"
                    onClick={() => setCustomerLocation(loc)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      customerLocation.area === loc.area
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {loc.tag}: {loc.area.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date & Time Slot */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              3. Preferred Date & Time Slot
            </label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {dates.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition cursor-pointer flex items-center gap-1.5 ${
                    selectedDate === d
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {d}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition cursor-pointer flex items-center gap-1.5 ${
                    selectedSlot === slot
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{slot}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Problem Note */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              4. Specific Instructions / Problem Note
            </label>
            <textarea
              rows={2}
              value={problemDesc}
              onChange={(e) => setProblemDesc(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              placeholder="Describe the issue (e.g., leaking tap, bring ladder)..."
            />
          </div>

          {/* Transparent Pricing & SAVE25 Promo */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-slate-800">
                  Promo Code: SAVE25 (25% Off)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setApplyPromo(!applyPromo)}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer ${
                  applyPromo
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {applyPromo ? 'Applied ✓' : 'Apply'}
              </button>
            </div>
            <div className="border-t border-slate-200/70 pt-2 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Standard Service / Visit Fee</span>
                <span className="tabular-nums font-medium">₹{basePrice}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Instant Promo Discount (SAVE25)</span>
                  <span className="tabular-nums">-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1">
                <span>Upfront Total Payable</span>
                <span className="tabular-nums text-blue-600">
                  ₹{finalEstimate}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Zero hidden charges. Real-time synced to Worker Partner App.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Footer CTA */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <div className="flex-1">
            <span className="text-[11px] text-slate-400 block">
              Total Estimate
            </span>
            <span className="text-lg font-extrabold text-slate-900 tabular-nums">
              ₹{finalEstimate}
            </span>
          </div>
          <StatefulButton
            variant="blue"
            loadingText="Syncing to Partner App..."
            successText="Booking Confirmed!"
            className="px-6 py-3.5 rounded-2xl text-xs font-bold"
            onClick={() => {
              const created = createBooking({
                worker,
                serviceTitle: selectedService,
                problemDescription: problemDesc,
                address: customerLocation.address,
                area: customerLocation.area,
                scheduledDate: selectedDate,
                scheduledTime: selectedSlot,
                baseAmount: basePrice,
                discountAmount: discount,
              });
              setTimeout(() => onBooked(created), 300);
            }}
          >
            <span>Confirm Booking • ₹{finalEstimate}</span>
          </StatefulButton>
        </div>
      </div>
    </div>
  );
};

interface LiveBookingTrackerProps {
  booking: Booking;
  onBack: () => void;
  onOpenChat: () => void;
}

export const LiveBookingTracker: React.FC<LiveBookingTrackerProps> = ({
  booking,
  onBack,
  onOpenChat,
}) => {
  const {
    respondExtraWork,
    completePayment,
    submitReview,
    updateBookingStatus,
    showToast,
    sendChatMessage,
  } = useKaamDost();

  const [selectedUpi, setSelectedUpi] = useState<
    'UPI_GPAY' | 'UPI_PHONEPE' | 'UPI_PAYTM' | 'CASH'
  >('UPI_GPAY');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [ratingVal, setRatingVal] = useState<number>(booking.rating || 5);
  const [reviewComment, setReviewComment] = useState<string>(
    booking.reviewText || ''
  );
  const [showCallOverlay, setShowCallOverlay] = useState(false);

  const approvedExtrasTotal = (booking.extraWorkItems || [])
    .filter((i) => i.status === 'APPROVED')
    .reduce((sum, item) => sum + item.price, 0);

  const pendingExtras = (booking.extraWorkItems || []).filter(
    (i) => i.status === 'PENDING'
  );

  const subtotal =
    booking.baseAmount - booking.discountAmount + approvedExtrasTotal;
  const gstAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gstAmount + (booking.tipAmount || tipAmount);

  const statusOrder: Booking['status'][] = [
    'REQUESTED',
    'ACCEPTED',
    'EN_ROUTE',
    'ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
    'PAID',
  ];
  const currentIdx = statusOrder.indexOf(booking.status);

  const timelineSteps = [
    {
      key: 'REQUESTED',
      title: 'Booking Confirmed',
      desc: `Slot scheduled for ${booking.scheduledDate} (${booking.scheduledTime})`,
    },
    {
      key: 'ACCEPTED',
      title: `${booking.workerName} Assigned & En Route`,
      desc: `Background verified ${booking.workerTrade} • ${booking.distanceKm} km away`,
    },
    {
      key: 'ARRIVED',
      title: 'Technician Arrived at Location',
      desc: `Share Start OTP ${booking.startOtp} with ${booking.workerName}`,
    },
    {
      key: 'IN_PROGRESS',
      title: 'Service In Progress',
      desc: 'Inspection & repair work underway with 30-day warranty',
    },
    {
      key: 'COMPLETED',
      title: 'Service Completed & Final Bill Ready',
      desc: 'Pay securely via UPI (GPay / PhonePe / Paytm) or Cash',
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#F7F9FD] pb-28">
      {/* Top Bar */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-20">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 active:scale-95 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-slate-900">
            Booking #{booking.id}
          </h2>
          <p className="text-[11px] text-emerald-600 font-semibold">
            WebSocket Live • {booking.status.replace('_', ' ')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvoiceModal(true)}
          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Invoice</span>
        </button>
      </div>

      {/* Simulated Live GPS Tracking Banner */}
      <div className="mx-5 mt-4 rounded-3xl overflow-hidden glass-booking-card">
        <div className="relative h-36 bg-gradient-to-r from-[#DBEAFE] via-[#EFF6FF] to-[#E0F2FE] p-4 flex flex-col justify-between">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(#2563EB 1.25px, transparent 1.25px)',
              backgroundSize: '16px 16px',
            }}
          />
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-white/95 text-slate-800 text-xs font-bold shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {booking.status === 'PAID' || booking.status === 'COMPLETED'
                ? 'Job Completed at Location'
                : `${booking.workerName} • ${booking.area}`}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tabular-nums">
              Start OTP: {booking.startOtp}
            </span>
          </div>

          <div className="relative z-10 my-auto flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md text-xs font-bold">
              <Navigation className="w-4 h-4" />
            </div>
            <div className="flex-1 h-1.5 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(25, (currentIdx + 1) * 18))}%`,
                }}
              />
            </div>
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md">
              <MapPin className="w-4 h-4" />
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>{booking.workerBusiness}</span>
            <span>{booking.address}</span>
          </div>
        </div>

        {/* Worker Details Bar */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SmartImage
              src={booking.workerAvatar}
              alt={booking.workerName}
              fallbackLabel={booking.workerName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900">
                  {booking.workerName}
                </h3>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs text-slate-500">
                {booking.workerBusiness} • {booking.workerTrade}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenChat}
              className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat ({booking.messages.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCallOverlay(true)}
              className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition cursor-pointer"
              aria-label="Call technician"
            >
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1-Tap Quick Replies for Customer to Technician */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Quick Reply to {booking.workerName.split(' ')[0]} (1-Tap):</span>
            </span>
            <button
              type="button"
              onClick={onOpenChat}
              className="text-blue-600 hover:text-blue-700 font-semibold text-[10px] cursor-pointer"
            >
              Open Full Chat →
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { text: 'Please share your live ETA', icon: '⏱️' },
              { text: 'Running 5 mins late, please wait in lobby', icon: '⏳' },
              { text: 'Gate passcode is #4021', icon: '🔑' },
              { text: 'Door is open, 3rd floor Flat 302', icon: '🚪' },
              { text: 'Visitor parking available in Basement 1', icon: '🅿️' },
              { text: 'Please bring spare Teflon tape & valve', icon: '🚰' },
            ].map((qr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
                  sendChatMessage(booking.id, 'CUSTOMER', qr.text);
                  showToast(
                    `Sent to ${booking.workerName}`,
                    `"${qr.text}" dispatched to technician`,
                    'info'
                  );
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer shrink-0 shadow-2xs"
                title={`Send "${qr.text}" to technician`}
              >
                <span>{qr.icon}</span>
                <span>{qr.text}</span>
                <Send className="w-2.5 h-2.5 text-blue-500 ml-0.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* REAL-TIME ADDITIONAL WORK APPROVAL PROMPT (SOCKET SYNCED) */}
      {pendingExtras.length > 0 && (
        <div className="mx-5 mt-4 glass-booking-card rounded-3xl p-4 border border-amber-300/80 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">
                  Real-Time Additional Work Approval Needed
                </span>
                <h4 className="text-xs font-bold text-slate-900">
                  {booking.workerName} requested extra part/labor approval
                </h4>
              </div>
            </div>
          </div>

          {pendingExtras.map((extra) => (
            <div
              key={extra.id}
              className="bg-white rounded-2xl p-3.5 border border-amber-200 space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {extra.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {extra.description}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                  +₹{extra.price}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <StatefulButton
                  variant="outline"
                  loadingText="Declining..."
                  successText="Declined"
                  className="py-2 rounded-xl text-xs"
                  onClick={() =>
                    respondExtraWork(booking.id, extra.id, 'REJECTED')
                  }
                >
                  <span>Decline</span>
                </StatefulButton>
                <StatefulButton
                  variant="emerald"
                  loadingText="Approving..."
                  successText="Approved ✓"
                  className="py-2 rounded-xl text-xs"
                  onClick={() =>
                    respondExtraWork(booking.id, extra.id, 'APPROVED')
                  }
                >
                  <span>Approve ₹{extra.price}</span>
                </StatefulButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live Status Timeline */}
      <div className="mx-5 mt-4 glass-booking-card rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Live Service Timeline
          </h3>
          {booking.status !== 'COMPLETED' && booking.status !== 'PAID' && (
            <button
              type="button"
              onClick={() => {
                const nextStatusMap: Partial<
                  Record<Booking['status'], Booking['status']>
                > = {
                  REQUESTED: 'ACCEPTED',
                  ACCEPTED: 'ARRIVED',
                  EN_ROUTE: 'ARRIVED',
                  ARRIVED: 'IN_PROGRESS',
                  IN_PROGRESS: 'COMPLETED',
                };
                const next = nextStatusMap[booking.status] || 'COMPLETED';
                updateBookingStatus(booking.id, next);
              }}
              className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              Advance Step →
            </button>
          )}
        </div>

        <div className="space-y-4">
          {timelineSteps.map((step, i) => {
            const stepIdx = statusOrder.indexOf(
              step.key as Booking['status']
            );
            const isDone = currentIdx >= stepIdx;
            const isCurrent = booking.status === step.key;

            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div
                      className={`w-0.5 h-7 mt-1 ${
                        currentIdx > stepIdx ? 'bg-emerald-400' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 -mt-0.5">
                  <p
                    className={`text-xs font-bold ${
                      isDone ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* UPI Payment & Transparent Bill Settlement Card */}
      <div className="mx-5 mt-4 glass-booking-card rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Transparent Bill & UPI Payment
          </h3>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              booking.paymentStatus === 'PAID'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {booking.paymentStatus === 'PAID' ? 'PAID ✓' : 'Pay on Completion'}
          </span>
        </div>

        <div className="space-y-1.5 text-xs border-b border-slate-100 pb-3">
          <div className="flex justify-between text-slate-600">
            <span>{booking.serviceTitle}</span>
            <span className="tabular-nums font-semibold">
              ₹{booking.baseAmount}
            </span>
          </div>
          {booking.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Promo Discount (SAVE25)</span>
              <span className="tabular-nums">-₹{booking.discountAmount}</span>
            </div>
          )}
          {(booking.extraWorkItems || []).map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center text-slate-600"
            >
              <span>
                {item.title}{' '}
                <span className="text-[10px] font-semibold text-slate-400">
                  ({item.status})
                </span>
              </span>
              <span
                className={`tabular-nums ${
                  item.status === 'APPROVED'
                    ? 'font-semibold text-slate-800'
                    : 'line-through text-slate-400'
                }`}
              >
                ₹{item.price}
              </span>
            </div>
          ))}
          <div className="flex justify-between text-slate-500">
            <span>GST & Partner Safety Insurance (18%)</span>
            <span className="tabular-nums">₹{gstAmount}</span>
          </div>
          <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-100">
            <span>Total Payable</span>
            <span className="tabular-nums text-blue-600">₹{grandTotal}</span>
          </div>
        </div>

        {booking.paymentStatus !== 'PAID' ? (
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Add a 100% direct tip for {booking.workerName} (Optional)
              </span>
              <div className="flex gap-2">
                {[0, 30, 50, 100].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipAmount(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      tipAmount === t
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {t === 0 ? 'No Tip' : `+₹${t}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Select Instant UPI / Payment Mode
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'UPI_GPAY', label: 'Google Pay (GPay)' },
                  { id: 'UPI_PHONEPE', label: 'PhonePe UPI' },
                  { id: 'UPI_PAYTM', label: 'Paytm UPI' },
                  { id: 'CASH', label: 'Cash after Service' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setSelectedUpi(
                        m.id as
                          | 'UPI_GPAY'
                          | 'UPI_PHONEPE'
                          | 'UPI_PAYTM'
                          | 'CASH'
                      )
                    }
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                      selectedUpi === m.id
                        ? 'border-blue-500 bg-blue-50/70 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <StatefulButton
              variant="blue"
              loadingText="Verifying UPI Payment..."
              successText="Paid ₹"
              className="w-full py-3.5 rounded-2xl text-xs font-bold"
              onClick={() => {
                completePayment(booking.id, selectedUpi, tipAmount);
              }}
            >
              <IndianRupee className="w-4 h-4" />
              <span>
                Pay ₹{grandTotal} via {selectedUpi.replace('UPI_', '')}
              </span>
            </StatefulButton>
          </div>
        ) : (
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">
                Rate {booking.workerName}&apos;s Service
              </h4>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingVal(star)}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= ratingVal
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write a quick review (e.g., punctual, clean work)..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
            <StatefulButton
              variant="primary"
              loadingText="Submitting Review..."
              successText="Review Saved!"
              className="w-full py-3 rounded-xl text-xs font-bold"
              onClick={() => {
                submitReview(booking.id, ratingVal, reviewComment);
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Submit Rating & Review</span>
            </StatefulButton>
          </div>
        )}
      </div>

      {/* GST Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase">
                  KaamDost GST Tax Invoice
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {booking.invoiceNumber}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs space-y-1.5 text-slate-600">
              <p>
                <strong className="text-slate-900">Customer:</strong>{' '}
                {booking.customerName} ({booking.area})
              </p>
              <p>
                <strong className="text-slate-900">Partner:</strong>{' '}
                {booking.workerBusiness} ({booking.workerName})
              </p>
              <p>
                <strong className="text-slate-900">Warranty:</strong> 30-Day
                KaamDost Service Protection
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Base Service Fee</span>
                <span className="tabular-nums">₹{booking.baseAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Approved Extra Parts</span>
                <span className="tabular-nums">₹{approvedExtrasTotal}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="tabular-nums">-₹{booking.discountAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span className="tabular-nums">₹{gstAmount}</span>
              </div>
              <div className="flex justify-between font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="tabular-nums">₹{grandTotal}</span>
              </div>
            </div>
            <StatefulButton
              variant="blue"
              loadingText="Downloading PDF..."
              successText="Invoice Saved!"
              className="w-full py-3 rounded-xl text-xs font-bold"
              onClick={() => {
                showToast('GST Invoice Downloaded', booking.invoiceNumber);
                setShowInvoiceModal(false);
              }}
            >
              <span>Download GST Invoice PDF</span>
            </StatefulButton>
          </div>
        </div>
      )}

      {/* Voice Call Overlay */}
      {showCallOverlay && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-between p-8 text-white">
          <div className="text-center mt-8">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              KaamDost Masked Privacy Call
            </span>
            <h3 className="text-xl font-bold mt-4">{booking.workerName}</h3>
            <p className="text-xs text-slate-300 mt-1">
              {booking.workerBusiness} • Connected (00:14)
            </p>
          </div>
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-emerald-400/50 animate-pulse">
              <SmartImage
                src={booking.workerAvatar}
                alt={booking.workerName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCallOverlay(false)}
            className="w-full max-w-xs py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer"
          >
            End Call
          </button>
        </div>
      )}
    </div>
  );
};

interface ChatScreenProps {
  booking: Booking;
  senderRole: 'CUSTOMER' | 'WORKER';
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  booking,
  senderRole,
  onBack,
}) => {
  const { sendChatMessage } = useKaamDost();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechInterim, setSpeechInterim] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [activeSpeechMode, setActiveSpeechMode] = useState<'LIVE' | 'SIMULATED'>('LIVE');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Check Web Speech API availability
  const hasWebSpeech =
    typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const [activeReplyCategory, setActiveReplyCategory] = useState<string>('POPULAR');
  const [audioReadbackEnabled, setAudioReadbackEnabled] = useState<boolean>(false);

  interface QuickReplyItem {
    id: string;
    text: string;
    shortLabel: string;
    icon: string;
    category: 'TRANSIT' | 'STATUS' | 'PARTS' | 'ACCESS';
    popular?: boolean;
  }

  const speakMessage = (text: string) => {
    if (!audioReadbackEnabled) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch {
        // speech synthesis not available or blocked
      }
    }
  };

  const workerQuickReplies: QuickReplyItem[] = [
    // Transit & ETA
    {
      id: 'w-on-way',
      shortLabel: 'On my way',
      text: 'On my way',
      icon: '🚗',
      category: 'TRANSIT',
      popular: true,
    },
    {
      id: 'w-5m-late',
      shortLabel: 'Running 5 mins late',
      text: 'Running 5 mins late',
      icon: '⏱️',
      category: 'TRANSIT',
      popular: true,
    },
    {
      id: 'w-traffic',
      shortLabel: 'Stuck in traffic',
      text: 'Stuck in traffic, reaching soon',
      icon: '🚦',
      category: 'TRANSIT',
      popular: true,
    },
    {
      id: 'w-at-gate',
      shortLabel: 'At building gate',
      text: 'Reached your building gate.',
      icon: '📍',
      category: 'TRANSIT',
      popular: true,
    },
    {
      id: 'w-doorstep',
      shortLabel: 'At doorstep',
      text: 'At your doorstep, please open.',
      icon: '🚪',
      category: 'TRANSIT',
      popular: true,
    },

    // Status & Work
    {
      id: 'w-inspecting',
      shortLabel: 'Inspecting issue',
      text: 'Starting diagnostic inspection of the issue now.',
      icon: '🔧',
      category: 'STATUS',
      popular: true,
    },
    {
      id: 'w-water-valve',
      shortLabel: 'Water valve off',
      text: 'Main water valve shut off for testing & safety.',
      icon: '🚰',
      category: 'STATUS',
    },
    {
      id: 'w-power-off',
      shortLabel: 'Power isolated',
      text: 'Main electrical breaker turned off for safe repair.',
      icon: '⚡',
      category: 'STATUS',
    },
    {
      id: 'w-work-done',
      shortLabel: 'Work completed',
      text: 'Work completed! Please inspect and verify.',
      icon: '✅',
      category: 'STATUS',
      popular: true,
    },
    {
      id: 'w-tested',
      shortLabel: 'Fittings verified',
      text: 'All fittings pressure tested with zero leaks.',
      icon: '✨',
      category: 'STATUS',
    },

    // Parts & Approvals
    {
      id: 'w-part-req',
      shortLabel: 'Spare part needed',
      text: 'A replacement part is required. Please check estimate.',
      icon: '⚠️',
      category: 'PARTS',
    },
    {
      id: 'w-part-install',
      shortLabel: 'Installing part',
      text: 'Spare part procured, installing now.',
      icon: '🛠️',
      category: 'PARTS',
    },

    // Access & Coordination
    {
      id: 'w-parking',
      shortLabel: 'Where to park?',
      text: 'Where can I park my two-wheeler?',
      icon: '🅿️',
      category: 'ACCESS',
    },
    {
      id: 'w-security',
      shortLabel: 'Security check',
      text: 'Security guard needs flat confirmation to permit entry.',
      icon: '🔑',
      category: 'ACCESS',
    },
    {
      id: 'w-call',
      shortLabel: 'Tried calling you',
      text: 'Tried calling your phone, please check chat.',
      icon: '📞',
      category: 'ACCESS',
    },
  ];

  const customerQuickReplies: QuickReplyItem[] = [
    {
      id: 'c-eta',
      shortLabel: 'Share ETA',
      text: 'Please share your live ETA.',
      icon: '⏱️',
      category: 'TRANSIT',
      popular: true,
    },
    {
      id: 'c-gate-code',
      shortLabel: 'Passcode #4021',
      text: 'Gate security passcode is #4021.',
      icon: '🔑',
      category: 'ACCESS',
      popular: true,
    },
    {
      id: 'c-door-open',
      shortLabel: 'Door open',
      text: 'Door is open, 3rd floor Flat 302.',
      icon: '🚪',
      category: 'ACCESS',
      popular: true,
    },
    {
      id: 'c-late',
      shortLabel: 'Running 5 mins late',
      text: 'Running 5 mins late, please wait for me at the lobby.',
      icon: '⏳',
      category: 'TRANSIT',
      popular: true,
    },
    {
      id: 'c-spare-tape',
      shortLabel: 'Bring Teflon tape',
      text: 'Please bring spare Teflon tape & valve.',
      icon: '🧰',
      category: 'PARTS',
    },
    {
      id: 'c-approved',
      shortLabel: 'Approved, proceed',
      text: 'Approved! Please proceed with the replacement.',
      icon: '👍',
      category: 'PARTS',
      popular: true,
    },
    {
      id: 'c-mixer',
      shortLabel: 'Check bathroom mixer',
      text: 'Please check the bathroom mixer tap as well.',
      icon: '🚰',
      category: 'STATUS',
    },
    {
      id: 'c-ready-pay',
      shortLabel: 'Ready for UPI payment',
      text: 'Service looks good, ready for instant UPI payout.',
      icon: '💳',
      category: 'STATUS',
      popular: true,
    },
  ];

  const activeQuickReplies =
    senderRole === 'WORKER' ? workerQuickReplies : customerQuickReplies;

  const quickReplyCategories = [
    { id: 'POPULAR', label: '🔥 Quick Common' },
    { id: 'ALL', label: '⚡ All Pre-sets' },
    { id: 'TRANSIT', label: '🚗 Transit & ETA' },
    { id: 'STATUS', label: '🔧 Status & Work' },
    { id: 'PARTS', label: '⚠️ Parts & Extra' },
    { id: 'ACCESS', label: '📍 Gate & Access' },
  ];

  const filteredQuickReplies =
    activeReplyCategory === 'POPULAR'
      ? activeQuickReplies.filter((item) => item.popular)
      : activeReplyCategory === 'ALL'
      ? activeQuickReplies
      : activeQuickReplies.filter((item) => item.category === activeReplyCategory);

  const handleSendQuickReply = (text: string) => {
    triggerHaptic(HAPTIC_PATTERNS.STATUS_UPDATE);
    sendChatMessage(booking.id, senderRole, text);
    setVoiceNotice(`Sent: "${text}"`);
    speakMessage(`Dispatched: ${text}`);
    setTimeout(() => setVoiceNotice(null), 2500);
  };

  const handleInsertQuickReply = (text: string) => {
    triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
    setInput((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${text}` : text;
    });
    setVoiceNotice(`Added to message: "${text}"`);
    speakMessage('Inserted preset into message');
    setTimeout(() => setVoiceNotice(null), 2000);
  };

  // Stop listening helper
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore if already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setSpeechInterim('');
  };

  // Toggle microphone recording with Web Speech API or simulated fallback
  const toggleListening = () => {
    triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);

    if (isListening) {
      stopListening();
      return;
    }

    setSpeechError(null);
    setVoiceNotice(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Graceful fallback when Web Speech API is not supported in the environment/browser
      setActiveSpeechMode('SIMULATED');
      setIsListening(true);
      simulateVoiceDictation('I am reaching your building gate in 5 minutes.');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition: any = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English tailored for KaamDost

      recognition.onstart = () => {
        setIsListening(true);
        setActiveSpeechMode('LIVE');
        setSpeechError(null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript;
          } else {
            interim += transcript;
          }
        }

        if (finalChunk) {
          setInput((prev) => {
            const trimmed = prev.trim();
            const chunk = finalChunk.trim();
            return trimmed ? `${trimmed} ${chunk}` : chunk;
          });
        }
        setSpeechInterim(interim);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError(
            'Microphone access is restricted in this browser frame. Use hands-free voice presets or test dictation below!'
          );
          setIsListening(false);
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Speech recognition note: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechInterim('');
      };

      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      // Fallback to simulated hands-free voice dictation
      setActiveSpeechMode('SIMULATED');
      setIsListening(true);
      simulateVoiceDictation('Arrived at customer location. Inspecting work area.');
    }
  };

  // Simulated voice dictation typewriter for demonstration and fallback environments
  const simulateVoiceDictation = (sampleText: string) => {
    setSpeechInterim('Listening...');
    let index = 0;
    const interval = setInterval(() => {
      index += 3;
      if (index <= sampleText.length) {
        setSpeechInterim(sampleText.slice(0, index));
      } else {
        clearInterval(interval);
        setInput((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${sampleText}` : sampleText;
        });
        setSpeechInterim('');
        setIsListening(false);
        setVoiceNotice('Hands-free dictation transcribed successfully!');
        setTimeout(() => setVoiceNotice(null), 3000);
      }
    }, 80);
  };

  // Hands-free incoming message voice readback when audioReadbackEnabled is active
  const prevMsgCountRef = useRef(booking.messages.length);
  useEffect(() => {
    if (booking.messages.length > prevMsgCountRef.current) {
      const lastMsg = booking.messages[booking.messages.length - 1];
      if (lastMsg && lastMsg.sender !== senderRole && audioReadbackEnabled) {
        const senderName =
          senderRole === 'WORKER' ? booking.customerName : booking.workerName;
        speakMessage(`${senderName}: ${lastMsg.text}`);
      }
    }
    prevMsgCountRef.current = booking.messages.length;
  }, [
    booking.messages.length,
    audioReadbackEnabled,
    senderRole,
    booking.customerName,
    booking.workerName,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
    sendChatMessage(booking.id, senderRole, input);
    setInput('');
    if (isListening) {
      stopListening();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[680px] bg-[#F7F9FD] pb-24">
      {/* Top Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              stopListening();
              onBack();
            }}
            className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <SmartImage
            src={booking.workerAvatar}
            alt={booking.workerName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100"
          />
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>{senderRole === 'CUSTOMER' ? booking.workerName : booking.customerName}</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                <Radio className="w-2.5 h-2.5 text-blue-600 animate-pulse" />
                Live
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Booking #{booking.id} • {booking.serviceTitle}
            </p>
          </div>
        </div>

        {/* Hands-Free Voice Status Controls (Mic & Audio Readback) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
              const next = !audioReadbackEnabled;
              setAudioReadbackEnabled(next);
              if (next) {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  try {
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance('Audio readback enabled');
                    u.lang = 'en-IN';
                    window.speechSynthesis.speak(u);
                  } catch {
                    // ignore
                  }
                }
              }
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs border ${
              audioReadbackEnabled
                ? 'bg-amber-500 text-white border-amber-600 shadow-amber-200 ring-2 ring-amber-300'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
            }`}
            title="Toggle hands-free audio voice readback for safe riding"
          >
            <Volume2 className={`w-3.5 h-3.5 ${audioReadbackEnabled ? 'text-white animate-pulse' : 'text-slate-500'}`} />
            <span>{audioReadbackEnabled ? 'Readback ON' : 'Readback'}</span>
          </button>

          <button
            type="button"
            onClick={toggleListening}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-300'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
            title="Toggle hands-free microphone dictation"
          >
            {isListening ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <Mic className="w-3.5 h-3.5" />
                <span>Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-blue-600" />
                <span>Voice Mic</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Worker Hands-Free Notice / Status Banner */}
      {senderRole === 'WORKER' && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-[11px] text-slate-200">
              <strong className="text-white">Hands-Free Dictation:</strong> Tap mic icon or voice chips to dictate status updates on the move.
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-blue-800/80 rounded text-blue-200">
            Speech-To-Text
          </span>
        </div>
      )}

      {/* Voice Notification Toast */}
      {voiceNotice && (
        <div className="mx-4 mt-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{voiceNotice}</span>
        </div>
      )}

      {/* Speech Error Banner (with fallback action) */}
      {speechError && (
        <div className="mx-4 mt-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Voice Dictation Assistant</span>
            </div>
            <button
              type="button"
              onClick={() => setSpeechError(null)}
              className="text-amber-600 hover:text-amber-800 text-[11px] font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">{speechError}</p>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        <div className="text-center my-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Encrypted Job Channel
          </span>
        </div>

        {booking.messages.map((msg) => {
          const isMe = msg.sender === senderRole;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <div
                  className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${
                    isMe ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {isMe &&
                    (msg.isCachedOffline ? (
                      <span
                        className="flex items-center gap-0.5 text-amber-200 text-[9px] font-medium bg-amber-400/20 px-1 py-0.2 rounded"
                        title="Stored in local Service Cache · Will auto-sync when online"
                      >
                        <Clock className="w-2.5 h-2.5 animate-pulse" />
                        <span>Cached</span>
                      </span>
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-blue-200" />
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Active Recording / Dictating Panel */}
      {isListening && (
        <div className="mx-4 mb-2 p-3 bg-white border-2 border-rose-400 rounded-2xl shadow-lg space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
              </span>
              <span className="text-xs font-bold text-rose-700">
                Listening Hands-Free...
              </span>
              <span className="text-[10px] text-slate-400">
                ({activeSpeechMode === 'LIVE' ? 'Web Speech Engine' : 'Voice Synthesizer'})
              </span>
            </div>

            {/* Audio Wave Visualizer Bars */}
            <div className="flex items-center gap-0.5 h-4">
              <span className="w-1 h-3 bg-rose-500 rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-rose-600 rounded-full animate-bounce" />
              <span className="w-1 h-2 bg-rose-400 rounded-full animate-pulse" />
              <span className="w-1 h-5 bg-rose-500 rounded-full animate-bounce" />
              <span className="w-1 h-2.5 bg-rose-400 rounded-full animate-pulse" />
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700 min-h-[38px] flex items-center">
            {speechInterim ? (
              <span className="text-slate-900 font-medium italic">
                &ldquo;{speechInterim}&rdquo;
              </span>
            ) : (
              <span className="text-slate-400 italic">
                Speak status or clarification now (e.g. &ldquo;Reached doorstep, starting repair&rdquo;)...
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={stopListening}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <MicOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Done Dictating</span>
            </button>

            {input.trim() && (
              <button
                type="button"
                onClick={handleSend}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Dictated Update</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* QUICK REPLY PRE-SETS DECK */}
      <div className="p-3 bg-white border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">
              Quick Reply Pre-sets
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              (1-Tap Send • + to edit)
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            Instant Dispatch
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {quickReplyCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
                setActiveReplyCategory(cat.id);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                activeReplyCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Pre-set Message Chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {filteredQuickReplies.map((qr) => (
            <div
              key={qr.id}
              className="inline-flex items-center rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition text-slate-800 shadow-2xs shrink-0 group"
            >
              {/* Main tap: Instant Send */}
              <button
                type="button"
                onClick={() => handleSendQuickReply(qr.text)}
                className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:text-blue-700 whitespace-nowrap"
                title={`Send instantly: "${qr.text}"`}
              >
                <span>{qr.icon}</span>
                <span>{qr.text}</span>
                <Send className="w-3 h-3 text-slate-400 group-hover:text-blue-600 ml-0.5" />
              </button>

              {/* Auxiliary + button: Insert into text input */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInsertQuickReply(qr.text);
                }}
                className="pr-2.5 pl-1 py-1.5 text-slate-400 hover:text-blue-600 cursor-pointer border-l border-slate-200"
                title={`Insert into input to edit before sending`}
                aria-label={`Insert ${qr.text}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Main Input Bar with Microphone Button */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Hands-Free Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer shrink-0 transition-all ${
              isListening
                ? 'bg-rose-600 text-white shadow-md ring-4 ring-rose-200 animate-pulse'
                : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200'
            }`}
            aria-label={isListening ? 'Stop microphone dictation' : 'Dictate hands-free with microphone'}
            title={
              isListening
                ? 'Stop listening'
                : hasWebSpeech
                ? 'Dictate message hands-free (Microphone-to-Text)'
                : 'Tap to dictate hands-free status'
            }
          >
            {isListening ? (
              <MicOff className="w-4 h-4 animate-bounce" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Text Input with Real-time Dictation preview */}
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening hands-free... speak now'
                  : senderRole === 'WORKER'
                  ? 'Type or tap mic to dictate status...'
                  : 'Type a message or tap mic...'
              }
              className={`w-full rounded-2xl bg-slate-50 border px-4 py-2.5 text-xs text-slate-800 focus:outline-none transition ${
                isListening
                  ? 'border-rose-400 bg-rose-50/20 text-rose-900 ring-2 ring-rose-200'
                  : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {isListening && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
            )}
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim()}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer shrink-0 transition ${
              input.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
