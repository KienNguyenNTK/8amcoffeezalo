import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';
import { ShippingConfig, StoreLocation } from '../types/shipping';
import axios from 'axios';

const SHIPPING_CONFIG_COLLECTION = 'shippingConfigs';
const DEFAULT_CONFIG_ID = 'default';

class ShippingConfigService {
    private collection = collection(db, SHIPPING_CONFIG_COLLECTION);

    // Hàm lấy tọa độ từ địa chỉ sử dụng Nominatim API
    async getCoordinates(address: string): Promise<{ lat: number; lon: number; } | null> {
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/search`,
                {
                    params: {
                        q: address,
                        format: 'json',
                        limit: 1
                    },
                    headers: {
                        'User-Agent': '8amCoffee/1.0'
                    }
                }
            );

            if (response.data && response.data[0]) {
                return {
                    lat: parseFloat(response.data[0].lat),
                    lon: parseFloat(response.data[0].lon)
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting coordinates:', error);
            return null;
        }
    }

    async getConfig(): Promise<ShippingConfig | null> {
        try {
            const docRef = doc(this.collection, DEFAULT_CONFIG_ID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as ShippingConfig;
            }

            // If no config exists, create default config
            const defaultConfig: ShippingConfig = {
                ranges: [
                    { minDistance: 0, maxDistance: 2, fee: 15000 },
                    { minDistance: 2, maxDistance: 5, fee: 25000 },
                    { minDistance: 5, maxDistance: 10, fee: 35000 }
                ],
                maxFee: 50000,
                enableMaxFee: true,
                storeLocation: {
                    address: "34 P. Tăng Bạt Hổ, Phạm Đình Hổ, Hai Bà Trưng, Hà Nội, Việt Nam",
                    lat: 21.0175624,
                    lon: 105.8583344
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await this.createConfig(defaultConfig);
            return defaultConfig;
        } catch (error) {
            console.error('Error getting shipping config:', error);
            return null;
        }
    }

    async createConfig(config: ShippingConfig): Promise<void> {
        try {
            const docRef = doc(this.collection, DEFAULT_CONFIG_ID);
            await setDoc(docRef, {
                ...config,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error creating shipping config:', error);
            throw error;
        }
    }

    async updateConfig(config: Partial<ShippingConfig>): Promise<void> {
        try {
            // Nếu có cập nhật địa chỉ mới, lấy tọa độ mới
            if (config.storeLocation?.address) {
                const coordinates = await this.getCoordinates(config.storeLocation.address);
                if (coordinates) {
                    config.storeLocation = {
                        ...config.storeLocation,
                        ...coordinates
                    };
                } else {
                    throw new Error('Không thể lấy tọa độ từ địa chỉ này');
                }
            }

            const docRef = doc(this.collection, DEFAULT_CONFIG_ID);
            await updateDoc(docRef, {
                ...config,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating shipping config:', error);
            throw error;
        }
    }

    calculateShippingFee(distanceInKm: number, config: ShippingConfig): number {
        console.log('distanceInKm', distanceInKm);

        // Nếu khoảng cách là 0 hoặc âm, trả về 0
        if (distanceInKm <= 0) return 0;

        // Tìm khoảng cách phù hợp từ config
        const applicableRange = config.ranges.find(
            range => distanceInKm >= range.minDistance && distanceInKm <= range.maxDistance
        );

        console.log('applicableRange', applicableRange);

        if (applicableRange) {
            return applicableRange.fee;
        }

        // Kiểm tra nếu khoảng cách vượt quá thresholdDistance
        if (config.isThresholdDistance && config.thresholdDistance && distanceInKm > config.thresholdDistance) {
            const excessDistance = distanceInKm - config.thresholdDistance;
            return config.feePerKm ? config.feePerKm * excessDistance : config.maxFee;
        }

        // Nếu không tìm thấy khoảng cách phù hợp, có thể trả về phí tối đa hoặc một giá trị mặc định
        return config.maxFee; // Hoặc một giá trị mặc định khác
    }

    // Hàm tính khoảng cách giữa 2 điểm dựa trên tọa độ
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return Math.round(d * 100) / 100; // Round to 2 decimal places
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}

export const shippingConfigService = new ShippingConfigService(); 