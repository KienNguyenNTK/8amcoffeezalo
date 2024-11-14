import { notification } from 'antd';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderService } from '../firebase/orderService';

const Order = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems, totalAmount, userId } = location.state || {};
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        phone: '',
        address: '',
        province: '',
        district: '',
        ward: '',
        cardName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        saveCard: false
    });
    const [showCartItems, setShowCartItems] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    useEffect(() => {
        getProvince();
    }, []);

    const getProvince = async () => {
        try {
            const response = await fetch('https://vapi.vnappmob.com/api/province');
            const data = await response.json();
            console.log(data.results);
            setProvinces(data.results);
        } catch (error) {
            console.error('Error fetching provinces:', error);
        }
    };

    const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedProvinceId = e.target.value;
        setFormData(prev => ({ ...prev, province: selectedProvinceId }));

        // Fetch districts based on selected province
        await axios.get(`https://vapi.vnappmob.com/api/province/district/${selectedProvinceId}`)
            .then(response => {
                setDistricts(response.data.results);
                setWards([]); // Reset wards when province changes
            })
            .catch(error => {
                console.error('Error fetching districts:', error);
            });
    };

    const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDistrictId = e.target.value;
        setFormData(prev => ({ ...prev, district: selectedDistrictId }));

        // Fetch wards based on selected district
        await axios.get(`https://vapi.vnappmob.com/api/province/ward/${selectedDistrictId}`)
            .then(response => {
                setWards(response.data.results);
            })
            .catch(error => {
                console.error('Error fetching wards:', error);
            });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const order: any = {
                userId,
                items: cartItems,
                totalAmount,
                shippingInfo: formData,
                status: 'pending' as const,
                paymentMethod: 'credit' as const
            };

            await orderService.createOrder(order);

            notification.success({
                message: 'Đặt hàng thành công',
                description: 'Đơn hàng của bạn đã được tạo',
                duration: 3,
                placement: 'top'
            });

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

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="pt-4 pb-10 bg-8am-white">
            <div className="mb-4 flex items-center justify-center mt-12"
                style={{
                    borderBottom: '1px solid #e0e0e0',
                }}
            >
                <button
                    className="p-2 rounded-full bg-8am-gray mr-4"
                    style={{
                        position: 'absolute',
                        top: '45px',
                        left: '10px',
                    }}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft className="h-4 w-4 text-8am-white" />
                </button>
                <div className="text-8am-black text-2xl font-bold">
                    Đặt hàng
                </div>
            </div>

            <div className="flex justify-between items-center mt-4 ml-4 mr-4">
                <div className="text-xl font-bold">Đơn hàng</div>
                <div className="text-lg flex items-center gap-2" onClick={() => setShowCartItems(!showCartItems)}>
                    {totalAmount.toLocaleString()}đ ({cartItems.length} sản phẩm)
                    {showCartItems ? <FaChevronUp /> : <FaChevronDown />}
                </div>
            </div>
            {showCartItems && (
                <div className={`mt-2 ml-2 mr-4 transition-all duration-300 ${showCartItems ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
                    {cartItems.map((item, index) => (
                        <div key={index} className="p-2 border-b border-gray-300 flex items-center gap-2">
                            <div>
                                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <div className="text-lg font-bold">{item.name}</div>
                                <div className="text-sm text-gray-500">{item.price.toLocaleString()}đ</div>
                                <div className="text-sm text-gray-500">Số lượng: {item.quantity}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 ml-4 mr-4">
                <h2 className="text-lg font-bold mb-4">Thông tin nhận hàng</h2>
                <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Họ và tên"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Số điện thoại"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                        <input
                            type="text"
                            name="address"
                            placeholder="Địa chỉ"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Tỉnh/Thành phố</label>
                        <select
                            name="province"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300"
                            value={formData.province}
                            onChange={handleProvinceChange}
                        >
                            <option value="">Chọn Tỉnh/Thành phố</option>
                            {provinces.map((province: any) => (
                                <option key={province.province_id} value={province.province_id}>{province.province_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Quận/Huyện</label>
                        <select
                            name="district"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300"
                            value={formData.district}
                            onChange={handleDistrictChange}
                            disabled={!formData.province}
                        >
                            <option value="">Chọn Quận/Huyện</option>
                            {districts.map((district: any) => (
                                <option key={district.district_id} value={district.district_id}>{district.district_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Phường/Xã</label>
                        <select
                            name="ward"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300"
                            value={formData.ward}
                            onChange={handleChange}
                            disabled={!formData.district}
                        >
                            <option value="">Chọn Phường/Xã</option>
                            {wards.map((ward: any) => (
                                <option key={ward.ward_id} value={ward.ward_id}>{ward.ward_name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 text-white py-4 rounded-lg font-medium disabled:bg-gray-400"
                    >
                        {loading ? 'Đang xử lý...' : 'Đặt hàng'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Order; 