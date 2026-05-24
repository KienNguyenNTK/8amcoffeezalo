import React, { useEffect, useMemo, useState } from 'react';
import { notification } from 'antd';
import { giftService } from '../firebase/giftService';
import { SelectedStoreService } from '../services/selectedStoreService';
import { Gift, GiftAssignment, GiftStoreAllocation } from '../types/gift';
import { RelatedGiftMessageItem } from '../types/message';
import {
  findGiftStoreAllocation,
  getCurrentGiftAssignment,
  isGiftActive,
} from '../utils/giftHelpers';
import GiftQRModal from './GiftQRModal';

interface GiftClaimSectionProps {
  gifts: Gift[];
  assignments: GiftAssignment[];
  userInfo: {
    id: string;
    name?: string;
    phone?: string;
  } | null;
  loading?: boolean;
  messageId?: string;
  relatedGiftItems?: RelatedGiftMessageItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  onClaimSuccess?: () => Promise<void> | void;
}

interface ActiveGiftModalState {
  gift: Gift;
  assignment: GiftAssignment;
  qrCode: string;
}

interface GiftStoreScope {
  isMessageGift: boolean;
  isMessageStoreMissing: boolean;
  preferredStoreId?: string;
  preferredStoreName?: string;
  storeOptions: GiftStoreAllocation[];
}

const mergeGiftWithMessageSnapshot = (gift: Gift, snapshot?: RelatedGiftMessageItem): Gift => {
  if (!snapshot) return gift;

  return {
    ...gift,
    name: gift.name || snapshot.name || '',
    description: gift.description || snapshot.description || '',
    imageUrl: gift.imageUrl || snapshot.imageUrl,
    storeAllocations:
      gift.storeAllocations && gift.storeAllocations.length > 0
        ? gift.storeAllocations
        : snapshot.storeAllocations,
    resetConfig: gift.resetConfig || snapshot.resetConfig,
  };
};

const getGiftStoreScope = (gift: Gift, snapshot?: RelatedGiftMessageItem): GiftStoreScope => {
  const allStoreOptions = gift.storeAllocations || [];
  const preferredStoreId = snapshot?.storeId?.trim() || undefined;
  const preferredStoreName = snapshot?.storeName?.trim() || undefined;
  const isMessageGift = Boolean(snapshot);

  if (!isMessageGift) {
    return {
      isMessageGift: false,
      isMessageStoreMissing: false,
      storeOptions: allStoreOptions,
    };
  }

  return {
    isMessageGift: true,
    isMessageStoreMissing: allStoreOptions.length === 0,
    preferredStoreId,
    preferredStoreName,
    storeOptions: allStoreOptions,
  };
};

const withAssignmentStoreFallback = (
  assignment: GiftAssignment | null,
  allocation?: GiftStoreAllocation,
): GiftAssignment | null => {
  if (!assignment || !allocation) return assignment;

  return {
    ...assignment,
    storeId: assignment.storeId || assignment.metadata?.storeId || allocation.storeId,
    storeName: assignment.storeName || assignment.metadata?.storeName || allocation.storeName,
  };
};

const getAssignmentStoreId = (
  assignment: GiftAssignment | null | undefined,
): string | undefined => {
  return assignment?.storeId || assignment?.metadata?.storeId;
};

const GiftClaimSection: React.FC<GiftClaimSectionProps> = ({
  gifts,
  assignments,
  userInfo,
  loading = false,
  messageId,
  relatedGiftItems = [],
  emptyTitle = 'Hiện chưa có quà khả dụng',
  emptyDescription = 'Quà sẽ xuất hiện tại đây khi hệ thống mở nhận.',
  onClaimSuccess,
}) => {
  const [selectedStores, setSelectedStores] = useState<Record<string, string>>({});
  const [claimingGiftId, setClaimingGiftId] = useState<string | null>(null);
  const [reassigningGiftId, setReassigningGiftId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveGiftModalState | null>(null);
  const [loadingQrForAssignmentId, setLoadingQrForAssignmentId] = useState<string | null>(null);

  const relatedGiftMap = useMemo(() => {
    return relatedGiftItems.reduce<Record<string, RelatedGiftMessageItem>>((accumulator, item) => {
      accumulator[item.id] = item;
      return accumulator;
    }, {});
  }, [relatedGiftItems]);

  const normalizedGifts = useMemo(() => {
    return gifts
      .map((gift) => mergeGiftWithMessageSnapshot(gift, relatedGiftMap[gift.id]))
      .filter((gift) => Boolean(gift.id))
      .sort((left, right) => {
        if ((left.isActive !== false) !== (right.isActive !== false)) {
          return left.isActive === false ? 1 : -1;
        }

        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();
        return rightTime - leftTime;
      });
  }, [gifts, relatedGiftMap]);

  useEffect(() => {
    const selectedStoreId = SelectedStoreService.getSelectedStoreId();

    setSelectedStores((currentSelections) => {
      const nextSelections = { ...currentSelections };

      normalizedGifts.forEach((gift) => {
        const storeScope = getGiftStoreScope(gift, relatedGiftMap[gift.id]);
        const currentAssignment = getCurrentGiftAssignment(gift, assignments);
        const assignmentStoreId = getAssignmentStoreId(currentAssignment);
        const availableStoreIds = storeScope.storeOptions.map((allocation) => allocation.storeId);
        const preferredStoreId =
          (assignmentStoreId && availableStoreIds.includes(assignmentStoreId) && assignmentStoreId) ||
          (storeScope.preferredStoreId &&
            availableStoreIds.includes(storeScope.preferredStoreId) &&
            storeScope.preferredStoreId) ||
          (selectedStoreId && availableStoreIds.includes(selectedStoreId) && selectedStoreId) ||
          storeScope.storeOptions.find((allocation) => allocation.availableQuantity > 0)?.storeId ||
          storeScope.storeOptions[0]?.storeId;

        if (
          preferredStoreId &&
          (!nextSelections[gift.id] || !availableStoreIds.includes(nextSelections[gift.id]))
        ) {
          nextSelections[gift.id] = preferredStoreId;
        }
      });

      return nextSelections;
    });
  }, [assignments, normalizedGifts, relatedGiftMap]);

  const handleClaimGift = async (gift: Gift) => {
    if (!userInfo?.id) {
      alert('Bạn cần đăng nhập hội viên để nhận quà.');
      return;
    }

    const storeScope = getGiftStoreScope(gift, relatedGiftMap[gift.id]);
    const storeId = selectedStores[gift.id];
    const selectedAllocation =
      findGiftStoreAllocation(
        {
          ...gift,
          storeAllocations: storeScope.storeOptions,
        },
        storeId
      ) || storeScope.storeOptions[0];

    if (storeScope.isMessageStoreMissing) {
      alert(
        storeScope.isMessageGift
          ? 'Tin nhắn này chưa có danh sách cơ sở nhận quà khả dụng.'
          : 'Quà này chưa được cấu hình cơ sở nhận.'
      );
      return;
    }

    if (!selectedAllocation) {
      alert('Quà này chưa được cấu hình cơ sở nhận.');
      return;
    }

    if (selectedAllocation.availableQuantity <= 0) {
      alert('Cơ sở này đã hết lượt đăng ký quà.');
      return;
    }

    try {
      setClaimingGiftId(gift.id);

      const assignment = await giftService.assignGift({
        giftId: gift.id,
        userId: userInfo.id,
        storeId: selectedAllocation.storeId,
        storeName: selectedAllocation.storeName,
        userInfo: {
          name: userInfo.name,
          phone: userInfo.phone,
        },
        metadata: {
          source: messageId ? 'message' : 'gifts',
          storeId: selectedAllocation.storeId,
          storeName: selectedAllocation.storeName,
          ...(messageId ? { messageId } : {}),
        },
      });

      let qrCode = assignment.qrCodeBranded || assignment.qrCode || assignment.qr || '';
      if (!qrCode && assignment.assignmentId) {
        const qrData = await giftService.getQRCode(assignment.assignmentId);
        qrCode = qrData.qrCodeBranded || qrData.qrCode || qrData.qr || '';
      }

      const enrichedAssignment = {
        ...assignment,
        storeId: assignment.storeId || selectedAllocation.storeId,
        storeName: assignment.storeName || selectedAllocation.storeName,
        assignedAt: assignment.assignedAt || new Date().toISOString(),
        gift,
      };

      setActiveModal({
        gift,
        assignment: enrichedAssignment,
        qrCode,
      });

      await onClaimSuccess?.();
      notification.success({
        message: 'Đăng ký quà thành công',
        description: `Bạn đã giữ quà tại ${selectedAllocation.storeName}. Có thể mở QR để sử dụng tại quán.`,
        placement: 'topRight',
      });
    } catch (error: any) {
      console.error('Error claiming gift:', error);
      alert(error?.message || 'Có lỗi xảy ra khi nhận quà.');
    } finally {
      setClaimingGiftId(null);
    }
  };

  const handleReassignGift = async (gift: Gift, assignment: GiftAssignment, selectedAllocation?: GiftStoreAllocation) => {
    if (!userInfo?.id) {
      alert('Bạn cần đăng nhập hội viên để đổi cơ sở nhận quà.');
      return;
    }

    if (!selectedAllocation) {
      alert('Vui lòng chọn cơ sở muốn chuyển quà tới.');
      return;
    }

    if (assignment.status !== 'assigned') {
      alert('Chỉ có thể đổi cơ sở khi quà vẫn đang ở trạng thái chưa sử dụng.');
      return;
    }

    const fromStoreId = getAssignmentStoreId(assignment);
    if (!fromStoreId) {
      alert('Không xác định được cơ sở hiện tại của quà để thực hiện chuyển.');
      return;
    }

    if (selectedAllocation.storeId === fromStoreId) {
      alert('Quà đang được giữ tại cơ sở này rồi.');
      return;
    }

    if (selectedAllocation.availableQuantity <= 0) {
      alert('Cơ sở mới đã hết lượt đăng ký quà.');
      return;
    }

    try {
      setReassigningGiftId(gift.id);

      await giftService.reassignGift({
        assignmentId: assignment.assignmentId,
        giftId: gift.id,
        userId: userInfo.id,
        fromStoreId,
        toStoreId: selectedAllocation.storeId,
        toStoreName: selectedAllocation.storeName,
        metadata: {
          source: messageId ? 'message' : 'gifts',
          storeId: selectedAllocation.storeId,
          storeName: selectedAllocation.storeName,
          ...(messageId ? { messageId } : {}),
        },
      });

      await onClaimSuccess?.();
      notification.success({
        message: 'Đổi cơ sở thành công',
        description: `Quà đã được chuyển sang ${selectedAllocation.storeName}.`,
        placement: 'topRight',
      });
    } catch (error: any) {
      console.error('Error reassigning gift:', error);
      alert(error?.message || 'Có lỗi xảy ra khi đổi cơ sở nhận quà.');
    } finally {
      setReassigningGiftId(null);
    }
  };

  const handleOpenExistingQr = async (gift: Gift, assignment: GiftAssignment) => {
    try {
      setLoadingQrForAssignmentId(assignment.assignmentId);

      let qrCode = assignment.qrCodeBranded || assignment.qrCode || assignment.qr || '';
      if (!qrCode && assignment.assignmentId) {
        const qrData = await giftService.getQRCode(assignment.assignmentId);
        qrCode = qrData.qrCodeBranded || qrData.qrCode || qrData.qr || '';
      }

      if (!qrCode) {
        alert('Không thể tải mã QR cho quà này.');
        return;
      }

      setActiveModal({
        gift,
        assignment,
        qrCode,
      });
    } catch (error) {
      console.error('Error opening QR:', error);
      alert('Không thể tải mã QR cho quà này.');
    } finally {
      setLoadingQrForAssignmentId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (normalizedGifts.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
        <h3 className="text-base font-semibold text-gray-900 mb-1">{emptyTitle}</h3>
        <p className="text-sm text-gray-500">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {normalizedGifts.map((gift) => {
          const relatedGiftSnapshot = relatedGiftMap[gift.id];
          const storeScope = getGiftStoreScope(gift, relatedGiftSnapshot);
          const currentAssignment = getCurrentGiftAssignment(gift, assignments);
          const selectedStoreId = selectedStores[gift.id];
          const storeOptions = storeScope.storeOptions;
          const assignmentStoreId = getAssignmentStoreId(currentAssignment);
          const assignmentAllocation = assignmentStoreId
            ? findGiftStoreAllocation(
                {
                  ...gift,
                  storeAllocations: storeOptions,
                },
                assignmentStoreId
              )
            : undefined;
          const selectedAllocation =
            findGiftStoreAllocation(
              {
                ...gift,
                storeAllocations: storeOptions,
              },
              selectedStoreId
            ) || storeOptions[0];
          const currentAssignmentWithStore = withAssignmentStoreFallback(currentAssignment, assignmentAllocation);
          const hasStoreConfiguration = storeOptions.length > 0;
          const canReassign =
            currentAssignmentWithStore?.status === 'assigned' &&
            !!selectedAllocation &&
            !!currentAssignmentWithStore.storeId &&
            selectedAllocation.storeId !== currentAssignmentWithStore.storeId &&
            selectedAllocation.availableQuantity > 0;

          const canClaim =
            isGiftActive(gift) &&
            !storeScope.isMessageStoreMissing &&
            hasStoreConfiguration &&
            !!selectedAllocation &&
            selectedAllocation.availableQuantity > 0 &&
            !currentAssignment;

          return (
            <div key={gift.id} className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm">
              <div className="flex gap-3">
                {gift.imageUrl && (
                  <img
                    src={gift.imageUrl}
                    alt={gift.name}
                    className="w-20 h-20 object-cover rounded-xl border border-gray-200 flex-shrink-0"
                    onError={(event) => {
                      (event.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{gift.name}</h3>
                      {gift.description && (
                        <p className="text-sm text-gray-500 mt-1">{gift.description}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {selectedAllocation && (
                      <>
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          Còn {selectedAllocation.availableQuantity}/{selectedAllocation.totalQuantity} quà
                        </span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          Đã đăng ký: {selectedAllocation.assignedCount + selectedAllocation.usedQuantity}
                        </span>
                      </>
                    )}
                    {selectedAllocation?.storeName && !currentAssignmentWithStore && (
                      <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                        Nhận tại: {selectedAllocation.storeName}
                      </span>
                    )}
                    {currentAssignmentWithStore?.storeName && (
                      <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                        Đã đăng ký tại: {currentAssignmentWithStore.storeName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {storeScope.isMessageStoreMissing && (
                <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                  {storeScope.isMessageGift
                    ? 'Tin nhắn này chưa có danh sách cơ sở nhận quà khả dụng.'
                    : 'Quà này chưa được cấu hình cơ sở nhận.'}
                </div>
              )}

              {!storeScope.isMessageStoreMissing && !hasStoreConfiguration && (
                <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                  Quà này chưa được cấu hình cơ sở nhận.
                </div>
              )}

              {hasStoreConfiguration && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-800 mb-2">Chọn cơ sở nhận quà</div>
                  {storeScope.isMessageGift && storeScope.preferredStoreName && (
                    <div className="mb-2 text-xs text-gray-500">
                      Tin nhắn đang gợi ý cơ sở: <strong>{storeScope.preferredStoreName}</strong>. Bạn vẫn có thể chọn cơ sở khác còn lượt.
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2">
                    {storeOptions.map((allocation) => {
                      const isSelected = selectedStoreId === allocation.storeId;
                      const isAssignedStore = currentAssignmentWithStore?.storeId === allocation.storeId;

                      return (
                        <button
                          key={allocation.storeId}
                          type="button"
                          onClick={() =>
                            setSelectedStores((currentSelections) => ({
                              ...currentSelections,
                              [gift.id]: allocation.storeId,
                            }))
                          }
                          className={`text-left rounded-xl border px-3 py-3 transition-colors ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 bg-white hover:border-orange-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-medium text-gray-900">{allocation.storeName}</div>
                                {isAssignedStore && (
                                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                                    Đang giữ quà tại đây
                                  </span>
                                )}
                                {isSelected && !isAssignedStore && (
                                  <span className="rounded-full bg-orange-100 px-2 py-1 text-[11px] font-medium text-orange-700">
                                    Đang chọn
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Còn {allocation.availableQuantity}/{allocation.totalQuantity} quà
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Đã đăng ký: {allocation.assignedCount + allocation.usedQuantity}
                              </div>
                            </div>
                            {allocation.availableQuantity <= 0 ? (
                              <span className="text-xs font-medium text-red-600">Hết lượt</span>
                            ) : (
                              <span className="text-xs font-medium text-green-600">Còn lượt</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentAssignmentWithStore ? (
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {currentAssignmentWithStore.status === 'redeemed'
                          ? 'Bạn đã đổi quà trong chu kỳ hiện tại'
                          : currentAssignmentWithStore.status === 'expired'
                            ? 'Quà đăng ký trong chu kỳ hiện tại đã hết hạn'
                            : 'Bạn đã đăng ký quà trong chu kỳ hiện tại'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {currentAssignmentWithStore.storeName
                          ? `Cơ sở: ${currentAssignmentWithStore.storeName}`
                          : 'Cơ sở sẽ hiển thị sau khi backend trả dữ liệu đầy đủ.'}
                      </div>
                      {selectedAllocation && currentAssignmentWithStore.status === 'assigned' && (
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedAllocation.storeId === currentAssignmentWithStore.storeId
                            ? 'Bạn đang xem đúng cơ sở đã giữ quà.'
                            : `Sẽ chuyển sang ${selectedAllocation.storeName} nếu bấm đổi cơ sở.`}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 sm:min-w-[160px]">
                      {currentAssignmentWithStore.status === 'assigned' && (
                        <button
                          type="button"
                          onClick={() => handleOpenExistingQr(gift, currentAssignmentWithStore)}
                          disabled={loadingQrForAssignmentId === currentAssignmentWithStore.assignmentId}
                          className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-60"
                        >
                          {loadingQrForAssignmentId === currentAssignmentWithStore.assignmentId ? 'Đang tải...' : 'Xem QR'}
                        </button>
                      )}

                      {currentAssignmentWithStore.status === 'assigned' && selectedAllocation && (
                        <button
                          type="button"
                          onClick={() => handleReassignGift(gift, currentAssignmentWithStore, selectedAllocation)}
                          disabled={!canReassign || reassigningGiftId === gift.id}
                          className="px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold disabled:opacity-60"
                        >
                          {reassigningGiftId === gift.id ? 'Đang đổi...' : 'Đổi sang cơ sở đã chọn'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  {!isGiftActive(gift) && (
                    <div className="mb-3 text-sm text-red-600">Quà này đang tạm ẩn nên chưa thể đăng ký.</div>
                  )}

                  {storeScope.isMessageStoreMissing && (
                    <div className="mb-3 text-sm text-yellow-700">
                      {storeScope.isMessageGift
                        ? 'Tin nhắn này chưa có danh sách cơ sở nhận quà nên chưa thể đăng ký.'
                        : 'Quà này chưa được cấu hình cơ sở nhận nên chưa thể đăng ký.'}
                    </div>
                  )}

                  {selectedAllocation && (
                    <div className="mb-3 text-sm text-gray-600">
                      Cơ sở đã chọn còn <strong>{selectedAllocation.availableQuantity}</strong>/
                      <strong>{selectedAllocation.totalQuantity}</strong> quà.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleClaimGift(gift)}
                    disabled={!canClaim || claimingGiftId === gift.id}
                    className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {claimingGiftId === gift.id
                      ? 'Đang xử lý...'
                      : storeScope.isMessageStoreMissing
                        ? 'Chưa cấu hình cơ sở nhận'
                        : selectedAllocation?.availableQuantity
                        ? 'Đăng ký nhận quà'
                        : 'Hết lượt đăng ký'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeModal && (
        <GiftQRModal
          qrCode={activeModal.qrCode}
          giftName={activeModal.gift.name}
          giftId={activeModal.gift.id}
          gift={activeModal.gift}
          assignment={activeModal.assignment}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
};

export default GiftClaimSection;
