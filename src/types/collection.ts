interface CoffeeCollection {
    id?: string;
    headline: string;        // Tiêu đề tuyển tập (vd: "Người nổi tiếng uống gì")
    name: string;           // Tên tuyển tập (vd: "Top 5 loại cà phê tốt nhất 2024")
    description: string;    // Mô tả chi tiết về tuyển tập
    imageUrl?: string;      // Hình ảnh đại diện cho tuyển tập
    items: {
        itemId: string;     // ID của cà phê hoặc đồ uống
        order: number;      // Thứ tự hiển thị
        type: 'coffee' | 'drink';  // Phân biệt loại item
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}

export type { CoffeeCollection }; 