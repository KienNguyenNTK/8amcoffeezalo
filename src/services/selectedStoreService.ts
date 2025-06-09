import type { Store } from '../types/store';

export class SelectedStoreService {
    private static STORAGE_KEY = 'selectedStore';

    static setSelectedStore(store: Store): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
    }

    static getSelectedStore(): Store | null {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as Store;
            }
        } catch (error) {
            console.error('Error parsing selected store from localStorage:', error);
            this.clearSelectedStore();
        }
        return null;
    }

    static clearSelectedStore(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    static hasSelectedStore(): boolean {
        return this.getSelectedStore() !== null;
    }

    static getSelectedStoreId(): string | null {
        const store = this.getSelectedStore();
        return store?.id || null;
    }

    static getSelectedStoreName(): string | null {
        const store = this.getSelectedStore();
        return store?.name || null;
    }
} 