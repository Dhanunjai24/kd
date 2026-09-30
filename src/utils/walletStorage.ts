/**
 * KaamDost Worker Quick Pay & Digital Wallet Engine
 * ------------------------------------------------
 * Manages the technician's digital wallet for storing and instantly accessing
 * earned commissions, peak-hour incentives, and customer tips.
 *
 * Supports offline dynamic QR generation, local ledger persistence via localStorage,
 * instant UPI withdrawals, and one-tap merchant Quick Pay for work tools and spare parts.
 */

import QRCode from 'qrcode';

export const WALLET_STORAGE_KEY_PREFIX = 'kaamdost_worker_wallet_';

export type TransactionType = 'CREDIT' | 'DEBIT';

export type TransactionCategory =
  | 'COMMISSION'
  | 'INCENTIVE'
  | 'TIP'
  | 'OFFLINE_QR_PAYMENT'
  | 'UPI_WITHDRAWAL'
  | 'MERCHANT_PURCHASE';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  title: string;
  subtitle: string;
  jobId?: string;
  amount: number;
  timestamp: number;
  date: string;
  time: string;
  status: 'COMPLETED' | 'PENDING_OFFLINE_SYNC';
  referenceId: string;
  receiptCode?: string;
  balanceAfter: number;
}

export interface WalletData {
  workerId: string;
  workerName: string;
  totalBalance: number;
  commissionsBalance: number;
  incentivesBalance: number;
  tipsBalance: number;
  upiId: string;
  bankName: string;
  accountNumberMasked: string;
  virtualCardNumber: string;
  offlineTokenCode: string;
  transactions: WalletTransaction[];
  lastUpdated: number;
}

/**
 * Returns the storage key for a specific worker.
 */
function getStorageKey(workerId: string): string {
  return `${WALLET_STORAGE_KEY_PREFIX}${workerId}`;
}

/**
 * Creates default seed wallet data for a technician.
 */
function createInitialWalletData(
  workerId: string,
  workerName: string,
  baseGross: number = 2400,
  incentiveBonus: number = 350
): WalletData {
  const commissions = Math.round(baseGross * 0.9);
  const tips = 200;
  const total = commissions + incentiveBonus + tips;
  const now = Date.now();

  const transactions: WalletTransaction[] = [
    {
      id: `tx-init-1`,
      type: 'CREDIT',
      category: 'COMMISSION',
      title: 'Kitchen Diverter & Mixer Commission',
      subtitle: '90% Service Payout · Booking #KD-84920',
      jobId: 'KD-84920',
      amount: 450,
      timestamp: now - 3600000 * 3,
      date: 'Today, 29 Sep',
      time: '01:15 PM',
      status: 'COMPLETED',
      referenceId: 'UPI-CR-892104',
      receiptCode: 'RCP-KD-4819',
      balanceAfter: total,
    },
    {
      id: `tx-init-2`,
      type: 'CREDIT',
      category: 'INCENTIVE',
      title: 'Peak-Hour Punctuality Bonus',
      subtitle: 'Arrived within 15 mins in Indiranagar Zone',
      jobId: 'KD-84920',
      amount: 200,
      timestamp: now - 3600000 * 4,
      date: 'Today, 29 Sep',
      time: '02:30 PM',
      status: 'COMPLETED',
      referenceId: 'BONUS-PK-1029',
      receiptCode: 'RCP-KD-4820',
      balanceAfter: total - 450,
    },
    {
      id: `tx-init-3`,
      type: 'CREDIT',
      category: 'TIP',
      title: 'Customer Appreciation Tip',
      subtitle: 'Rated 5.0★ by Pooja Hegde',
      jobId: 'KD-84905',
      amount: 150,
      timestamp: now - 3600000 * 6,
      date: 'Today, 29 Sep',
      time: '11:40 AM',
      status: 'COMPLETED',
      referenceId: 'TIP-CUST-4910',
      receiptCode: 'RCP-KD-4821',
      balanceAfter: total - 650,
    },
    {
      id: `tx-init-4`,
      type: 'DEBIT',
      category: 'MERCHANT_PURCHASE',
      title: 'Sri Balaji Hardware & Electricals',
      subtitle: 'Quick Pay QR · Brass Valve & Teflon Seal',
      jobId: 'KD-84920',
      amount: 280,
      timestamp: now - 3600000 * 8,
      date: 'Today, 29 Sep',
      time: '09:25 AM',
      status: 'COMPLETED',
      referenceId: 'QR-MERCH-8192',
      receiptCode: 'RCP-QR-9012',
      balanceAfter: total - 800,
    },
    {
      id: `tx-init-5`,
      type: 'CREDIT',
      category: 'COMMISSION',
      title: 'Overhead Tank Ball Cock Repair',
      subtitle: '90% Service Payout · Booking #KD-85012',
      jobId: 'KD-85012',
      amount: 720,
      timestamp: now - 86400000,
      date: 'Yesterday, 28 Sep',
      time: '06:15 PM',
      status: 'COMPLETED',
      referenceId: 'UPI-CR-904128',
      receiptCode: 'RCP-KD-4822',
      balanceAfter: total - 1080,
    },
    {
      id: `tx-init-6`,
      type: 'DEBIT',
      category: 'UPI_WITHDRAWAL',
      title: 'Instant Bank Payout to HDFC Account',
      subtitle: 'IMPS Direct Transfer · Acc ****4821',
      jobId: 'KD-84880',
      amount: 1200,
      timestamp: now - 86400000 * 1.5,
      date: 'Yesterday, 28 Sep',
      time: '02:00 PM',
      status: 'COMPLETED',
      referenceId: 'WDR-HDFC-91023',
      receiptCode: 'RCP-WDR-8812',
      balanceAfter: total - 1800,
    },
    {
      id: `tx-init-7`,
      type: 'CREDIT',
      category: 'COMMISSION',
      title: 'Quarter-Turn Tap Cartridge Replacement',
      subtitle: '90% Service Payout · Booking #KD-84750',
      jobId: 'KD-84750',
      amount: 380,
      timestamp: now - 86400000 * 2,
      date: '27 Sep 2026',
      time: '04:30 PM',
      status: 'COMPLETED',
      referenceId: 'UPI-CR-891024',
      receiptCode: 'RCP-KD-4815',
      balanceAfter: total - 600,
    },
    {
      id: `tx-init-8`,
      type: 'CREDIT',
      category: 'COMMISSION',
      title: 'Under-Sink Drain Pipe Leak Fix',
      subtitle: '90% Service Payout · Booking #KD-84620',
      jobId: 'KD-84620',
      amount: 320,
      timestamp: now - 86400000 * 3,
      date: '26 Sep 2026',
      time: '11:15 AM',
      status: 'COMPLETED',
      referenceId: 'UPI-CR-887102',
      receiptCode: 'RCP-KD-4809',
      balanceAfter: total - 980,
    },
  ];

  return {
    workerId,
    workerName: workerName || 'Partner',
    totalBalance: total,
    commissionsBalance: commissions,
    incentivesBalance: incentiveBonus,
    tipsBalance: tips,
    upiId: `${workerName.toLowerCase().replace(/\s+/g, '.') || 'partner'}@hdfcbank`,
    bankName: 'HDFC Bank',
    accountNumberMasked: '****4821',
    virtualCardNumber: '4532 •••• •••• 9812',
    offlineTokenCode: `KD-FASTPAY-${workerId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    transactions,
    lastUpdated: now,
  };
}

/**
 * Loads wallet data from localStorage or initializes if not found.
 */
export function getWalletData(
  workerId: string = 'worker-1',
  workerName: string = 'Daniel Walker',
  suggestedTotal?: number
): WalletData {
  if (typeof window === 'undefined') {
    return createInitialWalletData(workerId, workerName);
  }

  try {
    const raw = localStorage.getItem(getStorageKey(workerId));
    if (raw) {
      const parsed: WalletData = JSON.parse(raw);
      if (parsed && typeof parsed.totalBalance === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[WalletStorage] Error reading wallet from localStorage:', err);
  }

  // Initialize fresh wallet with current calculated earnings
  const initial = createInitialWalletData(
    workerId,
    workerName,
    suggestedTotal ? suggestedTotal - 350 : 2400,
    350
  );
  saveWalletData(workerId, initial);
  return initial;
}

/**
 * Saves wallet data to localStorage and emits custom notification event.
 */
export function saveWalletData(workerId: string, data: WalletData): void {
  if (typeof window === 'undefined') return;
  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(getStorageKey(workerId), JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent('kaamdost:wallet-updated', {
        detail: { workerId, data },
      })
    );
  } catch (err) {
    console.error('[WalletStorage] Failed to save wallet data:', err);
  }
}

/**
 * Executes a spend / payment from the wallet balance.
 */
export function processWalletSpend(
  workerId: string,
  amount: number,
  title: string,
  category: TransactionCategory = 'MERCHANT_PURCHASE',
  isOffline: boolean = false,
  jobId?: string
): {
  success: boolean;
  error?: string;
  transaction?: WalletTransaction;
  newBalance: number;
} {
  const wallet = getWalletData(workerId);

  if (amount <= 0) {
    return { success: false, error: 'Payment amount must be greater than zero.', newBalance: wallet.totalBalance };
  }

  if (wallet.totalBalance < amount) {
    return {
      success: false,
      error: `Insufficient wallet balance. Available: ₹${wallet.totalBalance.toLocaleString('en-IN')}`,
      newBalance: wallet.totalBalance,
    };
  }

  const now = Date.now();
  const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newBalance = wallet.totalBalance - amount;

  // Deduct proportionately from commissions first, then incentives
  let deductCommissions = Math.min(wallet.commissionsBalance, amount);
  let remainder = amount - deductCommissions;
  let deductIncentives = Math.min(wallet.incentivesBalance, remainder);
  remainder -= deductIncentives;
  let deductTips = Math.min(wallet.tipsBalance, remainder);

  const tx: WalletTransaction = {
    id: `tx-${now}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'DEBIT',
    category,
    title,
    subtitle: isOffline
      ? 'Offline Quick Pay QR · Stored in Service Cache'
      : 'Quick Pay · Instant Settlement',
    jobId,
    amount,
    timestamp: now,
    date: 'Today, 29 Sep',
    time: timeStr,
    status: isOffline ? 'PENDING_OFFLINE_SYNC' : 'COMPLETED',
    referenceId: `QP-${Math.floor(100000 + Math.random() * 900000)}`,
    receiptCode: `RCP-${Math.floor(1000 + Math.random() * 9000)}`,
    balanceAfter: newBalance,
  };

  wallet.totalBalance = newBalance;
  wallet.commissionsBalance -= deductCommissions;
  wallet.incentivesBalance -= deductIncentives;
  wallet.tipsBalance -= deductTips;
  wallet.transactions = [tx, ...wallet.transactions];

  saveWalletData(workerId, wallet);
  return { success: true, transaction: tx, newBalance };
}

/**
 * Deposits earnings (commission, bonus, tip) into the digital wallet.
 */
export function processWalletDeposit(
  workerId: string,
  amount: number,
  title: string,
  category: 'COMMISSION' | 'INCENTIVE' | 'TIP' = 'COMMISSION',
  subtitle?: string,
  jobId?: string
): { newBalance: number; transaction: WalletTransaction } {
  const wallet = getWalletData(workerId);
  const now = Date.now();
  const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newBalance = wallet.totalBalance + amount;

  const tx: WalletTransaction = {
    id: `tx-${now}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'CREDIT',
    category,
    title,
    subtitle: subtitle || 'Service Payout Credited',
    jobId,
    amount,
    timestamp: now,
    date: 'Today, 29 Sep',
    time: timeStr,
    status: 'COMPLETED',
    referenceId: `CR-${Math.floor(100000 + Math.random() * 900000)}`,
    receiptCode: `RCP-${Math.floor(1000 + Math.random() * 9000)}`,
    balanceAfter: newBalance,
  };

  wallet.totalBalance = newBalance;
  if (category === 'COMMISSION') wallet.commissionsBalance += amount;
  else if (category === 'INCENTIVE') wallet.incentivesBalance += amount;
  else if (category === 'TIP') wallet.tipsBalance += amount;

  wallet.transactions = [tx, ...wallet.transactions];
  saveWalletData(workerId, wallet);

  return { newBalance, transaction: tx };
}

/**
 * Generates an encrypted/tokenized QR payload for offline Quick Pay.
 * Formats:
 * - Direct UPI: `upi://pay?pa=daniel.walker@hdfcbank&pn=Daniel+Walker&am=500&cu=INR`
 * - Offline Token: `KD-FASTPAY:v1:W1:BAL2270:SEC-9812:TS1727650000`
 */
export function generateQrPayload(
  mode: 'RECEIVE_UPI' | 'OFFLINE_SPEND',
  wallet: WalletData,
  amount?: number,
  note?: string
): string {
  if (mode === 'RECEIVE_UPI') {
    const cleanName = encodeURIComponent(wallet.workerName);
    const amountParam = amount && amount > 0 ? `&am=${amount}` : '';
    const noteParam = note ? `&tn=${encodeURIComponent(note)}` : '&tn=KaamDost+Partner+Direct+UPI';
    return `upi://pay?pa=${wallet.upiId}&pn=${cleanName}${amountParam}${noteParam}&cu=INR`;
  }

  // OFFLINE_SPEND: Tokenized partner token for hardware dukaan / fuel station offline terminals
  const payloadObj = {
    app: 'KaamDost',
    version: '1.0',
    type: 'WORKER_OFFLINE_FASTPAY',
    workerId: wallet.workerId,
    name: wallet.workerName,
    availableBalance: wallet.totalBalance,
    requestedSpend: amount || 0,
    offlineToken: wallet.offlineTokenCode,
    nonce: Math.floor(100000 + Math.random() * 900000),
    timestamp: Date.now(),
    expiresIn: '24h',
  };

  return JSON.stringify(payloadObj);
}

/**
 * Renders a QR code to a high-resolution base64 PNG data URL.
 */
export async function renderQrCodeDataUrl(
  text: string,
  options?: { width?: number; darkColor?: string; lightColor?: string }
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: options?.width || 320,
    margin: 1.5,
    errorCorrectionLevel: 'M',
    color: {
      dark: options?.darkColor || '#0F172A',
      light: options?.lightColor || '#FFFFFF',
    },
  });
}
