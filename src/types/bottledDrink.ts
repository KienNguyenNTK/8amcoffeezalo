interface BottledDrink {
    id?: string;
    name: string;           
    description: string;    
    coffeeId: string;      
    coffeeName?: string;   
    origin: string[];        
    flavorNotes: string[]; 
    volumes: {
        volume: number;    // Dung tích (ml)
        price: number;     // Giá
    }[];
    images: string[];      
    createdAt?: Date;
    updatedAt?: Date;
}

export type { BottledDrink }; 