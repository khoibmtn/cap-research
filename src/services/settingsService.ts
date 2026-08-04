import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { AddressEntry } from './exportService';
import type { SpssVarConfig } from '../types/spssTypes';

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

    /** Drug generic names (Nhóm 2) — stored as objects */
    async getDrugGenericNames(): Promise<{ ten: string; nhom1: string }[] | null> {
        try {
            const snap = await getDoc(doc(db, 'app_settings/drug_generic_names'));
            if (snap.exists()) return snap.data().items ?? null;
        } catch (e) {
            console.warn('Failed to load drug generic names from Firestore', e);
        }
        return null;
    },

    async saveDrugGenericNames(items: { ten: string; nhom1: string }[]): Promise<void> {
        await setDoc(doc(db, 'app_settings/drug_generic_names'), { items });
    },

    /** Clinical settings (Glasgow threshold, etc.) */
    async getClinicalSettings(): Promise<{ glasgowThreshold: number } | null> {
        try {
            const snap = await getDoc(doc(db, 'app_settings/clinical'));
            if (snap.exists()) return snap.data() as { glasgowThreshold: number };
        } catch (e) {
            console.warn('Failed to load clinical settings from Firestore', e);
        }
        return null;
    },

    async saveClinicalSettings(settings: { glasgowThreshold: number }): Promise<void> {
        await setDoc(doc(db, 'app_settings/clinical'), settings);
    },

    /** SPSS variable config (variable names, labels, value labels, slot counts) */
    async getSpssConfig(): Promise<SpssVarConfig | null> {
        try {
            const snap = await getDoc(doc(db, 'app_settings/spss_config'));
            if (snap.exists()) return snap.data() as SpssVarConfig;
        } catch (e) {
            console.warn('Failed to load SPSS config from Firestore', e);
        }
        return null;
    },

    async saveSpssConfig(config: SpssVarConfig): Promise<void> {
        await setDoc(doc(db, 'app_settings/spss_config'), {
            ...config,
            lastModified: new Date().toISOString(),
        });
    },
};
