/**
 * Format currency in Ethiopian Birr (Br / ETB)
 */
export function formatBirr(
  amount: number | null | undefined,
  options?: {
    compact?: boolean;
    hideDecimals?: boolean;
    prefix?: boolean;
  }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Br 0.00';
  }

  const { compact = false, hideDecimals = false, prefix = true } = options || {};

  if (compact && Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `${prefix ? 'Br ' : ''}${millions.toFixed(2)}M`;
  }

  if (compact && Math.abs(amount) >= 10_000) {
    const thousands = amount / 1_000;
    return `${prefix ? 'Br ' : ''}${thousands.toFixed(1)}K`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: hideDecimals ? 0 : 2,
    maximumFractionDigits: hideDecimals ? 0 : 2,
  }).format(amount);

  return prefix ? `Br ${formatted}` : formatted;
}

/**
 * Standard alias for formatBirr
 */
export const formatCurrency = formatBirr;

/**
 * Format percentage with positive/negative signs
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format profit with directional metadata
 */
export function formatProfit(amount: number | null | undefined): {
  text: string;
  isPositive: boolean;
  isNegative: boolean;
  isZero: boolean;
} {
  const val = amount || 0;
  const isPositive = val > 0;
  const isNegative = val < 0;
  const isZero = val === 0;

  const prefix = isPositive ? '+Br ' : isNegative ? '-Br ' : 'Br ';
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absVal);

  return {
    text: `${prefix}${formatted}`,
    isPositive,
    isNegative,
    isZero,
  };
}

/**
 * Format date string to readable human format (e.g. Nov 19, 2026)
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Format date with time (e.g. Nov 19, 2026, 10:30 AM)
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Format relative time (e.g. "Just now", "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    return formatDate(dateString);
  } catch {
    return '—';
  }
}

/**
 * Format Ethiopian Phone numbers nicely
 */
export function formatEthiopianPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const clean = phone.replace(/[^0-9+]/g, '');
  if (clean.startsWith('+251') && clean.length === 13) {
    // +251 91 123 4567
    return `${clean.slice(0, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
  }
  if (clean.startsWith('09') && clean.length === 10) {
    // 091 123 4567
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return phone;
}

/**
 * Format quantity with its unit of measurement
 * e.g. "10 sets", "1 pc", "5 boxes", "2 packs"
 */
export function formatUnitQuantity(quantity: number | null | undefined, unit?: string | null): string {
  const qty = Number(quantity) || 0;
  const rawUnit = (unit || 'pcs').trim().toLowerCase();

  switch (rawUnit) {
    case 'set':
    case 'sets':
      return `${qty} ${qty === 1 ? 'set' : 'sets'}`;
    case 'box':
    case 'boxes':
      return `${qty} ${qty === 1 ? 'box' : 'boxes'}`;
    case 'pack':
    case 'packs':
      return `${qty} ${qty === 1 ? 'pack' : 'packs'}`;
    case 'pair':
    case 'pairs':
      return `${qty} ${qty === 1 ? 'pair' : 'pairs'}`;
    case 'ctn':
    case 'carton':
    case 'cartons':
      return `${qty} ${qty === 1 ? 'ctn' : 'ctns'}`;
    case 'dz':
    case 'dozen':
    case 'dozens':
      return `${qty} ${qty === 1 ? 'dozen' : 'dozens'}`;
    case 'roll':
    case 'rolls':
      return `${qty} ${qty === 1 ? 'roll' : 'rolls'}`;
    case 'kg':
      return `${qty} kg`;
    case 'm':
    case 'meter':
    case 'meters':
      return `${qty} m`;
    case 'pcs':
    case 'pc':
    case 'piece':
    case 'pieces':
    default:
      return `${qty} ${qty === 1 ? 'pc' : 'pcs'}`;
  }
}
