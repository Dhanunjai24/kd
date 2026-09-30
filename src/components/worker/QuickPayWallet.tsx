import React, { useState, useEffect } from 'react';
import {
  Wallet,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  CheckCircle2,
  Copy,
  Clock,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Fuel,
  Wrench,
  X,
  CreditCard,
  IndianRupee,
  RefreshCw,
  Sun,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { WorkerProfile } from '../../types/kaamdost';
import {
  WalletData,
  WalletTransaction,
  getWalletData,
  processWalletSpend,
  processWalletDeposit,
  generateQrPayload,
  renderQrCodeDataUrl,
} from '../../utils/walletStorage';
import { triggerHaptic, HAPTIC_PATTERNS } from '../../utils/haptics';
import { useKaamDost } from '../../context/KaamDostContext';

interface QuickPayWalletProps {
  activeWorker: WorkerProfile;
  netTakeHome: number;
  grossEarnings: number;
  incentiveBonus: number;
  onOpenFullModal?: () => void;
}

export const QuickPayWallet: React.FC<QuickPayWalletProps> = ({
  activeWorker,
  netTakeHome,
  grossEarnings,
  incentiveBonus,
}) => {
  const { showToast, isOnlineEffective } = useKaamDost();

  const [wallet, setWallet] = useState<WalletData>(() =>
    getWalletData(activeWorker.id, activeWorker.name, netTakeHome)
  );

  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isSpendModalOpen, setIsSpendModalOpen] = useState<boolean>(false);
  const [qrMode, setQrMode] = useState<'RECEIVE_UPI' | 'OFFLINE_SPEND'>('RECEIVE_UPI');
  const [qrAmount, setQrAmount] = useState<number | undefined>(undefined);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isHighBrightness, setIsHighBrightness] = useState<boolean>(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState<boolean>(false);

  // Spend form state
  const [spendAmount, setSpendAmount] = useState<string>('350');
  const [spendTitle, setSpendTitle] = useState<string>('Brass Angle Valve & ISI Seal');
  const [spendCategory, setSpendCategory] = useState<WalletTransaction['category']>('MERCHANT_PURCHASE');
  const [txFilter, setTxFilter] = useState<'ALL' | 'CREDITS' | 'SPENDS'>('ALL');

  // Sync wallet when worker or net take home changes
  useEffect(() => {
    const handleWalletUpdate = (e: any) => {
      if (e?.detail?.data) {
        setWallet(e.detail.data);
      } else {
        setWallet(getWalletData(activeWorker.id, activeWorker.name, netTakeHome));
      }
    };

    window.addEventListener('kaamdost:wallet-updated', handleWalletUpdate);
    return () => {
      window.removeEventListener('kaamdost:wallet-updated', handleWalletUpdate);
    };
  }, [activeWorker.id, activeWorker.name, netTakeHome]);

  // Generate QR Code data URL dynamically
  useEffect(() => {
    let isMounted = true;
    const payload = generateQrPayload(qrMode, wallet, qrAmount);

    renderQrCodeDataUrl(payload, {
      width: 280,
      darkColor: '#0F172A',
      lightColor: '#FFFFFF',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => console.error('Failed to generate QR:', err));

    return () => {
      isMounted = false;
    };
  }, [qrMode, qrAmount, wallet]);

  const handleCopyUpi = () => {
    triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
    navigator.clipboard?.writeText(wallet.upiId);
    setIsCopied(true);
    showToast('UPI ID Copied', wallet.upiId, 'info');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExecuteSpend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountNum = Number(spendAmount);
    if (!amountNum || amountNum <= 0) {
      showToast('Invalid Amount', 'Please enter a valid amount in ₹', 'warning');
      return;
    }

    triggerHaptic(HAPTIC_PATTERNS.MEDIUM_TAP);
    const result = processWalletSpend(
      wallet.workerId,
      amountNum,
      spendTitle || 'Quick Pay Merchant Spend',
      spendCategory,
      !isOnlineEffective
    );

    if (result.success) {
      setWallet(getWalletData(wallet.workerId));
      setIsSpendModalOpen(false);
      triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
      showToast(
        `₹${amountNum} Paid via Quick Pay`,
        `${spendTitle} · Remaining: ₹${result.newBalance.toLocaleString('en-IN')}`,
        'success'
      );
    } else {
      showToast('Quick Pay Failed', result.error || 'Insufficient balance', 'error');
    }
  };

  const handleInstantWithdraw = () => {
    if (wallet.totalBalance <= 0) {
      showToast('Zero Balance', 'No withdrawable balance available.', 'warning');
      return;
    }

    triggerHaptic(HAPTIC_PATTERNS.MEDIUM_TAP);
    const withdrawAmount = wallet.totalBalance;
    const result = processWalletSpend(
      wallet.workerId,
      withdrawAmount,
      `Instant UPI Settlement to ${wallet.bankName}`,
      'UPI_WITHDRAWAL',
      !isOnlineEffective
    );

    if (result.success) {
      setWallet(getWalletData(wallet.workerId));
      triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
      showToast(
        `₹${withdrawAmount.toLocaleString('en-IN')} Transferred Instantly`,
        `${wallet.workerName} • ${wallet.bankName} ${wallet.accountNumberMasked} (IMPS/UPI)`,
        'success'
      );
    }
  };

  // Simulate scanning merchant QR in offline mode
  const handleSimulateMerchantScan = () => {
    setIsSimulatingScan(true);
    triggerHaptic([50, 50]);

    setTimeout(() => {
      const scanAmount = qrAmount || 450;
      const res = processWalletSpend(
        wallet.workerId,
        scanAmount,
        'Balaji Hardware Dukaan (Offline QR Scan)',
        'OFFLINE_QR_PAYMENT',
        !isOnlineEffective
      );

      setIsSimulatingScan(false);
      if (res.success) {
        setWallet(getWalletData(wallet.workerId));
        setIsQrModalOpen(false);
        triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
        showToast(
          `Offline QR Payment Settled (₹${scanAmount})`,
          `Balaji Hardware Indiranagar · Balance: ₹${res.newBalance.toLocaleString('en-IN')}`,
          'success'
        );
      } else {
        showToast('Payment Failed', res.error, 'error');
      }
    }, 900);
  };

  const filteredTransactions = wallet.transactions.filter((tx) => {
    if (txFilter === 'CREDITS') return tx.type === 'CREDIT';
    if (txFilter === 'SPENDS') return tx.type === 'DEBIT';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 1. Main Digital Wallet Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 border border-slate-700/80 shadow-xl relative overflow-hidden">
        {/* Subtle Watermark Branding */}
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Zap className="w-4 h-4 fill-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <span>Quick Pay Digital Wallet</span>
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                <span>RuPay FastPay</span>
              </span>
              <p className="text-xs font-semibold text-slate-300">
                {wallet.workerName} · {activeWorker.trade} Partner
              </p>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Instant UPI</span>
          </span>
        </div>

        {/* Balance Display */}
        <div className="mt-4 relative z-10">
          <span className="text-[11px] font-medium text-slate-400">
            Available Partner Balance
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h2 className="text-3xl font-extrabold text-emerald-400 tabular-nums tracking-tight">
              ₹{wallet.totalBalance.toLocaleString('en-IN')}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              INR Available
            </span>
          </div>

          {/* Breakdown: Commissions vs Incentives vs Tips */}
          <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-2 pt-2 border-t border-slate-700/60 flex-wrap">
            <span>
              Commissions:{' '}
              <strong className="text-white font-mono">
                ₹{wallet.commissionsBalance.toLocaleString('en-IN')}
              </strong>
            </span>
            <span className="text-slate-500">·</span>
            <span>
              Incentives:{' '}
              <strong className="text-amber-300 font-mono">
                ₹{wallet.incentivesBalance.toLocaleString('en-IN')}
              </strong>
            </span>
            <span className="text-slate-500">·</span>
            <span>
              Tips:{' '}
              <strong className="text-emerald-300 font-mono">
                ₹{wallet.tipsBalance.toLocaleString('en-IN')}
              </strong>
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4 relative z-10">
          {/* 1. Show Offline QR */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
              setIsQrModalOpen(true);
            }}
            className="py-2.5 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer group shadow-xs"
          >
            <QrCode className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px]">Show QR Code</span>
          </button>

          {/* 2. Quick Spend */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
              setIsSpendModalOpen(true);
            }}
            className="py-2.5 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer group shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px]">Quick Spend</span>
          </button>

          {/* 3. Instant Withdraw */}
          <button
            type="button"
            onClick={handleInstantWithdraw}
            className="py-2.5 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer shadow-md"
          >
            <IndianRupee className="w-4 h-4" />
            <span className="text-[11px]">Withdraw UPI</span>
          </button>
        </div>

        {/* Bank & UPI Linked Footer */}
        <div className="mt-3.5 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {wallet.bankName} {wallet.accountNumberMasked}
            </span>
          </div>
          <span className="text-slate-300 font-mono text-[10px]">
            {wallet.upiId}
          </span>
        </div>
      </div>

      {/* 2. Recent Wallet Activity / Ledger */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Wallet Passbook & Spends
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-[10px] font-semibold">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setTxFilter('ALL');
              }}
              className={`px-2 py-0.5 rounded-lg transition ${
                txFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setTxFilter('CREDITS');
              }}
              className={`px-2 py-0.5 rounded-lg transition ${
                txFilter === 'CREDITS'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Credits
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setTxFilter('SPENDS');
              }}
              className={`px-2 py-0.5 rounded-lg transition ${
                txFilter === 'SPENDS'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Spends
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2 pt-1 max-h-72 overflow-y-auto pr-1">
          {filteredTransactions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No transactions in this category yet.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isCredit = tx.type === 'CREDIT';
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 transition text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">
                        {tx.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {tx.subtitle} · {tx.time}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-extrabold text-sm tabular-nums block ${
                        isCredit ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {tx.status === 'PENDING_OFFLINE_SYNC' ? (
                        <span className="text-amber-600 font-medium">Offline Cached</span>
                      ) : (
                        tx.referenceId
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MODAL: QR Code Display for Offline Payments & Receiving */}
      {/* ========================================================= */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`max-w-md w-full rounded-3xl overflow-hidden shadow-2xl transition-all ${
              isHighBrightness ? 'bg-white text-slate-900' : 'bg-slate-900 text-white border border-slate-700'
            }`}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    {qrMode === 'RECEIVE_UPI' ? 'Receive Instant Payment' : 'Pay Offline via FastPay QR'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Works offline with zero internet
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Sun Brightness Booster for Outdoor Sunlight */}
                <button
                  type="button"
                  onClick={() => setIsHighBrightness(!isHighBrightness)}
                  className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
                    isHighBrightness
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title="Toggle High Contrast Brightness for Outdoor Sunlight"
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* QR Mode Switcher Segmented Tabs */}
            <div className="p-4 pb-0">
              <div className="flex items-center p-1 bg-slate-800 rounded-2xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(20);
                    setQrMode('RECEIVE_UPI');
                  }}
                  className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    qrMode === 'RECEIVE_UPI'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Receive Customer UPI</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(20);
                    setQrMode('OFFLINE_SPEND');
                  }}
                  className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    qrMode === 'OFFLINE_SPEND'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Pay at Merchant Dukaan</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col items-center text-center space-y-4">
              {/* QR Amount Presets (for Receive Mode) */}
              {qrMode === 'RECEIVE_UPI' && (
                <div className="w-full flex items-center justify-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Preset:</span>
                  {[undefined, 250, 500, 1000].map((amt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQrAmount(amt)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        qrAmount === amt
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {amt ? `₹${amt}` : 'Any'}
                    </button>
                  ))}
                </div>
              )}

              {/* The QR Code Container */}
              <div className="bg-white p-4 rounded-3xl shadow-xl border-4 border-slate-200/80 inline-block relative">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Quick Pay QR Code"
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                )}
                {/* Center Brand Badge */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 bg-slate-950 text-amber-400 rounded-full flex items-center justify-center font-extrabold text-xs border-2 border-white shadow-md">
                    KD
                  </div>
                </div>
              </div>

              {/* QR Details */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-base">
                  {qrMode === 'RECEIVE_UPI'
                    ? wallet.workerName
                    : 'KaamDost Offline FastPay Token'}
                </h4>
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                  <span>ID:</span>
                  <span className="font-mono text-slate-300 font-bold">
                    {qrMode === 'RECEIVE_UPI' ? wallet.upiId : wallet.offlineTokenCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="text-sky-400 hover:text-sky-300 ml-1 p-0.5"
                    title="Copy UPI ID"
                  >
                    {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </p>
                {qrAmount && qrMode === 'RECEIVE_UPI' && (
                  <span className="inline-block px-3 py-0.5 bg-emerald-500/20 text-emerald-400 font-extrabold text-sm rounded-full mt-1">
                    ₹{qrAmount} Fixed
                  </span>
                )}
              </div>

              {/* Offline Explanation */}
              <div className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 text-left text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px]">
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    {qrMode === 'RECEIVE_UPI'
                      ? 'Scan with GPay, PhonePe, Paytm, or BHIM'
                      : 'Offline Partner Terminal Spend Token'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {qrMode === 'RECEIVE_UPI'
                    ? 'Customers can scan this offline static QR code even if you have no active internet connection. Payment settles straight to your HDFC bank account.'
                    : 'Show this QR at partner hardware stores or fuel pumps. The terminal scans your cryptographic token to deduct spare parts cost directly from your earned balance.'}
                </p>
              </div>

              {/* Interactive Simulation Button (For Testing Offline Merchant Spend) */}
              {qrMode === 'OFFLINE_SPEND' && (
                <button
                  type="button"
                  onClick={handleSimulateMerchantScan}
                  disabled={isSimulatingScan}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <RefreshCw className={`w-4 h-4 ${isSimulatingScan ? 'animate-spin' : ''}`} />
                  <span>
                    {isSimulatingScan
                      ? 'Simulating Hardware Store Terminal Scan...'
                      : 'Simulate Merchant Terminal Scan (-₹450)'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODAL: Quick Spend (Hardware Stores / Tools / Petrol)   */}
      {/* ========================================================= */}
      {isSpendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 text-white border border-slate-700 max-w-md w-full rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Quick Pay at Merchant Dukaan
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Instant deduction from earned commissions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSpendModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleExecuteSpend} className="p-5 space-y-4">
              {/* Available Balance Reminder */}
              <div className="bg-slate-800/60 rounded-2xl p-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">Wallet Balance:</span>
                <span className="font-extrabold text-emerald-400 tabular-nums text-sm">
                  ₹{wallet.totalBalance.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Quick Preset Purchases for Technicians */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Quick Select Job Expense:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSpendAmount('280');
                      setSpendTitle('Sri Balaji Hardware · Brass Valve & Seal');
                      setSpendCategory('MERCHANT_PURCHASE');
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left text-xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px]">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Spare Valve</span>
                    </div>
                    <span className="font-extrabold text-white text-xs mt-1 block">
                      ₹280
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSpendAmount('300');
                      setSpendTitle('Indian Oil Petrol Pump · Service Transit');
                      setSpendCategory('MERCHANT_PURCHASE');
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left text-xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                      <Fuel className="w-3.5 h-3.5" />
                      <span>Bike Petrol</span>
                    </div>
                    <span className="font-extrabold text-white text-xs mt-1 block">
                      ₹300
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSpendAmount('450');
                      setSpendTitle('National Electricals · 1.5 Sqmm Copper Cable');
                      setSpendCategory('MERCHANT_PURCHASE');
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left text-xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Wiring Reel</span>
                    </div>
                    <span className="font-extrabold text-white text-xs mt-1 block">
                      ₹450
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSpendAmount('180');
                      setSpendTitle('Hardware Dukaan · Teflon Tape & Screws');
                      setSpendCategory('MERCHANT_PURCHASE');
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left text-xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[11px]">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Tool Consumables</span>
                    </div>
                    <span className="font-extrabold text-white text-xs mt-1 block">
                      ₹180
                    </span>
                  </button>
                </div>
              </div>

              {/* Custom Amount Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Amount (₹):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={spendAmount}
                    onChange={(e) => setSpendAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-extrabold text-base focus:outline-hidden focus:border-amber-400 transition"
                    required
                  />
                </div>
              </div>

              {/* Merchant / Purpose Note */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Merchant / Purpose:
                </label>
                <input
                  type="text"
                  value={spendTitle}
                  onChange={(e) => setSpendTitle(e.target.value)}
                  placeholder="e.g. Indiranagar Hardware Store"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-amber-400 transition"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md mt-2"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Confirm & Pay ₹{spendAmount} from Wallet</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
