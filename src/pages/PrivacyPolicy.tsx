import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { ConfigProvider } from 'antd';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

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
                        onClick={() => navigate(-1)}
                    >
                        <FaArrowLeft className="h-4 w-4 text-8am-white" />
                    </button>

                    <div className="text-8am-black text-xl font-bold mt-5">
                        Chính sách bảo mật
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 space-y-6">
                    <section>
                        <h2 className="text-lg font-semibold mb-2">Mục đích và phạm vi thu thập thông tin</h2>
                        <p className="text-gray-600 mb-3">
                            8amCoffee cam kết không bán, chia sẻ hay trao đổi thông tin cá nhân của khách hàng thu thập trên miniapp cho một bên thứ ba nào khác.
                            Thông tin cá nhân thu thập được sẽ chỉ được sử dụng trong nội bộ công ty.
                        </p>
                        
                        <div className="ml-4">
                            <p className="font-medium mb-2">Khi bạn liên hệ đăng ký dịch vụ, thông tin cá nhân mà 8amCoffee thu thập bao gồm:</p>
                            <ul className="list-disc ml-6 text-gray-600">
                                <li>Tên khách hàng</li>
                                <li>Số điện thoại</li>
                                <li>Địa chỉ</li>
                            </ul>
                        </div>

                        <div className="ml-4 mt-3">
                            <p className="font-medium mb-2">Ngoài thông tin cá nhân là các thông tin về đơn hàng:</p>
                            <ul className="list-disc ml-6 text-gray-600">
                                <li>Tên sản phẩm</li>
                                <li>Số lượng</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-2">Mục đích sử dụng thông tin</h2>
                        <ul className="list-disc ml-6 text-gray-600">
                            <li>Hỗ trợ khách hàng</li>
                            <li>Cung cấp thông tin liên quan đến dịch vụ</li>
                            <li>Xử lý đơn đặt hàng và cung cấp dịch vụ và thông tin qua trang OA của chúng tôi theo yêu cầu của bạn</li>
                            <li>Gửi thông tin sản phẩm, dịch vụ mới, thông tin về các sự kiện sắp tới hoặc chương trình ưu đãi, khuyến mại</li>
                            <li>Hỗ trợ quản lý tài khoản khách hàng</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-2">Thời gian lưu trữ thông tin</h2>
                        <p className="text-gray-600">
                            Đối với thông tin cá nhân, 8amCoffee chỉ xóa đi dữ liệu này nếu khách hàng có yêu cầu.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-2">Địa chỉ của đơn vị thu thập và quản lý thông tin</h2>
                        <div className="text-gray-600">
                            <p className="font-medium">8am Coffee & Roastery</p>
                            <p>Địa chỉ: Số 34 Tăng Bạt Hổ – Phường Phạm Đình Hổ – Hà Nội.</p>
                            <p>Email: 8amcoffeeroastery@gmail.com</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-2">Cam kết bảo mật thông tin cá nhân khách hàng</h2>
                        <p className="text-gray-600">
                            8amCoffee cam kết không chia sẻ, bán hoặc cho thuê thông tin cá nhân của bạn cho bất kỳ người nào khác. 
                            8amCoffee cam kết chỉ sử dụng các thông tin của bạn vào các mục đích đã đề cập bên trên.
                        </p>
                        <p className="text-gray-600 mt-3">
                            8amCoffee hiểu rằng quyền lợi của bạn trong việc bảo vệ thông tin cá nhân cũng chính là trách nhiệm của chúng tôi 
                            nên trong bất kỳ trường hợp có thắc mắc, góp ý nào liên quan đến chính sách bảo mật của 8amCoffee, 
                            vui lòng liên hệ qua email: 8amcoffeeroastery@gmail.com
                        </p>
                    </section>
                </div>
            </div>
        </ConfigProvider>
    );
};

export default PrivacyPolicy; 