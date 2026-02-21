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
};
