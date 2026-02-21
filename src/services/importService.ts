import * as XLSX from 'xlsx';
import type { Patient } from '../types/patient';
import {
    createDefaultHanhChinh, createDefaultTienSu, createDefaultLamSang,
    createDefaultXetNghiem, createDefaultPSICriteria, createDefaultKetCuc,
} from '../types/patient';

// ─── Types ───────────────────────────────────────────────────────────
export interface ConflictPair {
    incoming: Omit<Patient, 'createdAt' | 'updatedAt'>;
    existing: Patient;
    diffs: FieldDiff[];
}

export interface FieldDiff {
    label: string;
    oldValue: string;
    newValue: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function str(v: unknown): string {
    if (v === null || v === undefined || v === '') return '';
    return String(v).trim();
}

function num(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
}

function bool(v: unknown): boolean {
    const s = str(v).toLowerCase();
    return s === 'có' || s === 'co' || s === 'true' || s === '1' || s === 'yes';
}

function gioiTinh(v: unknown): 'nam' | 'nu' | '' {
    const s = str(v).toLowerCase();
    if (s === 'nam') return 'nam';
    if (s === 'nữ' || s === 'nu') return 'nu';
    return '';
}

// ─── Excel → Patient mapping ─────────────────────────────────────────
// Reverse of exportService.ts column names
function rowToPatient(row: Record<string, unknown>): Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> {
    const hanhChinh: Patient['hanhChinh'] = {
        ...createDefaultHanhChinh(),
        hoTen: str(row['Họ tên']),
        tuoi: num(row['Tuổi']),
        gioiTinh: gioiTinh(row['Giới tính']),
        ngheNghiep: str(row['Nghề nghiệp']),
        diaChiXaPhuong: str(row['Xã/Phường']),
        diaChiTinhThanh: str(row['Tỉnh/Thành phố']),
        noiO: str(row['Nơi ở']) as Patient['hanhChinh']['noiO'],
        ngayVaoVien: str(row['Ngày vào viện']),
        ngayRaVien: str(row['Ngày ra viện']),
        ghiChu: '',
    };

    const tienSu = {
        ...createDefaultTienSu(),
        daiThaoDuong: bool(row['Đái tháo đường']),
        tangHuyetAp: bool(row['Tăng huyết áp']),
        viemDaDay: bool(row['Viêm dạ dày']),
        viemGanMan: bool(row['Viêm gan mạn']),
        benhThanMan: bool(row['Bệnh thận mạn']),
        gut: bool(row['Gút']),
        ungThu: bool(row['Ung thư']),
        suyTimUHuyet: bool(row['Suy tim ứ huyết']),
        benhMachMauNao: bool(row['Bệnh mạch máu não']),
        khac: str(row['Tiền sử khác']),
        hutThuocLa: bool(row['Hút thuốc lá']),
        soBaoNam: num(row['Số bao-năm']),
    };

    const lamSang = {
        ...createDefaultLamSang(),
        mach: num(row['Mạch']),
        huyetAp: str(row['Huyết áp']),
        nhietDo: num(row['Nhiệt độ']),
        nhipTho: num(row['Nhịp thở']),
        spO2: num(row['SpO2']),
        bmi: num(row['BMI']),
        diemGlasgow: num(row['Điểm Glasgow']),
        hoKhan: bool(row['Ho khan']),
        hoMau: bool(row['Ho máu']),
        hoKhacDom: bool(row['Ho khạc đờm']),
        dauNguc: bool(row['Đau ngực']),
        khoTho: bool(row['Khó thở']),
        ranAm: bool(row['Ran ẩm']),
        ranNo: bool(row['Ran nổ']),
        ranRit: bool(row['Ran rít']),
        ranNgay: bool(row['Ran ngáy']),
    };

    const xetNghiem = {
        ...createDefaultXetNghiem(),
        wbc: num(row['WBC (G/l)']),
        neutrophil: num(row['Neutrophil (%)']),
        lymphocyte: num(row['Lymphocyte (%)']),
        rbc: num(row['RBC (T/l)']),
        hemoglobin: num(row['Hemoglobin (g/l)']),
        hct: num(row['Hct (%)']),
        plt: num(row['PLT (G/l)']),
        ure: num(row['Ure (mmol/l)']),
        creatinin: num(row['Creatinin (µmol/l)']),
        ast: num(row['AST (U/l)']),
        alt: num(row['ALT (U/l)']),
        ggt: num(row['GGT (U/l)']),
        glucose: num(row['Glucose (µmol/l)']),
        protein: num(row['Protein (g/l)']),
        albumin: num(row['Albumin (g/l)']),
        crp: num(row['CRP (mg/L)']),
        procalcitonin: num(row['Procalcitonin (pg/ml)']),
        na: num(row['Na']),
        k: num(row['K']),
        cl: num(row['Cl']),
        ph: num(row['pH']),
        saO2: num(row['SaO2']),
        paCO2: num(row['PaCO2']),
        hcO3: num(row['HCO3']),
        be: num(row['BE']),
        sTREM1: num(row['sTREM-1']),
        tIMP1: num(row['TIMP-1']),
        il6: num(row['IL6']),
        il10: num(row['IL10']),
        il17: num(row['IL17']),
    };

    const chiSoTinhToan = {
        nlr: num(row['NLR']),
        plr: num(row['PLR']),
        car: num(row['CAR']),
    };

    const ketCuc = {
        ...createDefaultKetCuc(),
        tuVong: bool(row['Tử vong']),
        xinVe: bool(row['Xin về']),
        thoMay: bool(row['Thở máy']),
        tienTrienTotXuatVien: bool(row['Tiến triển tốt xuất viện']),
        tongSoNgayDieuTri: num(row['Tổng số ngày điều trị']),
        ngayBatDauKhangSinh: str(row['Ngày bắt đầu KS']),
        ngayKetThucKhangSinh: str(row['Ngày kết thúc KS']),
    };

    return {
        maBenhNhanNghienCuu: str(row['Mã BNNC']),
        maBenhAnNoiTru: str(row['Mã BA Nội trú']),
        hanhChinh,
        tienSu,
        lamSang,
        xetNghiem,
        chiSoTinhToan,
        hinhAnh: {
            xquangTonThuong: [],
            ctTonThuong: [],
            xquangTranDichMangPhoi: false,
            xquangTranKhiMangPhoi: false,
            ctTranDichMangPhoi: false,
            ctTranKhiMangPhoi: false,
        },
        viKhuan: [],
        psi: {
            criteria: createDefaultPSICriteria(),
            tongDiem: num(row['PSI Tổng điểm']) ?? 0,
            phanTang: str(row['PSI Phân tầng']),
        },
        ketCuc,
    };
}

// ─── Parse Excel file → Patient[] ────────────────────────────────────
export function parseExcelToPatients(file: File): Promise<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
                const patients = rows.map(rowToPatient);
                resolve(patients);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// ─── Detect conflicts by maBenhAnNoiTru ──────────────────────────────
export function detectConflicts(
    incoming: Omit<Patient, 'createdAt' | 'updatedAt'>[],
    existing: Patient[],
): {
    newPatients: Omit<Patient, 'createdAt' | 'updatedAt'>[];
    conflicts: ConflictPair[];
    identicalPatients: Omit<Patient, 'createdAt' | 'updatedAt'>[];
} {
    const existingMap = new Map<string, Patient>();
    existing.forEach((p) => {
        if (p.maBenhAnNoiTru) existingMap.set(p.maBenhAnNoiTru, p);
    });

    const newPatients: Omit<Patient, 'createdAt' | 'updatedAt'>[] = [];
    const conflicts: ConflictPair[] = [];
    const identicalPatients: Omit<Patient, 'createdAt' | 'updatedAt'>[] = [];

    for (const inc of incoming) {
        if (!inc.maBenhAnNoiTru) {
            newPatients.push(inc);
            continue;
        }

        const ex = existingMap.get(inc.maBenhAnNoiTru);
        if (!ex) {
            newPatients.push(inc);
        } else {
            const diffs = computeDiffs(ex, inc);
            if (diffs.length > 0) {
                conflicts.push({ incoming: inc, existing: ex, diffs });
            } else {
                identicalPatients.push(inc);
            }
        }
    }

    return { newPatients, conflicts, identicalPatients };
}

// ─── Deep field-level diff — compares ALL Patient fields ─────────────
function computeDiffs(
    existing: Patient,
    incoming: Omit<Patient, 'createdAt' | 'updatedAt'>,
): FieldDiff[] {
    const diffs: FieldDiff[] = [];

    // Top-level fields (skip maBNNC — handled separately during restore)
    addDiff(diffs, 'Mã BA', existing.maBenhAnNoiTru, incoming.maBenhAnNoiTru);

    // Hành chính
    const hcOld = existing.hanhChinh, hcNew = incoming.hanhChinh;
    addDiff(diffs, 'Họ tên', hcOld.hoTen, hcNew.hoTen);
    addDiff(diffs, 'Tuổi', hcOld.tuoi, hcNew.tuoi);
    addDiff(diffs, 'Giới tính', hcOld.gioiTinh, hcNew.gioiTinh);
    addDiff(diffs, 'Nghề nghiệp', hcOld.ngheNghiep, hcNew.ngheNghiep);
    addDiff(diffs, 'Xã/Phường', hcOld.diaChiXaPhuong, hcNew.diaChiXaPhuong);
    addDiff(diffs, 'Tỉnh/TP', hcOld.diaChiTinhThanh, hcNew.diaChiTinhThanh);
    addDiff(diffs, 'Nơi ở', hcOld.noiO, hcNew.noiO);
    addDiff(diffs, 'Ngày vào viện', hcOld.ngayVaoVien, hcNew.ngayVaoVien);
    addDiff(diffs, 'Ngày ra viện', hcOld.ngayRaVien, hcNew.ngayRaVien);
    addDiff(diffs, 'Ghi chú', hcOld.ghiChu, hcNew.ghiChu);

    // Tiền sử
    const tsOld = existing.tienSu, tsNew = incoming.tienSu;
    addDiff(diffs, 'Đái tháo đường', tsOld.daiThaoDuong, tsNew.daiThaoDuong);
    addDiff(diffs, 'Tăng huyết áp', tsOld.tangHuyetAp, tsNew.tangHuyetAp);
    addDiff(diffs, 'Viêm dạ dày', tsOld.viemDaDay, tsNew.viemDaDay);
    addDiff(diffs, 'Viêm gan mạn', tsOld.viemGanMan, tsNew.viemGanMan);
    addDiff(diffs, 'Bệnh thận mạn', tsOld.benhThanMan, tsNew.benhThanMan);
    addDiff(diffs, 'Gút', tsOld.gut, tsNew.gut);
    addDiff(diffs, 'Ung thư', tsOld.ungThu, tsNew.ungThu);
    addDiff(diffs, 'Suy tim ứ huyết', tsOld.suyTimUHuyet, tsNew.suyTimUHuyet);
    addDiff(diffs, 'Bệnh mạch máu não', tsOld.benhMachMauNao, tsNew.benhMachMauNao);
    addDiff(diffs, 'Tiền sử khác', tsOld.khac, tsNew.khac);
    addDiff(diffs, 'Hút thuốc lá', tsOld.hutThuocLa, tsNew.hutThuocLa);
    addDiff(diffs, 'Số bao-năm', tsOld.soBaoNam, tsNew.soBaoNam);

    // Lâm sàng
    const lsOld = existing.lamSang, lsNew = incoming.lamSang;
    addDiff(diffs, 'Triệu chứng', lsOld.thoiDiemTrieuChung, lsNew.thoiDiemTrieuChung);
    addDiff(diffs, 'Mạch', lsOld.mach, lsNew.mach);
    addDiff(diffs, 'Huyết áp', lsOld.huyetAp, lsNew.huyetAp);
    addDiff(diffs, 'Nhiệt độ', lsOld.nhietDo, lsNew.nhietDo);
    addDiff(diffs, 'Nhịp thở', lsOld.nhipTho, lsNew.nhipTho);
    addDiff(diffs, 'SpO2', lsOld.spO2, lsNew.spO2);
    addDiff(diffs, 'BMI', lsOld.bmi, lsNew.bmi);
    addDiff(diffs, 'Glasgow', lsOld.diemGlasgow, lsNew.diemGlasgow);
    addDiff(diffs, 'Ho khan', lsOld.hoKhan, lsNew.hoKhan);
    addDiff(diffs, 'Ho máu', lsOld.hoMau, lsNew.hoMau);
    addDiff(diffs, 'Ho khạc đờm', lsOld.hoKhacDom, lsNew.hoKhacDom);
    addDiff(diffs, 'Đau ngực', lsOld.dauNguc, lsNew.dauNguc);
    addDiff(diffs, 'Khó thở', lsOld.khoTho, lsNew.khoTho);
    addDiff(diffs, 'Ran ẩm', lsOld.ranAm, lsNew.ranAm);
    addDiff(diffs, 'Ran nổ', lsOld.ranNo, lsNew.ranNo);
    addDiff(diffs, 'Ran rít', lsOld.ranRit, lsNew.ranRit);
    addDiff(diffs, 'Ran ngáy', lsOld.ranNgay, lsNew.ranNgay);
    addDiff(diffs, 'HC TDMP', lsOld.hoiChungTDMP.co, lsNew.hoiChungTDMP.co);
    addDiff(diffs, 'HC TDMP bên', lsOld.hoiChungTDMP.ben, lsNew.hoiChungTDMP.ben);
    addDiff(diffs, 'HC Đông đặc', lsOld.hoiChungDongDac.co, lsNew.hoiChungDongDac.co);
    addDiff(diffs, 'HC Đông đặc bên', lsOld.hoiChungDongDac.ben, lsNew.hoiChungDongDac.ben);
    addDiff(diffs, 'HC TKMP', lsOld.hoiChungTKMP.co, lsNew.hoiChungTKMP.co);
    addDiff(diffs, 'HC TKMP bên', lsOld.hoiChungTKMP.ben, lsNew.hoiChungTKMP.ben);

    // Xét nghiệm
    const xnOld = existing.xetNghiem, xnNew = incoming.xetNghiem;
    const xnFields: [string, keyof typeof xnOld][] = [
        ['WBC', 'wbc'], ['Neutrophil', 'neutrophil'], ['Lymphocyte', 'lymphocyte'],
        ['RBC', 'rbc'], ['Hemoglobin', 'hemoglobin'], ['Hct', 'hct'], ['PLT', 'plt'],
        ['Ure', 'ure'], ['Creatinin', 'creatinin'], ['AST', 'ast'], ['ALT', 'alt'],
        ['GGT', 'ggt'], ['Glucose', 'glucose'], ['Protein', 'protein'], ['Albumin', 'albumin'],
        ['CRP', 'crp'], ['Procalcitonin', 'procalcitonin'],
        ['Na', 'na'], ['K', 'k'], ['Cl', 'cl'],
        ['pH', 'ph'], ['SaO2', 'saO2'], ['PaCO2', 'paCO2'], ['HCO3', 'hcO3'], ['BE', 'be'],
        ['sTREM-1', 'sTREM1'], ['TIMP-1', 'tIMP1'], ['IL6', 'il6'], ['IL10', 'il10'], ['IL17', 'il17'],
    ];
    for (const [label, key] of xnFields) {
        addDiff(diffs, label, xnOld[key], xnNew[key]);
    }

    // Chỉ số tính toán
    addDiff(diffs, 'NLR', existing.chiSoTinhToan.nlr, incoming.chiSoTinhToan.nlr);
    addDiff(diffs, 'PLR', existing.chiSoTinhToan.plr, incoming.chiSoTinhToan.plr);
    addDiff(diffs, 'CAR', existing.chiSoTinhToan.car, incoming.chiSoTinhToan.car);

    // Hình ảnh
    addDiff(diffs, 'X-quang TDMP', existing.hinhAnh.xquangTranDichMangPhoi, incoming.hinhAnh.xquangTranDichMangPhoi);
    addDiff(diffs, 'X-quang TKMP', existing.hinhAnh.xquangTranKhiMangPhoi, incoming.hinhAnh.xquangTranKhiMangPhoi);
    addDiff(diffs, 'CT TDMP', existing.hinhAnh.ctTranDichMangPhoi, incoming.hinhAnh.ctTranDichMangPhoi);
    addDiff(diffs, 'CT TKMP', existing.hinhAnh.ctTranKhiMangPhoi, incoming.hinhAnh.ctTranKhiMangPhoi);
    addDiff(diffs, 'X-quang tổn thương', stableStringify(existing.hinhAnh.xquangTonThuong), stableStringify(incoming.hinhAnh.xquangTonThuong));
    addDiff(diffs, 'CT tổn thương', stableStringify(existing.hinhAnh.ctTonThuong), stableStringify(incoming.hinhAnh.ctTonThuong));

    // Vi khuẩn
    addDiff(diffs, 'Vi khuẩn', stableStringify(existing.viKhuan), stableStringify(incoming.viKhuan));

    // PSI
    addDiff(diffs, 'PSI Tổng điểm', existing.psi.tongDiem, incoming.psi.tongDiem);
    addDiff(diffs, 'PSI Phân tầng', existing.psi.phanTang, incoming.psi.phanTang);

    // Kết cục
    const kcOld = existing.ketCuc, kcNew = incoming.ketCuc;
    addDiff(diffs, 'Thở máy', kcOld.thoMay, kcNew.thoMay);
    addDiff(diffs, 'Sốc nhiễm khuẩn', kcOld.socNhiemKhuan, kcNew.socNhiemKhuan);
    addDiff(diffs, 'Lọc máu', kcOld.locMau, kcNew.locMau);
    addDiff(diffs, 'Số ngày lọc máu', kcOld.soNgayLocMau, kcNew.soNgayLocMau);
    addDiff(diffs, 'Diễn biến ĐT', stableStringify(kcOld.dienBienDieuTri), stableStringify(kcNew.dienBienDieuTri));
    addDiff(diffs, 'Tình trạng RV', kcOld.tinhTrangRaVien, kcNew.tinhTrangRaVien);
    addDiff(diffs, 'Tử vong', kcOld.tuVong, kcNew.tuVong);
    addDiff(diffs, 'Xin về', kcOld.xinVe, kcNew.xinVe);
    addDiff(diffs, 'Tiến triển tốt', kcOld.tienTrienTotXuatVien, kcNew.tienTrienTotXuatVien);
    addDiff(diffs, 'Tổng ngày ĐT', kcOld.tongSoNgayDieuTri, kcNew.tongSoNgayDieuTri);
    addDiff(diffs, 'Ngày BĐ KS', kcOld.ngayBatDauKhangSinh, kcNew.ngayBatDauKhangSinh);
    addDiff(diffs, 'Ngày KT KS', kcOld.ngayKetThucKhangSinh, kcNew.ngayKetThucKhangSinh);

    return diffs;
}

function addDiff(diffs: FieldDiff[], label: string, oldVal: unknown, newVal: unknown) {
    const o = formatVal(oldVal);
    const n = formatVal(newVal);
    if (o !== n) {
        diffs.push({ label, oldValue: o, newValue: n });
    }
}

function formatVal(v: unknown): string {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'boolean') return v ? 'Có' : 'Không';
    if (typeof v === 'string' && v === '') return '—';
    return String(v);
}

// Stable JSON stringify with sorted keys to avoid false diffs from key ordering
function stableStringify(v: unknown): string {
    if (v === null || v === undefined) return '—';
    if (Array.isArray(v)) {
        if (v.length === 0) return '—';
        return JSON.stringify(v.map((item) => sortKeys(item)));
    }
    if (typeof v === 'object') return JSON.stringify(sortKeys(v));
    return String(v);
}

function sortKeys(obj: unknown): unknown {
    if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sortKeys);
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
        sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
}

// ─── Auto-assign next maBenhNhanNghienCuu ────────────────────────────
export function nextMaBNNC(existingCodes: string[], count = 1): string[] {
    // Parse "CAPxxx" → number, find max
    let max = 0;
    for (const code of existingCodes) {
        const match = code.match(/^CAP(\d+)$/i);
        if (match) {
            const n = parseInt(match[1], 10);
            if (n > max) max = n;
        }
    }
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
        max++;
        results.push(`CAP${String(max).padStart(3, '0')}`);
    }
    return results;
}

