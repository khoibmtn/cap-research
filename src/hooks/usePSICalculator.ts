import { useMemo } from 'react';
import type { PSICriteria } from '../types/patient';

interface PSIInput {
    tuoi: number | null;
    gioiTinh: string;
    criteria: PSICriteria;
}

interface PSIOutput {
    tongDiem: number;
    phanTang: string;
    chiTietDiem: Record<string, number>;
}

export function usePSICalculator(input: PSIInput): PSIOutput {
    return useMemo(() => {
        const { tuoi, gioiTinh, criteria } = input;
        const chiTietDiem: Record<string, number> = {};
        let tongDiem = 0;

        // Đặc điểm dân số học
        if (tuoi != null) {
            if (gioiTinh === 'nam') {
                chiTietDiem['tuoi'] = tuoi;
                tongDiem += tuoi;
            } else if (gioiTinh === 'nu') {
                chiTietDiem['tuoi'] = tuoi - 10;
                tongDiem += tuoi - 10;
            }
        }

        if (criteria.nhaDuongLao) {
            chiTietDiem['nhaDuongLao'] = 10;
            tongDiem += 10;
        }

        // Bệnh đồng mắc
        if (criteria.ungThu) { chiTietDiem['ungThu'] = 30; tongDiem += 30; }
        if (criteria.benhGan) { chiTietDiem['benhGan'] = 20; tongDiem += 20; }
        if (criteria.suyTimUHuyet) { chiTietDiem['suyTimUHuyet'] = 10; tongDiem += 10; }
        if (criteria.benhMachMauNao) { chiTietDiem['benhMachMauNao'] = 10; tongDiem += 10; }
        if (criteria.benhThan) { chiTietDiem['benhThan'] = 10; tongDiem += 10; }

        // Triệu chứng thực thể
        if (criteria.thayDoiTriGiac) { chiTietDiem['thayDoiTriGiac'] = 20; tongDiem += 20; }
        if (criteria.tanSoTho30) { chiTietDiem['tanSoTho30'] = 20; tongDiem += 20; }
        if (criteria.huyetApTamThu90) { chiTietDiem['huyetApTamThu90'] = 20; tongDiem += 20; }
        if (criteria.thanNhiet3540) { chiTietDiem['thanNhiet3540'] = 15; tongDiem += 15; }
        if (criteria.mach125) { chiTietDiem['mach125'] = 10; tongDiem += 10; }

        // Kết quả xét nghiệm
        if (criteria.ph735) { chiTietDiem['ph735'] = 30; tongDiem += 30; }
        if (criteria.bun30) { chiTietDiem['bun30'] = 20; tongDiem += 20; }
        if (criteria.hematocrit30) { chiTietDiem['hematocrit30'] = 10; tongDiem += 10; }
        if (criteria.naMau130) { chiTietDiem['naMau130'] = 20; tongDiem += 20; }
        if (criteria.glucoseMau250) { chiTietDiem['glucoseMau250'] = 10; tongDiem += 10; }
        if (criteria.paO2_60) { chiTietDiem['paO2_60'] = 10; tongDiem += 10; }
        if (criteria.tranDichMangPhoi) { chiTietDiem['tranDichMangPhoi'] = 10; tongDiem += 10; }

        // Phân tầng nguy cơ
        let phanTang = '';
        if (tongDiem <= 50) phanTang = 'I - Nguy cơ thấp';
        else if (tongDiem <= 70) phanTang = 'II - Nguy cơ thấp';
        else if (tongDiem <= 90) phanTang = 'III - Nguy cơ trung bình';
        else if (tongDiem <= 130) phanTang = 'IV - Nguy cơ cao';
        else phanTang = 'V - Nguy cơ rất cao';

        return { tongDiem, phanTang, chiTietDiem };
    }, [input.tuoi, input.gioiTinh, input.criteria]);
}
