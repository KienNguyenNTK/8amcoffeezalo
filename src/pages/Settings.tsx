import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChevronRight } from 'react-icons/fa';
import { authService } from '../services/authService';
import { User } from '../types/user';
import { recentlyViewedService } from '../services/recentlyViewedService';
import { addressService } from '../services/addressService';
import { Button, Form, Input, Modal, Select } from 'antd';
// import { notification } from '';

const { Option } = Select;

const Settings = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userAddress, setUserAddress] = useState<any>(null);
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const navigate = useNavigate();

    const clearHistory = async () => {
        try {
            await recentlyViewedService.clearRecentlyViewed();
            // notification.success({
            //     message: 'Đã xóa lịch sử xem',
            //     duration: 2,
            //     placement: 'top'
            // });
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    useEffect(() => {
        const getUser = async () => {
            const currentUser = await authService.getAuthenticatedUser();

            const phone = currentUser?.phoneNumber;
            if (phone && phone.startsWith('84')) {
                currentUser.phoneNumber = `+84 ${phone.slice(2).padStart(10, '0')}`;
            }

            setUser(currentUser);
        };

        getUser();
    }, []);

    useEffect(() => {
        const savedAddress = addressService.getAddress();
        if (savedAddress) {
            setUserAddress(savedAddress);
        }
    }, []);

    useEffect(() => {
        getProvince();
    }, []);

    const getProvince = async () => {
        try {
            const response = await fetch('https://provinces.open-api.vn/api/p/');
            const data = await response.json();
            setProvinces(data);
        } catch (error) {
            console.error('Error fetching provinces:', error);
        }
    };

    const handleProvinceChange = async (value: string) => {
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/p/${value}?depth=2`);
            const data = await response.json();
            setDistricts(data.districts);
            setWards([]);
            const province: any = provinces.find((p: any) => p.code === value);
            const newValues = { ...userAddress, province: province?.name, district: '', ward: '' };
            setUserAddress(newValues);
        } catch (error) {
            console.error('Error fetching districts:', error);
        }
    };

    const handleDistrictChange = async (value: string) => {
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/d/${value}?depth=2`);
            const data = await response.json();
            setWards(data.wards);
            const district: any = districts.find((d: any) => d.code === value);
            const newValues = { ...userAddress, district: district?.name, ward: '' };
            setUserAddress(newValues);
        } catch (error) {
            console.error('Error fetching wards:', error);
        }
    };

    const handleAddressClick = () => {
        setIsAddressModalVisible(true);
    };

    const handleAddressUpdate = (values: any) => {
        addressService.updateAddress(values);
        setUserAddress(values);
        setIsAddressModalVisible(false);
    };

    return (
        <div className="p-4 mb-10" style={{ marginTop: "20px" }}>
            <div className="mb-4 flex items-center justify-center">
                <button
                    className="p-2 rounded-full bg-8am-gray mr-4"
                    style={{
                        position: "absolute",
                        left: "20px",
                        top: "40px"
                    }}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft className="h-4 w-4 text-8am-white" />
                </button>

                <div className="text-8am-black text-xl font-bold mt-5"
                >
                    Cài đặt
                </div>
            </div>

            <div className="bg-white rounded-lg mb-4">
                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Số điện thoại</div>
                    <div className="flex items-center">
                        <span className="text-gray-400 mr-2">{user?.phoneNumber}</span>
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-gray-100" onClick={handleAddressClick}>
                    <div className="text-8am-black">Địa chỉ</div>
                    <div className="flex items-center">
                        {userAddress ? (
                            <span className="text-gray-400 mr-2">
                                {`${userAddress.address}`}
                            </span>
                        ) : (
                            <span className="text-gray-400 mr-2">Chưa có địa chỉ</span>
                        )}
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="text-8am-black">Tài khoản / Thẻ ngân hàng</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>


            </div>


            <div className="bg-white rounded-lg mb-4">
                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Cài đặt thông báo</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Hỗ trợ</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Tìm cửa hàng vật lý</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

            </div>

            <div className="bg-white rounded-lg mb-4">
                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Điều khoản sử dụng</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Chính sách bảo mật</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

                <div
                    className={`flex items-center justify-between p-4 border-b border-gray-100`}
                >
                    <div className="text-8am-black">Chính sách trả hàng</div>
                    <div className="flex items-center">
                        <FaChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                </div>

            </div>

            <div className="mt-6 space-y-2">
                {/* <button 
                    className="w-full py-3 bg-gray-100 rounded-lg text-8am-black"
                    onClick={clearHistory}
                >
                    Xóa lịch sử xem
                </button> */}
                <button className="w-full py-3 bg-gray-100 rounded-lg text-8am-black">
                    Đánh giá
                </button>
                <button className="w-full py-3 bg-gray-100 rounded-lg text-8am-black">
                    Đăng xuất
                </button>
            </div>

            <Modal
                title="Cập nhật địa chỉ"
                open={isAddressModalVisible}
                onCancel={() => setIsAddressModalVisible(false)}
                footer={null}
            >
                <Form
                    initialValues={userAddress || {}}
                    onFinish={handleAddressUpdate}
                    layout="vertical"
                >
                    <Form.Item
                        name="address"
                        label="Địa chỉ"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                    >
                        <input
                            type="text"
                            name="address"
                            placeholder="Địa chỉ"
                            className="w-full p-3 rounded-lg border border-gray-300"
                        />
                    </Form.Item>
                    <Form.Item
                        name="province"
                        label="Tỉnh/Thành phố"
                        rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
                    >
                        <Select
                            className="w-full h-10"
                            placeholder="Chọn Tỉnh/Thành phố"
                            value={userAddress?.province}
                            onChange={handleProvinceChange}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)
                                    .toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {provinces.map((province: any) => (
                                <Option key={province.code} value={province.code}>
                                    {province.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="district"
                        label="Quận/Huyện"
                        rules={[{ required: true, message: 'Vui lòng chọn quận/huyện' }]}
                    >
                        <Select
                            className="w-full h-10"
                            placeholder="Chọn Quận/Huyện"
                            value={userAddress?.district}
                            onChange={handleDistrictChange}
                            disabled={!userAddress?.province}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)
                                    .toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {districts.map((district: any) => (
                                <Option key={district.code} value={district.code}>
                                    {district.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="ward"
                        label="Phường/Xã"
                        rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
                    >
                        <Select
                            className="w-full h-10"
                            placeholder="Chọn Phường/Xã"
                            value={userAddress?.ward}
                            onChange={(value) => {
                                const ward: any = wards.find((w: any) => w.code === value);
                                const newValues = { ...userAddress, ward: ward?.name };
                                setUserAddress(newValues);
                            }}
                            disabled={!userAddress?.district}
                        >
                            {wards.map((ward: any) => (
                                <Option key={ward.code} value={ward.code}>
                                    {ward.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full bg-orange-500 font-medium">
                            Cập nhật
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Settings;