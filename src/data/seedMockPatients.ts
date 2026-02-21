/**
 * Utility to seed 9 mock CAP patients into Firestore.
 * Call `seedMockPatients()` from anywhere (e.g. a button handler, browser console).
 * It checks whether CAP001–CAP009 already exist so it's safe to call repeatedly.
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { patientService } from '../services/patientService';
import { mockPatients } from './mockPatients';

export async function seedMockPatients(): Promise<{ created: number; skipped: number }> {
    const col = collection(db, 'patients');
    let created = 0;
    let skipped = 0;

    for (const p of mockPatients) {
        // Check if this maBenhNhanNghienCuu already exists
        const q = query(col, where('maBenhNhanNghienCuu', '==', p.maBenhNhanNghienCuu));
        const snap = await getDocs(q);

        if (!snap.empty) {
            skipped++;
            continue;
        }

        await patientService.create(p);
        created++;
    }

    return { created, skipped };
}
