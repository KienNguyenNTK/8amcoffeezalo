import { Gift, GiftAssignment, GiftStoreAllocation } from '../types/gift';

const getAssignmentStoreKey = (
  assignment: GiftAssignment,
  allocationMap: Map<string, GiftStoreAllocation>
): string | undefined => {
  const storeId = assignment.storeId || assignment.metadata?.storeId;
  if (storeId && allocationMap.has(storeId)) {
    return storeId;
  }

  const storeName = assignment.storeName || assignment.metadata?.storeName;
  if (!storeName) return undefined;

  const matchedAllocation = Array.from(allocationMap.values()).find((allocation) => allocation.storeName === storeName);
  return matchedAllocation?.storeId;
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

export const reconcileGiftCountsFromAssignments = (
  gift: Gift,
  assignments: GiftAssignment[],
): Gift => {
  const baseAllocations = gift.storeAllocations || [];
  if (baseAllocations.length === 0) {
    return gift;
  }

  const allocationMap = new Map<string, GiftStoreAllocation>();
  baseAllocations.forEach((allocation) => {
    allocationMap.set(allocation.storeId, {
      ...allocation,
      assignedCount: 0,
      usedQuantity: 0,
    });
  });

  assignments.forEach((assignment) => {
    const storeKey = getAssignmentStoreKey(assignment, allocationMap);
    if (!storeKey) return;

    const allocation = allocationMap.get(storeKey);
    if (!allocation) return;

    if (assignment.status === 'redeemed') {
      allocation.usedQuantity += 1;
      return;
    }

    if (assignment.status === 'assigned') {
      allocation.assignedCount += 1;
    }
  });

  const reconciledAllocations = Array.from(allocationMap.values()).map((allocation) => ({
    ...allocation,
    availableQuantity: Math.max(
      0,
      allocation.totalQuantity - allocation.assignedCount - allocation.usedQuantity
    ),
  }));

  const totals = sumGiftTotals(reconciledAllocations);

  return {
    ...gift,
    storeAllocations: reconciledAllocations,
    totalQuantity: totals.totalQuantity,
    availableQuantity: totals.availableQuantity,
    assignedCount: totals.assignedCount,
    usedQuantity: totals.usedQuantity,
  };
};
