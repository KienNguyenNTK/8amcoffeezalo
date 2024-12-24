import React, { useEffect } from 'react';
import { authorize, getPhoneNumber, getUserInfo, getAccessToken, getUserID, followOA } from "zmp-sdk/apis";
import { useNavigate } from 'react-router-dom';
import { userService } from "../firebase/userService";
import { notification } from 'antd';
import axios from 'axios';
import { configService } from '../firebase/configService';
import { User } from "../types/user";

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
                    message: 'Cập nhật thông tin thành công!',
                    duration: 1.5,
                    placement: 'top',
                    closable: false
                });
            } catch (error) {
                console.error('Không thể cập nhật user:', error);
                notification.error({
                    message: 'Có lỗi xảy ra khi cập nhật thông tin!',
                    duration: 1.5,
                    placement: 'top',
                    closable: false
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
                    message: 'Đăng ký thành công!',
                    duration: 1.5,
                    placement: 'top',
                    closable: false
                });
            } catch (error) {
                console.error('Không thể tạo user:', error);
                notification.error({
                    message: 'Có lỗi xảy ra khi tạo tài khoản!',
                    duration: 1.5,
                    placement: 'top',
                    closable: false
                });
            }
        }
    };

    useEffect(() => {
        const handleAuthorize = async () => {
            try {
                // Kiểm tra user hiện tại
                const userId = await getUserID();
                const currentUser = await userService.getUserByLocalId(userId) as User | null;

                let isFollowedCheck = currentUser?.isFollowed;
                let phoneNumberCheck = currentUser?.phoneNumber;

                if (isFollowedCheck && phoneNumberCheck) {

                    notification.success({
                        message: 'Bạn đã là hội viên của chúng tôi!',
                        description: 'Chúc bạn có những trải nghiệm tuyệt vời!',
                        duration: 1.5,
                        placement: 'top',
                        closable: false
                    });

                    navigate('/');
                    return;
                }

                // Chỉ gọi followOA nếu user chưa follow
                if (!currentUser?.isFollowed) {
                    try {
                        await followOA({
                            id: '2315491439411829194'
                        });

                        isFollowedCheck = true;

                        // notification.success({
                        //     message: 'Thành công',
                        //     description: 'Cảm ơn bạn đã quan tâm OA của chúng tôi!',
                        //     duration: 1.5,
                        //     placement: 'top',
                        //     closable: false
                        // });
                    } catch (error) {
                        console.error('Lỗi khi follow OA:', error);
                        // navigate('/profile');

                        isFollowedCheck = false;
                    }
                }

                // Xin quyền và lấy số điện thoại nếu user chưa có
                if (!currentUser?.phoneNumber) {
                    try {
                        // 1. Xin quyền truy cập
                        await authorize({
                            scopes: ['scope.userInfo', 'scope.userPhonenumber']
                        });

                        // 2. Lấy token phone number và access token
                        const [phoneResult, accessToken] = await Promise.all([
                            getPhoneNumber(),
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

                        console.log('response', response.data);

                        const phoneNumber = response.data.data.number;

                        phoneNumberCheck = phoneNumber;

                        // // 4. Cập nhật số điện thoại cho user
                        // if (currentUser) {
                        //     await userService.updateUserByLocalId(userId, {
                        //         phoneNumber,
                        //         isFollowed: isFollowedCheck,
                        //     });
                        // } else {
                        //     // Tạo user mới nếu chưa tồn tại
                        //     const { userInfo } = await getUserInfo();
                        //     const newUser = {
                        //         localId: userId,
                        //         name: userInfo.name || 'Người dùng',
                        //         phoneNumber: phoneNumber,
                        //         isFollowed: isFollowedCheck,
                        //         password: userId,
                        //     };
                        //     await userService.createUser(newUser);
                        // }

                        // notification.success({
                        //     message: 'Thành công',
                        //     description: 'Đã cập nhật số điện thoại!',
                        //     duration: 1.5,
                        //     placement: 'top'
                        // });

                    } catch (error) {
                        console.error('Lỗi khi lấy số điện thoại:', error);
                        phoneNumberCheck = '';
                        // notification.error({
                        //     message: 'Lỗi',
                        //     description: 'Không thể lấy số điện thoại. Vui lòng thử lại sau.',
                        //     duration: 1.5,
                        //     placement: 'top'
                        // });
                    }
                }

                // const configZalo = await configService.getConfig();
                // console.log('configZalo', configZalo);

                // // getAccessToken({
                // //     success: async (accessToken) => {

                // //         console.log('accessToken authorize', accessToken);

                // //         // await configService.saveZaloTokens(accessToken, configZalo?.refresh_token_zalo, configZalo?.expires_in);
                // //     },
                // //     fail: (error) => {
                // //         console.log(error);
                // //     }
                // // });

                // await axios.post(`https://oauth.zaloapp.com/v4/oa/access_token`, {
                //     app_id: '2448144731783137375',
                //     grant_type: 'refresh_token',
                //     refresh_token: configZalo?.refresh_token_zalo
                // },
                //     {
                //         headers: {
                //             'Content-Type': 'application/x-www-form-urlencoded',
                //             'secret_key': 'g8RUo6XKj3V7RoSuEom1'
                //         }
                //     }
                // ).then(async (response) => {
                //     console.log('response', response.data);

                //     await configService.saveZaloTokens(response.data.access_token, response.data.refresh_token, response.data.expires_in);

                // }).catch((error) => {
                //     console.error('error', error);
                // });

                const newConfigZalo = await configService.getConfig();

                console.log('newConfigZalo', newConfigZalo);

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
                            isFollowed: isFollowedCheck,
                            phoneNumber: phoneNumberCheck,
                        });

                        notification.success({
                            message: 'Cập nhật thông tin thành công!',
                            duration: 1.5,
                            placement: 'top',
                            closable: false
                        });
                    } else {
                        // Tạo người dùng mới nếu chưa tồn tại
                        const newUser = {
                            localId: userId,
                            name: userInfo.display_name || 'Người dùng',
                            isFollowed: isFollowedCheck,
                            phoneNumber: phoneNumberCheck || '',
                            password: userId,
                        };

                        await userService.createUser(newUser);
                        notification.success({
                            message: 'Tạo tài khoản thành công!',
                            duration: 1.5,
                            placement: 'top',
                            closable: false
                        });
                    }
                    

                    // Chuyển hướng sau khi hoàn tất
                    navigate('/profile');

                }).catch((error) => {
                    console.error('error user detail', error);
                    // notification.error({
                    //     message: 'Có lỗi xảy ra khi lấy thông tin người dùng!'
                    // });
                    navigate('/profile');
                });

            } catch (error) {
                console.error('Lỗi xác thực:', error);
                // notification.error({
                //     message: 'Quan tâm OA của chúng tôi để được hỗ trợ tốt hơn!'
                // });
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