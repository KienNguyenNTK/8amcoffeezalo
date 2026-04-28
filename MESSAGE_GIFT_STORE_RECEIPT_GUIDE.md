# Hướng dẫn cho app nhận tin nhắn: nhận quà theo cơ sở

## 1) Mục tiêu

Tin nhắn trong hệ thống hiện có thể gắn quà tặng kèm cơ sở nhận quà cụ thể.

Điều này có nghĩa là:

- một tin nhắn có thể chứa nhiều quà
- mỗi quà có thể đi kèm `storeId` và `storeName`
- app nhận tin nhắn phải hiểu rằng khách chỉ được nhận quà đó tại cơ sở đã được chọn trong tin nhắn

---

## 2) Dữ liệu mới trong `related_gifts`

Trước đây `related_gifts` chỉ là danh sách quà.

Bây giờ mỗi phần tử có thể có thêm:

- `storeId`
- `storeName`

Cấu trúc nên hiểu ở app nhận:

```ts
interface RelatedGiftMessageItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  totalQuantity: number;
  availableQuantity: number;
  assignedCount: number;
  usedQuantity: number;
  storeAllocations?: Array<{
    storeId: string;
    storeName: string;
    totalQuantity: number;
    availableQuantity: number;
    assignedCount: number;
    usedQuantity: number;
  }>;
  storeId?: string;
  storeName?: string;
}
```

Ví dụ payload trong một message:

```json
{
  "related_gifts": [
    {
      "id": "gift_cold_brew",
      "name": "Cold brew",
      "availableQuantity": 80,
      "storeId": "store_241_xuan_thuy",
      "storeName": "241 Xuân Thủy"
    },
    {
      "id": "gift_voucher_20",
      "name": "Voucher giảm giá",
      "availableQuantity": 30,
      "storeId": "store_34_tang_bat_ho",
      "storeName": "34 Tăng Bạt Hổ"
    }
  ]
}
```

---

## 3) Ý nghĩa nghiệp vụ

Nếu một quà trong tin nhắn có:

- `storeId = A`
- `storeName = Cơ sở A`

thì app nhận tin nhắn phải hiểu:

- khách chỉ được nhận quà này tại `Cơ sở A`
- không tự cho đổi sang cơ sở khác
- khi tạo yêu cầu nhận quà hoặc gọi API gán quà, phải truyền đúng `storeId = A`

---

## 4) Rule hiển thị trên app nhận tin nhắn

Khi render một quà trong nội dung tin nhắn, nên hiển thị:

1. tên quà
2. ảnh quà nếu có
3. mô tả nếu có
4. cơ sở nhận quà

Ví dụ hiển thị:

- `Cold brew`
- `Nhận tại: 241 Xuân Thủy`

Nếu có nhiều quà trong một tin nhắn, mỗi quà phải hiển thị cơ sở riêng của nó.

Không nên chỉ hiển thị một cơ sở chung cho toàn bộ tin nhắn nếu payload đang gắn cơ sở theo từng quà.

---

## 5) Rule enable / disable nút nhận quà

## 5.1 Cho phép nhận

Cho phép user bấm nhận khi:

- quà có `id`
- quà có `storeId`
- quà đang còn hiệu lực trong hệ thống backend/Firebase
- quà chưa bị ẩn
- cơ sở được chọn trong tin nhắn vẫn còn tồn

## 5.2 Không cho nhận

Không cho user nhận nếu:

- thiếu `storeId`
- quà đã bị ẩn
- quà không còn tồn ở cơ sở đó
- quà không còn hợp lệ trên backend

Thông báo nên rõ nguyên nhân, ví dụ:

- `Quà này chưa được cấu hình cơ sở nhận`
- `Quà hiện đang tạm ẩn`
- `Cơ sở này đã hết quà`

---

## 6) Luồng nhận quà đề xuất ở app nhận tin nhắn

## Bước 1: User mở tin nhắn

App đọc `related_gifts`.

## Bước 2: Render từng quà

Mỗi quà hiển thị:

- tên
- ảnh
- cơ sở nhận
- nút `Nhận quà` hoặc `Xem chi tiết`

## Bước 3: Khi user bấm nhận

App gọi API hoặc service nhận/gán quà với tối thiểu:

```json
{
  "giftId": "gift_cold_brew",
  "userId": "user_123",
  "storeId": "store_241_xuan_thuy",
  "storeName": "241 Xuân Thủy"
}
```

Quan trọng:

- `storeId` phải lấy từ chính `related_gifts[n].storeId`
- không dùng cơ sở do user tự chọn lại, trừ khi business thay đổi

## Bước 4: Nhận phản hồi

Nếu thành công:

- hiện thông báo nhận thành công
- nếu có QR hoặc mã đổi quà thì hiển thị tiếp

Nếu thất bại:

- hiển thị message lỗi từ backend nếu có
- fallback sang message nghiệp vụ dễ hiểu

---

## 7) Nếu app nhận muốn cho user xem nhiều cơ sở

Hiện tại luồng admin đã chốt:

- trong message, mỗi quà đã gắn sẵn đúng 1 cơ sở

Nên app nhận không cần cho user đổi cơ sở.

Nếu sau này muốn cho đổi cơ sở trên app nhận, phải đổi business rule và admin flow vì hiện tại dữ liệu message đang dùng để chỉ định sẵn nơi nhận.

---

## 8) Rule fallback dữ liệu cũ

Có thể tồn tại tin nhắn cũ mà `related_gifts` chưa có:

- `storeId`
- `storeName`

Khi gặp dữ liệu cũ, app nhận nên:

1. coi đây là message chưa hỗ trợ nhận theo cơ sở
2. ẩn nút nhận quà hoặc chuyển sang trạng thái chỉ xem
3. hiện thông báo:
   - `Tin nhắn này chưa cấu hình cơ sở nhận quà`

Không nên tự đoán cơ sở.

---

## 9) Checklist cho app nhận

App nhận cần làm đủ các phần sau:

1. Parse `related_gifts` có thêm `storeId/storeName`.
2. Hiển thị cơ sở nhận quà trong UI.
3. Chỉ cho bấm nhận khi có `storeId`.
4. Khi gọi API nhận quà, truyền đúng `giftId + userId + storeId + storeName`.
5. Xử lý lỗi khi quà bị ẩn hoặc cơ sở hết tồn.
6. Xử lý fallback cho message cũ chưa có `storeId`.

---

## 10) Tóm tắt ngắn gửi cho team app nhận

Từ nay mỗi quà trong `related_gifts` của message có thể đi kèm:

- `storeId`
- `storeName`

App nhận phải:

- hiển thị đúng cơ sở nhận quà
- dùng đúng `storeId` đó khi tạo yêu cầu nhận quà
- không cho nhận nếu thiếu `storeId`
- hỗ trợ fallback cho message cũ chưa có cấu hình cơ sở
