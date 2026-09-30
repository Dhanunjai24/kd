import React, { useState, useEffect, useRef } from 'react';
import { useKaamDost } from '../../context/KaamDostContext';
import { TradeCategory, RankSortMode } from '../../types/kaamdost';
import { rankAndSortJobs, ALGORITHM_WEIGHTS } from '../../utils/jobRanking';
import {
  triggerHaptic,
  HAPTIC_PATTERNS,
  isHapticsSupported,
} from '../../utils/haptics';
import {
  SmartImage,
  StatefulButton,
  WorkerDashboardSkeleton,
  EmptyState,
  ErrorState,
} from '../ui/StateSystem';
import { ChatScreen } from '../customer/CustomerTrackingAndModals';
import { WorkerEarningsChart } from './WorkerEarningsChart';
import {
  Power,
  Navigation,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  PlusCircle,
  IndianRupee,
  Star,
  Bell,
  Briefcase,
  Wallet,
  UserCheck,
  HelpCircle,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Sparkles,
  LogIn,
  ChevronDown,
  ChevronUp,
  Compass,
  TrendingUp,
  SlidersHorizontal,
  Award,
  Info,
  X,
  Target,
  Mic,
  Smartphone,
  Zap,
  Send,
  ChevronRight,
} from 'lucide-react';

export type WorkerTab =
  | 'LOGIN_REGISTER'
  | 'DASHBOARD'
  | 'ACTIVE_JOB'
  | 'EARNINGS'
  | 'HISTORY'
  | 'CHAT'
  | 'NOTIFICATIONS'
  | 'PROFILE_SUPPORT';

export const WorkerApp: React.FC<{
  onSwitchToCustomerApp?: () => void;
}> = ({ onSwitchToCustomerApp }) => {
  const {
    workers,
    bookings,
    notifications,
    workerOnline,
    setWorkerOnline,
    activeWorkerId,
    setActiveWorkerId,
    activeWorker,
    updateWorkerProfile,
    updateBookingStatus,
    requestExtraWork,
    simulateIncomingJobForWorker,
    markNotificationsRead,
    showToast,
    uiDemoState,
    setUiDemoState,
    sendChatMessage,
  } = useKaamDost();

  const [tab, setTab] = useState<WorkerTab>('DASHBOARD');
  const [selectedJobId, setSelectedJobId] = useState<string>(
    bookings[0]?.id || 'KD-84920'
  );
  const [otpVerifyInput, setOtpVerifyInput] = useState<string>('4829');
  const [extraTitle, setExtraTitle] = useState<string>(
    'Heavy-Duty Brass Angle Valve + Teflon Seal'
  );
  const [extraPrice, setExtraPrice] = useState<string>('250');
  const [showAddExtraForm, setShowAddExtraForm] = useState<boolean>(false);
  const [editRate, setEditRate] = useState<string>(String(activeWorker.rate));
  const [editTrade, setEditTrade] = useState<TradeCategory>(activeWorker.trade);
  const [rankSortMode, setRankSortMode] = useState<RankSortMode>('RECOMMENDED');
  const [expandedJobBreakdownId, setExpandedJobBreakdownId] = useState<string | null>(null);
  const [showAlgorithmInfoModal, setShowAlgorithmInfoModal] = useState<boolean>(false);

  const workerBookings = bookings;
  const currentJob =
    workerBookings.find((b) => b.id === selectedJobId) || workerBookings[0];

  const requestedJobs = workerBookings.filter((b) => b.status === 'REQUESTED');
  const rankedRequestedJobs = rankAndSortJobs(
    requestedJobs,
    activeWorker,
    rankSortMode
  );
  const ongoingJobs = workerBookings.filter((b) =>
    ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(b.status)
  );

  // Monitor incoming job requests and trigger distinct haptic vibration feedback
  const prevRequestedJobsCountRef = useRef(requestedJobs.length);
  useEffect(() => {
    if (requestedJobs.length > prevRequestedJobsCountRef.current) {
      // Check if Recommended Jobs algorithm identified a 'Top Recommended' (100% match) job request
      const top100Job = rankedRequestedJobs.find(
        (r) => r.rank.tier === 'TOP_RECOMMENDED' && r.rank.matchPercentage === 100
      );

      if (top100Job) {
        // Unique, distinct long-pulse haptic pattern specifically for 100% Top Recommended match!
        triggerHaptic(HAPTIC_PATTERNS.TOP_RECOMMENDED_100_MATCH);
        showToast(
          '🔥 Top Recommended (100% Match) Job Detected!',
          `${top100Job.job.serviceTitle} — Triggered distinct long-pulse tactile vibration [400ms, 100ms, 400ms, 100ms, 600ms]`,
          'success'
        );
      } else {
        // Urgent incoming dispatch pulse pattern for standard new job requests
        triggerHaptic(HAPTIC_PATTERNS.NEW_JOB_REQUEST);
      }
    }
    prevRequestedJobsCountRef.current = requestedJobs.length;
  }, [requestedJobs.length, rankedRequestedJobs, showToast]);

  const completedOrPaidJobs = workerBookings.filter(
    (b) =>
      b.status === 'COMPLETED' ||
      b.status === 'PAID' ||
      b.status === 'IN_PROGRESS'
  );
  const grossEarnings = completedOrPaidJobs.reduce((sum, b) => {
    const extras = (b.extraWorkItems || [])
      .filter((x) => x.status === 'APPROVED')
      .reduce((s, x) => s + x.price, 0);
    return sum + b.baseAmount + extras + (b.tipAmount || 0);
  }, 1850);
  const platformCommission = Math.round(grossEarnings * 0.1);
  const incentiveBonus = 350;
  const netTakeHome = grossEarnings - platformCommission + incentiveBonus;

  const workerUnreadNotifs = notifications.filter(
    (n) => n.recipient === 'WORKER' && !n.read
  ).length;

  // 1. WORKER LOGIN / REGISTRATION & TRADE SELECTION
  if (tab === 'LOGIN_REGISTER') {
    const trades: TradeCategory[] = [
      'Plumber',
      'Electrician',
      'Carpenter',
      'Painter',
      'Cleaner',
      'Mason',
      'Welder',
      'Roofer',
    ];
    return (
      <div className="min-h-[820px] bg-[#0F172A] text-white p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between pt-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
            KaamDost Partner App
          </span>
          <button
            type="button"
            onClick={() => setTab('DASHBOARD')}
            className="text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
          >
            Back to Dashboard →
          </button>
        </div>

        <div className="my-auto space-y-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Partner Registration & Trade KYC
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Earn ₹35,000–₹55,000/month • Instant UPI Bank Payouts • Only 10%
              Commission
            </p>
          </div>

          <div className="bg-slate-800/90 rounded-3xl p-5 border border-slate-700 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Select Active Partner Account
              </label>
              <div className="grid grid-cols-2 gap-2">
                {workers.slice(0, 4).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setActiveWorkerId(w.id);
                      setEditRate(String(w.rate));
                      setEditTrade(w.trade);
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                      activeWorker.id === w.id
                        ? 'border-amber-400 bg-amber-500/15 text-white'
                        : 'border-slate-700 bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold truncate">{w.name}</p>
                    <p className="text-[11px] text-amber-400">{w.trade}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Primary Trade Specialization
              </label>
              <div className="flex flex-wrap gap-1.5">
                {trades.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditTrade(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      editTrade === t
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Base Visit Fee (₹)
              </label>
              <input
                type="number"
                value={editRate}
                onChange={(e) => setEditRate(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400 tabular-nums"
              />
            </div>

            <StatefulButton
              variant="orange"
              loadingText="Saving Partner KYC..."
              successText="Partner Verified!"
              className="w-full py-3.5 rounded-2xl text-xs font-bold"
              onClick={() => {
                updateWorkerProfile({
                  trade: editTrade,
                  rate: Number(editRate) || 499,
                });
                setTab('DASHBOARD');
              }}
            >
              <span>Complete Verification & Go Online</span>
            </StatefulButton>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Aadhaar e-KYC Verified • Free ₹5 Lakh Accidental Insurance
        </p>
      </div>
    );
  }

  // 2. CHAT SCREEN
  if (tab === 'CHAT' && currentJob) {
    return (
      <div className="relative min-h-[820px] bg-[#F7F9FD]">
        <ChatScreen
          booking={currentJob}
          senderRole="WORKER"
          onBack={() => setTab('ACTIVE_JOB')}
        />
        <WorkerBottomNav activeTab="ACTIVE_JOB" onSelect={setTab} />
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F7F9FD] min-h-[820px] flex flex-col relative pb-28">
      {/* Worker Header with Online/Offline Toggle */}
      <header className="px-5 pt-5 pb-3.5 bg-[#0F172A] text-white rounded-b-3xl shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTab('LOGIN_REGISTER')}
              className="relative cursor-pointer"
            >
              <SmartImage
                src={activeWorker.avatarUrl}
                alt={activeWorker.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400"
              />
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0F172A] ${
                  workerOnline ? 'bg-emerald-400' : 'bg-slate-400'
                }`}
              />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  {activeWorker.trade} Partner
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h1 className="text-base font-bold leading-tight">
                {activeWorker.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatefulButton
              variant={workerOnline ? 'emerald' : 'outline'}
              delayMs={250}
              loadingText="Switching..."
              successText={workerOnline ? 'Offline' : 'Online!'}
              className="px-3 py-2 rounded-full text-xs font-bold"
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
                const next = !workerOnline;
                setWorkerOnline(next);
                showToast(
                  next
                    ? 'You are now ONLINE for nearby jobs'
                    : 'You are now OFFLINE',
                  activeWorker.location,
                  next ? 'success' : 'warning'
                );
              }}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{workerOnline ? 'Duty: ONLINE' : 'Duty: OFFLINE'}</span>
            </StatefulButton>

            <button
              type="button"
              onClick={() => {
                markNotificationsRead('WORKER');
                setTab('NOTIFICATIONS');
              }}
              className="relative w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white cursor-pointer"
              aria-label="Worker notifications"
            >
              <Bell className="w-4 h-4" />
              {workerUnreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-amber-500 text-slate-950 text-[9px] font-extrabold rounded-full flex items-center justify-center">
                  {workerUnreadNotifs}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/90 text-center">
          <div>
            <span className="text-[11px] text-slate-400 block">
              Net Earnings
            </span>
            <span className="text-sm font-extrabold text-emerald-400 tabular-nums">
              ₹{netTakeHome}
            </span>
          </div>
          <div className="border-x border-slate-800">
            <span className="text-[11px] text-slate-400 block">
              Partner Rating
            </span>
            <span className="text-sm font-extrabold text-amber-400 tabular-nums">
              ★ {activeWorker.rating} ({activeWorker.reviewCount})
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">
              Jobs Completed
            </span>
            <span className="text-sm font-extrabold text-white tabular-nums">
              {activeWorker.completedJobs}
            </span>
          </div>
        </div>
      </header>

      {/* TAB 1: WORKER DASHBOARD */}
      {tab === 'DASHBOARD' && (
        <div className="p-5 space-y-4">
          {uiDemoState === 'skeleton' ? (
            <WorkerDashboardSkeleton />
          ) : uiDemoState === 'error' ? (
            <ErrorState onRetry={() => setUiDemoState('normal')} />
          ) : (
            <>
              {/* Radar Simulation */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-4 text-white flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    Live Dispatch Radar • WebSocket Synced
                  </span>
                  <h2 className="text-sm font-bold mt-0.5">
                    {workerOnline
                      ? 'Listening for job requests from Customer App'
                      : 'Go Online to receive new job requests'}
                  </h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatefulButton
                    variant="orange"
                    loadingText="Dispatching..."
                    successText="100% Match!"
                    className="px-3 py-2 rounded-xl text-xs font-bold shrink-0 bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => {
                      const created = simulateIncomingJobForWorker(true);
                      setSelectedJobId(created.id);
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>⭐ 100% Match</span>
                  </StatefulButton>
                  <StatefulButton
                    variant="blue"
                    loadingText="Dispatching..."
                    successText="Dispatched!"
                    className="px-3 py-2 rounded-xl text-xs font-bold shrink-0 bg-blue-700 hover:bg-blue-800 text-white"
                    onClick={() => {
                      const created = simulateIncomingJobForWorker(false);
                      setSelectedJobId(created.id);
                    }}
                  >
                    <span>+ Test Job</span>
                  </StatefulButton>
                </div>
              </div>

              {/* RECOMMENDED JOBS ALGORITHM & DISPATCH ENGINE */}
              <div>
                <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs mb-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
                          KaamDost Smart Match Engine
                        </span>
                        <h3 className="text-xs font-bold text-slate-900">
                          Recommended Jobs Algorithm
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAlgorithmInfoModal(true)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Info className="w-3 h-3 text-slate-500" />
                      <span>How it Ranks</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed font-body">
                    Job requests are mathematically ranked using your{' '}
                    <span className="font-semibold text-slate-700">Distance</span> (40%),{' '}
                    <span className="font-semibold text-slate-700">Trade Rating</span> (35%), and{' '}
                    <span className="font-semibold text-slate-700">Completion Success</span> (25%).
                  </p>

                  {/* Worker Live Score Factor Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-50">
                    <div className="bg-slate-50 rounded-2xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span>Distance</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 mt-0.5 block tabular-nums">
                        &lt; 6.0 km
                      </span>
                      <span className="text-[9px] text-slate-400">40% weight</span>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Rating</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 mt-0.5 block tabular-nums">
                        {activeWorker.rating} ★
                      </span>
                      <span className="text-[9px] text-slate-400">35% weight</span>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Success</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 mt-0.5 block tabular-nums">
                        {activeWorker.completionSuccessRate ?? 98.6}%
                      </span>
                      <span className="text-[9px] text-slate-400">25% weight</span>
                    </div>
                  </div>
                </div>

                {/* Filter & Sorting Mode Pills */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-800">
                      Ranked Job Requests ({rankedRequestedJobs.length})
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600">
                    Upfront ₹ Payout
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
                  <button
                    type="button"
                    onClick={() => setRankSortMode('RECOMMENDED')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                      rankSortMode === 'RECOMMENDED'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Recommended (AI Rank)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRankSortMode('DISTANCE')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                      rankSortMode === 'DISTANCE'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Nearest First</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRankSortMode('PAYOUT')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                      rankSortMode === 'PAYOUT'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <IndianRupee className="w-3 h-3" />
                    <span>Highest Payout</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRankSortMode('URGENCY')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                      rankSortMode === 'URGENCY'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Newest First</span>
                  </button>
                </div>

                {rankedRequestedJobs.length === 0 ? (
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-700">
                      No pending requests in your area right now.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tap &ldquo;+ Test Job&rdquo; above or book in Customer App to see the algorithm rank incoming jobs!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {rankedRequestedJobs.map(({ job, rank }) => {
                      const isExpanded = expandedJobBreakdownId === job.id;
                      return (
                        <div
                          key={job.id}
                          className="bg-white rounded-3xl p-4 border-2 border-slate-100 hover:border-blue-200 shadow-xs space-y-3 transition"
                        >
                          {/* Top Badges: Algorithm Match Badge & Distance Pill */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase ${rank.tierBadgeClass}`}
                            >
                              {rank.tier === 'TOP_RECOMMENDED' && '⭐'}
                              {rank.tier === 'HIGH_MATCH' && '⚡'}
                              {rank.tier === 'GOOD_MATCH' && '📍'}
                              <span>
                                {rank.matchPercentage}% {rank.tierLabel}
                              </span>
                            </span>

                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                              <MapPin className="w-3 h-3 text-blue-500" />
                              <span className="tabular-nums">{job.distanceKm} km away</span>
                              <span>• ~{job.etaMinutes || Math.round(job.distanceKm * 7)}m</span>
                            </span>
                          </div>

                          {/* 100% Top Recommended Match Tactile Indicator */}
                          {rank.matchPercentage === 100 && (
                            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-300 rounded-2xl px-3 py-1.5 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                <span>100% Match • Distinct Long-Pulse Haptic Triggered</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic(HAPTIC_PATTERNS.TOP_RECOMMENDED_100_MATCH);
                                  showToast(
                                    '🔥 Vibrated: 100% Match Long-Pulse Pattern',
                                    'Pattern: [400ms, 100ms, 400ms, 100ms, 600ms]',
                                    'success'
                                  );
                                }}
                                className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                title="Feel the unique distinct long-pulse tactile vibration"
                              >
                                <Smartphone className="w-3 h-3" />
                                <span>Feel Haptic 📳</span>
                              </button>
                            </div>
                          )}

                          {/* Job Title & Payout */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                {job.serviceTitle}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {job.customerName} • {job.area}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-base font-extrabold text-emerald-600 tabular-nums">
                                ₹{job.baseAmount}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                Direct Take-Home
                              </span>
                            </div>
                          </div>

                          {/* Customer Problem Note */}
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-body">
                            &ldquo;{job.problemDescription}&rdquo;
                          </p>

                          {/* Interactive Score Breakdown Toggle */}
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedJobBreakdownId(
                                  isExpanded ? null : job.id
                                )
                              }
                              className="w-full py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-between transition cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-blue-600" />
                                <span>Why this job is recommended ({rank.matchPercentage}% match)</span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </button>

                            {/* Expanded Breakdown Cards */}
                            {isExpanded && (
                              <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-b from-blue-50/50 to-slate-50 border border-blue-100 space-y-2.5 text-xs">
                                <div className="space-y-2">
                                  {/* Metric 1: Distance */}
                                  <div>
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-blue-500" />
                                        Distance Factor (40% Weight):
                                      </span>
                                      <span className="font-bold text-slate-900 tabular-nums">
                                        {rank.distanceScore}/100 ({job.distanceKm} km)
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-blue-500 h-full rounded-full"
                                        style={{ width: `${rank.distanceScore}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Metric 2: Trade Rating */}
                                  <div>
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                                      <span className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        Trade Rating Factor (35% Weight):
                                      </span>
                                      <span className="font-bold text-slate-900 tabular-nums">
                                        {rank.ratingScore}/100 ({activeWorker.rating}★ {activeWorker.trade})
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-amber-500 h-full rounded-full"
                                        style={{ width: `${rank.ratingScore}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Metric 3: Completion Success Rate */}
                                  <div>
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                                      <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        Success Rate Factor (25% Weight):
                                      </span>
                                      <span className="font-bold text-slate-900 tabular-nums">
                                        {rank.completionScore}/100 ({activeWorker.completionSuccessRate ?? 98.6}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-emerald-500 h-full rounded-full"
                                        style={{ width: `${rank.completionScore}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Composite Formula Explanation */}
                                <div className="p-2 rounded-xl bg-white border border-blue-100 text-[10px] text-slate-600 font-mono">
                                  <span>Formula: </span>
                                  <span className="text-blue-700 font-bold">(0.40 × {rank.distanceScore})</span>
                                  <span> + </span>
                                  <span className="text-amber-700 font-bold">(0.35 × {rank.ratingScore})</span>
                                  <span> + </span>
                                  <span className="text-emerald-700 font-bold">(0.25 × {rank.completionScore})</span>
                                  <span> = </span>
                                  <span className="font-bold text-slate-900">{rank.matchPercentage}% Total Fit</span>
                                </div>

                                {/* Insights Bullet Points */}
                                <div className="space-y-1 pt-1">
                                  {rank.insights.map((insight, idx) => (
                                    <p
                                      key={idx}
                                      className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-tight"
                                    >
                                      <span className="text-blue-500 font-bold">•</span>
                                      <span>{insight}</span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Accept / Decline Action Buttons */}
                          <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <StatefulButton
                              variant="danger"
                              loadingText="Declining..."
                              successText="Declined"
                              className="py-2.5 rounded-xl text-xs font-bold"
                              onClick={() => {
                                triggerHaptic(HAPTIC_PATTERNS.WARNING);
                                updateBookingStatus(job.id, 'CANCELLED');
                              }}
                            >
                              <span>Decline</span>
                            </StatefulButton>
                            <StatefulButton
                              variant="emerald"
                              loadingText="Accepting..."
                              successText="Accepted!"
                              className="py-2.5 rounded-xl text-xs font-bold"
                              onClick={() => {
                                triggerHaptic(HAPTIC_PATTERNS.STATUS_UPDATE);
                                updateBookingStatus(job.id, 'ACCEPTED');
                                setSelectedJobId(job.id);
                                setTab('ACTIVE_JOB');
                              }}
                            >
                              <span>Accept Job →</span>
                            </StatefulButton>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ONGOING JOBS */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2.5">
                  Active Ongoing Jobs ({ongoingJobs.length})
                </h3>
                {ongoingJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setTab('ACTIVE_JOB');
                    }}
                    className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3 cursor-pointer hover:border-blue-300 transition mb-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-blue-600">
                          #{job.id} • {job.status.replace('_', ' ')}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                          {job.serviceTitle}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {job.customerName} • {job.address}
                        </p>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                        ₹{job.baseAmount}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-semibold">
                        Customer Start OTP: {job.startOtp}
                      </span>
                      <span className="font-bold text-blue-600">
                        Open Job Execution →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE JOB EXECUTION */}
      {tab === 'ACTIVE_JOB' && currentJob && (
        <div className="p-5 space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                Job #{currentJob.id} • {currentJob.status.replace('_', ' ')}
              </span>
              <span className="text-base font-extrabold text-emerald-600 tabular-nums">
                ₹{currentJob.baseAmount}
              </span>
            </div>

            <h2 className="text-base font-bold text-slate-900">
              {currentJob.serviceTitle}
            </h2>
            <p className="text-xs text-slate-600 font-body">
              {currentJob.problemDescription}
            </p>

            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold">{currentJob.area}</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {currentJob.distanceKm} km • {currentJob.etaMinutes} mins
                </span>
              </div>
              <p className="text-xs text-slate-300">{currentJob.address}</p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(HAPTIC_PATTERNS.STATUS_UPDATE);
                    if (currentJob.status === 'ACCEPTED') {
                      updateBookingStatus(currentJob.id, 'EN_ROUTE');
                    }
                    showToast(
                      'Turn-by-Turn GPS Navigation Started',
                      `Routing to ${currentJob.address} (Status: En Route)`
                    );
                  }}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Start GPS Navigation</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
                    setTab('CHAT');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Open Chat with Hands-Free Voice Dictation"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <Mic className="w-3 h-3 text-amber-400" />
                  <span>Chat & Mic</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      `Calling ${currentJob.customerName}`,
                      currentJob.customerPhone
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                  aria-label="Call customer"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Instant 1-Tap Quick Replies for Hands-Free Communication */}
              <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Quick Reply to Customer (1-Tap):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
                      setTab('CHAT');
                    }}
                    className="text-blue-300 hover:text-white flex items-center gap-0.5 font-semibold text-[10px] cursor-pointer"
                  >
                    <span>Full Chat</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { text: 'On my way', icon: '🚗' },
                    { text: 'Running 5 mins late', icon: '⏱️' },
                    { text: 'Stuck in traffic, reaching soon', icon: '🚦' },
                    { text: 'Reached your building gate', icon: '📍' },
                    { text: 'At doorstep, please open', icon: '🚪' },
                    { text: 'Starting diagnostic inspection', icon: '🔧' },
                  ].map((qr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        triggerHaptic(HAPTIC_PATTERNS.STATUS_UPDATE);
                        sendChatMessage(currentJob.id, 'WORKER', qr.text);
                        showToast(
                          `Quick Reply Sent to ${currentJob.customerName}`,
                          `"${qr.text}" dispatched via real-time channel`,
                          'info'
                        );
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-blue-600 border border-slate-700 hover:border-blue-400 text-white text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer shrink-0 shadow-2xs"
                      title={`Send "${qr.text}" instantly to ${currentJob.customerName}`}
                    >
                      <span>{qr.icon}</span>
                      <span>{qr.text}</span>
                      <Send className="w-2.5 h-2.5 text-blue-300 ml-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STEP-BY-STEP WORKFLOW */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Service Execution Controls
            </h3>

            {/* Step 1: Mark Arrived */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Step 1: Arrive at Customer Doorstep
                </p>
                <p className="text-[11px] text-slate-500">
                  Notifies {currentJob.customerName} on Customer App
                </p>
              </div>
              <StatefulButton
                variant={
                  ['ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'PAID'].includes(
                    currentJob.status
                  )
                    ? 'outline'
                    : 'blue'
                }
                loadingText="Updating..."
                successText="Arrived!"
                className="px-3.5 py-2 rounded-xl text-xs"
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.STATUS_UPDATE);
                  updateBookingStatus(currentJob.id, 'ARRIVED');
                }}
              >
                <span>
                  {['ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'PAID'].includes(
                    currentJob.status
                  )
                    ? 'Arrived ✓'
                    : 'Mark Arrived'}
                </span>
              </StatefulButton>
            </div>

            {/* Step 2: Verify Start OTP */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Step 2: Verify Customer OTP & Start Service
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Customer OTP is{' '}
                    <strong className="text-slate-900">
                      {currentJob.startOtp}
                    </strong>
                  </p>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  value={otpVerifyInput}
                  onChange={(e) => setOtpVerifyInput(e.target.value)}
                  className="w-20 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-center text-xs font-extrabold tabular-nums"
                />
              </div>
              <StatefulButton
                variant="blue"
                loadingText="Verifying OTP..."
                successText="Service Started!"
                className="w-full py-2.5 rounded-xl text-xs font-bold"
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
                  updateBookingStatus(currentJob.id, 'IN_PROGRESS');
                }}
              >
                <span>Verify OTP & Start Work</span>
              </StatefulButton>
            </div>

            {/* Step 3: Additional Work Approval Flow (Socket Synced) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Additional Work / Spare Parts Approval
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Sends live estimate to Customer App for 1-tap approval
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExtraForm(!showAddExtraForm)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Part</span>
                </button>
              </div>

              {showAddExtraForm && (
                <div className="bg-white p-3 rounded-2xl border border-amber-200 space-y-2.5">
                  <input
                    type="text"
                    value={extraTitle}
                    onChange={(e) => setExtraTitle(e.target.value)}
                    placeholder="Part / Additional Work Title"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={extraPrice}
                      onChange={(e) => setExtraPrice(e.target.value)}
                      placeholder="Price in ₹"
                      className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold tabular-nums"
                    />
                    <StatefulButton
                      variant="orange"
                      loadingText="Sending via WebSocket..."
                      successText="Sent to Customer!"
                      className="flex-1 py-2 rounded-xl text-xs font-bold"
                      onClick={() => {
                        triggerHaptic(HAPTIC_PATTERNS.STATUS_UPDATE);
                        requestExtraWork(
                          currentJob.id,
                          extraTitle || 'Additional Spare Part',
                          Number(extraPrice) || 200
                        );
                        setShowAddExtraForm(false);
                      }}
                    >
                      <span>Request Customer Approval</span>
                    </StatefulButton>
                  </div>
                </div>
              )}

              {/* Status of Extra Work Items */}
              {(currentJob.extraWorkItems || []).length > 0 && (
                <div className="space-y-1.5">
                  {(currentJob.extraWorkItems || []).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white px-3 py-2 rounded-xl border border-amber-100 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">
                        {item.title} (₹{item.price})
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4: Complete Service */}
            <StatefulButton
              variant="emerald"
              loadingText="Completing Service..."
              successText="Service Completed!"
              className="w-full py-3.5 rounded-2xl text-xs font-bold"
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
                updateBookingStatus(currentJob.id, 'COMPLETED');
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Service Completed & Send Final Bill</span>
            </StatefulButton>
          </div>
        </div>
      )}

      {/* TAB 3: EARNINGS & COMMISSION BREAKDOWN */}
      {tab === 'EARNINGS' && (
        <div className="p-5 space-y-4">
          <div className="bg-[#0F172A] text-white rounded-3xl p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Withdrawable Partner Balance
                </span>
                <h2 className="text-2xl font-extrabold text-emerald-400 tabular-nums mt-0.5">
                  ₹{netTakeHome}
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                Zero Delay UPI
              </span>
            </div>

            <div className="bg-slate-800/90 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Gross Service & Spare Part Earnings</span>
                <span className="font-bold text-white tabular-nums">
                  ₹{grossEarnings}
                </span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>KaamDost Platform Commission (Flat 10%)</span>
                <span className="font-bold tabular-nums">
                  -₹{platformCommission}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Peak-Hour Punctuality Incentive Bonus</span>
                <span className="font-bold tabular-nums">
                  +₹{incentiveBonus}
                </span>
              </div>
              <div className="flex justify-between text-white font-extrabold text-sm pt-2 border-t border-slate-700">
                <span>Net Take-Home Payout</span>
                <span className="tabular-nums text-emerald-400">
                  ₹{netTakeHome}
                </span>
              </div>
            </div>

            <StatefulButton
              variant="emerald"
              loadingText="Transferring via IMPS/UPI..."
              successText="Credited to Bank!"
              className="w-full py-3.5 rounded-2xl text-xs font-bold"
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
                showToast(
                  `₹${netTakeHome} Transferred Instantly`,
                  `${activeWorker.name} • HDFC Bank ****4821 (UPI)`
                );
              }}
            >
              <IndianRupee className="w-4 h-4" />
              <span>Instant Withdraw ₹{netTakeHome} to Bank / UPI</span>
            </StatefulButton>
          </div>

          {/* Daily Earnings Trend Progression Chart (Recharts) */}
          <WorkerEarningsChart
            completedOrPaidJobs={completedOrPaidJobs}
            activeWorker={activeWorker}
            grossEarnings={grossEarnings}
            netTakeHome={netTakeHome}
          />
        </div>
      )}

      {/* TAB 4: HISTORY */}
      {tab === 'HISTORY' && (
        <div className="p-5 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            Partner Job History ({workerBookings.length})
          </h2>
          {workerBookings.length === 0 ? (
            <EmptyState
              title="No past jobs yet"
              description="Accept incoming jobs on your dashboard to build your history."
            />
          ) : (
            workerBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedJobId(b.id);
                  setTab('ACTIVE_JOB');
                }}
                className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-200 transition"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400">
                    #{b.id} • {b.scheduledDate}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                    {b.serviceTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {b.customerName} • {b.area}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 tabular-nums block">
                    ₹{b.baseAmount}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">
                    {b.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: NOTIFICATIONS */}
      {tab === 'NOTIFICATIONS' && (
        <div className="p-5 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            Partner Alerts & Approvals
          </h2>
          {notifications
            .filter((n) => n.recipient === 'WORKER')
            .map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1"
              >
                <div className="flex justify-between">
                  <h4 className="text-xs font-bold text-slate-900">
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-slate-400">{n.time}</span>
                </div>
                <p className="text-xs text-slate-600 font-body">{n.body}</p>
              </div>
            ))}
        </div>
      )}

      {/* TAB 6: PROFILE & SUPPORT */}
      {tab === 'PROFILE_SUPPORT' && (
        <div className="p-5 space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Partner Profile & Trade Settings
              </h3>
              <button
                type="button"
                onClick={() => setTab('LOGIN_REGISTER')}
                className="text-xs font-bold text-blue-600 flex items-center gap-1 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Switch / Register Trade</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50">
                <span className="text-slate-400 block text-[11px]">
                  Trade Category
                </span>
                <strong className="text-slate-900">{activeWorker.trade}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <span className="text-slate-400 block text-[11px]">
                  Base Visit Fee
                </span>
                <strong className="text-slate-900 tabular-nums">
                  ₹{activeWorker.rate}
                </strong>
              </div>
            </div>
          </div>

          {/* Haptic Vibration Feedback Controller & Tester */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Haptic Vibration Feedback
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tactile alerts via navigator.vibrate()
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  isHapticsSupported()
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {isHapticsSupported() ? 'Hardware Active' : 'Ready'}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-body leading-relaxed">
              Provides distinct physical vibration pulses on your device when new job requests arrive, when accepting jobs, and when status updates are tapped.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.TOP_RECOMMENDED_100_MATCH);
                  showToast(
                    '🔥 Vibrated: 100% Match Long-Pulse Alert',
                    'Pattern: [400ms, 100ms, 400ms, 100ms, 600ms]',
                    'success'
                  );
                }}
                className="p-2.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/90 border-2 border-amber-300 text-center transition cursor-pointer shadow-xs ring-2 ring-amber-200/50"
              >
                <span className="block text-[10px] font-extrabold text-amber-800 uppercase tracking-tight">
                  ⭐ Top Match (100%)
                </span>
                <span className="text-[11px] font-extrabold text-amber-900">
                  Long-Pulse 📳
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.NEW_JOB_REQUEST);
                  showToast(
                    '📳 Vibrated: Standard New Job Alert',
                    'Pattern: [150ms, 70ms, 200ms, 70ms, 300ms]'
                  );
                }}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-center transition cursor-pointer"
              >
                <span className="block text-[10px] font-bold text-indigo-700">Dispatch Alert</span>
                <span className="text-[11px] font-bold text-slate-800">Standard Job</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.STATUS_UPDATE);
                  showToast(
                    '📳 Vibrated: Status Update Tap',
                    'Pattern: [50ms, 60ms, 60ms]'
                  );
                }}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-center transition cursor-pointer"
              >
                <span className="block text-[10px] font-bold text-blue-700">Status Tap</span>
                <span className="text-[11px] font-bold text-slate-800">Double Pulse</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
                  showToast(
                    '🎉 Vibrated: Service Success',
                    'Pattern: [60ms, 50ms, 100ms, 50ms, 150ms]'
                  );
                }}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-center transition cursor-pointer"
              >
                <span className="block text-[10px] font-bold text-emerald-700">Success</span>
                <span className="text-[11px] font-bold text-slate-800">Completed 🎉</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                24×7 Partner Helpline & Emergency SOS
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-body">
              Dedicated Kannada, Hindi & English partner desk for dispute
              resolution and on-job safety.
            </p>
            <StatefulButton
              variant="primary"
              loadingText="Calling Partner Desk..."
              successText="Partner Desk Connected!"
              className="w-full py-3 rounded-xl text-xs font-bold"
              onClick={() =>
                showToast('KaamDost Partner Helpline Connected', '1800-102-KAAM')
              }
            >
              <span>Call Partner Support (Toll-Free)</span>
            </StatefulButton>
          </div>

          {onSwitchToCustomerApp && (
            <button
              type="button"
              onClick={onSwitchToCustomerApp}
              className="w-full p-4 rounded-3xl bg-blue-600 text-white flex items-center justify-between shadow-sm cursor-pointer"
            >
              <div className="text-left">
                <span className="text-[10px] font-bold text-blue-100 uppercase">
                  Connected View
                </span>
                <p className="text-sm font-bold">
                  Switch to Customer App Experience
                </p>
              </div>
              <ArrowUpRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* ALGORITHM EXPLAINER MODAL */}
      {showAlgorithmInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Recommended Jobs Algorithm
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Fair, transparent dispatch mathematics
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAlgorithmInfoModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-body leading-relaxed">
              KaamDost connects technicians with incoming customers using a transparent, multi-factor weighting algorithm designed to maximize earnings while cutting unpaid commute times.
            </p>

            <div className="space-y-3">
              {/* Factor 1 */}
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Live Distance Proximity (40% Weight)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-extrabold">
                    Primary
                  </span>
                </div>
                <p className="text-[11px] text-blue-950 font-body leading-relaxed">
                  Jobs within &lt; 1.5 km receive maximum scores (100 pts). Minimizes your fuel spend and ensures customers receive emergency arrival within 15–20 minutes.
                </p>
              </div>

              {/* Factor 2 */}
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                    <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                    <span>2. Trade Rating & Specialty (35% Weight)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-600 text-white font-extrabold">
                    Reputation
                  </span>
                </div>
                <p className="text-[11px] text-amber-950 font-body leading-relaxed">
                  Rewards your verified craftsmanship score ({activeWorker.rating}★). Exact trade specialty matches receive a 1.0 multiplier for top customer confidence.
                </p>
              </div>

              {/* Factor 3 */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3. Completion Success Rate (25% Weight)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold">
                    Reliability
                  </span>
                </div>
                <p className="text-[11px] text-emerald-950 font-body leading-relaxed">
                  Calculated from your historical dispute-free, on-time completions ({activeWorker.completionSuccessRate ?? 98.6}%). Reliable technicians are consistently prioritized on lucrative high-value jobs.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 text-white text-[11px] space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Partner Tip to Rank Higher
              </span>
              <p className="text-slate-300 font-body leading-relaxed">
                Stay online in high-density corridors like Indiranagar and Koramangala. Maintaining a 98%+ completion rate grants you instant priority dispatch.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAlgorithmInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
            >
              Got it, Close
            </button>
          </div>
        </div>
      )}

      <WorkerBottomNav activeTab={tab} onSelect={setTab} />
    </div>
  );
};

const WorkerBottomNav: React.FC<{
  activeTab: WorkerTab;
  onSelect: (t: WorkerTab) => void;
}> = ({ activeTab, onSelect }) => {
  const items: { id: WorkerTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'DASHBOARD',
      label: 'Radar',
      icon: <Briefcase className="w-5 h-5" />,
    },
    {
      id: 'ACTIVE_JOB',
      label: 'Active Job',
      icon: <Navigation className="w-5 h-5" />,
    },
    {
      id: 'EARNINGS',
      label: 'Earnings',
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      id: 'HISTORY',
      label: 'History',
      icon: <Star className="w-5 h-5" />,
    },
    {
      id: 'PROFILE_SUPPORT',
      label: 'Partner',
      icon: <UserCheck className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      aria-label="Worker Bottom Navigation"
      className="sticky bottom-4 left-0 right-0 mx-auto w-[92%] max-w-[380px] bg-[#0F172A]/95 backdrop-blur-md text-white rounded-full px-3 py-2 z-40 flex items-center justify-between shadow-xl border border-slate-700"
    >
      {items.map((item) => {
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
              onSelect(item.id);
            }}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-full transition cursor-pointer ${
              active
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-0.5 whitespace-nowrap">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
