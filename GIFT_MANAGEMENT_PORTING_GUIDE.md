# Hướng dẫn chi tiết trang `GiftManagementSection` và hệ thống quà tặng (port sang dự án khác)

## 1) Module quà tặng hiện đang làm gì?

Module quà tặng hiện tại không còn chỉ là CRUD quà đơn giản. Nó đã được mở rộng thành một hệ quản lý quà có các nghiệp vụ sau:

1. Tạo và cập nhật quà tặng.
2. Tạm ẩn quà thay vì xóa.
3. Phân bổ tồn quà theo từng cơ sở.
4. Gán quà cho khách theo đúng cơ sở.
5. Chặn gán khi quà bị ẩn, chưa phân bổ cơ sở, hoặc cơ sở hết tồn.
6. Tự reset tồn quà theo giờ hằng ngày.
7. Sắp xếp danh sách theo trạng thái hoạt động trước, tạm ẩn sau, rồi theo thời gian tạo.

File UI chính:

- `src/components/GiftManagementSection.tsx`

Service chính:

- `src/services/giftService.ts`
- `src/services/storeService.ts`

Type chính:

- `src/types/gift.ts`

Trang có liên quan:

- `src/pages/MessageManagement.tsx`

---

## 2) Những phần đã được thêm mới so với bản quà tặng cũ

### 2.1 Tạm ẩn quà thay vì xóa

Trước đây tư duy là xóa quà. Bây giờ quà có trạng thái:

- `Hoạt động`
- `Tạm ẩn`

Khi quà bị tạm ẩn:

- vẫn giữ nguyên document quà trong Firebase
- vẫn giữ lịch sử dữ liệu cũ
- không cho gán quà mới
- không cho dùng trong các luồng chọn quà mới

Field dùng để điều khiển:

- `isActive?: boolean`

Quy ước:

- `undefined` được coi là `true` để không vỡ dữ liệu cũ

### 2.2 Tồn quà theo từng cơ sở

Thay vì chỉ có `totalQuantity` toàn hệ thống, mỗi quà giờ có tồn theo từng cơ sở.

Field mới:

- `storeAllocations: GiftStoreAllocation[]`

Cấu trúc:

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

- `totalQuantity`: tổng quà được cấp cho cơ sở
- `availableQuantity`: số quà còn có thể gán
- `assignedCount`: số quà đã gán
- `usedQuantity`: số quà đã sử dụng

`totalQuantity` ở cấp quà vẫn còn, nhưng bây giờ là giá trị tổng hợp từ toàn bộ `storeAllocations`.

### 2.3 Gán quà theo cơ sở

Modal gán quà hiện tại bắt buộc phải chọn:

- quà
- khách hàng
- cơ sở

Payload gán quà:

```ts
interface AssignGiftPayload {
  giftId: string;
  userId: string;
  storeId: string;
  storeName?: string;
}
```

Khi gán quà:

1. chọn đúng cơ sở
2. trừ tồn đúng cơ sở đó
3. không ảnh hưởng tồn của cơ sở khác

### 2.4 Reset quà theo giờ hằng ngày

Đây là phần mới nhất.

Mỗi quà có thể bật cấu hình reset tự động theo ngày, ví dụ:

- sau `17:00` mỗi ngày

Khi quá mốc giờ cấu hình:

- `availableQuantity` của từng cơ sở về lại `totalQuantity`
- `assignedCount` về `0`
- `usedQuantity` về `0`
- `assignedUsers` bị xóa về mảng rỗng
- `redeemedUsers` bị xóa về mảng rỗng

Field cấu hình:

```ts
interface GiftResetConfig {
  enabled: boolean;
  dailyResetHour: number;
  dailyResetMinute: number;
  lastResetAt?: string;
}
```

Gắn vào quà:

```ts
interface Gift {
  resetConfig?: GiftResetConfig;
}
```

---

## 3) Kiến trúc dữ liệu hiện tại

## 3.1 Type `Gift`

Type hiện tại nên mang sang dự án mới gần như nguyên trạng:

```ts
interface Gift {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  storeAllocations?: GiftStoreAllocation[];
  resetConfig?: GiftResetConfig;
  totalQuantity: number;
  availableQuantity: number;
  assignedCount: number;
  usedQuantity: number;
  assignedUsers?: GiftUserSummary[];
  redeemedUsers?: GiftUserSummary[];
  createdAt?: string;
  updatedAt?: string;
}
```

## 3.2 Các field tổng hợp

Nhóm field sau không nên cho nhập tay:

- `totalQuantity`
- `availableQuantity`
- `assignedCount`
- `usedQuantity`

Chúng nên được tính từ `storeAllocations`.

## 3.3 Tương thích dữ liệu cũ

Code hiện tại đã xử lý dữ liệu cũ như sau:

- nếu không có `isActive` thì hiểu là đang hoạt động
- nếu chưa có `storeAllocations` thì quà vẫn hiển thị nhưng không gán mới được
- nếu chưa có `resetConfig` thì coi như quà không có reset hằng ngày

---

## 4) Luồng dữ liệu Firebase hiện tại

## 4.1 Nguồn dữ liệu

Collection quà:

- `gifts`

Collection cơ sở:

- đang lấy qua `storeService`, nguồn là `storeLocations`

## 4.2 Gift service đang làm gì

Trong `src/services/giftService.ts` hiện có các nhóm logic chính:

### Chuẩn hóa dữ liệu

- `normalizeStoreAllocation`
- `normalizeStoreAllocations`
- `normalizeResetConfig`
- `normalizeGift`
- `normalizeGiftDoc`

### Tính tổng từ từng cơ sở

- `sumGiftTotals`

### Tạo payload lưu Firestore

- `buildGiftPayload`

Payload này tự tính lại:

- `totalQuantity`
- `availableQuantity`
- `assignedCount`
- `usedQuantity`

### Đồng bộ document quà

- `ensureGiftDocExists`

Hàm này dùng khi Firebase chưa có document nhưng API cũ có dữ liệu.

### Reset theo giờ

Các helper mới:

- `getDailyResetBoundary`
- `shouldResetGiftNow`
- `buildResetGiftData`
- `maybeResetGiftDocument`

### Điểm kích hoạt reset

Reset tự động hiện xảy ra khi:

1. gọi `getGifts()`
2. gọi `getGiftDetail()`
3. gọi `assignGift()` vì trước khi gán sẽ đọc lại quà hiện tại

Điều này giúp:

- mở trang quà là dữ liệu được tự làm mới
- xem chi tiết quà là dữ liệu đúng theo ngày hiện tại
- gán quà không bị dùng tồn cũ sau thời điểm reset

---

## 5) Các thay đổi trong UI quản lý quà

## 5.1 Danh sách quà

Bảng quà hiện có thêm:

- cột trạng thái với `Switch`
- tag `Tạm ẩn`
- tag `Reset HH:mm` nếu quà có bật reset theo giờ
- mở rộng row để xem tồn theo cơ sở

### Thứ tự hiển thị

Danh sách đang sort theo:

1. quà hoạt động trước
2. quà tạm ẩn sau
3. trong cùng nhóm thì `createdAt` mới hơn lên trước
4. nếu thiếu `createdAt` thì fallback theo tên

## 5.2 Modal tạo và sửa quà

Modal quà hiện có các phần:

1. Tên quà
2. Mô tả
3. Tổng số lượng
4. Phân bổ theo cơ sở
5. Reset quà hằng ngày
6. Ảnh minh họa

### Tổng số lượng

`Tổng số lượng` đang là field chỉ đọc, được tính từ tổng các ô số lượng của từng cơ sở.

### Phân bổ theo cơ sở

Mỗi cơ sở có một ô nhập số lượng riêng.

Khi sửa quà:

- nếu tăng số lượng cho cơ sở thì `availableQuantity` tăng tương ứng
- nếu giảm số lượng cho cơ sở thì `availableQuantity` cũng điều chỉnh lại
- dữ liệu cũ của cơ sở vẫn được giữ

### Reset quà hằng ngày

UI mới gồm:

- `Switch` bật/tắt reset
- `TimePicker` chọn giờ reset

Ví dụ:

- bật reset
- chọn `17:00`

Ý nghĩa:

- sau 17:00 mỗi ngày, quà sẽ được reset tồn về mức tối đa

## 5.3 Modal gán quà

Modal gán quà có thêm:

- chọn cơ sở
- bảng tồn theo từng cơ sở để đối chiếu nhanh

Rule chặn:

- quà tạm ẩn: không gán
- quà chưa phân bổ cơ sở: không gán
- cơ sở chưa được cấp quà: không gán
- cơ sở hết tồn: không gán

---

## 6) Nghiệp vụ đang được áp dụng

## 6.1 Rule trạng thái quà

Nếu `isActive === false`:

- quà bị coi là tạm ẩn
- không cho gán mới
- không cho dùng trong các nơi chọn quà mới

Nếu `isActive` là `true` hoặc `undefined`:

- quà được coi là đang hoạt động

## 6.2 Rule tồn theo cơ sở

Mỗi cơ sở có tồn riêng.

Ví dụ:

- Cơ sở A: 50
- Cơ sở B: 30

Nếu khách nhận quà ở cơ sở A:

- A giảm 1
- B giữ nguyên

## 6.3 Rule reset theo giờ

Ví dụ cấu hình:

- `enabled = true`
- `dailyResetHour = 17`
- `dailyResetMinute = 0`

Kịch bản:

1. Trong ngày, quà được gán bình thường.
2. Sau 17:00, lần đọc dữ liệu kế tiếp sẽ trigger reset.
3. Sau reset, từng cơ sở quay về `availableQuantity = totalQuantity`.

### Vai trò của `lastResetAt`

Field này dùng để tránh reset lặp vô hạn trong cùng một ngày.

Ý tưởng:

- nếu hôm nay đã reset sau mốc `17:00`, không reset lại nữa
- sang ngày mới, sau khi lại qua `17:00`, reset tiếp

## 6.4 Rule dữ liệu cũ

Quà cũ chưa có `storeAllocations`:

- vẫn nhìn thấy trong bảng
- vẫn có thể sửa
- không gán mới được cho tới khi phân bổ cơ sở

Quà cũ chưa có `resetConfig`:

- không bị reset tự động

---

## 7) Tích hợp với `MessageManagement`

Trang `MessageManagement` đã được chỉnh để:

- chỉ cho chọn quà đang hoạt động khi gán mới
- vẫn hiển thị quà cũ đã gắn trước đó kể cả khi quà đã tạm ẩn

Ý nghĩa:

- dữ liệu lịch sử không mất
- nhưng nghiệp vụ mới luôn dùng danh sách quà đang hoạt động

Nếu port sang app khác mà có màn hình “chọn quà liên quan”, nên áp dụng rule tương tự.

## 7.1 Pattern chọn cơ sở áp dụng trong `MessageManagement`

Nếu app khác cũng cần chọn cơ sở áp dụng cho tin, chương trình, voucher bundle hoặc quà liên quan, nên copy theo pattern hiện tại trong `MessageManagement.tsx`.

### Tải danh sách cơ sở

```ts
const [availableStores, setAvailableStores] = useState<Store[]>([]);
const [loadingStores, setLoadingStores] = useState(false);

const loadStores = useCallback(async (): Promise<Store[]> => {
  setLoadingStores(true);
  try {
    const stores = await storeService.getActiveStores();
    setAvailableStores(stores);
    return stores;
  } finally {
    setLoadingStores(false);
  }
}, []);
```

Khi mở form hoặc modal thì gọi:

```ts
useEffect(() => {
  if (modalVisible) {
    void loadStores();
  }
}, [modalVisible, loadStores]);
```

### Field chọn cơ sở trong form

```tsx
<Form.Item
  name="storeIds"
  label="Cơ sở áp dụng"
  rules={[{ required: true, message: 'Vui lòng chọn ít nhất một cơ sở' }]}
>
  <Select
    mode="multiple"
    placeholder="Chọn cơ sở áp dụng"
    loading={loadingStores}
    options={availableStores.map((store) => ({
      value: store.id,
      label: store.name,
    }))}
  />
</Form.Item>
```

### Payload khi submit

Khi submit, lấy `values.storeIds` để lưu cả danh sách id và snapshot tên cơ sở:

```ts
const payload = {
  ...values,
  storeIds: values.storeIds || [],
  stores: availableStores
    .filter((store) => values.storeIds?.includes(store.id))
    .map((store) => ({
      id: store.id,
      name: store.name,
    })),
};
```

Nếu app khác là app khách hàng hoặc mobile, backend/Firebase query cần dùng `storeIds` để lọc dữ liệu theo cơ sở người dùng đang chọn. Ví dụ một tin, quà hoặc chương trình chỉ hiện khi:

```ts
item.storeIds?.includes(selectedStoreId)
```

Trong màn hình hiện tại, phần chọn cơ sở cho quà liên quan đang nằm theo từng quà:

```ts
relatedGiftStores[gift.id] = [storeId1, storeId2];
```

Cách này phù hợp khi mỗi quà trong cùng một tin/chương trình có phạm vi cơ sở khác nhau. Nếu app khác không gắn cơ sở theo từng quà mà gắn chung cho toàn bộ tin/chương trình, dùng `storeIds` ở cấp root sẽ đơn giản hơn.

---

## 8) Các bước port sang app khác

## Bước 1: Mang type dữ liệu sang trước

Tối thiểu cần mang:

- `Gift`
- `GiftStoreAllocation`
- `GiftResetConfig`
- `AssignGiftPayload`
- `GiftUserSummary`

## Bước 2: Mang service chuẩn hóa dữ liệu

Nên port nguyên cụm helper sau:

- `normalizeStoreAllocation`
- `normalizeStoreAllocations`
- `normalizeResetConfig`
- `sumGiftTotals`
- `normalizeGift`
- `normalizeGiftDoc`
- `buildGiftPayload`

Nếu bỏ mất cụm này thì rất dễ lệch số liệu giữa UI và Firebase.

## Bước 3: Mang logic reset theo giờ

Bắt buộc giữ:

- `shouldResetGiftNow`
- `buildResetGiftData`
- `maybeResetGiftDocument`

Và nhớ gọi chúng ở:

- `getGifts`
- `getGiftDetail`
- trước khi `assignGift`

## Bước 4: Mang UI phân bổ theo cơ sở

Trong form quà cần có:

- list cơ sở
- ô nhập số lượng cho từng cơ sở
- tổng số lượng tự tính

Không nên quay lại kiểu nhập một `totalQuantity` duy nhất.

## Bước 5: Mang UI reset theo giờ

Trong form quà cần có:

- switch bật/tắt
- time picker

Giá trị khi submit nên map về:

```ts
{
  enabled: boolean,
  dailyResetHour: number,
  dailyResetMinute: number,
  lastResetAt?: string
}
```

## Bước 6: Chỉnh màn gán quà

Modal gán quà phải bắt buộc chọn cơ sở.

Trước khi submit:

1. kiểm tra quà đang active
2. kiểm tra cơ sở có phân bổ
3. kiểm tra cơ sở còn tồn

## Bước 7: Chỉnh các màn chọn quà khác

Nếu app mới có:

- thông báo
- chiến dịch
- voucher bundle
- loyalty

thì tất cả các nơi đó nên:

- chỉ load quà active cho chọn mới
- vẫn giữ được dữ liệu lịch sử đã chọn trước đó
- nếu có phạm vi cơ sở, lưu `storeIds` và `stores` theo pattern `MessageManagement`
- nếu phạm vi cơ sở khác nhau theo từng quà, dùng map dạng `relatedGiftStores[gift.id]`

---

## 9) Những rủi ro cần lưu ý khi mang sang app khác

## 9.1 Firestore không cho lưu `undefined`

Đã từng gặp lỗi với `imageUrl: undefined`.

Khi build payload:

- chỉ thêm field nào thực sự có giá trị

## 9.2 Không nên để loading vô hạn khi đọc Firebase

Đã từng có case đọc Firestore bị treo.

Giải pháp hiện tại:

- bọc read bằng `withTimeout(...)`

Nếu port sang app khác, nên giữ pattern timeout này.

## 9.3 Reset đang là reset “lười”

Reset hiện không chạy bằng cron/job riêng.

Nó chạy khi có hành động đọc hoặc gán quà.

Ưu điểm:

- dễ triển khai
- không cần server scheduler

Nhược điểm:

- dữ liệu chỉ reset khi có người mở trang hoặc dùng quà

Nếu app mới cần reset đúng từng phút ngay cả khi không ai mở app, phải chuyển sang:

- Cloud Function scheduler
- cron job backend

## 9.4 Xóa `assignedUsers` và `redeemedUsers`

Logic reset hiện tại đang xóa 2 mảng này khi sang chu kỳ mới.

Điều này đúng nếu business hiểu rằng:

- sau mỗi ngày là một vòng quà mới

Nếu app mới cần giữ lịch sử xuyên nhiều ngày, nên đổi chiến lược:

- không xóa lịch sử
- chuyển lịch sử sang collection riêng
- hoặc thêm `cycleDate`

---

## 10) Checklist test sau khi port

## A. Tạo và sửa quà

- Tạo quà mới với 2 cơ sở.
- Kiểm tra tổng số lượng bằng tổng từng cơ sở.
- Sửa lại phân bổ và kiểm tra tổng cập nhật đúng.

## B. Tạm ẩn

- Tạm ẩn quà.
- Kiểm tra quà rơi xuống dưới nhóm hoạt động.
- Kiểm tra không gán quà mới được nữa.

## C. Gán theo cơ sở

- Gán quà ở cơ sở 1.
- Kiểm tra tồn cơ sở 1 giảm.
- Kiểm tra cơ sở 2 không đổi.

## D. Reset theo giờ

- Bật reset hằng ngày và đặt giờ gần thời điểm test.
- Gán thử vài quà để làm giảm tồn.
- Sau khi qua mốc giờ, reload danh sách.
- Kiểm tra tồn từng cơ sở quay về max.

## E. Dữ liệu cũ

- Import quà cũ chưa có `storeAllocations`.
- Kiểm tra quà vẫn xem được.
- Kiểm tra không gán mới được cho tới khi sửa và phân bổ cơ sở.

---

## 11) Nếu muốn tách riêng thành các module nhỏ hơn

Khi port sang app lớn hơn, nên tách:

1. `gift.types.ts`
2. `gift.firestore.ts`
3. `gift.reset.ts`
4. `gift.assignment.ts`
5. `GiftManagementSection.tsx`
6. `GiftAssignModal.tsx`
7. `GiftStoreAllocationEditor.tsx`
8. `GiftResetConfigEditor.tsx`

Tách như vậy sẽ dễ tái sử dụng hơn bản hiện tại.

---

## 12) Tóm tắt ngắn để đưa vào tài liệu app khác

Phần quà tặng hiện đã có các tính năng:

- quản lý quà bằng Firebase
- tạm ẩn quà thay vì xóa
- tồn quà theo từng cơ sở
- gán quà bắt buộc theo cơ sở
- chặn gán khi quà ẩn hoặc hết tồn
- reset quà theo giờ hằng ngày
- chỉ cho chọn quà active ở các luồng chọn mới
- giữ tương thích với dữ liệu quà cũ

Nếu app khác muốn giống hoàn toàn, phải mang cả:

- type dữ liệu
- helper normalize
- logic reset theo giờ
- UI phân bổ theo cơ sở
- UI gán theo cơ sở
- rule lọc quà active ở các màn liên quan
