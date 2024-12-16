import React, { useEffect } from 'react';
import { authorize, getPhoneNumber, getUserInfo, getAccessToken, getUserID, followOA } from "zmp-sdk/apis";
import { useNavigate } from 'react-router-dom';
import { userService } from "../firebase/userService";
import { notification } from 'antd';
import axios from 'axios';
import { configService } from '../firebase/configService';

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
                await followOA({
                    id: '2315491439411829194'
                });

                notification.success({
                    message: 'Thành công',
                    description: 'Cảm ơn bạn đã quan tâm OA của chúng tôi!',
                    duration: 2,
                    placement: 'top'
                });

                const userId = await getUserID();

                const configZalo = await configService.getConfig();
                console.log('configZalo', configZalo);

                await axios.post(`https://oauth.zaloapp.com/v4/oa/access_token`, {
                    app_id: import.meta.env.VITE_ZALO_APP_ID,
                    grant_type: 'refresh_token',
                    refresh_token: configZalo?.refresh_token_zalo
                },
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'secret_key': import.meta.env.VITE_ZALO_SECRET_KEY
                        }
                    }
                ).then(async (response) => {
                    console.log('response', response.data);

                    await configService.saveZaloTokens(response.data.access_token, response.data.refresh_token, response.data.expires_in);

                }).catch((error) => {
                    console.error('error', error);
                });

                const newConfigZalo = await configService.getConfig();

                await axios.get(`https://openapi.zalo.me/v3.0/oa/user/detail?data={"user_id":"${userId}"}`, {
                    headers: {
                        'access_token': newConfigZalo?.access_token_zalo,
                        'Content-Type': 'application/json'
                    }
                }).then(async (response) => {
                    console.log('response user detail', response.data);

                    const userInfo = response.data.data;
                    const user = await userService.getUserByLocalId(userId);

                    if (user) {
                        // Cập nhật thông tin người dùng nếu đã tồn tại
                        await userService.updateUserByLocalId(userId, {
                            isFollowed: true,
                        });

                        notification.success({
                            message: 'Cập nhật thông tin thành công!'
                        });
                    } else {
                        // Tạo người dùng mới nếu chưa tồn tại
                        const newUser = {
                            localId: userId,
                            name: userInfo.display_name || 'Người dùng',
                            isFollowed: true,
                            phoneNumber: userInfo.shared_info.phone || '',
                            password: userId,
                        };

                        await userService.createUser(newUser);
                        notification.success({
                            message: 'Tạo tài khoản thành công!'
                        });
                    }

                    // Chuyển hướng sau khi hoàn tất
                    navigate('/profile');

                }).catch((error) => {
                    console.error('error user detail', error);
                    notification.error({
                        message: 'Có lỗi xảy ra khi lấy thông tin người dùng!'
                    });
                    navigate('/profile');
                });

            } catch (error) {
                console.error('Lỗi xác thực:', error);
                notification.error({
                    message: 'Có lỗi xảy ra trong quá trình xác thực!'
                });
                navigate('/profile');
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