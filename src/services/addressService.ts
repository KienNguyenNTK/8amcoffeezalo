interface AddressInfo {
    address: string;
    province: string;
    district: string;
    ward: string;
    fullName: string;
    phone: string;
    email: string;
}

const LOCAL_STORAGE_KEY = 'userAddress';

export const addressService = {
    saveAddress: (address: AddressInfo) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(address));
    },

    getAddress: (): AddressInfo | null => {
        const address = localStorage.getItem(LOCAL_STORAGE_KEY);
        return address ? JSON.parse(address) : null;
    },

    updateAddress: (address: Partial<AddressInfo>) => {
        const currentAddress = addressService.getAddress() || {};
        const updatedAddress = { ...currentAddress, ...address };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedAddress));
    },

    clearAddress: () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
};