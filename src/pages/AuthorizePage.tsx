import React, { useEffect } from 'react';
import { authorize, getPhoneNumber, getUserInfo, getAccessToken, getUserID } from "zmp-sdk/apis";
import { useNavigate } from 'react-router-dom';
import { userService } from "../firebase/userService";
import { notification } from 'antd';
import axios from 'axios';

const AuthorizePage: React.FC = () => {
    const navigate = useNavigate();

    const handleUserData = async (phoneNumber: string, userInfo: any) => {
        // const idUser = localStorage.getItem('idUser');
        // console.log('idUser: ', idUser);

        const userId = await getUserID();
        const user = await userService.getUserByLocalId(userId);

        if (user) {
            try {
                await userService.updateUserByLocalId(userId, {
                    phoneNumber,
                    name: userInfo.name || 'Người dùng',
                    password: userId
                });
                notification.success({
                    message: 'Cập nhật thông tin thành công!'
                });
            } catch (error) {
                console.error('Không thể cập nhật user:', error);
                notification.error({
                    message: 'Có lỗi xảy ra khi cập nhật thông tin!'
                });
            }
        } else {
            const newUser = {
                localId: userId,
                name: userInfo.name || 'Người dùng',
                phoneNumber: phoneNumber,
                password: userId,
            };

            try {
                await userService.createUser(newUser);
                notification.success({
                    message: 'Đăng ký thành công!'
                });
            } catch (error) {
                console.error('Không thể tạo user:', error);
                notification.error({
                    message: 'Có lỗi xảy ra khi tạo tài khoản!'
                });
            }
        }
    };

    useEffect(() => {
        const handleAuthorize = async () => {
            try {
                // 1. Authorize với Zalo
                await authorize({
                    scopes: ['scope.userInfo', 'scope.userPhonenumber']
                });

                // 2. Lấy thông tin token phone number và user info
                const [phoneResult, userInfoResult, accessToken] = await Promise.all([
                    getPhoneNumber(),
                    getUserInfo(),
                    getAccessToken()
                ]);

                // 3. Lấy số điện thoại từ API Zalo
                const response = await axios.get('https://graph.zalo.me/v2.0/me/info', {
                    headers: {
                        'access_token': accessToken,
                        'code': phoneResult.token,
                        'secret_key': 'g8RUo6XKj3V7RoSuEom1'
                    }
                });

                const phoneNumber = response.data.data.number;
                const { userInfo } = userInfoResult;

                console.log('phoneNumber: ', phoneNumber);
                console.log('userInfo: ', userInfo);

                // 4. Lưu thông tin vào database
                await handleUserData(phoneNumber, userInfo);

                // 5. Lưu thông tin user vào localStorage
                localStorage.setItem('userInfo', JSON.stringify(userInfo));

                // 6. Chuyển hướng sau khi hoàn tất
                navigate('/rewards');

            } catch (error) {
                console.error('Lỗi xác thực:', error);
                notification.error({
                    message: 'Có lỗi xảy ra trong quá trình xác thực!'
                });
                navigate('/rewards');
            }
        };

        handleAuthorize();
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <p>Đang xử lý xác thực...</p>
            </div>
        </div>
    );
};

export default AuthorizePage; 