import { notification } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../firebase/orderService';
import { CartItem } from '../types/cart';

interface OrderFormProps {
  cartItems: CartItem[];
  totalAmount: number;
  userId: string;
  onOrderComplete: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({
  cartItems,
  totalAmount,
  userId,
  onOrderComplete
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    district: '',
    ward: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const order = {
        userId,
        items: cartItems,
        totalAmount,
        shippingInfo: formData,
        status: 'pending' as const,
        paymentMethod: 'cod' as const
      };

      await orderService.createOrder(order);

      notification.success({
        message: 'Đặt hàng thành công',
        description: 'Đơn hàng của bạn đã được tạo',
        duration: 3,
        placement: 'top'
      });

      onOrderComplete();
      navigate('/profile');
    } catch (error) {
      console.error('Error creating order:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tạo đơn hàng',
        duration: 3,
        placement: 'top'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        className="w-full p-3 rounded-lg border"
        value={formData.email}
        onChange={handleChange}
      />
      <input
        type="text"
        name="fullName"
        placeholder="Họ và tên"
        required
        className="w-full p-3 rounded-lg border"
        value={formData.fullName}
        onChange={handleChange}
      />
      <input
        type="tel"
        name="phone"
        placeholder="Số điện thoại"
        required
        className="w-full p-3 rounded-lg border"
        value={formData.phone}
        onChange={handleChange}
      />
      <input
        type="text"
        name="address"
        placeholder="Địa chỉ"
        required
        className="w-full p-3 rounded-lg border"
        value={formData.address}
        onChange={handleChange}
      />
      <input
        type="text"
        name="district"
        placeholder="Quận/Huyện"
        required
        className="w-full p-3 rounded-lg border"
        value={formData.district}
        onChange={handleChange}
      />
      <input
        type="text"
        name="ward"
        placeholder="Phường/Xã"
        required
        className="w-full p-3 rounded-lg border"
        value={formData.ward}
        onChange={handleChange}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 text-white py-4 rounded-lg font-medium disabled:bg-gray-400"
      >
        {loading ? 'Đang xử lý...' : 'Đặt hàng'}
      </button>
    </form>
  );
};

export default OrderForm; 