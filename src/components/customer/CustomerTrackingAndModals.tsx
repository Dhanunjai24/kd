import React, { useState } from 'react';
import { Booking, WorkerProfile } from '../../types/kaamdost';
import { useKaamDost } from '../../context/KaamDostContext';
import { SmartImage, StatefulButton } from '../ui/StateSystem';
import { BENGALURU_LOCATIONS } from '../../data/initialData';
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

  const approvedExtrasTotal = booking.extraWorkItems
    .filter((i) => i.status === 'APPROVED')
    .reduce((sum, item) => sum + item.price, 0);

  const pendingExtras = booking.extraWorkItems.filter(
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
      <div className="mx-5 mt-4 rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-xs">
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
      </div>

      {/* REAL-TIME ADDITIONAL WORK APPROVAL PROMPT (SOCKET SYNCED) */}
      {pendingExtras.length > 0 && (
        <div className="mx-5 mt-4 bg-amber-50/95 rounded-3xl p-4 border-2 border-amber-300 shadow-sm space-y-3">
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
      <div className="mx-5 mt-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
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
      <div className="mx-5 mt-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
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
          {booking.extraWorkItems.map((item) => (
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

  const quickReplies =
    senderRole === 'CUSTOMER'
      ? [
          'Please share your live ETA.',
          'Gate security passcode is #4021.',
          'Please bring spare Teflon tape & valve.',
        ]
      : [
          'I am on the way, reaching in 10 mins!',
          'Reached your building gate.',
          'Please check the extra spare part approval.',
        ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendChatMessage(booking.id, senderRole, input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full min-h-[680px] bg-[#F7F9FD] pb-24">
      {/* Top Header */}
      <div className="px-4 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <SmartImage
            src={booking.workerAvatar}
            alt={booking.workerName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {senderRole === 'CUSTOMER'
                ? booking.workerName
                : booking.customerName}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium">
              WebSocket Connected • Booking #{booking.id}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {booking.messages.map((msg) => {
          const isMe = msg.sender === senderRole;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-xs'
                }`}
              >
                <p>{msg.text}</p>
                <span
                  className={`text-[10px] block mt-1 ${
                    isMe ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Replies & Input */}
      <div className="p-3 bg-white border-t border-slate-100 space-y-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {quickReplies.map((qr) => (
            <button
              key={qr}
              type="button"
              onClick={() => sendChatMessage(booking.id, senderRole, qr)}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[11px] font-medium text-slate-700 whitespace-nowrap transition cursor-pointer"
            >
              {qr}
            </button>
          ))}
        </div>
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
