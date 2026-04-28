import axios from 'axios';
import { Message, RelatedProduct } from '../types/message';
import { configService } from './configService';
import { db, storage } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    orderBy
} from 'firebase/firestore';

const COLLECTION_NAME = 'messages';
const ZALO_CONSULTING_ENDPOINT = 'https://openapi.zalo.me/v3.0/oa/message/cs';

const decodeHtmlEntities = (text: string): string => {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"');
};

const normalizeHtmlToPlainText = (input?: string): string => {
    if (!input) return '';

    const normalized = decodeHtmlEntities(
        input
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]+>/g, '')
    )
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return normalized;
};

const stripRedundantButtonLinks = (text: string, buttons: Array<{ payload?: any }>) => {
    if (!text) return '';

    const buttonUrls = buttons
        .map(button => button?.payload?.url)
        .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
        .map(url => url.trim());

    if (buttonUrls.length === 0) {
        return text;
    }

    const lines = text
        .split('\n')
        .map(line => line.trimEnd());

    const filteredLines: string[] = [];

    for (let index = 0; index < lines.length; index += 1) {
        const currentLine = lines[index].trim();
        const nextLine = lines[index + 1]?.trim();

        const isButtonUrlLine = buttonUrls.some(url => currentLine === url);
        const isLabelBeforeButtonUrl = /^(xem tin nhắn|xem chi tiết|xem thêm)\s*:?\s*$/i.test(currentLine)
            && buttonUrls.some(url => nextLine === url);

        if (isButtonUrlLine || isLabelBeforeButtonUrl) {
            continue;
        }

        filteredLines.push(lines[index]);
    }

    return filteredLines
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

const sanitizeConsultingButtons = (buttons?: Message['template_data'] extends infer T
    ? T extends { buttons?: infer B }
        ? B
        : never
    : never) => {
    if (!Array.isArray(buttons)) return [];

    return buttons
        .filter((button): button is NonNullable<typeof button> => Boolean(button?.title && button?.type))
        .map(button => ({
            title: button.title,
            type: button.type as string,
            payload: button.payload
        }));
};

// Helper function to check if URL is a Firebase Storage URL
const isFirebaseStorageUrl = (url: string): boolean => {
    try {
        return url.includes('firebasestorage.googleapis.com') || 
               url.includes('storage.googleapis.com') ||
               url.startsWith('gs://');
    } catch {
        return false;
    }
};

interface ZaloMessageElement {
    title?: string;
    image_url?: string;
    subtitle?: string;
    default_action?: {
        type: string;
        url?: string;
    };
}

interface ZaloMessageButton {
    title: string;
    type: string;
    payload?: any;
}

interface ZaloMessagePayload {
    template_type: string;
    elements: ZaloMessageElement[];
    buttons?: ZaloMessageButton[];
}

interface ZaloMessage {
    recipient: {
        user_id: string;
    };
    message: {
        attachment: {
            type: string;
            payload: ZaloMessagePayload;
        };
    };
}

export const messageService = {
    sendConsultingMessageToUser: async (
        zaloUserId: string,
        selectedMessage: Message,
        accessToken: string
    ): Promise<void> => {
        const templateData = selectedMessage.template_data;
        const bannerUrl = templateData?.banner?.image_url?.trim();
        const textSections = [
            templateData?.header?.content,
            templateData?.table?.rows?.map(row => `${row.key}: ${row.value}`).join('\n'),
            templateData?.text?.content,
            selectedMessage.content
        ]
            .map(section => normalizeHtmlToPlainText(section))
            .filter(Boolean);
        const normalizedText = textSections.join('\n\n').trim();
        const buttons = sanitizeConsultingButtons(templateData?.buttons);
        const cleanedText = stripRedundantButtonLinks(normalizedText, buttons);

        if (!bannerUrl && !cleanedText) {
            throw new Error('Không có nội dung hợp lệ để gửi tin tư vấn (ảnh hoặc text).');
        }

        if (bannerUrl) {
            await axios.post(ZALO_CONSULTING_ENDPOINT, {
                recipient: {
                    user_id: zaloUserId
                },
                message: {
                    attachment: {
                        type: 'media',
                        payload: {
                            elements: [
                                {
                                    media_type: 'image',
                                    url: bannerUrl
                                }
                            ]
                        }
                    }
                }
            }, {
                headers: {
                    access_token: accessToken,
                    'Content-Type': 'application/json'
                }
            });
        }

        if (cleanedText) {
            const textPayload: any = {
                recipient: {
                    user_id: zaloUserId
                },
                message: {
                    text: cleanedText
                }
            };

            if (buttons.length > 0) {
                textPayload.message.attachment = {
                    type: 'template',
                    payload: {
                        buttons
                    }
                };
            }

            await axios.post(ZALO_CONSULTING_ENDPOINT, textPayload, {
                headers: {
                    access_token: accessToken,
                    'Content-Type': 'application/json'
                }
            });
        }
    },

    getAllMessages: async () => {
        try {
            const querySnapshot = await getDocs(
                query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'))
            );
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
        } catch (error) {
            throw new Error('Could not fetch messages: ' + error);
        }
    },

    getMessage: async (id: string) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error('Message not found');
            }
            return { id: docSnap.id, ...docSnap.data() } as Message;
        } catch (error) {
            throw new Error('Could not fetch message: ' + error);
        }
    },

    uploadBanner: async (file: File): Promise<string> => {
        try {
            const storageRef = ref(storage, `message-banners/${Date.now()}-${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            return downloadUrl;
        } catch (error) {
            throw new Error('Could not upload banner: ' + error);
        }
    },

    createMessage: async (message: Partial<Message>, bannerFile?: File) => {
        try {
            let bannerUrl = '';
            if (bannerFile) {
                bannerUrl = await messageService.uploadBanner(bannerFile);
            }

            const messageData: Partial<Message> = {
                ...message,
                template_data: {
                    ...message.template_data,
                    banner: bannerUrl ? {
                        image_url: bannerUrl,
                        max_size: "1MB",
                        ratio: "1:1.5"
                    } : undefined
                },
                // Đảm bảo related_products được lưu đúng cách
                related_products: message.related_products || [],
                related_gifts: message.related_gifts || [],
                giftIds: message.giftIds || []
            };

            // Save to Firebase first
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...messageData,
                timestamp: new Date(),
                status: 'sent'
            });

            const savedMessage = { id: docRef.id, ...messageData } as Message;

            // If it's a Zalo template message, send it through Zalo API
            if (message.type === 'template' && message.template_data) {
                // const config = await configService.getConfig();
                
                // Convert our template to Zalo format
                const zaloMessage: ZaloMessage = {
                    recipient: {
                        user_id: message.receiverId || ''
                    },
                    message: {
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "list",
                                elements: []
                            }
                        }
                    }
                };

                // Add banner if exists
                if (message.template_data.banner) {
                    zaloMessage.message.attachment.payload.elements.push({
                        image_url: message.template_data.banner.image_url
                    });
                }

                // Add header if exists
                if (message.template_data.header) {
                    zaloMessage.message.attachment.payload.elements.push({
                        title: message.template_data.header.content
                    });
                }

                // Add table data if exists
                if (message.template_data.table?.rows) {
                    message.template_data.table.rows.forEach(row => {
                        zaloMessage.message.attachment.payload.elements.push({
                            title: `${row.key}: ${row.value}`
                        });
                    });
                }

                // Add text if exists
                if (message.template_data.text) {
                    zaloMessage.message.attachment.payload.elements.push({
                        title: message.template_data.text.content
                    });
                }

                // Add buttons if exists
                if (message.template_data.buttons) {
                    zaloMessage.message.attachment.payload.buttons = message.template_data.buttons.map(button => ({
                        title: button.title,
                        type: button.type || "oa.open.phone",
                        payload: button.payload
                    }));
                }

                // // Send to Zalo
                // await axios.post('https://openapi.zalo.me/v3.0/oa/message/cs', zaloMessage, {
                //     headers: {
                //         'access_token': config?.access_token_zalo,
                //         'Content-Type': 'application/json'
                //     }
                // });
            }

            return savedMessage;
        } catch (error) {
            throw new Error('Could not create message: ' + error);
        }
    },

    updateMessage: async (id: string, message: Partial<Message>, bannerFile?: File) => {
        try {
            let bannerUrl = message.template_data?.banner?.image_url;
            
            if (bannerFile) {
                bannerUrl = await messageService.uploadBanner(bannerFile);
            }

            const messageData = {
                ...message,
                template_data: {
                    ...message.template_data,
                    banner: bannerUrl ? {
                        image_url: bannerUrl,
                        max_size: "1MB",
                        ratio: "1:1.5"
                    } : undefined
                },
                // Cập nhật related_products
                related_products: message.related_products || []
            };

            if ('related_gifts' in message) {
                messageData.related_gifts = message.related_gifts || [];
            }

            if ('giftIds' in message) {
                messageData.giftIds = message.giftIds || [];
            }

            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...messageData,
                updatedAt: new Date()
            });
            return { id, ...messageData };
        } catch (error) {
            throw new Error('Could not update message: ' + error);
        }
    },

    deleteMessage: async (id: string) => {
        try {
            // Get message data first to delete banner if exists
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const bannerUrl = data.template_data?.banner?.image_url;
                
                // Xóa banner từ Firebase Storage nếu tồn tại
                if (bannerUrl && isFirebaseStorageUrl(bannerUrl)) {
                    try {
                        const bannerRef = ref(storage, bannerUrl);
                        await deleteObject(bannerRef);
                        console.log(`Successfully deleted message banner: ${bannerUrl}`);
                    } catch (error) {
                        console.error(`Error deleting message banner ${bannerUrl}:`, error);
                        // Tiếp tục xử lý dù có lỗi khi xóa ảnh
                    }
                } else if (bannerUrl) {
                    console.log(`Skipped non-Firebase Storage URL: ${bannerUrl}`);
                }

                console.log(`Storage cleanup for message ID ${id}: ${bannerUrl ? (isFirebaseStorageUrl(bannerUrl) ? '1 banner deleted' : '1 non-Firebase URL skipped') : 'no banner to delete'}`);
            }

            // Xóa document từ Firestore
            await deleteDoc(docRef);
            console.log(`Successfully deleted message document with ID: ${id}`);
            return true;
        } catch (error) {
            console.error(`Error deleting message with ID ${id}:`, error);
            throw new Error('Could not delete message: ' + error);
        }
    },

    markAsRead: async (id: string) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                status: 'read',
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            throw new Error('Could not mark message as read: ' + error);
        }
    },

    sendZaloMessage: async (messageData: any) => {
        try {
            const config = await configService.getConfig();
            const response = await axios.post(ZALO_CONSULTING_ENDPOINT, messageData, {
                headers: {
                    'access_token': config?.access_token_zalo || '',
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error sending Zalo message:', error);
            throw error;
        }
    },

    getMessageWithGifts: async (id: string) => {
        try {
            const message = await messageService.getMessage(id);
            
            // Nếu message có giftIds, load gift details
            if (message.giftIds && message.giftIds.length > 0) {
                // Import giftService nếu cần
                const { giftService } = await import('./giftService');
                const gifts = await Promise.all(
                message.giftIds.map(giftId => giftService.getGiftById(giftId))
            );
            return { ...message, gifts };
            }
            return message;
        } catch (error) {
            throw new Error('Could not fetch message with gifts: ' + error);
        }
    },
}; 
