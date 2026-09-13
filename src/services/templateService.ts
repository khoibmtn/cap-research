import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface AnalysisTemplate {
    id: string;
    name: string;
    type: 'crosstab' | 'regression';
    isDefault?: boolean;
    createdAt: string;
    updatedAt: string;
    config: Record<string, any>;
}

const TEMPLATES_COLLECTION = 'analysis_templates';
const LOCAL_STORAGE_PREFIX = 'cap_analysis_templates_';
const LAST_STATE_PREFIX = 'cap_last_state_';

function getLocalKey(type: 'crosstab' | 'regression'): string {
    return `${LOCAL_STORAGE_PREFIX}${type}`;
}

function getLocalLastStateKey(type: 'crosstab' | 'regression'): string {
    return `${LAST_STATE_PREFIX}${type}`;
}

function loadLocalTemplates(type: 'crosstab' | 'regression'): AnalysisTemplate[] {
    try {
        const raw = localStorage.getItem(getLocalKey(type));
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch { /* ignore */ }
    return [];
}

function saveLocalTemplates(type: 'crosstab' | 'regression', templates: AnalysisTemplate[]): void {
    try {
        localStorage.setItem(getLocalKey(type), JSON.stringify(templates));
    } catch { /* ignore */ }
}

/**
 * Lấy danh sách template theo loại (crosstab hoặc regression)
 * Đồng bộ hai chiều thông minh: Remote (Firestore) + Local Cache
 */
export async function getTemplates(type: 'crosstab' | 'regression'): Promise<AnalysisTemplate[]> {
    const local = loadLocalTemplates(type);
    let remote: AnalysisTemplate[] = [];

    try {
        const q = query(collection(db, TEMPLATES_COLLECTION), where('type', '==', type));
        const snap = await getDocs(q);
        snap.forEach(d => {
            remote.push({ id: d.id, ...d.data() } as AnalysisTemplate);
        });
    } catch (err) {
        console.warn(`Không thể tải template ${type} từ Firestore, dùng cache local:`, err);
    }

    // Merge thông minh 2 chiều: Không bao giờ làm mất mẫu ở local nếu remote chưa có
    const mergedMap = new Map<string, AnalysisTemplate>();

    // Đưa remote vào map trước
    for (const r of remote) {
        mergedMap.set(r.id, r);
    }

    // Đưa local vào map: nếu chưa có ở remote hoặc local mới hơn thì giữ local và tự động đẩy lên Firestore
    const needSyncToRemote: AnalysisTemplate[] = [];
    for (const l of local) {
        const r = mergedMap.get(l.id);
        if (!r) {
            // Local có mà remote chưa có -> giữ và tự động đồng bộ lên Firestore
            mergedMap.set(l.id, l);
            needSyncToRemote.push(l);
        } else {
            // Cả hai cùng có -> so sánh updatedAt
            const localUpdated = new Date(l.updatedAt || 0).getTime();
            const remoteUpdated = new Date(r.updatedAt || 0).getTime();
            if (localUpdated > remoteUpdated) {
                mergedMap.set(l.id, l);
                needSyncToRemote.push(l);
            }
        }
    }

    // Tự động đẩy các mẫu chưa sync lên Firestore trong background
    if (needSyncToRemote.length > 0) {
        for (const item of needSyncToRemote) {
            setDoc(doc(db, TEMPLATES_COLLECTION, item.id), item, { merge: true }).catch((err) => {
                console.warn('Tự động sync template lên Firestore thất bại:', err);
            });
        }
    }

    const mergedList = Array.from(mergedMap.values());

    // Sắp xếp: Mặc định lên đầu, sau đó theo updatedAt giảm dần
    mergedList.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });

    // Cập nhật lại local cache đầy đủ
    saveLocalTemplates(type, mergedList);

    return mergedList;
}

/**
 * Lưu hoặc cập nhật template
 */
export async function saveTemplate(
    data: { id?: string; name: string; type: 'crosstab' | 'regression'; config: Record<string, any>; isDefault?: boolean }
): Promise<AnalysisTemplate> {
    const id = data.id || `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const existingList = loadLocalTemplates(data.type);
    const existing = existingList.find(t => t.id === id);

    const template: AnalysisTemplate = {
        id,
        name: data.name.trim(),
        type: data.type,
        isDefault: data.isDefault ?? existing?.isDefault ?? false,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        config: data.config,
    };

    // Nếu template này được đặt làm default, bỏ default các template khác
    let updatedList = existingList.filter(t => t.id !== id);
    if (template.isDefault) {
        updatedList = updatedList.map(t => ({ ...t, isDefault: false }));
    }
    updatedList.unshift(template);
    saveLocalTemplates(data.type, updatedList);

    // Đồng bộ Firestore
    try {
        const docRef = doc(db, TEMPLATES_COLLECTION, id);
        await setDoc(docRef, template, { merge: true });
    } catch (err) {
        console.warn('Lưu Firestore thất bại, đã lưu LocalStorage:', err);
    }

    return template;
}

/**
 * Xóa template
 */
export async function deleteTemplate(id: string, type: 'crosstab' | 'regression'): Promise<void> {
    const existingList = loadLocalTemplates(type);
    const updatedList = existingList.filter(t => t.id !== id);
    saveLocalTemplates(type, updatedList);

    try {
        const docRef = doc(db, TEMPLATES_COLLECTION, id);
        await deleteDoc(docRef);
    } catch (err) {
        console.warn('Xóa Firestore thất bại, đã xóa LocalStorage:', err);
    }
}

/**
 * Đổi tên template
 */
export async function renameTemplate(id: string, newName: string, type: 'crosstab' | 'regression'): Promise<AnalysisTemplate | null> {
    const list = loadLocalTemplates(type);
    const target = list.find(t => t.id === id);
    if (!target) return null;

    target.name = newName.trim();
    target.updatedAt = new Date().toISOString();
    saveLocalTemplates(type, list);

    try {
        const docRef = doc(db, TEMPLATES_COLLECTION, id);
        await setDoc(docRef, { name: target.name, updatedAt: target.updatedAt }, { merge: true });
    } catch (err) {
        console.warn('Đổi tên template Firestore thất bại, đã cập nhật LocalStorage:', err);
    }

    return target;
}

/**
 * Đặt template làm mặc định
 */
export async function setDefaultTemplate(id: string, type: 'crosstab' | 'regression'): Promise<void> {
    const list = loadLocalTemplates(type);
    const updated = list.map(t => ({
        ...t,
        isDefault: t.id === id
    }));
    saveLocalTemplates(type, updated);

    try {
        for (const t of updated) {
            const docRef = doc(db, TEMPLATES_COLLECTION, t.id);
            await setDoc(docRef, { isDefault: t.isDefault }, { merge: true });
        }
    } catch (err) {
        console.warn('Cập nhật default Firestore thất bại:', err);
    }
}

/**
 * Lưu trạng thái thao tác gần nhất (Last State)
 */
export function saveLastState(type: 'crosstab' | 'regression', state: any): void {
    try {
        localStorage.setItem(getLocalLastStateKey(type), JSON.stringify(state));
    } catch { /* ignore */ }
}

/**
 * Lấy trạng thái thao tác gần nhất (Last State)
 */
export function getLastState<T = any>(type: 'crosstab' | 'regression'): T | null {
    try {
        const raw = localStorage.getItem(getLocalLastStateKey(type));
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
}
