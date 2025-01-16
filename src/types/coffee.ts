interface CuppingScore {
    fragrance: number;      // Mùi hương (Fragrance)
    wetAroma: number;       // Hương ướt (Wet Aroma)
    brightness: number;     // Độ sáng (Brightness)
    flavor: number;         // Hương vị (Flavor)
    body: number;           // Thể chất (Body)
    finish: number;         // Kết thúc (Finish)
    sweetness: number;      // Độ ngọt (Sweetness)
    cleanCup: number;       // Tách sạch (Clean Cup)
    complexity: number;     // Độ phức tạp (Complexity)
    uniformity: number;     // Tính đồng nhất (Uniformity)
    total: number;          // Tổng điểm
}

interface FlavorScore {
    floral: number;      // Hương hoa
    honey: number;       // Mật ong
    sugars: number;      // Đường
    caramel: number;     // Caramel
    fruits: number;      // Trái cây
    citrus: number;      // Cam quýt
    berry: number;       // Dâu
    cocoa: number;       // Ca cao
    nuts: number;        // Hạt
    rustic: number;      // Mộc
    spice: number;       // Gia vị
    body: number;        // Thể chất
    total: number;       // Tổng điểm
}

// Thêm type cho roast levels
type RoastLevel = 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';

interface CoffeeBean {
    id?: string;
    name: string;
    imageUrl?: string;
    images: string[];
    roastLevel: RoastLevel[];
    beanInfo: string;
    region: string[];
    altitude?: {
        min?: number;
        max?: number;
    };
    processingMethod: string[];
    flavorNotes: string[];
    brewingMethods: {
        espresso?: boolean;
        pourOver?: boolean;
        phin?: boolean;
    };
    beanType: string[]; // Thay đổi từ object sang array of strings
    roastDate: any;
    daysFromRoast: number;
    cuppingScore: CuppingScore;
    flavorScore: FlavorScore;
    weightAndPrice: {
        weight: number;
        price: number;
    }[];
    isSingleOrigin: boolean;
    blend?: {
        components: {
            origin: string;
            percentage: number;
        }[];
    };
    driveImages: {
        fileId: string;
        webViewLink: string;
        fileName?: string;
    }[];
    expirationMonths: number; // Số tháng hết hạn
    purchaseCount: number; // Number of times purchased
    createdAt: Date;
    updatedAt: Date;
}

export type { CoffeeBean, CuppingScore, FlavorScore }; 