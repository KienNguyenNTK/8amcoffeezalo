export interface QRPaymentData {
    version: string;
    initiationMethod: string;
    bankInfo: {
        acquirerId: string;
        bankId: string;
        accountNumber: string;
        merchantName?: string;
    };
    currency: string;
    amount: number;
    country: string;
    merchantName?: string;
    merchantCity?: string;
    additionalData?: string;
    crc?: string;
    rawText: string;
} 