# Hướng dẫn sửa app nhận quà: đăng ký giữ lượt và sử dụng QR

## 1) Mục tiêu

App khách cần hiểu đúng 2 trạng thái khác nhau của một phần quà:

1. Khách đăng ký nhận quà: hệ thống giữ lượt cho khách.
2. Khách sử dụng quà: QR được redeem tại cơ sở.

Vì vậy số lượng trên app phải giảm ngay khi khách đăng ký, không đợi tới lúc khách dùng QR.

---

## 2) Ý nghĩa các field số lượng

Mỗi quà theo từng cơ sở có cấu trúc:

```ts
interface GiftStoreAllocation {
  storeId: string;
  storeName: string;
  totalQuantity: number;
  availableQuantity: number;
  assignedCount: number;
  usedQuantity: number;
}
```

Ý nghĩa:

```ts
totalQuantity      // Tổng số quà cấu hình cho cơ sở
availableQuantity  // Số lượt còn được đăng ký
assignedCount      // Số người đã đăng ký / giữ lượt
usedQuantity       // Số người đã dùng quà thật qua QR / redeem
```

Quy ước quan trọng:

- `availableQuantity` là số còn để cho khách đăng ký.
- `assignedCount` tăng khi khách đăng ký.
- `usedQuantity` chỉ tăng khi QR được redeem.
- Không tính số còn bằng `totalQuantity - usedQuantity`.

---

## 3) Luồng đúng

Ví dụ cơ sở có 30 quà:

```txt
Ban đầu:
totalQuantity = 30
availableQuantity = 30
assignedCount = 0
usedQuantity = 0
```

Khi 10 khách đăng ký:

```txt
totalQuantity = 30
availableQuantity = 20
assignedCount = 10
usedQuantity = 0
```

Khi 5 trong 10 khách đã dùng QR:

```txt
totalQuantity = 30
availableQuantity = 20
assignedCount = 10
usedQuantity = 5
```

Điểm cần nhớ:

- Đăng ký làm giảm `availableQuantity`.
- Redeem QR không làm giảm `availableQuantity` nữa.
- Redeem QR chỉ tăng `usedQuantity`.

---

## 4) Điều kiện hiển thị trên app

Khi app render một quà cho một cơ sở, lấy allocation như sau:

```ts
const allocation = gift.storeAllocations?.find(
  (item) => item.storeId === selectedStoreId,
);
```

Sau đó lấy số lượng:

```ts
const totalQuantity = allocation?.totalQuantity ?? 0;
const availableQuantity = allocation?.availableQuantity ?? 0;
const assignedCount = allocation?.assignedCount ?? 0;
const usedQuantity = allocation?.usedQuantity ?? 0;
```

Hiển thị đề xuất:

```txt
Còn 20/30 quà
Đã đăng ký: 10
Đã sử dụng: 5
```

Nếu không muốn hiển thị đủ 3 dòng, tối thiểu phải hiển thị:

```txt
Còn 20/30 quà
```

Trong đó `20` bắt buộc lấy từ `availableQuantity`.

---

## 5) Điều kiện enable / disable nút đăng ký

Chỉ cho đăng ký khi:

```ts
const canRegister =
  Boolean(allocation) &&
  availableQuantity > 0 &&
  gift.isActive !== false &&
  !existingAssignment;
```

Nút UI:

```ts
button.disabled = !canRegister;
button.text = canRegister ? 'Đăng ký nhận quà' : 'Hết lượt đăng ký';
```

Nếu khách đã đăng ký rồi:

```ts
button.disabled = false;
button.text = 'Xem QR';
```

Không được cho đăng ký dựa trên:

```ts
usedQuantity < totalQuantity
```

Điều kiện này sai vì có thể tất cả quà đã được đăng ký nhưng chưa ai sử dụng.

---

## 6) Payload đăng ký quà

Khi khách bấm đăng ký, app gửi payload tối thiểu:

```json
{
  "giftId": "gift_id",
  "userId": "user_id",
  "storeId": "store_id",
  "storeName": "Tên cơ sở"
}
```

Nếu quà đến từ tin nhắn có `related_gifts`, `storeId` và `storeName` phải lấy từ chính item đó:

```ts
const payload = {
  giftId: relatedGift.id,
  userId: currentUser.id,
  storeId: relatedGift.storeId,
  storeName: relatedGift.storeName,
};
```

Không tự đoán cơ sở.

Không bỏ trống `storeId`.

---

## 7) Sau khi đăng ký thành công

Backend/admin hiện áp dụng logic:

```ts
availableQuantity -= 1;
assignedCount += 1;
```

App nên xử lý response như sau:

1. Lưu assignment trả về.
2. Hiển thị trạng thái đã đăng ký.
3. Hiển thị nút `Xem QR`.
4. Refetch lại gift/detail/message để lấy số lượng mới nhất.

Ví dụ:

```ts
const assignment = await assignGift(payload);

setCurrentAssignment(assignment);
await refetchGiftDetail();
```

Có thể optimistic UI, nhưng không được chỉ dựa vào local state lâu dài. Sau API success nên refetch.

---

## 8) Chặn đăng ký trùng

App cần kiểm tra khách đã có assignment trong chu kỳ hiện tại chưa.

Ví dụ:

```ts
const existingAssignment = assignments.find(
  (item) =>
    item.giftId === gift.id &&
    item.userId === currentUser.id &&
    item.status === 'assigned',
);
```

Nếu có `existingAssignment`:

- không hiện nút đăng ký mới
- hiện card trạng thái `Bạn đã đăng ký quà trong chu kỳ hiện tại`
- hiện nút `Xem QR`

Gợi ý UI:

```txt
Bạn đã đăng ký quà trong chu kỳ hiện tại
Cơ sở sẽ hiển thị sau khi backend trả dữ liệu đầy đủ.
[Xem QR]
```

---

## 9) Lấy QR sau khi đã đăng ký

Khi có `assignmentId`, gọi API lấy QR:

```http
GET /gifts/qr/:assignmentId
```

Response kỳ vọng:

```ts
interface GiftAssignmentQRResponse {
  assignmentId: string;
  status: 'assigned' | 'redeemed';
  qrTarget: string;
  qrCode?: string;
}
```

UI:

- Nếu `status === 'assigned'`: hiển thị QR để dùng.
- Nếu `status === 'redeemed'`: hiển thị `Đã sử dụng`.

---

## 10) Payload redeem QR

Khi QR được sử dụng, backend hoặc app scan QR gọi redeem:

```json
{
  "assignmentId": "assignment_id",
  "giftId": "gift_id",
  "userId": "user_id"
}
```

Sau redeem thành công, hệ thống chỉ tăng:

```ts
usedQuantity += 1;
```

Không trừ:

```ts
availableQuantity -= 1;
```

Lý do: `availableQuantity` đã bị trừ từ lúc khách đăng ký.

---

## 11) Những lỗi không được mắc

### 11.1 Không tính số còn bằng `totalQuantity - usedQuantity`

Sai:

```ts
const remaining = allocation.totalQuantity - allocation.usedQuantity;
```

Đúng:

```ts
const remaining = allocation.availableQuantity;
```

### 11.2 Không trừ `availableQuantity` ở bước redeem

Sai:

```ts
// Khi redeem QR
availableQuantity -= 1;
usedQuantity += 1;
```

Đúng:

```ts
// Khi redeem QR
usedQuantity += 1;
```

### 11.3 Không cho đăng ký khi `usedQuantity < totalQuantity`

Sai:

```ts
const canRegister = allocation.usedQuantity < allocation.totalQuantity;
```

Đúng:

```ts
const canRegister = allocation.availableQuantity > 0;
```

### 11.4 Không bỏ qua `storeId`

Sai:

```ts
await assignGift({
  giftId,
  userId,
});
```

Đúng:

```ts
await assignGift({
  giftId,
  userId,
  storeId,
  storeName,
});
```

---

## 12) Contract type nên dùng ở app

```ts
interface GiftUserSummary {
  assignmentId?: string;
  userId: string;
  name?: string;
  phone?: string;
  storeId?: string;
  storeName?: string;
  assignedAt?: string;
  redeemedAt?: string;
}

interface GiftStoreAllocation {
  storeId: string;
  storeName: string;
  totalQuantity: number;
  availableQuantity: number;
  assignedCount: number;
  usedQuantity: number;
}

interface Gift {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  storeAllocations?: GiftStoreAllocation[];
  totalQuantity: number;
  availableQuantity: number;
  assignedCount: number;
  usedQuantity: number;
  assignedUsers?: GiftUserSummary[];
  redeemedUsers?: GiftUserSummary[];
}

interface AssignGiftPayload {
  giftId: string;
  userId: string;
  storeId: string;
  storeName?: string;
}

interface GiftAssignment {
  assignmentId: string;
  giftId: string;
  userId: string;
  status: 'assigned' | 'redeemed';
  assignedAt: string;
  redeemedAt?: string;
  qrTarget: string;
  qrCode?: string;
  metadata?: {
    storeId?: string;
    storeName?: string;
    [key: string]: any;
  };
}
```

---

## 13) Pseudocode màn chọn quà

```ts
function getGiftState(gift: Gift, selectedStoreId: string, existingAssignment?: GiftAssignment) {
  const allocation = gift.storeAllocations?.find(
    (item) => item.storeId === selectedStoreId,
  );

  const availableQuantity = allocation?.availableQuantity ?? 0;
  const totalQuantity = allocation?.totalQuantity ?? 0;
  const isActive = gift.isActive !== false;
  const hasRegistered = Boolean(existingAssignment);

  return {
    allocation,
    totalQuantity,
    availableQuantity,
    hasRegistered,
    canRegister: Boolean(allocation) && isActive && availableQuantity > 0 && !hasRegistered,
    statusText: hasRegistered
      ? 'Bạn đã đăng ký quà trong chu kỳ hiện tại'
      : availableQuantity > 0
        ? 'Còn quà'
        : 'Hết lượt đăng ký',
  };
}
```

Render:

```tsx
const state = getGiftState(gift, selectedStoreId, existingAssignment);

return (
  <View>
    <Text>{gift.name}</Text>
    <Text>Còn {state.availableQuantity}/{state.totalQuantity} quà</Text>

    {state.hasRegistered ? (
      <Button title="Xem QR" onPress={openQR} />
    ) : (
      <Button
        title="Đăng ký nhận quà"
        disabled={!state.canRegister}
        onPress={registerGift}
      />
    )}
  </View>
);
```

---

## 14) Pseudocode đăng ký quà

```ts
async function registerGift(gift: Gift, selectedStoreId: string) {
  const allocation = gift.storeAllocations?.find(
    (item) => item.storeId === selectedStoreId,
  );

  if (!allocation) {
    throw new Error('Quà chưa được phân bổ cho cơ sở này');
  }

  if (allocation.availableQuantity <= 0) {
    throw new Error('Cơ sở này đã hết lượt đăng ký quà');
  }

  const assignment = await api.assignGift({
    giftId: gift.id,
    userId: currentUser.id,
    storeId: allocation.storeId,
    storeName: allocation.storeName,
  });

  setCurrentAssignment(assignment);
  await refetchGiftDetail(gift.id);
}
```

---

## 15) Pseudocode redeem QR

```ts
async function redeemGift(assignment: GiftAssignment) {
  const result = await api.redeemGift({
    assignmentId: assignment.assignmentId,
    giftId: assignment.giftId,
    userId: assignment.userId,
  });

  await refetchGiftDetail(assignment.giftId);
  return result;
}
```

Backend/admin sẽ tăng `usedQuantity`.

App không tự trừ `availableQuantity` ở đây.

---

## 16) Checklist test cho app

### A. Đăng ký giữ lượt

1. Cơ sở có `totalQuantity = 30`, `availableQuantity = 30`.
2. User A đăng ký.
3. App reload.
4. Kỳ vọng:
   - `availableQuantity = 29`
   - `assignedCount = 1`
   - `usedQuantity = 0`
   - User A thấy nút `Xem QR`

### B. Chặn khi hết lượt đăng ký

1. Cấu hình cơ sở có `totalQuantity = 1`.
2. User A đăng ký thành công.
3. User B mở app.
4. Kỳ vọng:
   - app hiển thị hết lượt
   - nút đăng ký disabled

### C. Redeem QR

1. User A đã đăng ký.
2. Scan QR và redeem.
3. App reload.
4. Kỳ vọng:
   - `availableQuantity` không đổi so với sau đăng ký
   - `assignedCount` không đổi
   - `usedQuantity` tăng 1
   - QR/status của User A là `redeemed`

### D. Không tính sai số còn

1. Cơ sở có 30 quà.
2. 30 khách đăng ký nhưng chưa ai dùng.
3. Kỳ vọng:
   - `availableQuantity = 0`
   - `usedQuantity = 0`
   - app vẫn phải disable đăng ký

Nếu app tính bằng `totalQuantity - usedQuantity`, case này sẽ sai.

---

## 17) Tóm tắt ngắn gửi dev app

Sửa app để coi `availableQuantity` là số lượt còn đăng ký. Khi khách đăng ký thành công, backend/admin giảm `availableQuantity` và tăng `assignedCount`. Khi QR được redeem, backend/admin chỉ tăng `usedQuantity`, không giảm `availableQuantity` nữa. UI phải disable đăng ký khi `availableQuantity <= 0`, không dùng `totalQuantity - usedQuantity` để tính số còn.
