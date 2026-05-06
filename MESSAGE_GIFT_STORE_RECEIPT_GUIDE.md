# Hướng dẫn cho app nhận tin nhắn: nhận quà với cơ sở gợi ý

## 1) Mục tiêu

Tin nhắn trong hệ thống hiện có thể gắn quà tặng kèm cơ sở nhận quà gợi ý.

Điều này có nghĩa là:

- một tin nhắn có thể chứa nhiều quà
- mỗi quà có thể đi kèm `storeId` và `storeName`
- app nhận tin nhắn có thể dùng cơ sở này làm mặc định ban đầu, nhưng vẫn phải cho khách chọn các cơ sở khác còn lượt

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

- `Cơ sở A` là gợi ý hoặc mặc định ban đầu nếu cơ sở đó còn trong `storeAllocations`
- khách vẫn được đổi sang cơ sở khác nếu quà còn lượt ở cơ sở khác
- khi tạo yêu cầu nhận quà hoặc gọi API gán quà, phải truyền đúng `storeId` mà khách đang chọn

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

- nếu user chưa đổi lựa chọn, app có thể mặc định theo `related_gifts[n].storeId`
- nếu user đã chọn cơ sở khác, payload phải lấy theo cơ sở đang chọn thực tế

## Bước 4: Nhận phản hồi

Nếu thành công:

- hiện thông báo nhận thành công
- nếu có QR hoặc mã đổi quà thì hiển thị tiếp

Nếu thất bại:

- hiển thị message lỗi từ backend nếu có
- fallback sang message nghiệp vụ dễ hiểu

---

## 7) Nếu app nhận muốn cho user xem nhiều cơ sở

Hiện tại app nhận phải cho user xem và chọn nhiều cơ sở ngay trên màn quà nếu `storeAllocations` có nhiều cơ sở.

`storeId/storeName` trong message chỉ là dữ liệu gợi ý để:

- preselect cơ sở ban đầu
- hiển thị thông tin tham khảo trong UI

Không còn là khóa cứng để chặn user đổi cơ sở.

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
2. Hiển thị danh sách cơ sở nhận quà trong UI khi có `storeAllocations`.
3. Dùng `storeId` trong message làm mặc định nếu hợp lệ, không khóa cứng.
4. Khi gọi API nhận quà, truyền đúng `giftId + userId + storeId + storeName` theo cơ sở đang chọn.
5. Hỗ trợ thao tác đổi cơ sở sau khi đã đăng ký nếu assignment còn `assigned`.
6. Xử lý lỗi khi quà bị ẩn hoặc cơ sở hết tồn.
7. Xử lý fallback cho message cũ chưa có `storeAllocations`.

---

## 10) Tóm tắt ngắn gửi cho team app nhận

Từ nay mỗi quà trong `related_gifts` của message có thể đi kèm:

- `storeId`
- `storeName`

App nhận phải:

- hiển thị danh sách cơ sở khả dụng nếu có `storeAllocations`
- có thể dùng `storeId` đó làm lựa chọn mặc định ban đầu
- dùng đúng cơ sở user đang chọn khi tạo yêu cầu nhận quà hoặc đổi cơ sở
- không cho nhận nếu không có cơ sở khả dụng
- hỗ trợ fallback cho message cũ chưa có cấu hình cơ sở
