import { useMemo } from 'react';
import type { CURB65ChiTiet } from '../types/patient';

interface CURB65Input {
    tuoi: number | null;
    ure: number | null;
    nhipTho: number | null;
    huyetAp: string; // "120/80"
    diemGlasgow: number | null;
    confusion: boolean;
    confusionGlasgowThreshold: number; // default: 13
}

interface CURB65Output {
    tongDiem: number;
    phanNhom: string;
    chiTiet: CURB65ChiTiet;
    duDuLieu: boolean;
    glasgowBelowThreshold: boolean; // whether to show Confusion question
}

function parseHuyetAp(s: string): { tamThu: number | null; tamTruong: number | null } {
    if (!s) return { tamThu: null, tamTruong: null };
    const parts = s.split('/');
    const tamThu = Number(parts[0]);
    const tamTruong = parts.length > 1 ? Number(parts[1]) : null;
    return {
        tamThu: isNaN(tamThu) ? null : tamThu,
        tamTruong: tamTruong !== null && !isNaN(tamTruong) ? tamTruong : null,
    };
}

export function useCURB65Calculator(input: CURB65Input): CURB65Output {
    return useMemo(() => {
        const { tuoi, ure, nhipTho, huyetAp, diemGlasgow, confusion, confusionGlasgowThreshold } = input;
        const { tamThu, tamTruong } = parseHuyetAp(huyetAp);

        // Check if Glasgow is below threshold → show Confusion question
        const glasgowBelowThreshold = diemGlasgow !== null && diemGlasgow <= confusionGlasgowThreshold;

        // Evaluate each component (null = missing data)
        const c: boolean | null = diemGlasgow === null ? null : (glasgowBelowThreshold ? confusion : false);
        const u: boolean | null = ure === null ? null : ure > 7;
        const r: boolean | null = nhipTho === null ? null : nhipTho >= 30;
        const b: boolean | null = (tamThu === null && tamTruong === null) ? null
            : (tamThu !== null && tamThu < 90) || (tamTruong !== null && tamTruong <= 60);
        const age65: boolean | null = tuoi === null ? null : tuoi >= 65;

        const chiTiet: CURB65ChiTiet = { c, u, r, b, age65 };

        // All 5 components must be evaluable
        const duDuLieu = c !== null && u !== null && r !== null && b !== null && age65 !== null;

        if (!duDuLieu) {
            return { tongDiem: 0, phanNhom: '', chiTiet, duDuLieu: false, glasgowBelowThreshold };
        }

        const tongDiem = [c, u, r, b, age65].filter(Boolean).length;

        let phanNhom = '';
        if (tongDiem <= 1) phanNhom = 'Nhẹ — Điều trị ngoại trú';
        else if (tongDiem === 2) phanNhom = 'Trung bình — Nhập viện ngắn';
        else phanNhom = 'Nặng — Cân nhắc ICU';

        return { tongDiem, phanNhom, chiTiet, duDuLieu: true, glasgowBelowThreshold };
    }, [input.tuoi, input.ure, input.nhipTho, input.huyetAp, input.diemGlasgow, input.confusion, input.confusionGlasgowThreshold]);
}
