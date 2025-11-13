export interface ZaloMessageComponent {
    type: 'banner' | 'header' | 'table' | 'text' | 'button';
    content?: string;
    align?: 'left' | 'center' | 'right';
    image_url?: string;
    attachment_id?: string;
    title?: string;
    payload?: any;
    image_icon?: string;
}

// Interface cho sản phẩm liên quan
export interface RelatedProduct {
    id: string;
    name: string;
    type: 'coffee' | 'bottled_drink' | 'dish' | 'coffee_equipment';
    price?: number;
    originalId?: string; // ID gốc trong collection tương ứng
}

export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Date;
    status: 'sent' | 'delivered' | 'read';
    type: 'text' | 'image' | 'template';
    imageUrl?: string;
    
    // Sản phẩm liên quan
    related_products?: RelatedProduct[];

    giftIds?: string[];
    
    // Zalo specific fields
    components?: ZaloMessageComponent[];
    template_data?: {
        banner?: {
            image_url: string;
            attachment_id?: string;
            max_size?: string; // e.g. "1MB"
            ratio?: string; // e.g. "1:1.5"
        };
        header?: {
            content: string;
            align?: 'left' | 'center' | 'right';
        };
        table?: {
            rows: Array<{
                key: string;
                value: string;
            }>;
        };
        text?: {
            content: string;
            align?: 'left' | 'center' | 'right';
        };
        buttons?: Array<{
            title: string;
            image_icon?: string;
            type?: string;
            payload?: any;
        }>;
    };
}

export interface MessageFilter {
    searchText?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
} 