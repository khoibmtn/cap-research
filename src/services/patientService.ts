import {
    collection, doc, addDoc, updateDoc, deleteDoc,
    getDocs, getDoc, onSnapshot, query, orderBy,
    serverTimestamp,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Patient } from '../types/patient';

const COLLECTION = 'patients';

export const patientService = {
    async create(data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Auto-backup (fire-and-forget — never blocks patient creation)
        const patientLabel = [data.maBenhNhanNghienCuu, data.hanhChinh?.hoTen].filter(Boolean).join(' - ');
        const note = patientLabel ? `thêm ${patientLabel}` : undefined;
        import('./backupService').then(({ backupService }) => {
            backupService.createAutoBackup(note);
        }).catch(() => { /* silent */ });

        return docRef.id;
    },

    async update(id: string, data: Partial<Patient>): Promise<void> {
        const docRef = doc(db, COLLECTION, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    async delete(id: string): Promise<void> {
        // Auto-backup before delete (await to ensure backup completes before deletion)
        try {
            const patient = await this.getById(id);
            const patientLabel = patient
                ? [patient.maBenhNhanNghienCuu, patient.hanhChinh?.hoTen].filter(Boolean).join(' - ')
                : id;
            const { backupService } = await import('./backupService');
            await backupService.createAutoBackup(`xóa ${patientLabel}`);
        } catch { /* silent — don't block deletion */ }

        await deleteDoc(doc(db, COLLECTION, id));
    },

    async getById(id: string): Promise<Patient | null> {
        const docSnap = await getDoc(doc(db, COLLECTION, id));
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as Patient;
    },

    async getAll(): Promise<Patient[]> {
        const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Patient));
    },

    subscribeAll(callback: (patients: Patient[]) => void): Unsubscribe {
        const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const patients = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Patient));
            callback(patients);
        });
    },

    /**
     * Reassign maBenhNhanNghienCuu for all enabled patients sequentially.
     * Sorts by current CAP number, then assigns CAP001, CAP002, ... with no gaps.
     * Creates a backup before making changes.
     * Returns the number of patients updated.
     */
    async reassignMaBNNC(patients: Patient[], { skipBackup = false }: { skipBackup?: boolean } = {}): Promise<{ updated: number; mapping: { old: string; new: string; name: string }[] }> {
        const enabled = patients
            .filter((p) => !p.disabled)
            .sort((a, b) => {
                const numA = parseInt(a.maBenhNhanNghienCuu?.match(/^CAP(\d+)$/i)?.[1] || '0', 10);
                const numB = parseInt(b.maBenhNhanNghienCuu?.match(/^CAP(\d+)$/i)?.[1] || '0', 10);
                return numA - numB;
            });

        // Build mapping
        const mapping: { old: string; new: string; name: string }[] = [];
        let updated = 0;

        for (let i = 0; i < enabled.length; i++) {
            const newCode = `CAP${String(i + 1).padStart(3, '0')}`;
            const oldCode = enabled[i].maBenhNhanNghienCuu || '';
            if (oldCode !== newCode) {
                mapping.push({ old: oldCode, new: newCode, name: enabled[i].hanhChinh.hoTen });
            }
        }

        if (mapping.length === 0) return { updated: 0, mapping: [] };

        // Auto-backup before reassignment (skip for auto-triggered reassigns)
        if (!skipBackup) {
            try {
                const { backupService } = await import('./backupService');
                await backupService.createAutoBackup(`trước khi gán lại mã BNNC (${mapping.length} thay đổi)`);
            } catch { /* silent */ }
        }

        // Apply updates
        for (let i = 0; i < enabled.length; i++) {
            const newCode = `CAP${String(i + 1).padStart(3, '0')}`;
            if (enabled[i].maBenhNhanNghienCuu !== newCode) {
                const docRef = doc(db, COLLECTION, enabled[i].id);
                await updateDoc(docRef, {
                    maBenhNhanNghienCuu: newCode,
                    updatedAt: serverTimestamp(),
                });
                updated++;
            }
        }

        return { updated, mapping };
    },
};
