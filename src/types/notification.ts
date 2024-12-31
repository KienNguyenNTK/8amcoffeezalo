import { Timestamp } from 'firebase/firestore';

export type NotificationType = 'order' | 'system' | 'promotion' | 'favorite';

export interface Notification {
    id?: string;
    userId: string;
    title: string;
    content: string;
    isRead: boolean;
    type: NotificationType;
    createdAt: Timestamp;
    link?: string;
    image?: string; // Optional image URL for the notification
    metadata?: {
        orderId?: string;
        productId?: string;
        promotionId?: string;
        [key: string]: any;
    };
    priority?: 'high' | 'medium' | 'low';
    expiresAt?: Timestamp; // Optional expiration date for temporary notifications
    actions?: NotificationAction[]; // Optional actions that can be performed on the notification
}

export interface NotificationAction {
    label: string;
    action: 'view' | 'dismiss' | 'link';
    url?: string;
    data?: any;
}

export interface NotificationPreferences {
    userId: string;
    enablePush: boolean;
    enableEmail: boolean;
    mutedUntil?: Timestamp;
    mutedTypes?: NotificationType[];
    categories?: {
        [key in NotificationType]: boolean;
    };
}

// Constants for notification types
export const NOTIFICATION_TYPES = {
    ORDER: 'order' as NotificationType,
    SYSTEM: 'system' as NotificationType,
    PROMOTION: 'promotion' as NotificationType,
    FAVORITE: 'favorite' as NotificationType,
};

// Constants for notification priorities
export const NOTIFICATION_PRIORITIES = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
} as const;

// Helper type for notification grouping
export interface NotificationGroup {
    date: string;
    notifications: Notification[];
} 