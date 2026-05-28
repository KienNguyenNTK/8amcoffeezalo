---
inclusion: always
---

# Tech Stack

## Nền tảng
- **Zalo Mini App (ZMP)**: Chạy trong Zalo App, không phải web browser độc lập
- **ZMP SDK** (`zmp-sdk`): API native của Zalo (`getUserInfo`, `getUserID`, OA tagging, ...)
- **ZMP UI** (`zmp-ui`): Component library chính thức (App, ZMPRouter, AnimationRoutes, ...)

## Frontend
- **React 18** + **TypeScript**
- **Vite 5** làm build tool (cấu hình qua `zmp-vite-plugin`)
- **React Router DOM v6** cho routing (dùng wrapper `ZMPRouter` + `AnimationRoutes`)
- **Recoil** cho global state management (`atom`, `selector`)
- **Tailwind CSS 3** + **SCSS** (Sass) cho styling
- **Ant Design (antd)** + **ZMP UI** cho UI components
- **react-icons** cho icon

## Backend / Data
- **Firebase 11** (Firestore + Storage) là backend chính
- Mỗi domain entity có service riêng trong `src/firebase/*Service.ts`
- `FirebaseContext` cung cấp Firebase instance qua React Context

## Tích hợp & Thư viện
- **axios** cho HTTP calls (Zalo OA API, ...)
- **dayjs** + **moment** cho xử lý thời gian
- **chart.js** + **react-chartjs-2**, **recharts**, **@amcharts/amcharts5** cho biểu đồ
- **html5-qrcode** cho quét QR
- **react-barcode** cho hiển thị barcode
- **swiper 9** cho carousel
- **vaul** cho bottom sheet / drawer
- **Stripe** (`@stripe/react-stripe-js`) và **Braintree Drop-in** cho thanh toán
- **crypto-js** cho mã hóa
- **react-markdown** để render markdown
- **react-circular-progressbar** cho progress UI

## Scripts (npm)
| Lệnh | Mục đích |
|------|----------|
| `npm run start` (`zmp start`) | Chạy dev server qua Zalo Mini App CLI |
| `npm run build` (`vite build`) | Build production |
| `npm run deploy` (`zmp deploy`) | Deploy lên Zalo |
| `npm run login` (`zmp login`) | Đăng nhập ZMP CLI |

> **Lưu ý**: Không dùng `npm run dev`. Dev server phải chạy bằng `zmp start` (yêu cầu Zalo Mini App CLI hoặc VS Code Zalo Mini App Extension).

## Biến môi trường
Đặt trong file `.env` (theo mẫu `.env.example`):
- `VITE_ZALO_APP_ID`, `VITE_ZALO_SECRET_KEY`
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
  `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
  `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`

> Tất cả biến phải bắt đầu bằng `VITE_` để Vite expose ra client.

## Cấu hình app
- `app-config.json`: Cấu hình Zalo Mini App (title, theme color, status bar, ...)
- `app-config.json` được expose qua `window.APP_CONFIG` trong `src/app.ts`

## Quy ước môi trường
- Hỗ trợ trình duyệt cũ trên mobile (Android ≥ 5, iOS ≥ 9.3) — xem `browserslist` trong `package.json`
- Tránh dùng API quá mới mà không có polyfill phù hợp
