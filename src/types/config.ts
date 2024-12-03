export interface AppConfig {
    id?: string;
    access_token_zalo: string;
    refresh_token_zalo: string;
    token_expires_at: Date;
    createdAt?: Date;
    updatedAt?: Date;
}