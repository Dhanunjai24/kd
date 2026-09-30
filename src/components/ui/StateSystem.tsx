import React, { useState } from 'react';
import { ActionState } from '../../types/kaamdost';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Wrench,
  SearchX,
} from 'lucide-react';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
  fallbackBg?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel = 'KD',
  fallbackBg = 'bg-gradient-to-br from-blue-100 to-slate-200 text-blue-700',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    const initials = fallbackLabel
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return (
      <div
        className={`flex flex-col items-center justify-center font-bold select-none ${fallbackBg} ${className}`}
        role="img"
        aria-label={alt || fallbackLabel}
      >
        <Wrench className="w-5 h-5 opacity-70 mb-0.5" />
        <span className="text-xs tracking-tight">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || fallbackLabel}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      {...rest}
    />
  );
};

interface StatefulButtonProps {
  onClick: () => Promise<void> | void;
  children: React.ReactNode;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  className?: string;
  variant?: 'primary' | 'blue' | 'orange' | 'emerald' | 'outline' | 'danger';
  disabled?: boolean;
  delayMs?: number;
  simulateError?: boolean;
  type?: 'button' | 'submit';
  ariaLabel?: string;
}

export const StatefulButton: React.FC<StatefulButtonProps> = ({
  onClick,
  children,
  loadingText = 'Processing...',
  successText = 'Done!',
  errorText = 'Failed — Retry',
  className = '',
  variant = 'blue',
  disabled = false,
  delayMs = 450,
  simulateError = false,
  type = 'button',
  ariaLabel,
}) => {
  const [state, setState] = useState<ActionState>('idle');

  const baseStyles =
    'inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer whitespace-nowrap select-none';

  const variantMap: Record<string, string> = {
    primary: 'bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-sm',
    blue: 'bg-gradient-to-r from-[#38A7F8] to-[#2563EB] hover:from-[#2190FE] hover:to-[#1D4ED8] text-white shadow-sm shadow-blue-500/20',
    orange:
      'bg-[#FF6433] hover:bg-[#fa5520] text-white shadow-md shadow-orange-500/20',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs',
    danger:
      'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200',
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (state === 'loading' || disabled) return;

    setState('loading');
    try {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (simulateError) {
        throw new Error('Simulated network error');
      }
      await onClick();
      setState('success');
      setTimeout(() => {
        setState('idle');
      }, 950);
    } catch {
      setState('error');
      setTimeout(() => {
        setState('idle');
      }, 2000);
    }
  };

  let activeVariantClass = variantMap[variant] || variantMap.blue;
  if (state === 'success') {
    activeVariantClass = 'bg-emerald-500 text-white shadow-sm';
  } else if (state === 'error') {
    activeVariantClass = 'bg-rose-600 text-white shadow-sm';
  }

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled || state === 'loading'}
      onClick={handleClick}
      className={`${baseStyles} ${activeVariantClass} ${className}`}
    >
      {state === 'loading' && (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText}</span>
        </>
      )}
      {state === 'success' && (
        <>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successText}</span>
        </>
      )}
      {state === 'error' && (
        <>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorText}</span>
        </>
      )}
      {state === 'idle' && children}
    </button>
  );
};

export const WorkerCardSkeleton: React.FC<{ count?: number }> = ({
  count = 2,
}) => {
  return (
    <div className="flex flex-col gap-3.5" aria-busy="true" aria-label="Loading service providers">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-full skeleton-shimmer shrink-0" />
              <div className="space-y-2">
                <div className="w-32 h-4 rounded-md skeleton-shimmer" />
                <div className="w-24 h-3 rounded-md skeleton-shimmer" />
              </div>
            </div>
            <div className="w-16 h-6 rounded-full skeleton-shimmer" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-50">
            <div className="h-10 rounded-xl skeleton-shimmer" />
            <div className="h-10 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const WorkerDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 h-24 skeleton-shimmer" />
        <div className="bg-white rounded-2xl p-4 border border-slate-100 h-24 skeleton-shimmer" />
      </div>
      <div className="bg-white rounded-3xl p-5 border border-slate-100 space-y-3">
        <div className="w-40 h-4 rounded skeleton-shimmer" />
        <div className="w-full h-16 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 rounded-xl skeleton-shimmer" />
          <div className="h-11 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="bg-white rounded-3xl p-7 border border-slate-100 text-center flex flex-col items-center justify-center my-2 shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3.5">
        <SearchX className="w-7 h-7" />
      </div>
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed font-body">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-xs active:scale-95 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => Promise<void> | void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load live services',
  message = 'Network connection interrupted while fetching nearby verified professionals. Please retry.',
  onRetry,
}) => {
  return (
    <div className="bg-rose-50/70 rounded-3xl p-6 border border-rose-200/80 text-center flex flex-col items-center justify-center my-2">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-600 mt-1 max-w-[270px] leading-relaxed font-body">
        {message}
      </p>
      <div className="mt-4">
        <StatefulButton
          onClick={onRetry}
          variant="primary"
          loadingText="Reconnecting..."
          successText="Restored!"
          className="px-4 py-2.5 rounded-xl text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </StatefulButton>
      </div>
    </div>
  );
};
