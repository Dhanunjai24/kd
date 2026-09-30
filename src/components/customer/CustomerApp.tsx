import React, { useState } from 'react';
import { useKaamDost } from '../../context/KaamDostContext';
import { WorkerProfile } from '../../types/kaamdost';
import {
  ASSETS,
  SERVICE_CATEGORIES,
  BENGALURU_LOCATIONS,
} from '../../data/initialData';
import {
  SmartImage,
  StatefulButton,
  WorkerCardSkeleton,
  EmptyState,
  ErrorState,
} from '../ui/StateSystem';
import {
  BookingScheduleModal,
  LiveBookingTracker,
  ChatScreen,
} from './CustomerTrackingAndModals';
import {
  ArrowLeft,
  Bookmark,
  MapPin,
  Star,
  Check,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  Bell,
  Calendar,
  MessageCircle,
  User,
  Home as HomeIcon,
  HelpCircle,
  LogOut,
  ChevronRight,
  PhoneCall,
  Sparkles,
  X,
} from 'lucide-react';

export type CustomerScreen =
  | 'SPLASH_OTP'
  | 'HOME'
  | 'POPULAR_SERVICES'
  | 'WORKER_PROFILE'
  | 'BOOKING_TRACKER'
  | 'BOOKINGS_LIST'
  | 'CHAT'
  | 'NOTIFICATIONS'
  | 'PROFILE'
  | 'SUPPORT';

export const CustomerApp: React.FC<{
  onSwitchToWorkerApp?: () => void;
}> = ({ onSwitchToWorkerApp }) => {
  const {
    workers,
    bookings,
    notifications,
    customerLocation,
    setCustomerLocation,
    toggleBookmarkWorker,
    markNotificationsRead,
    showToast,
    uiDemoState,
    setUiDemoState,
  } = useKaamDost();

  const [screen, setScreen] = useState<CustomerScreen>('HOME');
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCategoryLoading, setIsCategoryLoading] = useState<boolean>(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile>(
    workers[0]
  );
  const [activeBookingId, setActiveBookingId] = useState<string>(
    bookings[0]?.id || 'KD-84920'
  );
  const [bookingModalWorker, setBookingModalWorker] =
    useState<WorkerProfile | null>(null);
  const [bookingModalService, setBookingModalService] = useState<{
    title?: string;
    price?: number;
  }>({});
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'distance'>(
    'rating'
  );
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('98450 72109');
  const [otpInput, setOtpInput] = useState('4829');

  const currentWorker =
    workers.find((w) => w.id === selectedWorker.id) || workers[0];
  const currentBooking =
    bookings.find((b) => b.id === activeBookingId) || bookings[0];

  const customerUnreadCount = notifications.filter(
    (n) => n.recipient === 'CUSTOMER' && !n.read
  ).length;

  const pendingExtraApprovalCount = bookings.reduce(
    (acc, b) =>
      acc + (b.extraWorkItems || []).filter((x) => x.status === 'PENDING').length,
    0
  );

  const handleCategorySwitch = (
    filterKey: string,
    navigateToPopular = false
  ) => {
    setSelectedCategoryFilter(filterKey);
    if (navigateToPopular) {
      setScreen('POPULAR_SERVICES');
    }
    setIsCategoryLoading(true);
    setTimeout(() => {
      setIsCategoryLoading(false);
    }, 320);
  };

  const openWorkerProfile = (worker: WorkerProfile) => {
    setSelectedWorker(worker);
    setScreen('WORKER_PROFILE');
  };

  const filteredWorkers = workers
    .filter((w) => {
      const matchesCat =
        selectedCategoryFilter === 'all' ||
        w.filterKey === selectedCategoryFilter ||
        w.trade.toLowerCase() === selectedCategoryFilter.toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesCat;
      const matchesSearch =
        w.name.toLowerCase().includes(q) ||
        w.businessName.toLowerCase().includes(q) ||
        w.trade.toLowerCase().includes(q) ||
        w.skills.some((s) => s.toLowerCase().includes(q)) ||
        w.rateCard.some((r) => r.title.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.rate - b.rate;
      if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
      return b.rating - a.rating;
    });

  const matchingProblems = searchQuery.trim()
    ? SERVICE_CATEGORIES.flatMap((cat) =>
        cat.commonProblems
          .filter(
            (p) =>
              p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              cat.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((p) => ({ ...p, trade: cat.name, filterKey: cat.filterKey }))
      )
    : [];

  // 1. SPLASH + LOGIN / OTP SCREEN
  if (screen === 'SPLASH_OTP') {
    return (
      <div className="min-h-[780px] bg-gradient-to-b from-[#E0F2FE] via-[#F8FAFC] to-white p-6 flex flex-col justify-between">
        <div className="pt-6 flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-white text-blue-600 text-xs font-extrabold shadow-2xs border border-blue-100">
            🇮🇳 KaamDost India
          </span>
          <button
            type="button"
            onClick={() => setScreen('HOME')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Skip to Home →
          </button>
        </div>

        <div className="my-auto space-y-5">
          <div className="relative w-36 h-36 mx-auto">
            <SmartImage
              src={ASSETS.handyman3D}
              alt="KaamDost 3D Mascot"
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </div>
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Trusted Home Experts in 20 Mins
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Upfront ₹ pricing • Aadhaar & Police Verified Artisans • 30-Day
              Service Guarantee
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Mobile Number (India +91)
              </label>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <span className="text-xs font-bold text-slate-900 pr-2.5 border-r border-slate-200">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full pl-3 text-sm font-bold text-slate-900 bg-transparent focus:outline-none tabular-nums"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  4-Digit SMS OTP
                </label>
                <span className="text-[11px] text-blue-600 font-semibold">
                  Auto-filled Demo OTP
                </span>
              </div>
              <input
                type="text"
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center tracking-[0.5em] text-base font-extrabold text-slate-900 focus:outline-none focus:border-blue-500 tabular-nums"
              />
            </div>

            <StatefulButton
              variant="blue"
              loadingText="Verifying OTP..."
              successText="Verified! Welcome Alex"
              className="w-full py-3.5 rounded-2xl text-xs font-bold"
              onClick={() => {
                showToast('Logged in as Alex Carter', '+91 98450 72109');
                setScreen('HOME');
              }}
            >
              <span>Verify OTP & Continue</span>
            </StatefulButton>

            {onSwitchToWorkerApp && (
              <button
                type="button"
                onClick={onSwitchToWorkerApp}
                className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition cursor-pointer"
              >
                Are you a Skilled Professional? Open Worker App →
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          100% Safe & Insured • Zero Hidden Charges • Instant UPI
        </p>
      </div>
    );
  }

  // 2. WORKER PROFILE, RATINGS & EXPERIENCE SCREEN (MATCHING IMAGE 6 & HTML)
  if (screen === 'WORKER_PROFILE') {
    return (
      <div className="relative flex flex-col min-h-[820px] bg-[#F5F8FA] pb-24 overflow-hidden">
        {/* Top Floating Navigation */}
        <nav
          aria-label="Top Actions"
          className="absolute top-5 left-0 right-0 z-30 px-5 flex justify-between items-center pointer-events-auto"
        >
          <button
            type="button"
            aria-label="Go back"
            onClick={() => setScreen('HOME')}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-700 shadow-xs border border-white/60 active:scale-95 hover:bg-white transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Save profile"
            onClick={() => toggleBookmarkWorker(currentWorker.id)}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-700 shadow-xs border border-white/60 active:scale-95 hover:bg-white transition cursor-pointer"
          >
            <Bookmark
              className={`w-5 h-5 ${
                currentWorker.isBookmarked
                  ? 'fill-[#FF7334] text-[#FF7334]'
                  : 'text-slate-700'
              }`}
            />
          </button>
        </nav>

        {/* Hero Visual Section */}
        <section className="relative w-full h-[350px] bg-gradient-to-b from-[#E7EFF9] via-[#EAF2FB] to-[#F5F8FA] overflow-hidden flex justify-center items-end">
          <div className="absolute -top-10 -left-10 w-60 h-60 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-16 -right-10 w-64 h-64 bg-indigo-200/35 rounded-full blur-3xl pointer-events-none" />
          <SmartImage
            src={currentWorker.heroPortraitUrl}
            alt={`${currentWorker.name} - ${currentWorker.trade}`}
            fallbackLabel={currentWorker.name}
            className="w-[85%] max-w-[320px] h-[340px] object-cover object-top hero-mask drop-shadow-xs transition-transform duration-300 hover:scale-[1.02]"
          />
        </section>

        {/* Profile Detail Card */}
        <section className="relative -mt-6 mx-0 px-5 pt-6 pb-6 bg-white rounded-t-[32px] shadow-lg border-t border-slate-100/70 flex-1 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {currentWorker.name}
                </h1>
                <span
                  className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full text-white"
                  title="Verified Professional"
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FF7334] text-white tracking-wide shadow-2xs">
                  {currentWorker.trade}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#FF7334]" />
                <span>{currentWorker.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-amber-50/80 px-2.5 py-1 rounded-xl border border-amber-100 shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-slate-900 tabular-nums">
                {currentWorker.rating}
              </span>
              <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                ({currentWorker.reviewCount})
              </span>
            </div>
          </div>

          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                ₹{currentWorker.rate}
              </span>
              <span className="text-xs font-medium text-slate-400">
                ({currentWorker.rateUnit})
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              <span>{currentWorker.experienceYears}+ Yrs Exp</span>
              <span className="mx-1.5">·</span>
              <span className="text-emerald-700 font-semibold">
                {currentWorker.completedJobs} Jobs Done
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">About Me</h2>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-body">
              {currentWorker.about}
            </p>
          </div>

          {/* Work Gallery */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <h2 className="text-sm font-bold text-slate-900">Gallery</h2>
              <button
                type="button"
                onClick={() =>
                  setLightboxImage(currentWorker.galleryUrls[0] || null)
                }
                className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {currentWorker.galleryUrls.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxImage(url)}
                  className="relative h-20 rounded-xl overflow-hidden bg-slate-100 group cursor-pointer shadow-2xs"
                >
                  <SmartImage
                    src={url}
                    alt={`${currentWorker.trade} work sample ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Transparent Rate Card */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900">
                Transparent Rate Card
              </h2>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 30-Day Warranty
              </span>
            </div>
            <div className="space-y-2">
              {currentWorker.rateCard.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.timeEstimate} · Upfront Fixed Price
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingModalService({
                        title: item.title,
                        price: item.price,
                      });
                      setBookingModalWorker(currentWorker);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-bold transition tabular-nums shrink-0 cursor-pointer"
                  >
                    ₹{item.price} + Book
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews */}
          {currentWorker.reviews.length > 0 && (
            <div className="pt-1">
              <h2 className="text-sm font-bold text-slate-900 mb-2">
                Recent Customer Reviews
              </h2>
              <div className="space-y-2.5">
                {currentWorker.reviews.slice(0, 2).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {rev.customerName}
                      </span>
                      <span className="text-[11px] text-amber-500 font-bold">
                        ★ {rev.rating}.0 ·{' '}
                        <span className="text-slate-400 font-normal">
                          {rev.date}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-body">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Sticky Bottom Actions */}
        <footer className="sticky bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200/60 px-5 py-3.5 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={() => setScreen('CHAT')}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-slate-600" />
            <span>Message</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setBookingModalService({
                title: `${currentWorker.trade} Visit & Repair`,
                price: currentWorker.rate,
              });
              setBookingModalWorker(currentWorker);
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#2190FE] to-[#127FE8] hover:from-[#1b84ec] hover:to-[#0f73d3] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/30 active:scale-95 transition cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Now</span>
          </button>
        </footer>

        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div className="relative max-w-md w-full rounded-3xl overflow-hidden bg-white p-2">
              <SmartImage
                src={lightboxImage}
                alt="Work Sample Full View"
                className="w-full h-72 object-cover rounded-2xl"
              />
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="mt-2 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}

        {bookingModalWorker && (
          <BookingScheduleModal
            worker={bookingModalWorker}
            initialServiceTitle={bookingModalService.title}
            initialPrice={bookingModalService.price}
            onClose={() => setBookingModalWorker(null)}
            onBooked={(created) => {
              setBookingModalWorker(null);
              setActiveBookingId(created.id);
              setScreen('BOOKING_TRACKER');
            }}
          />
        )}
      </div>
    );
  }

  // 3. MOST POPULAR SERVICES SCREEN (MATCHING IMAGE 8 & HTML)
  if (screen === 'POPULAR_SERVICES') {
    const filterTabs = [
      { key: 'all', label: 'All' },
      { key: 'plumbing', label: 'Plumbing' },
      { key: 'cleaning', label: 'Cleaning' },
      { key: 'electrician', label: 'Electrician' },
      { key: 'painting', label: 'Painting' },
      { key: 'carpentry', label: 'Carpentry' },
      { key: 'masonry', label: 'Masonry' },
    ];

    return (
      <div className="flex flex-col min-h-[820px] bg-[#F8FAFD] pb-28 relative">
        <section className="px-5 pt-5 pb-2 flex items-center relative z-20">
          <button
            type="button"
            aria-label="Back"
            onClick={() => setScreen('HOME')}
            className="w-10 h-10 rounded-2xl bg-white shadow-2xs border border-slate-100 flex items-center justify-center active:scale-95 transition text-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center font-bold text-slate-800 text-lg tracking-tight pr-10">
            Most Popular Services
          </h1>
        </section>

        <nav
          aria-label="Category Filters"
          className="pt-3 pb-2 px-5 overflow-x-auto no-scrollbar flex space-x-2.5 z-20"
        >
          {filterTabs.map((tab) => {
            const isActive = selectedCategoryFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleCategorySwitch(tab.key)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full font-medium text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#38A7F8] text-white shadow-xs px-6'
                    : 'bg-white border border-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <section className="px-5 mt-2 space-y-4 flex-1">
          {isCategoryLoading || uiDemoState === 'skeleton' ? (
            <WorkerCardSkeleton count={3} />
          ) : uiDemoState === 'error' ? (
            <ErrorState onRetry={() => setUiDemoState('normal')} />
          ) : filteredWorkers.length === 0 || uiDemoState === 'empty' ? (
            <EmptyState
              title="No specialists found in this filter"
              description="Try switching back to All Categories or clearing your search filter."
              actionLabel="Show All Services"
              onAction={() => {
                setUiDemoState('normal');
                handleCategorySwitch('all');
              }}
            />
          ) : (
            filteredWorkers.map((worker) => (
              <article
                key={worker.id}
                className="bg-white rounded-3xl p-4 shadow-[0_8px_24px_-4px_rgba(149,157,165,0.12)] border border-slate-100/80 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="relative shrink-0">
                      <div className="w-[54px] h-[54px] rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                        <SmartImage
                          src={worker.popularAvatarUrl}
                          alt={`${worker.name} - ${worker.trade}`}
                          fallbackLabel={worker.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                      </div>
                    </div>

                    <div>
                      <h2 className="font-bold text-slate-800 text-base leading-tight">
                        {worker.businessName}
                      </h2>
                      <p className="text-[#38A7F8] font-semibold text-sm mt-0.5 tabular-nums">
                        ₹{worker.rate}
                        {worker.rateUnit !== 'per visit' && (
                          <span className="text-slate-400 font-normal text-xs">
                            /{worker.rateUnit}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center space-x-1 mt-1 text-xs text-slate-500">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-slate-700 tabular-nums">
                          {worker.rating}
                        </span>
                        <span className="tabular-nums">
                          ({worker.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="bg-[#F97316] text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    {worker.trade}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => openWorkerProfile(worker)}
                    className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 active:scale-95 transition shadow-2xs cursor-pointer"
                  >
                    <i className="fa-regular fa-eye text-slate-500 text-xs" />
                    <span>View Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingModalService({
                        title: worker.businessName,
                        price: worker.rate,
                      });
                      setBookingModalWorker(worker);
                    }}
                    className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#38A7F8] to-[#2563EB] text-white font-semibold text-xs shadow-sm shadow-blue-500/25 active:scale-95 transition cursor-pointer"
                  >
                    <i className="fa-regular fa-calendar-check text-xs" />
                    <span>Book Now</span>
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

        {bookingModalWorker && (
          <BookingScheduleModal
            worker={bookingModalWorker}
            initialServiceTitle={bookingModalService.title}
            initialPrice={bookingModalService.price}
            onClose={() => setBookingModalWorker(null)}
            onBooked={(created) => {
              setBookingModalWorker(null);
              setActiveBookingId(created.id);
              setScreen('BOOKING_TRACKER');
            }}
          />
        )}

        <CustomerBottomDock
          activeScreen={screen}
          onNavigate={setScreen}
          unreadChatCount={currentBooking?.messages.length || 1}
        />
      </div>
    );
  }

  // 4. LIVE BOOKING TRACKER SCREEN
  if (screen === 'BOOKING_TRACKER' && currentBooking) {
    return (
      <div className="relative min-h-[820px] bg-[#F7F9FD]">
        <LiveBookingTracker
          booking={currentBooking}
          onBack={() => setScreen('BOOKINGS_LIST')}
          onOpenChat={() => setScreen('CHAT')}
        />
        <CustomerBottomDock
          activeScreen="BOOKINGS_LIST"
          onNavigate={setScreen}
          unreadChatCount={currentBooking.messages.length}
        />
      </div>
    );
  }

  // 5. CHAT SCREEN
  if (screen === 'CHAT' && currentBooking) {
    return (
      <div className="relative min-h-[820px] bg-[#F7F9FD]">
        <ChatScreen
          booking={currentBooking}
          senderRole="CUSTOMER"
          onBack={() => setScreen('BOOKING_TRACKER')}
        />
        <CustomerBottomDock
          activeScreen="CHAT"
          onNavigate={setScreen}
          unreadChatCount={0}
        />
      </div>
    );
  }

  // 6. BOOKINGS LIST
  if (screen === 'BOOKINGS_LIST') {
    return (
      <div className="flex flex-col min-h-[820px] bg-[#F7F9FD] pb-28">
        <header className="px-5 pt-5 pb-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">My Bookings</h1>
            <p className="text-xs text-slate-500">
              WebSocket synced live tracking & invoices
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScreen('POPULAR_SERVICES')}
            className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold cursor-pointer"
          >
            + New Booking
          </button>
        </header>

        <div className="p-5 space-y-3.5">
          {bookings.map((b) => {
            const hasPendingExtra = (b.extraWorkItems || []).some(
              (x) => x.status === 'PENDING'
            );
            return (
              <div
                key={b.id}
                onClick={() => {
                  setActiveBookingId(b.id);
                  setScreen('BOOKING_TRACKER');
                }}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3 cursor-pointer hover:border-blue-200 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <SmartImage
                      src={b.workerAvatar}
                      alt={b.workerName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400">
                        #{b.id} • {b.scheduledDate}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {b.serviceTitle}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {b.workerBusiness} ({b.workerName})
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                      b.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {b.status.replace('_', ' ')}
                  </span>
                </div>

                {hasPendingExtra && (
                  <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900">
                      ⚠️ Approval Needed: Worker requested extra part
                    </span>
                    <span className="font-extrabold text-amber-700">
                      Review →
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Start OTP:{' '}
                    <strong className="text-slate-900 tabular-nums">
                      {b.startOtp}
                    </strong>
                  </span>
                  <span className="font-extrabold text-blue-600 flex items-center gap-1">
                    Track Live Status <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <CustomerBottomDock
          activeScreen="BOOKINGS_LIST"
          onNavigate={setScreen}
          unreadChatCount={currentBooking?.messages.length || 0}
        />
      </div>
    );
  }

  // 7. NOTIFICATIONS SCREEN
  if (screen === 'NOTIFICATIONS') {
    const custNotifs = notifications.filter((n) => n.recipient === 'CUSTOMER');
    return (
      <div className="flex flex-col min-h-[820px] bg-[#F7F9FD] pb-28">
        <header className="px-5 pt-5 pb-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScreen('HOME')}
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-bold text-slate-900">
              Notifications
            </h1>
          </div>
          <button
            type="button"
            onClick={() => markNotificationsRead('CUSTOMER')}
            className="text-xs font-semibold text-blue-600 cursor-pointer"
          >
            Mark all read
          </button>
        </header>
        <div className="p-5 space-y-3">
          {custNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.bookingId) {
                  setActiveBookingId(n.bookingId);
                  setScreen('BOOKING_TRACKER');
                }
              }}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                n.read
                  ? 'bg-white border-slate-100'
                  : 'bg-blue-50/60 border-blue-200 shadow-2xs'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {n.time}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-body">
                {n.body}
              </p>
            </div>
          ))}
        </div>
        <CustomerBottomDock
          activeScreen="HOME"
          onNavigate={setScreen}
          unreadChatCount={0}
        />
      </div>
    );
  }

  // 8. PROFILE & SUPPORT SCREEN
  if (screen === 'PROFILE' || screen === 'SUPPORT') {
    return (
      <div className="flex flex-col min-h-[820px] bg-[#F7F9FD] pb-28">
        <header className="px-5 pt-5 pb-4 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SmartImage
              src={ASSETS.alexCarterAvatar}
              alt="Alex Carter"
              className="w-13 h-13 rounded-full object-cover ring-2 ring-blue-100"
            />
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Alex Carter
              </h1>
              <p className="text-xs text-slate-500">
                +91 98450 72109 • {customerLocation.area}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScreen('SPLASH_OTP')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>OTP Login</span>
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-100 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900">
              Saved Service Addresses (Bengaluru)
            </h3>
            {BENGALURU_LOCATIONS.map((loc) => (
              <button
                key={loc.tag}
                type="button"
                onClick={() => {
                  setCustomerLocation(loc);
                  showToast(`Default location set to ${loc.area}`);
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                  customerLocation.area === loc.area
                    ? 'border-blue-500 bg-blue-50/40'
                    : 'border-slate-100 bg-slate-50/60'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {loc.tag} — {loc.area}
                  </p>
                  <p className="text-[11px] text-slate-500">{loc.address}</p>
                </div>
                {customerLocation.area === loc.area && (
                  <span className="text-[11px] font-bold text-blue-600">
                    Active ✓
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900">
                24×7 KaamDost Customer Protection & Help
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-body">
              Every booking includes ₹10,000 property damage protection,
              upfront rate cards, and a 30-day rework guarantee.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <StatefulButton
                variant="outline"
                loadingText="Connecting..."
                successText="Callback Scheduled!"
                className="py-2.5 rounded-xl text-xs"
                onClick={() =>
                  showToast(
                    'Support Callback Requested',
                    'Our Bengaluru support desk will call you in 2 mins'
                  )
                }
              >
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                <span>Request Callback</span>
              </StatefulButton>
              <StatefulButton
                variant="blue"
                loadingText="Checking..."
                successText="30-Day Warranty Active"
                className="py-2.5 rounded-xl text-xs"
                onClick={() =>
                  showToast('KaamDost Shield Active', 'Covered on #KD-84920')
                }
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Claim Warranty</span>
              </StatefulButton>
            </div>
          </div>

          {onSwitchToWorkerApp && (
            <button
              type="button"
              onClick={onSwitchToWorkerApp}
              className="w-full p-4 rounded-3xl bg-[#0F172A] text-white flex items-center justify-between shadow-sm cursor-pointer"
            >
              <div className="text-left">
                <span className="text-[10px] font-bold text-amber-400 uppercase">
                  Connected Experience
                </span>
                <p className="text-sm font-bold">
                  Switch to KaamDost Worker Partner App
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400" />
            </button>
          )}
        </div>

        <CustomerBottomDock
          activeScreen="PROFILE"
          onNavigate={setScreen}
          unreadChatCount={0}
        />
      </div>
    );
  }

  // 9. CUSTOMER HOME SCREEN (MATCHING IMAGE 3 & HTML)
  return (
    <div className="w-full bg-[#F7F9FD] min-h-[820px] flex flex-col relative overflow-x-hidden pb-28">
      {/* TopBar */}
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setScreen('PROFILE')}
            className="relative cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-2xs ring-1 ring-slate-100 bg-amber-100 flex items-center justify-center">
              <SmartImage
                alt="Alex Carter"
                className="w-full h-full object-cover"
                src={ASSETS.alexCarterAvatar}
              />
            </div>
          </button>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 font-medium">Hello</span>
              <span className="text-xs">👋</span>
              <button
                type="button"
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="ml-1.5 text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <MapPin className="w-3 h-3" />
                <span>{customerLocation.area.split(',')[0]}</span>
              </button>
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              Alex Carter
            </h1>
          </div>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          onClick={() => setScreen('NOTIFICATIONS')}
          className="relative w-11 h-11 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          <span className="absolute top-2 right-2 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white tabular-nums">
            {customerUnreadCount || 2}
          </span>
        </button>
      </header>

      {/* Location Picker */}
      {showLocationPicker && (
        <div className="mx-5 mb-2 p-3 rounded-2xl bg-white border border-blue-100 shadow-md space-y-1.5 z-30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Select Service Area
            </span>
            <button
              type="button"
              onClick={() => setShowLocationPicker(false)}
              className="text-xs text-slate-400 cursor-pointer"
            >
              Close
            </button>
          </div>
          {BENGALURU_LOCATIONS.map((loc) => (
            <button
              key={loc.tag}
              type="button"
              onClick={() => {
                setCustomerLocation(loc);
                setShowLocationPicker(false);
                showToast(`Location updated to ${loc.area}`);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 text-xs flex items-center justify-between cursor-pointer"
            >
              <span className="font-bold text-slate-800">{loc.area}</span>
              <span className="text-[11px] text-slate-400">{loc.tag}</span>
            </button>
          ))}
        </div>
      )}

      {/* Live Approval Banner */}
      {pendingExtraApprovalCount > 0 && (
        <div className="px-5 mb-2">
          <button
            type="button"
            onClick={() => {
              setActiveBookingId(bookings[0].id);
              setScreen('BOOKING_TRACKER');
            }}
            className="w-full p-3 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-center justify-between text-left shadow-2xs hover:bg-amber-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-slate-900">
                  Live Booking #{bookings[0].id}: Approval Needed (₹250)
                </p>
                <p className="text-[11px] text-slate-600">
                  {bookings[0].workerName} requested extra valve approval • Tap
                  to view
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-700 shrink-0" />
          </button>
        </div>
      )}

      {/* SearchBar */}
      <div className="px-5 mt-1">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative flex items-center bg-white rounded-2xl border border-slate-100 shadow-2xs px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm font-medium text-slate-700 placeholder-slate-400 bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
              placeholder="Search for any service..."
              type="text"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 pl-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Submit search"
                onClick={() => setScreen('POPULAR_SERVICES')}
                className="text-slate-400 hover:text-slate-600 pl-2 cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          <button
            type="button"
            aria-label="Filter Settings"
            onClick={() => setShowFilterSheet(!showFilterSheet)}
            className="w-12 h-12 bg-white rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Drawer */}
        {showFilterSheet && (
          <div className="mt-2.5 p-3 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700">Sort Providers By</span>
              <button
                type="button"
                onClick={() => setShowFilterSheet(false)}
                className="text-slate-400 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'rating', label: 'Top Rated ★' },
                { id: 'price_low', label: 'Lowest Price ₹' },
                { id: 'distance', label: 'Nearest to Me' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.id as any);
                    setShowFilterSheet(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                    sortBy === opt.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transparent Problem Search Results */}
      {searchQuery.trim() && matchingProblems.length > 0 && (
        <div className="mx-5 mt-3 p-3.5 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-blue-700 uppercase">
            Upfront Price Estimates for &ldquo;{searchQuery}&rdquo;
          </span>
          <div className="space-y-1.5">
            {matchingProblems.slice(0, 3).map((prob, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50 transition"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {prob.title}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {prob.trade} • Est. {prob.duration}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleCategorySwitch(prob.filterKey, true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold tabular-nums cursor-pointer"
                >
                  ₹{prob.price} →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero Promotional Banner (Matching Image 3) */}
      <section className="px-5 mt-4" data-purpose="hero-promotional-banner">
        <div className="relative w-full rounded-3xl bg-gradient-to-r from-[#D7EEFF] via-[#E4F2FD] to-[#D9EEFD] p-5 pt-6 overflow-hidden shadow-xs border border-blue-50">
          <div className="w-7/12 relative z-10 flex flex-col items-start">
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wide">
              Save 25% Today!
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight mt-1 mb-4">
              Exclusive discounts on home service
            </h2>
            <button
              type="button"
              onClick={() => {
                const target = workers[0];
                setBookingModalService({
                  title: `${target.trade} Express Visit`,
                  price: target.rate,
                });
                setBookingModalWorker(target);
              }}
              className="bg-[#FF6433] hover:bg-[#fa5520] active:scale-95 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              Book Now
            </button>
          </div>
          <div className="absolute -right-2 -bottom-2 w-48 h-52 pointer-events-none flex items-end justify-center">
            <SmartImage
              alt="3D Handyman"
              className="w-full h-full object-contain drop-shadow-lg transform scale-110 translate-y-1"
              src={ASSETS.handyman3D}
            />
          </div>
        </div>
      </section>

      {/* Most Booked Services (4x2 Grid Matching Image 3) */}
      <section className="px-5 mt-6" data-purpose="category-navigation">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Most Booked Services
          </h3>
          <button
            type="button"
            onClick={() => handleCategorySwitch('all', true)}
            className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
          >
            View all
          </button>
        </div>

        <div className="grid grid-cols-4 gap-y-4 gap-x-2.5 text-center">
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySwitch(cat.filterKey, true)}
              className="group flex flex-col items-center focus:outline-none cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-center group-active:scale-95 transition-all group-hover:border-blue-200">
                <span className={`text-2xl ${cat.iconColorClass}`}>
                  <i className={cat.iconClass} />
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1.5">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Popular Near You (Matching Image 3) */}
      <section className="px-5 mt-6" data-purpose="popular-providers">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Popular Near You
          </h3>
          <button
            type="button"
            onClick={() => setScreen('POPULAR_SERVICES')}
            className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
          >
            View all
          </button>
        </div>

        {isCategoryLoading || uiDemoState === 'skeleton' ? (
          <WorkerCardSkeleton count={2} />
        ) : uiDemoState === 'error' ? (
          <ErrorState onRetry={() => setUiDemoState('normal')} />
        ) : filteredWorkers.length === 0 || uiDemoState === 'empty' ? (
          <EmptyState
            title="No nearby artisans found"
            description="Try switching categories or clearing search."
            actionLabel="Reset Filters"
            onAction={() => {
              setUiDemoState('normal');
              setSelectedCategoryFilter('all');
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredWorkers.slice(0, 2).map((worker) => (
              <article
                key={worker.id}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs flex flex-col gap-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-visible shrink-0">
                      <SmartImage
                        alt={worker.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
                        src={worker.avatarUrl}
                        fallbackLabel={worker.name}
                      />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white text-[8px]">
                        <Check className="w-2 h-2 stroke-[3]" />
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {worker.businessName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <span className="font-bold text-blue-600 tabular-nums">
                          ₹{worker.rate}
                        </span>
                        <span>•</span>
                        <div className="flex items-center text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="text-slate-700 font-semibold ml-1 text-xs tabular-nums">
                            {worker.rating}
                          </span>
                          <span className="text-slate-400 ml-0.5 tabular-nums">
                            ({worker.reviewCount})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      worker.trade === 'Plumber'
                        ? 'text-orange-600 bg-orange-50 border-orange-100'
                        : 'text-amber-700 bg-amber-50 border-amber-100'
                    }`}
                  >
                    {worker.trade}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => openWorkerProfile(worker)}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-regular fa-eye text-slate-400 text-xs" />
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingModalService({
                        title: worker.businessName,
                        price: worker.rate,
                      });
                      setBookingModalWorker(worker);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-2xs active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-regular fa-calendar-check text-xs" />
                    Book Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Floating Frosted Dock (Matching Image 3) */}
      <CustomerBottomDock
        activeScreen="HOME"
        onNavigate={setScreen}
        unreadChatCount={currentBooking?.messages.length || 0}
      />

      {bookingModalWorker && (
        <BookingScheduleModal
          worker={bookingModalWorker}
          initialServiceTitle={bookingModalService.title}
          initialPrice={bookingModalService.price}
          onClose={() => setBookingModalWorker(null)}
          onBooked={(created) => {
            setBookingModalWorker(null);
            setActiveBookingId(created.id);
            setScreen('BOOKING_TRACKER');
          }}
        />
      )}
    </div>
  );
};

const CustomerBottomDock: React.FC<{
  activeScreen: CustomerScreen;
  onNavigate: (s: CustomerScreen) => void;
  unreadChatCount?: number;
}> = ({ activeScreen, onNavigate, unreadChatCount = 0 }) => {
  return (
    <nav
      aria-label="Customer Navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[370px] glass-dock rounded-full px-3 py-2 z-40 flex items-center justify-between"
    >
      <button
        type="button"
        aria-label="Home"
        onClick={() => onNavigate('HOME')}
        className={`flex items-center justify-center w-11 h-11 rounded-full transition cursor-pointer ${
          activeScreen === 'HOME'
            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
            : 'text-slate-400 hover:text-blue-500'
        }`}
      >
        <HomeIcon className="w-5 h-5" />
      </button>

      <button
        type="button"
        aria-label="Messages"
        onClick={() => onNavigate('CHAT')}
        className={`flex items-center justify-center w-11 h-11 rounded-full transition relative cursor-pointer ${
          activeScreen === 'CHAT'
            ? 'bg-blue-500 text-white shadow-md'
            : 'text-slate-400 hover:text-blue-500'
        }`}
      >
        <MessageCircle className="w-5 h-5" />
        {unreadChatCount > 0 && activeScreen !== 'CHAT' && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white" />
        )}
      </button>

      <button
        type="button"
        aria-label="Bookings"
        onClick={() => onNavigate('BOOKINGS_LIST')}
        className={`flex items-center justify-center w-11 h-11 rounded-full transition cursor-pointer ${
          activeScreen === 'BOOKINGS_LIST' ||
          activeScreen === 'BOOKING_TRACKER'
            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
            : 'text-slate-400 hover:text-blue-500'
        }`}
      >
        <Calendar className="w-5 h-5" />
      </button>

      <button
        type="button"
        aria-label="Profile"
        onClick={() => onNavigate('PROFILE')}
        className={`flex items-center justify-center w-11 h-11 rounded-full transition cursor-pointer ${
          activeScreen === 'PROFILE'
            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
            : 'text-slate-400 hover:text-blue-500'
        }`}
      >
        <User className="w-5 h-5" />
      </button>
    </nav>
  );
};
