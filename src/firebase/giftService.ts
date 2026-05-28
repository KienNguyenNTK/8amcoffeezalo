import axios from 'axios';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import {
  AssignGiftRequest,
  Gift,
  GiftAssignment,
  GiftQRCodeResponse,
  GiftResetConfig,
  ReassignGiftRequest,
  GiftStatus,
  GiftStoreAllocation,
  GiftUserSummary,
  RedeemGiftRequest,
} from '../types/gift';
import { reconcileGiftCountsFromAssignments } from '../utils/giftAllocationReconciler';
import { toDate, toIsoString } from '../utils/giftHelpers';
import { db } from './config';
import {
  assignGiftFromFirestore,
  getQRCodeFromFirestore,
  getUserAssignmentsFromFirestore,
} from './giftFirestoreFallback';

const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  if (error?.code === 'ECONNABORTED') return true;
  if (error?.message === 'Network Error') return true;
  if (error?.message === 'Request aborted') return true;
  if (typeof error?.message === 'string' && error.message.toLowerCase().includes('network')) return true;
  return !error?.response;
};

const API_BASE_URL = 'https://api-coffee.8am.vn/api/gifts';

const toNumber = (value: any): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const unwrapPayload = (payload: any) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

const unwrapArrayPayload = (payload: any): any[] => {
  const unwrapped = unwrapPayload(payload);
  if (Array.isArray(unwrapped)) return unwrapped;
  if (Array.isArray(unwrapped?.items)) return unwrapped.items;
  if (Array.isArray(unwrapped?.assignments)) return unwrapped.assignments;
  if (Array.isArray(unwrapped?.gifts)) return unwrapped.gifts;
  return [];
};

const normalizeStoreAllocation = (value: any): GiftStoreAllocation => ({
  storeId: String(value?.storeId || value?.id || ''),
  storeName: String(value?.storeName || value?.name || ''),
  totalQuantity: toNumber(value?.totalQuantity),
  availableQuantity: toNumber(value?.availableQuantity),
  assignedCount: toNumber(value?.assignedCount),
  usedQuantity: toNumber(value?.usedQuantity),
});

const normalizeStoreAllocations = (value: any): GiftStoreAllocation[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeStoreAllocation)
    .filter((allocation) => allocation.storeId);
};

const normalizeResetConfig = (value: any): GiftResetConfig | undefined => {
  if (!value || typeof value !== 'object') return undefined;

  const enabled = Boolean(value.enabled);
  return {
    enabled,
    dailyResetHour: toNumber(value.dailyResetHour),
    dailyResetMinute: toNumber(value.dailyResetMinute),
    lastResetAt: toIsoString(value.lastResetAt),
  };
};

const normalizeGiftUserSummary = (value: any): string | GiftUserSummary => {
  if (typeof value === 'string') return value;

  const metadata = value?.metadata || {};

  return {
    userId: String(value?.userId || value?.id || ''),
    name: value?.name || value?.userName || undefined,
    phone: value?.phone || undefined,
    assignmentId: value?.assignmentId || undefined,
    assignedAt: toIsoString(value?.assignedAt) || undefined,
    redeemedAt: toIsoString(value?.redeemedAt) || undefined,
    storeId: value?.storeId || metadata.storeId || undefined,
    storeName: value?.storeName || metadata.storeName || undefined,
    cycleKey: value?.cycleKey || undefined,
    expiresAt: toIsoString(value?.expiresAt) || undefined,
  };
};

const getAssignmentStoreId = (value: any): string | undefined => {
  return value?.storeId || value?.metadata?.storeId || value?.store?.id || value?.storeLocation?.id || undefined;
};

const getAssignmentStoreName = (value: any): string | undefined => {
  return value?.storeName || value?.metadata?.storeName || value?.store?.name || value?.storeLocation?.name || undefined;
};

const sumGiftTotals = (storeAllocations: GiftStoreAllocation[]) => {
  return storeAllocations.reduce(
    (totals, allocation) => ({
      totalQuantity: totals.totalQuantity + allocation.totalQuantity,
      availableQuantity: totals.availableQuantity + allocation.availableQuantity,
      assignedCount: totals.assignedCount + allocation.assignedCount,
      usedQuantity: totals.usedQuantity + allocation.usedQuantity,
    }),
    {
      totalQuantity: 0,
      availableQuantity: 0,
      assignedCount: 0,
      usedQuantity: 0,
    }
  );
};

const getGiftAssignmentsFromFirestore = async (giftId: string): Promise<GiftAssignment[]> => {
  if (!giftId) return [];

  try {
    const assignmentsQuery = query(collection(db, 'giftAssignments'), where('giftId', '==', giftId));
    const snapshot = await getDocs(assignmentsQuery);
    return snapshot.docs.map((documentSnapshot) =>
      normalizeGiftAssignment({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      })
    );
  } catch (error) {
    console.warn('Could not load gift assignments for reconciliation:', error);
    return [];
  }
};

const reconcileGiftFromAssignments = async (gift: Gift): Promise<Gift> => {
  if (!gift.id || !gift.storeAllocations || gift.storeAllocations.length === 0) return gift;

  const assignments = await getGiftAssignmentsFromFirestore(gift.id);
  return reconcileGiftCountsFromAssignments(gift, assignments);
};

const normalizeGift = (value: any): Gift => {
  const storeAllocations = normalizeStoreAllocations(value?.storeAllocations);
  const totals = sumGiftTotals(storeAllocations);

  return {
    id: String(value?.id || value?._id || ''),
    name: String(value?.name || ''),
    description: value?.description || '',
    imageUrl: value?.imageUrl || value?.image || undefined,
    isActive: value?.isActive !== false,
    storeAllocations: storeAllocations.length ? storeAllocations : undefined,
    resetConfig: normalizeResetConfig(value?.resetConfig),
    totalQuantity: storeAllocations.length ? totals.totalQuantity : toNumber(value?.totalQuantity),
    availableQuantity: storeAllocations.length ? totals.availableQuantity : toNumber(value?.availableQuantity),
    assignedCount: storeAllocations.length ? totals.assignedCount : toNumber(value?.assignedCount),
    usedQuantity: storeAllocations.length ? totals.usedQuantity : toNumber(value?.usedQuantity),
    assignedUsers: Array.isArray(value?.assignedUsers)
      ? value.assignedUsers.map(normalizeGiftUserSummary)
      : undefined,
    redeemedUsers: Array.isArray(value?.redeemedUsers)
      ? value.redeemedUsers.map(normalizeGiftUserSummary)
      : undefined,
    createdAt: toIsoString(value?.createdAt),
    updatedAt: toIsoString(value?.updatedAt),
  };
};

const enrichGiftFromFirestore = async (gift: Gift): Promise<Gift> => {
  if (!gift.id || (gift.storeAllocations && gift.storeAllocations.length > 0)) {
    return reconcileGiftFromAssignments(gift);
  }

  try {
    const snapshot = await getDoc(doc(db, 'gifts', gift.id));
    if (!snapshot.exists()) return gift;

    const firestoreGift = normalizeGift({
      id: snapshot.id,
      ...snapshot.data(),
    });

    const enrichedGift = {
      ...gift,
      ...firestoreGift,
      name: firestoreGift.name || gift.name,
      description: firestoreGift.description || gift.description,
      imageUrl: firestoreGift.imageUrl || gift.imageUrl,
    };

    return reconcileGiftFromAssignments(enrichedGift);
  } catch (error) {
    console.warn('Could not enrich gift from Firestore:', error);
    return gift;
  }
};

const normalizeGiftStatus = (value: any): GiftStatus => {
  const assignment = value?.assignment ? normalizeGiftAssignment(value.assignment) : undefined;
  const assignmentId = value?.assignmentId || assignment?.assignmentId || null;
  const rawStatus = value?.status || assignment?.status || null;
  const storeId = getAssignmentStoreId(value) || assignment?.storeId || null;
  const storeName = getAssignmentStoreName(value) || assignment?.storeName || null;

  return {
    hasAssignment: Boolean(value?.hasAssignment || assignmentId),
    assignmentId,
    status: rawStatus,
    redeemedAt: toIsoString(value?.redeemedAt) || assignment?.redeemedAt || null,
    expiresAt: toIsoString(value?.expiresAt) || assignment?.expiresAt || null,
    cycleKey: value?.cycleKey || assignment?.cycleKey || null,
    storeId,
    storeName,
    assignment: assignment || (assignmentId
      ? {
          assignmentId,
          giftId: String(value?.gift?.id || value?.giftId || ''),
          userId: String(value?.user?.id || value?.userId || ''),
          storeId: storeId || undefined,
          storeName: storeName || undefined,
          cycleKey: value?.cycleKey || undefined,
          status: rawStatus || 'assigned',
          assignedAt: toIsoString(value?.assignedAt) || undefined,
          redeemedAt: toIsoString(value?.redeemedAt) || undefined,
          expiresAt: toIsoString(value?.expiresAt) || undefined,
          gift: value?.gift ? normalizeGift(value.gift) : undefined,
        }
      : null),
    gift: value?.gift
      ? {
          id: String(value.gift.id || ''),
          name: value.gift.name || '',
          description: value.gift.description || '',
        }
      : undefined,
    user: value?.user
      ? {
          id: String(value.user.id || ''),
          name: value.user.name || '',
          phone: value.user.phone || '',
          email: value.user.email || undefined,
        }
      : undefined,
  };
};

const normalizeGiftAssignment = (value: any): GiftAssignment => {
  const normalizedGift = value?.gift ? normalizeGift(value.gift) : undefined;
  const rawStatus = value?.status || 'assigned';
  const expiresAt = toIsoString(value?.expiresAt);
  const storeId = getAssignmentStoreId(value);
  const storeName = getAssignmentStoreName(value);

  let status: GiftAssignment['status'] = rawStatus;
  if (rawStatus !== 'redeemed' && expiresAt) {
    const expiryDate = toDate(expiresAt);
    if (expiryDate && expiryDate.getTime() <= Date.now()) {
      status = 'expired';
    }
  }

  return {
    assignmentId: String(value?.assignmentId || value?.id || ''),
    giftId: String(value?.giftId || value?.gift?.id || ''),
    userId: String(value?.userId || value?.user?.id || ''),
    storeId,
    storeName,
    cycleKey: value?.cycleKey || undefined,
    status,
    assignedAt: toIsoString(value?.assignedAt) || toIsoString(value?.createdAt) || undefined,
    redeemedAt: toIsoString(value?.redeemedAt) || undefined,
    expiresAt,
    qrTarget: value?.qrTarget || undefined,
    qrQuery: value?.qrQuery || undefined,
    qrCode: value?.qrCode || undefined,
    qrCodeBranded: value?.qrCodeBranded || undefined,
    qr: value?.qr || undefined,
    userInfo: value?.userInfo
      ? {
          name: value.userInfo.name || undefined,
          phone: value.userInfo.phone || undefined,
        }
      : undefined,
    metadata: value?.metadata
      ? {
          ...value.metadata,
          source: value.metadata.source || undefined,
          messageId: value.metadata.messageId || undefined,
        }
      : undefined,
    gift: normalizedGift,
  };
};

const normalizeQRCodeResponse = (value: any): GiftQRCodeResponse => {
  const payload = unwrapPayload(value);

  return {
    assignmentId: payload?.assignmentId || payload?.id || undefined,
    status: payload?.status || undefined,
    storeId: getAssignmentStoreId(payload),
    storeName: getAssignmentStoreName(payload),
    qrCode: payload?.qrCode || undefined,
    qrCodeBranded: payload?.qrCodeBranded || undefined,
    qr: payload?.qr || undefined,
    qrTarget: payload?.qrTarget || undefined,
    qrQuery: payload?.qrQuery || undefined,
    expiresAt: toIsoString(payload?.expiresAt) || undefined,
  };
};

const enrichQRCodeResponseFromFirestore = async (
  qrResponse: GiftQRCodeResponse,
): Promise<GiftQRCodeResponse> => {
  if (!qrResponse.assignmentId || (qrResponse.storeId && qrResponse.storeName)) return qrResponse;

  try {
    const snapshot = await getDoc(doc(db, 'giftAssignments', qrResponse.assignmentId));
    if (!snapshot.exists()) return qrResponse;

    const assignmentData = snapshot.data();
    return {
      ...qrResponse,
      storeId: qrResponse.storeId || getAssignmentStoreId(assignmentData),
      storeName: qrResponse.storeName || getAssignmentStoreName(assignmentData),
    };
  } catch (error) {
    console.warn('Could not enrich QR response from Firestore:', error);
    return qrResponse;
  }
};

const enrichAssignmentFromFirestore = async (assignment: GiftAssignment): Promise<GiftAssignment> => {
  if (!assignment.assignmentId || (assignment.storeId && assignment.storeName)) return assignment;

  try {
    const snapshot = await getDoc(doc(db, 'giftAssignments', assignment.assignmentId));
    if (!snapshot.exists()) return assignment;

    const firestoreAssignment = normalizeGiftAssignment({
      id: snapshot.id,
      ...snapshot.data(),
    });

    return {
      ...assignment,
      storeId: assignment.storeId || firestoreAssignment.storeId,
      storeName: assignment.storeName || firestoreAssignment.storeName,
      metadata: {
        ...(assignment.metadata || {}),
        ...(firestoreAssignment.metadata || {}),
      },
    };
  } catch (error) {
    console.warn('Could not enrich assignment from Firestore:', error);
    return assignment;
  }
};

const hydrateAssignmentsWithGifts = async (assignments: GiftAssignment[]): Promise<GiftAssignment[]> => {
  const missingGiftIds = Array.from(
    new Set(
      assignments
        .filter((assignment) => !assignment.gift && assignment.giftId)
        .map((assignment) => assignment.giftId)
    )
  );

  if (missingGiftIds.length === 0) return assignments;

  const gifts = await Promise.all(
    missingGiftIds.map(async (giftId) => {
      try {
        return await giftService.getGiftById(giftId);
      } catch {
        return null;
      }
    })
  );

  const giftMap = new Map(gifts.filter(Boolean).map((gift) => [gift!.id, gift as Gift]));

  return assignments.map((assignment) => {
    const gift = assignment.gift || giftMap.get(assignment.giftId);
    const reflectedUser = gift
      ? [...(gift.assignedUsers || []), ...(gift.redeemedUsers || [])].find((user) => {
          if (typeof user === 'string') return user === assignment.userId;
          return user.assignmentId === assignment.assignmentId || user.userId === assignment.userId;
        })
      : undefined;

    return {
      ...assignment,
      storeId:
        assignment.storeId ||
        assignment.metadata?.storeId ||
        (typeof reflectedUser === 'string' ? undefined : reflectedUser?.storeId),
      storeName:
        assignment.storeName ||
        assignment.metadata?.storeName ||
        (typeof reflectedUser === 'string' ? undefined : reflectedUser?.storeName),
      gift,
    };
  });
};

const buildLegacyAssignments = async (userId: string): Promise<GiftAssignment[]> => {
  const gifts = await giftService.getAllGifts();
  const assignments: GiftAssignment[] = [];

  for (const gift of gifts) {
    try {
      const status = await giftService.checkStatus(gift.id, userId);
      if (!status.hasAssignment || !status.assignmentId) continue;

      let qrData: GiftQRCodeResponse | null = null;
      try {
        qrData = await giftService.getQRCode(status.assignmentId);
      } catch {
        qrData = null;
      }

      const reflectedUser = [...(gift.assignedUsers || []), ...(gift.redeemedUsers || [])].find((user) => {
        if (typeof user === 'string') return user === userId;
        return user.assignmentId === status.assignmentId || user.userId === userId;
      });
      const reflectedStoreId = typeof reflectedUser === 'string' ? undefined : reflectedUser?.storeId;
      const reflectedStoreName = typeof reflectedUser === 'string' ? undefined : reflectedUser?.storeName;

      assignments.push({
        assignmentId: status.assignmentId,
        giftId: gift.id,
        userId,
        storeId: status.storeId || status.assignment?.storeId || reflectedStoreId || undefined,
        storeName: status.storeName || status.assignment?.storeName || reflectedStoreName || undefined,
        cycleKey: status.cycleKey || undefined,
        status: status.status || 'assigned',
        assignedAt: status.assignment?.assignedAt || undefined,
        redeemedAt: status.redeemedAt || status.assignment?.redeemedAt || undefined,
        expiresAt: status.expiresAt || status.assignment?.expiresAt || undefined,
        qrTarget: qrData?.qrTarget,
        qrQuery: qrData?.qrQuery,
        qrCode: qrData?.qrCode,
        qrCodeBranded: qrData?.qrCodeBranded,
        qr: qrData?.qr,
        gift,
      });
    } catch (error) {
      console.warn('Could not build legacy gift assignment:', error);
    }
  }

  return assignments;
};

export const giftService = {
  getAllGifts: async (): Promise<Gift[]> => {
    try {
      const response = await axios.get(API_BASE_URL);
      const gifts = unwrapArrayPayload(response.data).map(normalizeGift);
      return Promise.all(gifts.map(enrichGiftFromFirestore));
    } catch (error) {
      console.error('Error fetching gifts:', error);
      throw error;
    }
  },

  getAllActiveGifts: async (): Promise<Gift[]> => {
    const gifts = await giftService.getAllGifts();
    return gifts.filter((gift) => gift.isActive !== false);
  },

  getGiftById: async (giftId: string): Promise<Gift> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/gift/${giftId}`);
      const normalized = normalizeGift(unwrapPayload(response.data));
      if (!normalized.id) {
        throw new Error('Gift payload from REST API is empty');
      }
      return enrichGiftFromFirestore(normalized);
    } catch (error) {
      console.warn(`REST getGiftById failed for ${giftId}, falling back to Firestore.`, error);

      try {
        const snapshot = await getDoc(doc(db, 'gifts', giftId));
        if (snapshot.exists()) {
          const fromFirestore = normalizeGift({
            id: snapshot.id,
            ...snapshot.data(),
          });
          return reconcileGiftFromAssignments(fromFirestore);
        }
        console.warn(`Gift ${giftId} not found in Firestore.`);
      } catch (firestoreError) {
        console.error('Firestore fallback also failed for gift', giftId, firestoreError);
      }

      throw error;
    }
  },

  assignGift: async (request: AssignGiftRequest): Promise<GiftAssignment> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/assign`, request);
      return normalizeGiftAssignment(unwrapPayload(response.data));
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error(
          error.response?.data?.message || 'Quà đã hết, đã được nhận trong chu kỳ hiện tại, hoặc cơ sở không còn quà.'
        );
      }

      if (isNetworkError(error)) {
        console.warn('REST assignGift unreachable, falling back to Firestore.', error);
        try {
          return await assignGiftFromFirestore(request);
        } catch (fallbackError) {
          console.error('Firestore fallback assignGift failed:', fallbackError);
          throw fallbackError;
        }
      }

      console.error('Error assigning gift:', error);
      throw error;
    }
  },

  getQRCode: async (assignmentId: string): Promise<GiftQRCodeResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/qr/${assignmentId}`);
      return enrichQRCodeResponseFromFirestore(normalizeQRCodeResponse(response.data));
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn(`REST getQRCode unreachable for ${assignmentId}, falling back to Firestore.`, error);
        const fallback = await getQRCodeFromFirestore(assignmentId);
        if (fallback) return fallback;
      }
      console.error('Error fetching QR code:', error);
      throw error;
    }
  },

  checkStatus: async (giftId: string, userId: string): Promise<GiftStatus> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/check-status`, {
        params: { giftId, userId },
      });
      return normalizeGiftStatus(unwrapPayload(response.data));
    } catch (error) {
      console.error('Error checking gift status:', error);
      throw error;
    }
  },

  redeemGift: async (request: RedeemGiftRequest): Promise<GiftAssignment> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/redeem`, request);
      return normalizeGiftAssignment(unwrapPayload(response.data));
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error(error.response?.data?.message || 'Quà đã được đổi, hết hạn, hoặc không đúng cơ sở.');
      }
      console.error('Error redeeming gift:', error);
      throw error;
    }
  },

  reassignGift: async (request: ReassignGiftRequest): Promise<GiftAssignment> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/reassign`, request);
      return normalizeGiftAssignment(unwrapPayload(response.data));
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Backend chưa hỗ trợ API đổi cơ sở nhận quà (`POST /api/gifts/reassign`).');
      }
      if (error.response?.status === 409) {
        throw new Error(
          error.response?.data?.message || 'Không thể đổi cơ sở vì quà đã được dùng, hết hạn, hoặc cơ sở mới không còn lượt.'
        );
      }
      console.error('Error reassigning gift:', error);
      throw error;
    }
  },

  getUserAssignments: async (userId: string): Promise<GiftAssignment[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/assignments`, {
        params: { userId },
      });
      const assignments = unwrapArrayPayload(response.data).map(normalizeGiftAssignment);
      return hydrateAssignmentsWithGifts(assignments);
    } catch (error: any) {
      const statusCode = error?.response?.status;
      const shouldFallback = !statusCode || [400, 404, 405].includes(statusCode);

      if (shouldFallback) {
        // Ưu tiên Firestore vì nhanh và không phụ thuộc REST.
        try {
          const firestoreAssignments = await getUserAssignmentsFromFirestore(userId);
          if (firestoreAssignments.length > 0 || isNetworkError(error)) {
            return hydrateAssignmentsWithGifts(firestoreAssignments);
          }
        } catch (firestoreError) {
          console.warn('Firestore assignments fallback failed:', firestoreError);
        }

        if (!isNetworkError(error)) {
          console.warn('Assignments endpoint unavailable, falling back to legacy gift lookup.');
          return buildLegacyAssignments(userId);
        }

        console.warn('REST + legacy lookup both unreachable, returning Firestore assignments only.');
        return hydrateAssignmentsWithGifts(await getUserAssignmentsFromFirestore(userId));
      }

      console.error('Error fetching user assignments:', error);
      throw error;
    }
  },

  getAssignment: async (assignmentId: string): Promise<GiftAssignment> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/assignment/${assignmentId}`);
      const assignment = await enrichAssignmentFromFirestore(normalizeGiftAssignment(unwrapPayload(response.data)));
      return hydrateAssignmentsWithGifts([assignment]).then((items) => items[0]);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }
  },
};
