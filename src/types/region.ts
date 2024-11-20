interface Region {
    id?: string;
    name: string;
    description: string;
    country?: string;
    altitude?: {
        min?: number;
        max?: number;
    };
    climate?: string;
    soil?: string;
    imageUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type { Region }; 