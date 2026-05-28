---
inclusion: always
---

# Cấu trúc dự án & Quy ước code

## Cấu trúc thư mục

```
8amcoffeezalo/
├── app-config.json          # Cấu hình Zalo Mini App
├── index.html               # HTML entry
├── package.json
├── postcss.config.js        # Tailwind + autoprefixer
├── .env / .env.example      # Biến môi trường (VITE_*)
├── src/
│   ├── app.ts               # Entry point: mount React app, load CSS, expose APP_CONFIG
│   ├── state.ts             # Recoil global atoms/selectors
│   ├── components/          # React components dùng chung
│   │   └── bottom-navigation/   # Component có nhiều file đặt trong folder
│   ├── pages/               # Route pages (mỗi file = 1 màn hình)
│   ├── firebase/            # Firebase services + Context
│   │   ├── config.ts        # Khởi tạo Firebase app
│   │   ├── FirebaseContext.tsx
│   │   └── *Service.ts      # 1 service / domain entity
│   ├── services/            # Business services không thuộc Firebase
│   ├── hooks/               # Custom React hooks (useXxx)
│   ├── types/               # TypeScript type definitions / interfaces
│   ├── utils/               # Helper functions thuần
│   ├── css/                 # Global stylesheets (tailwind.scss, app.scss)
│   ├── styles/              # Stylesheet riêng theo feature
│   ├── dump/                # Static JSON (provinces, wards, ...)
│   └── public/images/       # Hình ảnh tĩnh
└── .kiro/
    └── steering/            # Steering rules cho Kiro
```

## Quy ước đặt tên file

Dự án đang tồn tại **2 phong cách**, giữ nguyên phong cách hiện có khi sửa file:
- **kebab-case**: components cũ (`coffee-card.tsx`, `bottom-navigation.tsx`, `info-cafe-modal.tsx`)
- **PascalCase**: components mới (`GiftClaimSection.tsx`, `QRScanner.tsx`, `StoreGuard.tsx`)
- **camelCase**: services, hooks, utils, types (`giftService.ts`, `useCartCount.ts`, `qrParser.ts`, `gift.ts`)

> Khi tạo file mới: dùng **PascalCase cho component**, **camelCase cho service / hook / util / type**.

## Quy ước code

### Components (React)
- Function component + arrow function: `const MyComponent = () => { ... }; export default MyComponent;`
- Page component đặt trong `src/pages/`, được wire vào router trong `src/components/app.tsx`
- Component dùng chung đặt trong `src/components/`
- Dùng `zmp-ui` components (App, Box, Text, Button, ...) thay cho HTML/antd khi có thể
- Dùng `useNavigate` từ `react-router-dom` để điều hướng

### State management
- Global state qua **Recoil**: định nghĩa atom/selector trong `src/state.ts` hoặc file riêng
- Local state qua `useState` / `useReducer`
- Side effects qua `useEffect`

### Firebase services
- Mỗi domain (coffee, gift, order, ...) có 1 file service trong `src/firebase/`
- Export object hoặc class với các method CRUD: `getXxx`, `createXxx`, `updateXxx`, `deleteXxx`
- Type liên quan đặt trong `src/types/<domain>.ts`
- Truy cập Firebase qua import trực tiếp từ `firebase/config.ts`

### TypeScript
- Định nghĩa type/interface cho mọi entity trong `src/types/`
- Tránh `any` khi có thể; nếu phải dùng `any` cho data Zalo/Firebase, ghi chú lý do
- Props của component nên có interface riêng

### Styling
- **Tailwind CSS** là cách tiếp cận chính cho utility classes
- **SCSS** dùng khi cần component có style phức tạp; đặt cùng folder với component (xem `bottom-navigation/`) hoặc trong `src/styles/`
- Theme color dùng từ `app-config.json` → `template.primaryColor`

### Routing
- Tất cả route khai báo tập trung trong `src/components/app.tsx`
- Dùng `<Route path="..." element={<Component />} />` trong `<AnimationRoutes>`
- Route bảo vệ chọn cửa hàng đã được wrap bởi `<StoreGuard>`

### Imports
- Dùng relative path: `../firebase/userService`, `../components/...`
- Không dùng path alias (chưa cấu hình)

## Tài liệu
- File hướng dẫn tiếng Việt ở root: `GIFT_*_GUIDE.md`, `HUONG_DAN_*.md`, `SETUP_COMPLETE_CHECKLIST.md`
- README.md cũng dùng tiếng Việt cho phần mô tả tính năng
- Khi thêm tính năng lớn, cập nhật README hoặc tạo file hướng dẫn riêng
