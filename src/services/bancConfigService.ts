import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
    type BancFieldVisibility,
    DEFAULT_BANC_VISIBILITY,
    BANC_STORAGE_KEY,
    loadBancVisibility
} from '../data/bancFields';

const SETTINGS_COLLECTION = 'app_settings';
const SETTINGS_DOC_ID = 'banc_visibility';

/**
 * Lấy cấu hình hiển thị trường BANC
 * Ưu tiên đọc từ cache LocalStorage, sau đó đồng bộ ngầm từ Firestore nếu có kết nối
 */
export async function getBancVisibility(): Promise<BancFieldVisibility> {
    const local = loadBancVisibility();

    try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            if (data?.visibility && typeof data.visibility === 'object') {
                const merged = { ...DEFAULT_BANC_VISIBILITY, ...data.visibility };
                try {
                    localStorage.setItem(BANC_STORAGE_KEY, JSON.stringify(merged));
                } catch { /* ignore */ }
                return merged;
            }
        }
    } catch (err) {
        console.warn('Không thể tải cấu hình BANC từ Firestore, dùng cache:', err);
    }

    return local;
}

/**
 * Lưu cấu hình hiển thị trường BANC
 * Ghi đồng thời vào LocalStorage và Firestore
 */
export async function saveBancVisibility(visibility: BancFieldVisibility): Promise<void> {
    // 1. Lưu LocalStorage trước để giao diện mượt mà tức thì
    try {
        localStorage.setItem(BANC_STORAGE_KEY, JSON.stringify(visibility));
    } catch { /* ignore */ }

    // 2. Đồng bộ Firestore
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        await setDoc(docRef, {
            visibility,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch (err) {
        console.warn('Lỗi khi lưu cấu hình BANC lên Firestore (đã lưu LocalStorage an toàn):', err);
    }
}
