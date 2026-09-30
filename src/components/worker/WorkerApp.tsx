import React, { useState } from 'react';
import { useKaamDost } from '../../context/KaamDostContext';
import { TradeCategory } from '../../types/kaamdost';
import {
  SmartImage,
  StatefulButton,
  WorkerDashboardSkeleton,
  EmptyState,
  ErrorState,
} from '../ui/StateSystem';
import { ChatScreen } from '../customer/CustomerTrackingAndModals';
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

  const workerBookings = bookings;
  const currentJob =
    workerBookings.find((b) => b.id === selectedJobId) || workerBookings[0];

  const requestedJobs = workerBookings.filter((b) => b.status === 'REQUESTED');
  const ongoingJobs = workerBookings.filter((b) =>
    ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(b.status)
  );

  const completedOrPaidJobs = workerBookings.filter(
    (b) =>
      b.status === 'COMPLETED' ||
      b.status === 'PAID' ||
      b.status === 'IN_PROGRESS'
  );
  const grossEarnings = completedOrPaidJobs.reduce((sum, b) => {
    const extras = b.extraWorkItems
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
                <StatefulButton
                  variant="orange"
                  loadingText="Dispatching..."
                  successText="New Job!"
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0"
                  onClick={() => {
                    const created = simulateIncomingJobForWorker();
                    setSelectedJobId(created.id);
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ Test Job</span>
                </StatefulButton>
              </div>

              {/* REAL-TIME JOB REQUESTS (ACCEPT / DECLINE) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    New Job Requests ({requestedJobs.length})
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-600">
                    Upfront ₹ Payout
                  </span>
                </div>

                {requestedJobs.length === 0 ? (
                  <div className="bg-white rounded-3xl p-4 border border-slate-100 text-center space-y-2">
                    <p className="text-xs font-semibold text-slate-600">
                      No pending requests right now.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Book any service in Customer App — it will appear here in
                      real time via WebSocket!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requestedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white rounded-3xl p-4 border-2 border-amber-400 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                              <Clock className="w-3 h-3" /> New Request •{' '}
                              {job.distanceKm} km away
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                              {job.serviceTitle}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {job.customerName} • {job.area}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-extrabold text-emerald-600 tabular-nums">
                              ₹{job.baseAmount}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              Est. Payout
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-body">
                          &ldquo;{job.problemDescription}&rdquo;
                        </p>

                        <div className="grid grid-cols-2 gap-2.5">
                          <StatefulButton
                            variant="danger"
                            loadingText="Declining..."
                            successText="Declined"
                            className="py-2.5 rounded-xl text-xs font-bold"
                            onClick={() =>
                              updateBookingStatus(job.id, 'CANCELLED')
                            }
                          >
                            <span>Decline</span>
                          </StatefulButton>
                          <StatefulButton
                            variant="emerald"
                            loadingText="Accepting..."
                            successText="Accepted!"
                            className="py-2.5 rounded-xl text-xs font-bold"
                            onClick={() => {
                              updateBookingStatus(job.id, 'ACCEPTED');
                              setSelectedJobId(job.id);
                              setTab('ACTIVE_JOB');
                            }}
                          >
                            <span>Accept Job →</span>
                          </StatefulButton>
                        </div>
                      </div>
                    ))}
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
                  onClick={() =>
                    showToast(
                      'Turn-by-Turn GPS Navigation Started',
                      `Routing to ${currentJob.address}`
                    )
                  }
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Start GPS Navigation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('CHAT')}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
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
                onClick={() => updateBookingStatus(currentJob.id, 'ARRIVED')}
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
                onClick={() =>
                  updateBookingStatus(currentJob.id, 'IN_PROGRESS')
                }
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
              {currentJob.extraWorkItems.length > 0 && (
                <div className="space-y-1.5">
                  {currentJob.extraWorkItems.map((item) => (
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
              onClick={() => updateBookingStatus(currentJob.id, 'COMPLETED')}
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
              onClick={() =>
                showToast(
                  `₹${netTakeHome} Transferred Instantly`,
                  `${activeWorker.name} • HDFC Bank ****4821 (UPI)`
                )
              }
            >
              <IndianRupee className="w-4 h-4" />
              <span>Instant Withdraw ₹{netTakeHome} to Bank / UPI</span>
            </StatefulButton>
          </div>
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
            onClick={() => onSelect(item.id)}
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
