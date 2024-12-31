import React, { useEffect, useState, useRef } from 'react';
import { IoNotificationsOutline } from "react-icons/io5";
import { Notification, notificationService } from '../firebase/notificationService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface NotificationBellProps {
    userId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const notifications = await notificationService.getUserNotifications(userId);
            setNotifications(notifications);
            const unreadCount = await notificationService.getUnreadCount(userId);
            setUnreadCount(unreadCount);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead && notification.id) {
            await notificationService.markAsRead(notification.id);
            fetchNotifications();
        }
        if (notification.link) {
            navigate(notification.link);
        }
        setIsOpen(false);
    };

    const getNotificationIcon = (type: string = 'system') => {
        switch (type) {
            case 'order':
                return '🛍️';
            case 'promotion':
                return '🎉';
            default:
                return '📢';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="relative p-2 text-gray-600 hover:text-gray-800"
                onClick={() => setIsOpen(!isOpen)}
            >
                <IoNotificationsOutline className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-x-0 top-20 mx-4 bg-white rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-semibold">Thông báo</h3>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                        !notification.isRead ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">
                                                {notification.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.content}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {dayjs(notification.createdAt.toDate()).fromNow()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                Không có thông báo nào
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell; 