import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChevronRight, FaUser, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { authService } from '../services/authService';
import { User } from '../types/user';
import { recentlyViewedService } from '../services/recentlyViewedService';
import { addressService } from '../services/addressService';
import { Button, Form, Input, Modal, Select, ConfigProvider, Switch, notification } from 'antd';
import { userService } from '../firebase/userService';
import { businessHoursService } from '../firebase/businessHoursService';
import { OpeningHours } from '../types/businessHours';
import { getUserID } from 'zmp-sdk/apis';
import { followOA, unfollowOA } from 'zmp-sdk';
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
    const [userInfo, setUserInfo] = useState<any>(null);
    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
    const [editField, setEditField] = useState<'username' | 'phone' | null>(null);
    const [form] = Form.useForm();
    const [isFollowed, setIsFollowed] = useState(false);
    const [isStoreModalVisible, setIsStoreModalVisible] = useState(false);
    const [openingHours, setOpeningHours] = useState<OpeningHours | null>(null);

    useEffect(() => {
        const checkLocal = async () => {
            const userId = await getUserID();
            const user = await userService.getUserByLocalId(userId);
            if (user) {
                setUserInfo(user);
            }
        };
        checkLocal();
    }, []);

    useEffect(() => {
        const fetchOpeningHours = async () => {
            try {
                const hours = await businessHoursService.getOpeningHours();
                setOpeningHours(hours);
            } catch (error) {
                console.error('Error fetching opening hours:', error);
            }
        };
        fetchOpeningHours();
    }, []);

    const clearHistory = async () => {
        try {
            await recentlyViewedService.clearRecentlyViewed();
            // notification.success({
            //     message: 'Đã xóa lịch sử xem',
            //     duration: 1.5,
            //     placement: 'top'
            // });
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    useEffect(() => {
        const getUser = async () => {
            // const currentUser = await authService.getAuthenticatedUser();

            const phone = userInfo?.phoneNumber;
            if (phone && phone.startsWith('84')) {
                userInfo.phoneNumber = `+84 ${phone.slice(2).padStart(10, '0')}`;
            }

            setUser(userInfo);
        };

        getUser();
    }, [userInfo]);

    useEffect(() => {
        const savedAddress = addressService.getAddress();
        if (savedAddress) {
            setUserAddress(savedAddress);
        }
    }, []);

    useEffect(() => {
        getProvince();
    }, []);

    useEffect(() => {
        if (userInfo) {
            setIsFollowed(userInfo.isFollowed || false);
        }
    }, [userInfo]);

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

    const handleProfileUpdate = async (values: any) => {
        try {
            await userService.updateUser(userInfo.id, values);
            setUserInfo({ ...userInfo, ...values });
            setIsProfileModalVisible(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleProfileClick = (field: 'username' | 'phone') => {
        setEditField(field);
        setIsProfileModalVisible(true);
        if (field === 'username') {
            form.setFieldsValue({ name: userInfo?.name });
        }
        else {
            form.setFieldsValue({ phoneNumber: userInfo?.phoneNumber });
        }
    };

    const handleToggleNotification = async (checked: boolean) => {
        try {
            if (checked) {
                await followOA({
                    id: '2315491439411829194'
                });
                setIsFollowed(true);
                notification.success({
                    message: 'Thành công',
                    description: 'Bạn sẽ nhận được thông báo từ chúng tôi!',
                    duration: 1.5,
                    placement: 'top',
                    closable: false
                });

                if (userInfo) {
                    await userService.updateUser(userInfo.id, { isFollowed: true });
                }
            }
            // else {
            //     await unfollowOA({
            //         id: '2315491439411829194'
            //     });
            //     setIsFollowed(false);
            //     notification.success({
            //         message: 'Thành công',
            //         description: 'Bạn đã tắt thông báo!',
            //         duration: 1.5,
            //         placement: 'top',
            //         closable: false
            //     });

            //     if (userInfo) {
            //         await userService.updateUser(userInfo.id, { isFollowed: false });
            //     }
            // }
        } catch (error) {
            console.error('Lỗi khi thay đổi trạng thái thông báo:', error);
            // notification.error({
            //     message: 'Lỗi',
            //     description: 'Không thể thay đổi trạng thái thông báo. Vui lòng thử lại sau.',
            //     duration: 1.5,
            //     placement: 'top',
            //     closable: false
            // });
        }
    };

    const handleSupport = () => {
        window.location.href = 'tel:0852323468';
    };

    const handleFindStore = () => {
        setIsStoreModalVisible(true);
    };

    const handleOpenMap = () => {
        // window.open('https://maps.google.com/?q=34+Tăng+Bạt+Hổ,+phường+Phạm+Đình+Hổ,+Hà+Nội,+Việt+Nam', '_blank');
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#f97316',
                    colorPrimaryHover: '#ea580c',
                    colorPrimaryActive: '#ea580c',
                }
            }}
        >
            <div className="p-4 mb-10" style={{ marginTop: "20px" }}>
                <div className="mb-4 flex items-center justify-center">
                    <button
                        className="p-2 rounded-full bg-8am-gray mr-4"
                        style={{
                            zIndex: 1000,
                            position: 'fixed',
                            top: '50px',
                            left: '20px'
                        }}
                        onClick={() => navigate('/profile')}
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
                    // onClick={() => handleProfileClick('username')}
                    >
                        <div className="text-8am-black">Tên khách hàng</div>
                        <div className="flex items-center">
                            <span className="text-gray-400 mr-2">{userInfo?.name || 'Chưa có tên'}</span>
                            {/* <FaChevronRight className="text-gray-400 h-4 w-4" /> */}
                        </div>
                    </div>

                    <div
                        className={`flex items-center justify-between p-4 border-b border-gray-100`}
                    // onClick={() => handleProfileClick('phone')}
                    >
                        <div className="text-8am-black">Số điện thoại</div>
                        <div className="flex items-center">
                            <span className="text-gray-400 mr-2">{user?.phoneNumber}</span>
                            {/* <FaChevronRight className="text-gray-400 h-4 w-4" /> */}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border-b border-gray-100" onClick={handleAddressClick}>
                        <div className="text-8am-black">Địa chỉ cá nhân</div>
                        <div className="flex items-center">
                            {/* {userAddress ? (
                                <span className="text-gray-400 mr-2">
                                    {`${userAddress.address}`}
                                </span>
                            ) : (
                                <span className="text-gray-400 mr-2">Chưa có địa chỉ</span>
                            )} */}
                            <FaChevronRight className="text-gray-400 h-4 w-4" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border-b border-gray-100 opacity-30">
                        <div className="text-8am-black">Tài khoản / Thẻ ngân hàng</div>
                        <div className="flex items-center">
                            <FaChevronRight className="text-gray-400 h-4 w-4" />
                        </div>
                    </div>


                </div>


                <div className="bg-white rounded-lg mb-4">
                    {/* <div className={`flex items-center justify-between p-4 border-b border-gray-100 opacity-30`}>
                        <div className="text-8am-black">Nhận thông báo</div>
                        <Switch
                            checked={isFollowed}
                            onChange={handleToggleNotification}
                            className="bg-gray-200"
                        />
                    </div> */}

                    <div
                        className={`flex items-center justify-between p-4 border-b border-gray-100`}
                        onClick={handleSupport}
                    >
                        <div className="text-8am-black">Hỗ trợ</div>
                        <div className="flex items-center">
                            <span className="text-gray-400 mr-2">0852323468</span>
                            <FaChevronRight className="text-gray-400 h-4 w-4" />
                        </div>
                    </div>

                    <div
                        className={`flex items-center justify-between p-4 border-b border-gray-100`}
                        onClick={handleFindStore}
                    >
                        <div className="text-8am-black">Thông tin cửa hàng  </div>
                        <div className="flex items-center">
                            <FaChevronRight className="text-gray-400 h-4 w-4" />
                        </div>
                    </div>

                </div>

                <div className="bg-white rounded-lg mb-4">
                    <div
                        className={`flex items-center justify-between p-4 border-b border-gray-100 opacity-30`}
                    >
                        <div className="text-8am-black">Điều khoản sử dụng</div>
                        <div className="flex items-center">
                            <FaChevronRight className="text-gray-400 h-4 w-4" />
                        </div>
                    </div>

                    <div
                        className={`flex items-center justify-between p-4 border-b border-gray-100`}
                        onClick={() => navigate('/privacy-policy')}
                    >
                        <div className="text-8am-black">Chính sách bảo mật</div>
                        <div className="flex items-center">
                            <FaChevronRight className="text-gray-400 h-4 w-4" />
                        </div>
                    </div>

                    <div
                        className={`flex items-center justify-between p-4 border-b border-gray-100 opacity-30`}
                    >
                        <div className="text-8am-black">Chính sách trả hàng</div>
                        <div className="flex items-center">
                            <FaChevronRight className="text-gray-400 h-4 w-4" />
                        </div>
                    </div>

                </div>

                {/* <div className="mb-4 bg-white rounded-lg shadow-sm mt-4">
                    <div className="p-6">
                        <div className="space-y-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <FaUser className="text-gray-500 h-4 w-4" />
                                <div className="text-8am-black text-sm">
                                    Người đại diện:
                                    <span className="font-medium ml-1 text-gray-700">
                                        Nguyễn Trần Kiên
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center space-x-2">
                                <FaPhone className="text-gray-500 h-4 w-4" />
                                <div className="text-8am-black text-sm">
                                    Số điện thoại:
                                    <span
                                        className="font-medium ml-1 cursor-pointer text-blue-500 hover:text-blue-600 transition-colors duration-200"
                                        onClick={() => window.location.href = 'tel:0936663688'}
                                    >
                                        0986716147
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-center space-x-2">
                                <FaMapMarkerAlt className="text-gray-500 h-4 w-4" />
                                <div className="text-8am-black text-sm">
                                    Địa chỉ:  P. Trần Hòa, Khu Đồng Mồ, Hoàng Mai, Hà Nội
                                </div>
                            </div>
                        </div>
                    </div>
                </div> */}

                <div className="mt-6 space-y-2">
                    {/* <button 
                        className="w-full py-3 bg-gray-100 rounded-lg text-8am-black"
                        onClick={clearHistory}
                    >
                        Xóa lịch sử xem
                    </button> */}
                    {/* <button className="w-full py-3 bg-gray-100 rounded-lg text-8am-black">
                        Đánh giá
                    </button>
                    <button className="w-full py-3 bg-gray-100 rounded-lg text-8am-black">
                        Đăng xuất
                    </button> */}
                </div>


                {
                    userInfo && (
                        <Modal
                            title={editField === 'username' ? "Cập nhật tên" : "Cập nhật số điện thoại"}
                            open={isProfileModalVisible}
                            onCancel={() => setIsProfileModalVisible(false)}
                            footer={null}
                        >
                            <Form

                                onFinish={handleProfileUpdate}
                                layout="vertical"
                                form={form}
                            >
                                {editField === 'username' ? (
                                    <Form.Item
                                        name="name"
                                        label="Tên"
                                        rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                                    >
                                        <Input placeholder="Nhập tên của bạn" />
                                    </Form.Item>
                                ) : (
                                    <Form.Item
                                        name="phoneNumber"
                                        label="Số điện thoại"
                                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                                    >
                                        <Input placeholder="Nhập số điện thoại" />
                                    </Form.Item>
                                )}
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" className="w-full bg-orange-500 font-medium">
                                        Cập nhật
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Modal>
                    )
                }

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

                <Modal
                    title="Cửa hàng 8am Coffee"
                    open={isStoreModalVisible}
                    onCancel={() => setIsStoreModalVisible(false)}
                    footer={null}
                >
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Thông tin liên hệ</h3>
                            <div className="space-y-2 text-gray-600">
                                <p>Email: 8amcoffeeroastery@gmail.com</p>
                                <p>Instagram: 8amcoffeeroastery</p>
                                <p>Website: 8am.vn/coffee</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Địa chỉ cửa hàng</h3>
                            <div
                                className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                                onClick={handleOpenMap}
                            >
                                <p className="font-medium">8am Coffee & Roastery</p>
                                <p className="text-gray-600">34 Tăng Bạt Hổ, phường Phạm Đình Hổ, Hà Nội, Việt Nam</p>
                                <p className="text-gray-500 mt-1">Giờ mở cửa: {openingHours?.openTime} - {openingHours?.closeTime}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Dịch vụ</h3>
                            <div className="space-y-1 text-gray-600">
                                <p>• Giao hàng</p>
                                <p>• Mang về</p>
                                <p>• Chỗ ngồi ngoài trời</p>
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        </ConfigProvider>
    );
};

export default Settings;