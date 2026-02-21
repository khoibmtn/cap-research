import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { AddressEntry } from './exportService';

const SETTINGS_DOC = 'app_settings/addresses';

export const settingsService = {
    async getAddresses(): Promise<AddressEntry[]> {
        try {
            const snap = await getDoc(doc(db, SETTINGS_DOC));
            if (snap.exists()) {
                return snap.data().entries ?? [];
            }
        } catch (e) {
            console.warn('Failed to load addresses from Firestore', e);
        }
        return [];
    },

    async saveAddresses(entries: AddressEntry[]): Promise<void> {
        await setDoc(doc(db, SETTINGS_DOC), { entries });
    },

    async getPrintSettings(): Promise<Record<string, unknown> | null> {
        try {
            const snap = await getDoc(doc(db, 'app_settings/print'));
            if (snap.exists()) return snap.data();
        } catch (e) {
            console.warn('Failed to load print settings from Firestore', e);
        }
        return null;
    },

    async savePrintSettings(settings: Record<string, unknown>): Promise<void> {
        await setDoc(doc(db, 'app_settings/print'), settings);
    },

    /** Generic list persistence — each key maps to a Firestore doc */
    async getList(key: string): Promise<string[] | null> {
        try {
            const snap = await getDoc(doc(db, `app_settings/lists_${key}`));
            if (snap.exists()) return snap.data().items ?? null;
        } catch (e) {
            console.warn(`Failed to load list "${key}" from Firestore`, e);
        }
        return null;
    },

    async saveList(key: string, items: string[]): Promise<void> {
        await setDoc(doc(db, `app_settings/lists_${key}`), { items });
    },

    async getColumnConfig(): Promise<string[] | null> {
        try {
            const snap = await getDoc(doc(db, 'app_settings/dashboard_columns'));
            if (snap.exists()) return snap.data().columns ?? null;
        } catch (e) {
            console.warn('Failed to load column config from Firestore', e);
        }
        return null;
    },

    async saveColumnConfig(columns: string[]): Promise<void> {
        await setDoc(doc(db, 'app_settings/dashboard_columns'), { columns });
    },

    async getBackupColumnConfig(uid: string): Promise<string[] | null> {
        try {
            const snap = await getDoc(doc(db, `user_settings/${uid}/preferences/backup_columns`));
            if (snap.exists()) return snap.data().columns ?? null;
        } catch (e) {
            console.warn('Failed to load backup column config from Firestore', e);
        }
        return null;
    },

    async saveBackupColumnConfig(uid: string, columns: string[]): Promise<void> {
        await setDoc(doc(db, `user_settings/${uid}/preferences/backup_columns`), { columns });
    },
};
