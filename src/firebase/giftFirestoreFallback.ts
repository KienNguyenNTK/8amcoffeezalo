import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import {
  AssignGiftRequest,
  Gift,
  GiftAssignment,
  GiftQRCodeResponse,
  GiftStoreAllocation,
} from '../types/gift';
import { getGiftCycleExpiryAt, getGiftCycleKey, toIsoString } from '../utils/giftHelpers';
import { db } from './config';

const GIFTS_COLLECTION = 'gifts';
const ASSIGNMENTS_COLLECTION = 'giftAssignments';

const QR_SERVICE_URL = 'https://api.qrserver.com/v1/create-qr-code/';

const buildQrCodeUrl = (assignmentId: string): string => {
  const data = encodeURIComponent(assignmentId);
  return `${QR_SERVICE_URL}?size=300x300&margin=10&data=${data}`;
};

const toNumber = (value: any): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildCycleKey = (gift: Pick<Gift, 'resetConfig'>): string =>
  getGiftCycleKey(gift as Gift, new Date());

const buildExpiresAt = (gift: Pick<Gift, 'resetConfig'>): string | undefined => {
  const expiry = getGiftCycleExpiryAt(gift as Gift, new Date());
  return expiry ? expiry.toISOString() : undefined;
};

const findAllocationIndex = (
  allocations: GiftStoreAllocation[] | undefined,
  storeId: string,
): number => {
  if (!Array.isArray(allocations)) return -1;
  return allocations.findIndex((allocation) => allocation?.storeId === storeId);
};

const sanitizeAllocation = (raw: any): GiftStoreAllocation => ({
  storeId: String(raw?.storeId || ''),
  storeName: String(raw?.storeName || ''),
  totalQuantity: toNumber(raw?.totalQuantity),
  availableQuantity: toNumber(raw?.availableQuantity),
  assignedCount: toNumber(raw?.assignedCount),
  usedQuantity: toNumber(raw?.usedQuantity),
});

/**
 * Kiểm tra xem user đã có assignment đang hoạt động cho gift trong chu kỳ hiện tại chưa.
 */
const hasActiveAssignmentInCycle = async (
  giftId: string,
  userId: string,
  cycleKey: string,
): Promise<boolean> => {
  try {
    const assignmentsQuery = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where('giftId', '==', giftId),
      where('userId', '==', userId),
    );
    const snapshot = await getDocs(assignmentsQuery);

    return snapshot.docs.some((documentSnapshot) => {
      const data = documentSnapshot.data();
      if (!data) return false;
      const status = data.status;
      const docCycleKey = data.cycleKey;
      const expiresAt = data.expiresAt instanceof Timestamp
        ? data.expiresAt.toDate()
        : data.expiresAt
        ? new Date(data.expiresAt)
        : null;

      if (status === 'redeemed' || status === 'expired') {
        // Một số shop muốn cho lại sau redeem trong chu kỳ; backend mới chặn dùng cycleKey
        // → giữ logic chặt: cùng cycleKey đã có bất kỳ trạng thái nào cũng coi là "đã dùng".
        return docCycleKey === cycleKey;
      }

      if (docCycleKey && docCycleKey === cycleKey) return true;
      if (!docCycleKey && expiresAt && expiresAt.getTime() > Date.now()) return true;

      return false;
    });
  } catch (error) {
    console.warn('Could not check existing assignment:', error);
    return false;
  }
};

/**
 * Fallback đăng ký quà trực tiếp Firestore khi REST API không phản hồi.
 * Dùng transaction để đảm bảo decrement availableQuantity đúng.
 */
export const assignGiftFromFirestore = async (
  request: AssignGiftRequest,
): Promise<GiftAssignment> => {
  const { giftId, userId, storeId, storeName, userInfo, metadata } = request;

  if (!giftId) throw new Error('Thiếu giftId.');
  if (!userId) throw new Error('Bạn cần đăng nhập hội viên để nhận quà.');
  if (!storeId) throw new Error('Cần chọn cơ sở nhận quà.');

  const giftDocRef = doc(db, GIFTS_COLLECTION, giftId);

  // Đọc trước transaction để build cycleKey và check duplicate.
  const preSnapshot = await getDoc(giftDocRef);
  if (!preSnapshot.exists()) {
    throw new Error('Quà không còn tồn tại.');
  }
  const preData = preSnapshot.data() as any;
  const giftForCycle: Pick<Gift, 'resetConfig'> = {
    resetConfig: preData?.resetConfig
      ? {
          enabled: Boolean(preData.resetConfig.enabled),
          dailyResetHour: toNumber(preData.resetConfig.dailyResetHour),
          dailyResetMinute: toNumber(preData.resetConfig.dailyResetMinute),
        }
      : undefined,
  };
  const cycleKey = buildCycleKey(giftForCycle);
  const expiresAtIso = buildExpiresAt(giftForCycle);

  const alreadyHas = await hasActiveAssignmentInCycle(giftId, userId, cycleKey);
  if (alreadyHas) {
    throw new Error('Bạn đã đăng ký quà này trong chu kỳ hiện tại rồi.');
  }

  // Transaction: trừ allocation theo storeId.
  const resolvedStoreName = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(giftDocRef);
    if (!snapshot.exists()) {
      throw new Error('Quà không còn tồn tại.');
    }
    const data = snapshot.data() as any;
    if (data?.isActive === false) {
      throw new Error('Quà này đang tạm ẩn nên chưa thể đăng ký.');
    }

    const allocationsRaw: any[] = Array.isArray(data?.storeAllocations) ? data.storeAllocations : [];
    const allocations: GiftStoreAllocation[] = allocationsRaw.map(sanitizeAllocation);
    const allocationIndex = findAllocationIndex(allocations, storeId);
    if (allocationIndex < 0) {
      throw new Error('Cơ sở này không nằm trong danh sách phân bổ quà.');
    }

    const allocation = allocations[allocationIndex];
    if (allocation.availableQuantity <= 0) {
      throw new Error('Cơ sở này đã hết lượt đăng ký quà.');
    }

    const updatedAllocation: GiftStoreAllocation = {
      ...allocation,
      assignedCount: allocation.assignedCount + 1,
      availableQuantity: Math.max(0, allocation.availableQuantity - 1),
    };
    const nextAllocations = [...allocations];
    nextAllocations[allocationIndex] = updatedAllocation;

    const totals = nextAllocations.reduce(
      (totalsAccumulator, allocationItem) => ({
        totalQuantity: totalsAccumulator.totalQuantity + allocationItem.totalQuantity,
        availableQuantity: totalsAccumulator.availableQuantity + allocationItem.availableQuantity,
        assignedCount: totalsAccumulator.assignedCount + allocationItem.assignedCount,
        usedQuantity: totalsAccumulator.usedQuantity + allocationItem.usedQuantity,
      }),
      {
        totalQuantity: 0,
        availableQuantity: 0,
        assignedCount: 0,
        usedQuantity: 0,
      },
    );

    transaction.update(giftDocRef, {
      storeAllocations: nextAllocations,
      ...totals,
      updatedAt: serverTimestamp(),
    });

    return updatedAllocation.storeName;
  });

  const assignedAt = new Date();
  const finalStoreName = storeName || resolvedStoreName || '';

  const assignmentDocRef = await addDoc(collection(db, ASSIGNMENTS_COLLECTION), {
    giftId,
    userId,
    storeId,
    storeName: finalStoreName,
    cycleKey,
    status: 'assigned',
    assignedAt: Timestamp.fromDate(assignedAt),
    createdAt: Timestamp.fromDate(assignedAt),
    expiresAt: expiresAtIso ? Timestamp.fromDate(new Date(expiresAtIso)) : null,
    userInfo: userInfo || null,
    metadata: {
      ...(metadata || {}),
      storeId,
      storeName: finalStoreName,
      source: metadata?.source || 'firestore-fallback',
    },
  });

  const qrCode = buildQrCodeUrl(assignmentDocRef.id);

  // Lưu QR url vào doc để các lần đọc sau cùng có sẵn.
  try {
    await updateDoc(assignmentDocRef, {
      qrCode,
      qrCodeBranded: qrCode,
    });
  } catch (updateError) {
    console.warn('Could not persist QR url on assignment:', updateError);
  }

  const assignment: GiftAssignment = {
    assignmentId: assignmentDocRef.id,
    giftId,
    userId,
    storeId,
    storeName: finalStoreName,
    cycleKey,
    status: 'assigned',
    assignedAt: assignedAt.toISOString(),
    redeemedAt: undefined,
    expiresAt: expiresAtIso,
    qrCode,
    qrCodeBranded: qrCode,
    qr: qrCode,
    userInfo,
    metadata: {
      ...(metadata || {}),
      storeId,
      storeName: finalStoreName,
      source: metadata?.source || 'firestore-fallback',
    },
  };

  return assignment;
};

/**
 * Fallback lấy QR cho assignment đã có.
 */
export const getQRCodeFromFirestore = async (
  assignmentId: string,
): Promise<GiftQRCodeResponse | null> => {
  if (!assignmentId) return null;

  try {
    const snapshot = await getDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId));
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as any;
    const qrCode = data?.qrCodeBranded || data?.qrCode || data?.qr || buildQrCodeUrl(assignmentId);

    return {
      assignmentId,
      status: data?.status || 'assigned',
      storeId: data?.storeId || data?.metadata?.storeId,
      storeName: data?.storeName || data?.metadata?.storeName,
      qrCode,
      qrCodeBranded: data?.qrCodeBranded || qrCode,
      qr: qrCode,
      qrTarget: data?.qrTarget,
      qrQuery: data?.qrQuery,
      expiresAt: toIsoString(data?.expiresAt),
    };
  } catch (error) {
    console.warn('Could not load QR from Firestore:', error);
    return null;
  }
};

/**
 * Fallback lấy assignments của user trực tiếp từ Firestore.
 */
export const getUserAssignmentsFromFirestore = async (
  userId: string,
): Promise<GiftAssignment[]> => {
  if (!userId) return [];

  try {
    const assignmentsQuery = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where('userId', '==', userId),
    );
    const snapshot = await getDocs(assignmentsQuery);

    return snapshot.docs.map((documentSnapshot) => {
      const data = documentSnapshot.data() as any;
      const assignedAtIso = toIsoString(data?.assignedAt) || toIsoString(data?.createdAt);
      const expiresAtIso = toIsoString(data?.expiresAt);
      const qrCode =
        data?.qrCodeBranded || data?.qrCode || data?.qr || buildQrCodeUrl(documentSnapshot.id);

      return {
        assignmentId: documentSnapshot.id,
        giftId: String(data?.giftId || ''),
        userId,
        storeId: data?.storeId || data?.metadata?.storeId,
        storeName: data?.storeName || data?.metadata?.storeName,
        cycleKey: data?.cycleKey || undefined,
        status: (data?.status as GiftAssignment['status']) || 'assigned',
        assignedAt: assignedAtIso,
        redeemedAt: toIsoString(data?.redeemedAt),
        expiresAt: expiresAtIso,
        qrCode,
        qrCodeBranded: data?.qrCodeBranded || qrCode,
        qr: qrCode,
        qrTarget: data?.qrTarget,
        qrQuery: data?.qrQuery,
        userInfo: data?.userInfo || undefined,
        metadata: data?.metadata || undefined,
      } as GiftAssignment;
    });
  } catch (error) {
    console.warn('Could not load assignments from Firestore:', error);
    return [];
  }
};

export const buildFallbackQrCodeUrl = buildQrCodeUrl;
