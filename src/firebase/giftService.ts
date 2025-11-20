import axios from 'axios';

const API_BASE_URL = 'https://api-coffee.8am.vn/api/gifts';

export interface AssignGiftRequest {
  giftId: string;
  userId: string;
  userInfo?: {
    name: string;
    phone: string;
  };
  metadata?: {
    source?: string;
    messageId?: string;
    [key: string]: any;
  };
}

export interface RedeemGiftRequest {
  giftId: string;
  userId: string;
}

export const giftService = {
  // Lấy danh sách tất cả gifts
  getAllGifts: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gifts:', error);
      throw error;
    }
  },

  // Lấy thông tin gift theo ID
  getGiftById: async (giftId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/gift/${giftId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gift:', error);
      throw error;
    }
  },

  // Gán gift cho user
  assignGift: async (request: AssignGiftRequest) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/assign`, request);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('Gift đã hết hoặc bạn đã nhận quà này rồi!');
      }
      console.error('Error assigning gift:', error);
      throw error;
    }
  },

  // Lấy QR code của assignment
  getQRCode: async (assignmentId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/qr/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching QR code:', error);
      throw error;
    }
  },

  // Kiểm tra trạng thái gift
  checkStatus: async (giftId: string, userId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/check-status`, {
        params: { giftId, userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking gift status:', error);
      throw error;
    }
  },

  // Xác nhận đổi quà (Redeem)
  redeemGift: async (request: RedeemGiftRequest) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/redeem`, request);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('Quà đã được đổi rồi');
      }
      console.error('Error redeeming gift:', error);
      throw error;
    }
  },

  // Lấy danh sách assignments của user
  getUserAssignments: async (userId: string) => {
    try {
      // Note: API này có thể chưa có, cần hỏi backend
      // Tạm thời có thể lấy từ gift.assignedUsers
      const allGifts = await giftService.getAllGifts();
      const userAssignments: any[] = [];
      
      for (const gift of allGifts) {
        if (gift.assignedUsers && gift.assignedUsers.includes(userId)) {
          // Cần gọi API để lấy assignment details
          // Tạm thời return gift info
          userAssignments.push({
            giftId: gift.id,
            giftName: gift.name,
            giftDescription: gift.description,
          });
        }
      }
      
      return userAssignments;
    } catch (error) {
      console.error('Error fetching user assignments:', error);
      throw error;
    }
  },

  // Lấy thông tin assignment đầy đủ (bao gồm metadata)
  getAssignment: async (assignmentId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/assignment/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching assignment:", error);
      throw error;
    }
  },
};