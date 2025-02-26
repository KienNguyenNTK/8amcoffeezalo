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
        // try {
        //     const response = await axios.get(
        //         `https://nominatim.openstreetmap.org/search`,
        //         {
        //             params: {
        //                 q: address,
        //                 format: 'json',
        //                 limit: 1
        //             },
        //             headers: {
        //                 'User-Agent': '8amCoffee/1.0'
        //             }
        //         }
        //     );

        //     if (response.data && response.data[0]) {
        //         return {
        //             lat: parseFloat(response.data[0].lat),
        //             lon: parseFloat(response.data[0].lon)
        //         };
        //     }
        //     return null;
        // } catch (error) {
        //     console.error('Error getting coordinates:', error);
        //     return null;
        // }

        try {
            const response = await axios.get(
                `https://rsapi.goong.io/geocode`,
                {
                    params: {
                        address,
                        api_key: 'ukMOx7DOpbgqqXs0r4ZDtPWshyLzOZ3WMBAhA8Ea',
                    },

                }
            );

            if (response && response.data && response.data.results && response.data.results[0]) {
                console.log('response', response);
                return {
                    lat: response.data.results[0].geometry.location.lat,
                    lon: response.data.results[0].geometry.location.lng
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting coordinates:', error);
            return null;
        }
    }

    async calculateDistanceTwoPoints(): Promise<number | null> {
        // try {
        //     const response = await axios.get(
        //         `https://nominatim.openstreetmap.org/search`,
        //         {
        //             params: {
        //                 q: address,
        //                 format: 'json',
        //                 limit: 1
        //             },
        //             headers: {
        //                 'User-Agent': '8amCoffee/1.0'
        //             }
        //         }
        //     );

        //     if (response.data && response.data[0]) {
        //         return {
        //             lat: parseFloat(response.data[0].lat),
        //             lon: parseFloat(response.data[0].lon)
        //         };
        //     }
        //     return null;
        // } catch (error) {
        //     console.error('Error getting coordinates:', error);
        //     return null;
        // }

        try {
            const response = await axios.get("https://rsapi.goong.io/DistanceMatrix", {
                params: {
                    origins: '21.0175624,105.8583344',
                    destinations: '20.974711,105.8255184',
                    api_key: 'ukMOx7DOpbgqqXs0r4ZDtPWshyLzOZ3WMBAhA8Ea',
                },
            });

            const data = response.data;
            if (data && data.rows.length > 0) {
                console.log('data', data);
                return data.rows[0].elements[0].distance.text;
            }
        } catch (error) {
            console.error("Lỗi khi tính khoảng cách:", error);
        }
        return null;
    }

    async getConfig(): Promise<ShippingConfig | null> {
        try {
            const docRef = doc(this.collection, DEFAULT_CONFIG_ID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as any; // Use any temporarily for migration
                
                // Handle migration from storeLocation to storeLocations if needed
                if (data.storeLocation && !data.storeLocations) {
                    data.storeLocations = [data.storeLocation];
                    delete data.storeLocation;
                    
                    // Update the document to use the new structure
                    await this.updateConfig({
                        storeLocations: data.storeLocations
                    });
                }
                
                return data as ShippingConfig;
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
                storeLocations: [{
                    id: '1',
                    address: "34 P. Tăng Bạt Hổ, Phạm Đình Hổ, Hai Bà Trưng, Hà Nội, Việt Nam",
                    province: "Hà Nội",
                    district: "Hai Bà Trưng",
                    ward: "Phạm Đình Hổ",
                    street: "P. Tăng Bạt Hổ",
                    lat: 21.0175624,
                    lon: 105.8583344
                }],
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
            // Nếu có cập nhật địa chỉ mới, lấy tọa độ mới cho từng địa chỉ
            if (config.storeLocations) {
                const updatedLocations: StoreLocation[] = [];
                
                for (const location of config.storeLocations) {
                    // Nếu địa chỉ đã có tọa độ và không thay đổi, giữ nguyên
                    if (location.lat && location.lon && location.lat !== 0 && location.lon !== 0) {
                        updatedLocations.push(location);
                        continue;
                    }
                    
                    // Tạo địa chỉ đầy đủ từ các thành phần
                    const fullAddress = `${location.address}, ${location.street}, ${location.ward}, ${location.district}, ${location.province}`;
                    
                    const coordinates = await this.getCoordinates(fullAddress);
                    if (coordinates) {
                        updatedLocations.push({
                            ...location,
                            ...coordinates
                        });
                    } else {
                        throw new Error(`Không thể lấy tọa độ từ địa chỉ: ${fullAddress}`);
                    }
                }
                
                config.storeLocations = updatedLocations;
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

    async calculateShippingFeeFromTwoAddress(customerAddress: any, storeAddress: any): Promise<any> {
        try {
            const response = await axios.get("https://services.giaohangtietkiem.vn/services/shipment/fee", {
                params: {
                    address: customerAddress.address,
                    province: customerAddress.province,
                    district: customerAddress.district,
                    ward: customerAddress.ward,
                    pick_address: storeAddress.address,
                    pick_province: storeAddress.province, 
                    pick_district: storeAddress.district,
                    pick_ward: storeAddress.ward,
                    pick_street: storeAddress.street,
                    weight: 500,
                    deliver_option: 'xteam'
                },
                headers: {
                    'Token': '15KkLTfwQkVinEABl7i3wdV0xCC49bwGOlbyfE1'
                }
            });

            const data = response.data;
            console.log('data', data);
            return data;
        } catch (error) {
            console.error("Lỗi khi tính khoảng cách:", error);
        }
        return null;
    }
}

export const shippingConfigService = new ShippingConfigService(); 