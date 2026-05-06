# Hướng dẫn backend: đổi cơ sở nhận quà (`POST /api/gifts/reassign`)

## 1) Kết luận trước

Không nên để Zalo Mini App tự ghi Firebase để đổi cơ sở nhận quà.

Lý do:

1. Đây là mutation nhiều bước, phải cập nhật **đồng thời**:
   - `giftAssignments/{assignmentId}`
   - `gifts/{giftId}.storeAllocations`
   - các field tổng hợp ở cấp `gift`
2. Nếu app client tự ghi:
   - rất dễ bị race condition khi nhiều user đổi/gán cùng lúc
   - dễ lệch số giữa assignment và allocation
   - khó khóa rule nghiệp vụ như `assigned/redeemed/expired`
   - lộ quyền ghi Firestore không an toàn
3. Frontend hiện đang dùng API `assign/redeem/check-status/assignments`, nên `reassign` cũng phải nằm cùng tầng backend để giữ một nguồn sự thật.

Kết luận:

- frontend chỉ nên gọi `POST /api/gifts/reassign`
- backend phải xử lý transaction và reconcile số lượng

---

## 2) Mục tiêu endpoint

Endpoint mới:

```http
POST /api/gifts/reassign
```

Mục tiêu:

- chuyển 1 assignment đang `assigned` từ cơ sở cũ sang cơ sở mới
- trừ/tăng lại số lượng theo cơ sở
- cập nhật assignment trả về cho app

Không dùng endpoint này cho:

- assignment đã `redeemed`
- assignment đã `expired`
- assignment không xác định được cơ sở cũ

---

## 3) Contract request/response

## 3.1 Request

```json
{
  "assignmentId": "assignment_123",
  "giftId": "gift_cold_brew",
  "userId": "user_abc",
  "fromStoreId": "store_old",
  "toStoreId": "store_new",
  "toStoreName": "241 Xuân Thủy",
  "metadata": {
    "source": "message",
    "messageId": "msg_001"
  }
}
```

## 3.2 Response thành công

```json
{
  "assignmentId": "assignment_123",
  "giftId": "gift_cold_brew",
  "userId": "user_abc",
  "storeId": "store_new",
  "storeName": "241 Xuân Thủy",
  "status": "assigned",
  "assignedAt": "2026-05-06T08:00:00.000Z",
  "expiresAt": "2026-05-06T17:00:00.000Z",
  "metadata": {
    "source": "message",
    "messageId": "msg_001",
    "storeId": "store_new",
    "storeName": "241 Xuân Thủy",
    "reassignedFromStoreId": "store_old",
    "reassignedAt": "2026-05-06T09:15:00.000Z"
  }
}
```

## 3.3 Status code đề xuất

- `200`: đổi cơ sở thành công
- `400`: thiếu field hoặc payload sai
- `404`: không tìm thấy assignment hoặc gift
- `409`: assignment không hợp lệ để đổi, hoặc cơ sở mới hết lượt
- `500`: lỗi hệ thống

---

## 4) Rule nghiệp vụ bắt buộc

Khi xử lý `reassign`, backend phải kiểm tra:

1. `assignmentId`, `giftId`, `userId`, `fromStoreId`, `toStoreId` là bắt buộc.
2. Assignment phải tồn tại.
3. Assignment phải thuộc đúng `giftId` và `userId`.
4. Assignment phải đang `status = assigned`.
5. `fromStoreId !== toStoreId`.
6. Gift phải tồn tại.
7. Gift phải có `storeAllocations`.
8. Cả cơ sở cũ và cơ sở mới phải có trong `storeAllocations`.
9. Cơ sở mới phải còn chỗ theo công thức chuẩn:

```txt
availableQuantity = totalQuantity - assignedCount - usedQuantity
```

10. Nếu số đang lưu trong `gift.storeAllocations` có nguy cơ lệch, phải reconcile từ `giftAssignments` trước khi kiểm tra còn chỗ.

---

## 5) Nguồn sự thật

Chuẩn backend phải dùng:

1. `giftAssignments` là nguồn sự thật cho từng lượt.
2. `gifts.storeAllocations` là dữ liệu tổng hợp.
3. Trước khi mutate, nên reconcile lại allocation từ assignments hiện tại nếu hệ thống chưa đảm bảo số tổng hợp luôn đúng.

---

## 6) Công thức chuẩn

Với mỗi cơ sở:

```txt
assignedCount = số assignment status = assigned
usedQuantity = số assignment status = redeemed
availableQuantity = totalQuantity - assignedCount - usedQuantity
```

Khi đổi cơ sở cho một assignment đang `assigned`:

- cơ sở cũ:
  - `assignedCount - 1`
  - `usedQuantity` giữ nguyên
  - `availableQuantity + 1`
- cơ sở mới:
  - `assignedCount + 1`
  - `usedQuantity` giữ nguyên
  - `availableQuantity - 1`

Nếu dùng flow reconcile toàn bộ từ assignments sau update, không cần tự cộng/trừ tay nhiều nơi.

---

## 7) Cách làm an toàn nhất

Khuyến nghị backend làm theo flow này:

1. Mở transaction.
2. Đọc:
   - `giftAssignments/{assignmentId}`
   - `gifts/{giftId}`
3. Query toàn bộ `giftAssignments` của `giftId`.
4. Reconcile lại allocation từ danh sách assignments hiện tại.
5. Kiểm tra cơ sở mới còn chỗ không.
6. Update assignment sang `toStoreId/toStoreName`.
7. Reconcile lại allocation một lần nữa trên snapshot mới.
8. Ghi lại `gifts/{giftId}` với `storeAllocations` mới và các total mới.
9. Commit transaction.

Không khuyến nghị:

- chỉ update `assignment.storeId`
- chỉ cộng/trừ allocation bằng patch rời rạc mà không có transaction

---

## 8) Helper reconcile nên có ở backend

```ts
interface GiftStoreAllocation {
  storeId: string;
  storeName: string;
  totalQuantity: number;
  availableQuantity: number;
  assignedCount: number;
  usedQuantity: number;
}

function reconcileGiftCountsFromAssignments(gift, assignments) {
  const allocationMap = new Map();

  (gift.storeAllocations || []).forEach((allocation) => {
    allocationMap.set(allocation.storeId, {
      ...allocation,
      assignedCount: 0,
      usedQuantity: 0,
    });
  });

  assignments.forEach((assignment) => {
    const storeId = assignment.storeId || assignment.metadata?.storeId;
    const allocation = storeId ? allocationMap.get(storeId) : undefined;
    if (!allocation) return;

    if (assignment.status === 'redeemed') {
      allocation.usedQuantity += 1;
      return;
    }

    if (assignment.status === 'assigned') {
      allocation.assignedCount += 1;
    }
  });

  const storeAllocations = Array.from(allocationMap.values()).map((allocation) => ({
    ...allocation,
    availableQuantity: Math.max(
      0,
      allocation.totalQuantity - allocation.assignedCount - allocation.usedQuantity
    ),
  }));

  const totalQuantity = storeAllocations.reduce((sum, item) => sum + item.totalQuantity, 0);
  const availableQuantity = storeAllocations.reduce((sum, item) => sum + item.availableQuantity, 0);
  const assignedCount = storeAllocations.reduce((sum, item) => sum + item.assignedCount, 0);
  const usedQuantity = storeAllocations.reduce((sum, item) => sum + item.usedQuantity, 0);

  return {
    ...gift,
    storeAllocations,
    totalQuantity,
    availableQuantity,
    assignedCount,
    usedQuantity,
  };
}
```

---

## 9) Pseudocode endpoint

```ts
router.post('/reassign', async (req, res) => {
  const {
    assignmentId,
    giftId,
    userId,
    fromStoreId,
    toStoreId,
    toStoreName,
    metadata,
  } = req.body || {};

  if (!assignmentId || !giftId || !userId || !fromStoreId || !toStoreId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (fromStoreId === toStoreId) {
    return res.status(409).json({ message: 'Assignment is already at this store' });
  }

  try {
    const result = await db.runTransaction(async (tx) => {
      const assignmentRef = db.collection('giftAssignments').doc(assignmentId);
      const giftRef = db.collection('gifts').doc(giftId);

      const [assignmentSnap, giftSnap] = await Promise.all([
        tx.get(assignmentRef),
        tx.get(giftRef),
      ]);

      if (!assignmentSnap.exists) {
        throw createHttpError(404, 'Assignment not found');
      }

      if (!giftSnap.exists) {
        throw createHttpError(404, 'Gift not found');
      }

      const assignment = { id: assignmentSnap.id, ...assignmentSnap.data() };
      const gift = { id: giftSnap.id, ...giftSnap.data() };

      if (assignment.giftId !== giftId || assignment.userId !== userId) {
        throw createHttpError(409, 'Assignment does not match gift or user');
      }

      if (assignment.status !== 'assigned') {
        throw createHttpError(409, 'Only assigned gifts can be moved');
      }

      const currentStoreId = assignment.storeId || assignment.metadata?.storeId;
      if (currentStoreId !== fromStoreId) {
        throw createHttpError(409, 'Current store mismatch');
      }

      const assignmentQuery = await tx.get(
        db.collection('giftAssignments').where('giftId', '==', giftId)
      );

      const assignments = assignmentQuery.docs.map((doc) => ({
        assignmentId: doc.id,
        ...doc.data(),
      }));

      const reconciledBefore = reconcileGiftCountsFromAssignments(gift, assignments);
      const nextStore = (reconciledBefore.storeAllocations || []).find((item) => item.storeId === toStoreId);

      if (!nextStore) {
        throw createHttpError(409, 'Target store is not configured for this gift');
      }

      if (nextStore.availableQuantity <= 0) {
        throw createHttpError(409, 'Target store has no remaining capacity');
      }

      const now = new Date().toISOString();
      const nextAssignment = {
        ...assignment,
        storeId: toStoreId,
        storeName: toStoreName || nextStore.storeName,
        metadata: {
          ...(assignment.metadata || {}),
          ...(metadata || {}),
          storeId: toStoreId,
          storeName: toStoreName || nextStore.storeName,
          reassignedFromStoreId: fromStoreId,
          reassignedAt: now,
        },
        updatedAt: now,
      };

      tx.update(assignmentRef, {
        storeId: nextAssignment.storeId,
        storeName: nextAssignment.storeName,
        metadata: nextAssignment.metadata,
        updatedAt: now,
      });

      const assignmentsAfter = assignments.map((item) =>
        item.assignmentId === assignmentId ? nextAssignment : item
      );

      const reconciledAfter = reconcileGiftCountsFromAssignments(gift, assignmentsAfter as any[]);

      tx.update(giftRef, {
        storeAllocations: reconciledAfter.storeAllocations,
        totalQuantity: reconciledAfter.totalQuantity,
        availableQuantity: reconciledAfter.availableQuantity,
        assignedCount: reconciledAfter.assignedCount,
        usedQuantity: reconciledAfter.usedQuantity,
        updatedAt: now,
      });

      return nextAssignment;
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || 'Failed to reassign gift',
    });
  }
});
```

---

## 10) Nếu backend đang dùng Firebase Admin + Express

Checklist tối thiểu:

1. Có quyền ghi `gifts` và `giftAssignments`.
2. Endpoint `POST /api/gifts/reassign` nằm cùng module với `assign/redeem/check-status`.
3. Có helper `createHttpError(status, message)`.
4. Có helper reconcile dùng chung cho:
   - `assign`
   - `reassign`
   - `redeem`
   - `delete assignment`

Nếu hiện tại `assign` và `redeem` vẫn đang patch số lượng bằng tay, nên refactor cùng lúc sang một helper reconcile dùng chung để tránh lệch số sau này.

---

## 11) Test cases backend bắt buộc

## Case A: đổi cơ sở thành công

Input:

- assignment đang `assigned` ở store A
- store B còn `availableQuantity > 0`

Expected:

- assignment đổi sang store B
- store A giảm `assignedCount` 1
- store B tăng `assignedCount` 1
- `usedQuantity` hai bên giữ nguyên

## Case B: cơ sở mới hết lượt

Expected:

- trả `409`
- assignment không đổi
- allocation không đổi

## Case C: assignment đã redeemed

Expected:

- trả `409`
- không cho đổi

## Case D: assignment hết hạn

Expected:

- trả `409`
- không cho đổi

## Case E: request gửi sai `fromStoreId`

Expected:

- trả `409`
- không update nhầm assignment

## Case F: số tổng hợp đang lệch

Input:

- `gift.storeAllocations` lưu sai
- `giftAssignments` mới là dữ liệu đúng

Expected:

- endpoint vẫn reconcile đúng từ assignments
- sau mutation, số lưu lại ở `gift` trở về đúng

---

## 12) Ảnh hưởng tới frontend hiện tại

Frontend đã gọi:

```http
POST https://api-coffee.8am.vn/api/gifts/reassign
```

Payload frontend hiện đang gửi tương thích với guide này. Sau khi backend triển khai endpoint:

1. frontend không cần sửa thêm contract
2. frontend sẽ refetch lại `gift detail` và `assignments`
3. số lượng từng cơ sở sẽ hiển thị đúng theo dữ liệu reconcile

---

## 13) Kết luận ngắn để handoff cho backend

Muốn đổi cơ sở nhận quà an toàn thì bắt buộc phải làm ở backend, không làm trực tiếp từ Mini App.

Backend cần thêm `POST /api/gifts/reassign` với transaction:

1. validate assignment/gift/store
2. reconcile allocation từ `giftAssignments`
3. kiểm tra cơ sở mới còn chỗ
4. update assignment sang cơ sở mới
5. reconcile lại `gift.storeAllocations`
6. lưu lại totals và trả assignment mới

Nếu chỉ update `storeId` của assignment mà không reconcile `storeAllocations`, số `Đã đăng ký / Đã sử dụng / Còn quà` sẽ tiếp tục lệch.
