export interface AppConfig {
    id?: string;
    access_token_zalo: string;
    refresh_token_zalo: string;
    token_expires_at: Date;
    userIdMessage?: string[]; // Array các user ID sẽ nhận thông báo
    createdAt?: Date;
    updatedAt?: Date;
}