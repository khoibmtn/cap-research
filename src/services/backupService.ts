import {
    ref, uploadBytes, deleteObject, getMetadata, getBytes,
} from 'firebase/storage';
import {
    collection, doc, addDoc, deleteDoc, updateDoc,
    getDocs, query, orderBy, serverTimestamp,
    type Timestamp,
} from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import type { Patient } from '../types/patient';
import { patientService } from './patientService';
import { nextMaBNNC } from './importService';

// ─── Types ───────────────────────────────────────────────────────────
export interface BackupMetadata {
    id: string;
    name: string;
    createdAt: Timestamp | null;
    patientCount: number;
    filePath: string;
    fileSize: number;
    triggerType: 'auto' | 'manual';
}

/** Patient as stored in backup JSON — timestamps are ISO strings */
export interface BackupPatient {
    id: string;
    maBenhNhanNghienCuu: string;
    maBenhAnNoiTru: string;
    hanhChinh: Patient['hanhChinh'];
    tienSu: Patient['tienSu'];
    lamSang: Patient['lamSang'];
    xetNghiem: Patient['xetNghiem'];
    chiSoTinhToan: Patient['chiSoTinhToan'];
    hinhAnh: Patient['hinhAnh'];
    viKhuan: Patient['viKhuan'];
    psi: Patient['psi'];
    ketCuc: Patient['ketCuc'];
    createdAt: string | null;
    updatedAt: string | null;
}

/** Search result with source backup info */
export interface SearchResult {
    patient: BackupPatient;
    backupId: string;
    backupName: string;
}

const BACKUPS_COLLECTION = 'backups';
const STORAGE_PREFIX = 'backups';

// ─── Helpers ─────────────────────────────────────────────────────────
function formatDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function serializePatients(patients: Patient[]): BackupPatient[] {
    return patients.map(({ createdAt, updatedAt, ...rest }) => ({
        ...rest,
        createdAt: createdAt && typeof (createdAt as Timestamp).toDate === 'function'
            ? (createdAt as Timestamp).toDate().toISOString()
            : null,
        updatedAt: updatedAt && typeof (updatedAt as Timestamp).toDate === 'function'
            ? (updatedAt as Timestamp).toDate().toISOString()
            : null,
    }));
}

// ─── Service ─────────────────────────────────────────────────────────
export const backupService = {
    /**
     * Create a backup: serialize patients → upload to Storage → save metadata to Firestore
     */
    async createBackup(
        patients: Patient[],
        name?: string,
        triggerType: 'auto' | 'manual' = 'manual',
    ): Promise<string> {
        const now = new Date();
        const backupName = name || `${triggerType === 'auto' ? 'Auto' : 'Backup'} - ${formatDate(now)}`;

        // Serialize (convert Timestamps to ISO strings)
        const data = serializePatients(patients);
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });

        // Upload to Firebase Storage
        const fileName = `backup_${now.getTime()}.json`;
        const filePath = `${STORAGE_PREFIX}/${fileName}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, blob);

        // Get file metadata for size
        const meta = await getMetadata(storageRef);

        // Save metadata to Firestore
        const docRef = await addDoc(collection(db, BACKUPS_COLLECTION), {
            name: backupName,
            createdAt: serverTimestamp(),
            patientCount: patients.length,
            filePath,
            fileSize: meta.size,
            triggerType,
        });

        return docRef.id;
    },

    /**
     * List all backups sorted by date descending
     */
    async listBackups(): Promise<BackupMetadata[]> {
        const q = query(
            collection(db, BACKUPS_COLLECTION),
            orderBy('createdAt', 'desc'),
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        } as BackupMetadata));
    },

    /**
     * Download and parse backup data from Storage
     */
    async getBackupData(backup: BackupMetadata): Promise<BackupPatient[]> {
        const storageRef = ref(storage, backup.filePath);
        const bytes = await getBytes(storageRef);
        const text = new TextDecoder().decode(bytes);
        return JSON.parse(text) as BackupPatient[];
    },

    /**
     * Search patients across one or all backups
     */
    async searchBackups(
        backups: BackupMetadata[],
        keyword: string,
        targetBackupId?: string,
    ): Promise<SearchResult[]> {
        const q = keyword.toLowerCase().trim();

        const targets = targetBackupId
            ? backups.filter((b) => b.id === targetBackupId)
            : backups;

        const results: SearchResult[] = [];

        for (const backup of targets) {
            try {
                const patients = await this.getBackupData(backup);
                for (const patient of patients) {
                    if (q) {
                        const searchable = [
                            patient.maBenhNhanNghienCuu,
                            patient.maBenhAnNoiTru,
                            patient.hanhChinh.hoTen,
                        ].join(' ').toLowerCase();
                        if (!searchable.includes(q)) continue;
                    }
                    results.push({
                        patient,
                        backupId: backup.id,
                        backupName: backup.name,
                    });
                }
            } catch (err) {
                console.warn(`[Backup] Skip search in "${backup.name}":`, err);
            }
        }

        return results;
    },


    /**
     * Delete a backup: remove file from Storage + metadata from Firestore
     */
    async deleteBackup(backup: BackupMetadata): Promise<void> {
        try {
            const storageRef = ref(storage, backup.filePath);
            await deleteObject(storageRef);
        } catch {
            // File may already be deleted
        }
        await deleteDoc(doc(db, BACKUPS_COLLECTION, backup.id));
    },

    /**
     * Rename a backup
     */
    async renameBackup(backupId: string, newName: string): Promise<void> {
        await updateDoc(doc(db, BACKUPS_COLLECTION, backupId), { name: newName });
    },

    /**
     * Auto-backup: fetch all patients and create an auto backup.
     */
    async createAutoBackup(): Promise<void> {
        try {
            const patients = await patientService.getAll();
            if (patients.length === 0) return;
            await this.createBackup(patients, undefined, 'auto');
        } catch (err) {
            console.warn('[Backup] Auto-backup failed:', err);
        }
    },

    /**
     * Restore selected patients from backup data.
     * - Overwrite: preserves existing maBenhNhanNghienCuu
     * - New: auto-assigns next maBNNC (CAP009, CAP010, etc.)
     */
    async restorePatients(
        patientsToRestore: BackupPatient[],
        existingPatients: Patient[],
    ): Promise<{ created: number; updated: number }> {
        const existingMap = new Map<string, Patient>();
        existingPatients.forEach((p) => {
            if (p.maBenhAnNoiTru) existingMap.set(p.maBenhAnNoiTru, p);
        });

        // Collect all existing maBNNC codes for auto-assignment
        const allCodes = existingPatients.map((p) => p.maBenhNhanNghienCuu);

        // Pre-compute new codes for all new patients
        const newPatients = patientsToRestore.filter(
            (p) => !p.maBenhAnNoiTru || !existingMap.has(p.maBenhAnNoiTru),
        );
        const newCodes = nextMaBNNC(allCodes, newPatients.length);
        let newCodeIdx = 0;

        let created = 0;
        let updated = 0;

        for (const incoming of patientsToRestore) {
            const existing = incoming.maBenhAnNoiTru
                ? existingMap.get(incoming.maBenhAnNoiTru)
                : undefined;

            const { id: _id, createdAt: _ca, updatedAt: _ua, ...data } = incoming;

            if (existing) {
                // Overwrite: preserve existing maBenhNhanNghienCuu
                const writeData = {
                    ...data,
                    maBenhNhanNghienCuu: existing.maBenhNhanNghienCuu,
                };
                await patientService.update(existing.id, writeData as Partial<Patient>);
                updated++;
            } else {
                // New: auto-assign next maBNNC
                const writeData = {
                    ...data,
                    maBenhNhanNghienCuu: newCodes[newCodeIdx++] || data.maBenhNhanNghienCuu,
                };
                await patientService.create(writeData as Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>);
                created++;
            }
        }

        return { created, updated };
    },
};
