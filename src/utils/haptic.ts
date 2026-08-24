/**
 * Utility hỗ trợ rung phản hồi xúc giác (Haptic Feedback) trên thiết bị di động
 */
export const haptic = {
  /** Rung cực nhẹ (khi click nút, chọn tab) */
  light: () => {
    try {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(10);
      }
    } catch (e) {}
  },

  /** Rung vừa (khi thêm giỏ hàng, toggle yêu thích) */
  medium: () => {
    try {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(25);
      }
    } catch (e) {}
  },

  /** Rung nhịp thành công (khi thanh toán / đặt hàng thành công) */
  success: () => {
    try {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([15, 40, 20]);
      }
    } catch (e) {}
  },

  /** Rung cảnh báo / lỗi */
  error: () => {
    try {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([30, 30, 30]);
      }
    } catch (e) {}
  }
};
