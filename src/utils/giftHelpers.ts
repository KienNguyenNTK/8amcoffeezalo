import {
  Gift,
  GiftAssignment,
  GiftResetConfig,
  GiftStoreAllocation,
} from '../types/gift';

const pad = (value: number) => String(value).padStart(2, '0');

export const toDate = (value: any): Date | null => {
  if (!value && value !== 0) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'object' && typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }

  if (typeof value === 'object' && typeof value.seconds === 'number') {
    try {
      return new Date(value.seconds * 1000);
    } catch {
      return null;
    }
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

export const toIsoString = (value: any): string | undefined => {
  const parsed = toDate(value);
  return parsed ? parsed.toISOString() : undefined;
};

export const isGiftActive = (gift?: Gift | null): boolean => {
  if (!gift) return false;
  return gift.isActive !== false;
};

export const getGiftStoreAllocations = (gift?: Gift | null): GiftStoreAllocation[] => {
  if (!gift?.storeAllocations) return [];
  return gift.storeAllocations;
};

export const findGiftStoreAllocation = (
  gift: Gift | null | undefined,
  storeId?: string | null
): GiftStoreAllocation | undefined => {
  if (!gift || !storeId) return undefined;
  return getGiftStoreAllocations(gift).find((allocation) => allocation.storeId === storeId);
};

export const hasGiftStoreConfiguration = (gift?: Gift | null): boolean => {
  return getGiftStoreAllocations(gift).length > 0;
};

export const hasAvailableGiftStore = (gift?: Gift | null): boolean => {
  return getGiftStoreAllocations(gift).some((allocation) => allocation.availableQuantity > 0);
};

export const getGiftResetTimeLabel = (resetConfig?: GiftResetConfig | null): string | null => {
  if (!resetConfig?.enabled) return null;
  return `${pad(resetConfig.dailyResetHour)}:${pad(resetConfig.dailyResetMinute)}`;
};

const getGiftResetBoundaryForDate = (date: Date, resetConfig?: GiftResetConfig | null): Date | null => {
  if (!resetConfig?.enabled) return null;

  const boundary = new Date(date);
  boundary.setHours(resetConfig.dailyResetHour, resetConfig.dailyResetMinute, 0, 0);
  return boundary;
};

export const getGiftCycleKey = (gift?: Gift | null, now: Date = new Date()): string => {
  if (!gift?.resetConfig?.enabled) return 'default';

  const boundary = getGiftResetBoundaryForDate(now, gift.resetConfig);
  if (!boundary) return 'default';

  const cycleStart = new Date(boundary);
  if (now < boundary) {
    cycleStart.setDate(cycleStart.getDate() - 1);
  }

  return `${cycleStart.getFullYear()}-${pad(cycleStart.getMonth() + 1)}-${pad(cycleStart.getDate())}@${pad(
    gift.resetConfig.dailyResetHour
  )}:${pad(gift.resetConfig.dailyResetMinute)}`;
};

export const getGiftCycleExpiryAt = (gift?: Gift | null, reference?: Date | null): Date | null => {
  if (!gift?.resetConfig?.enabled) return null;
  const baseDate = reference ?? new Date();
  const boundary = getGiftResetBoundaryForDate(baseDate, gift.resetConfig);
  if (!boundary) return null;

  if (baseDate < boundary) {
    return boundary;
  }

  const nextBoundary = new Date(boundary);
  nextBoundary.setDate(nextBoundary.getDate() + 1);
  return nextBoundary;
};

export const getGiftNextResetAt = (gift?: Gift | null, now: Date = new Date()): Date | null => {
  return getGiftCycleExpiryAt(gift, now);
};

export const getAssignmentExpiryDate = (
  assignment?: GiftAssignment | null,
  gift?: Gift | null
): Date | null => {
  const explicitExpiry = toDate(assignment?.expiresAt);
  if (explicitExpiry) return explicitExpiry;

  const assignedAt = toDate(assignment?.assignedAt);
  if (!assignedAt) return getGiftNextResetAt(gift);

  return getGiftCycleExpiryAt(gift, assignedAt);
};

export const isAssignmentExpired = (
  assignment?: GiftAssignment | null,
  gift?: Gift | null,
  now: Date = new Date()
): boolean => {
  if (!assignment) return false;
  if (assignment.status === 'expired') return true;

  const expiry = getAssignmentExpiryDate(assignment, gift);
  return Boolean(expiry && expiry.getTime() <= now.getTime() && assignment.status !== 'redeemed');
};

export const getCurrentGiftAssignment = (
  gift: Gift | null | undefined,
  assignments: GiftAssignment[],
  now: Date = new Date()
): GiftAssignment | null => {
  if (!gift) return null;

  const currentCycleKey = getGiftCycleKey(gift, now);
  const matchingAssignments = assignments
    .filter((assignment) => assignment.giftId === gift.id)
    .filter((assignment) => {
      if (assignment.cycleKey) {
        return assignment.cycleKey === currentCycleKey && !isAssignmentExpired(assignment, gift, now);
      }

      return !isAssignmentExpired(assignment, gift, now);
    })
    .sort((left, right) => {
      const leftTime = toDate(left.assignedAt)?.getTime() || 0;
      const rightTime = toDate(right.assignedAt)?.getTime() || 0;
      return rightTime - leftTime;
    });

  return matchingAssignments[0] || null;
};

export const sortAssignmentsNewestFirst = (assignments: GiftAssignment[]): GiftAssignment[] => {
  return [...assignments].sort((left, right) => {
    const leftTime = toDate(left.assignedAt)?.getTime() || 0;
    const rightTime = toDate(right.assignedAt)?.getTime() || 0;
    return rightTime - leftTime;
  });
};

export const formatGiftDateTime = (value: any): string => {
  const parsed = toDate(value);
  if (!parsed) return '—';
  return parsed.toLocaleString('vi-VN');
};

export const formatGiftDateShort = (value: any): string => {
  const parsed = toDate(value);
  if (!parsed) return '—';
  return parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatGiftTimeShort = (value: any): string => {
  const parsed = toDate(value);
  if (!parsed) return '—';
  return parsed.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
