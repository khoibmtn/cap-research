import { Timestamp } from 'firebase/firestore';

// ==================== HÀNH CHÍNH ====================
export interface HanhChinh {
    hoTen: string;
    tuoi: number | null;
    gioiTinh: 'nam' | 'nu' | '';
    ngheNghiep: string;
    diaChiXaPhuong: string;
    diaChiTinhThanh: string;
    noiO: 'nong_thon' | 'thanh_thi' | 'hai_dao' | '';
    ngayVaoVien: string; // dd/mm/yyyy
    ngayRaVien: string;
    ghiChu: string;
}

// ==================== TIỀN SỬ ====================
export interface TienSu {
    daiThaoDuong: boolean;
    tangHuyetAp: boolean;
    viemDaDay: boolean;
    viemGanMan: boolean;
    benhThanMan: boolean;
    gut: boolean;
    ungThu: boolean;
    suyTimUHuyet: boolean;
    benhMachMauNao: boolean;
    khac: string;
    hutThuocLa: boolean;
    soBaoNam: number | null;
}

// ==================== LÂM SÀNG ====================
export interface LamSang {
    thoiDiemTrieuChung: string; // dd/mm/yyyy - thời điểm xuất hiện so với nhập viện
    mach: number | null; // lần/phút
    huyetAp: string; // mmHg
    nhietDo: number | null; // °C
    nhipTho: number | null; // lần/phút
    spO2: number | null; // %
    bmi: number | null; // kg/m²
    diemGlasgow: number | null;
    hoKhan: boolean;
    hoMau: boolean;
    hoKhacDom: boolean;
    domTinh: string[]; // trong, nhầy, đục
    domMauSac: string;
    dauNguc: boolean;
    khoTho: boolean;
    ranAm: boolean;
    ranNo: boolean;
    ranRit: boolean;
    ranNgay: boolean;
    hoiChungTDMP: { co: boolean; ben: string };
    hoiChungDongDac: { co: boolean; ben: string };
    hoiChungTKMP: { co: boolean; ben: string };
}

// ==================== XÉT NGHIỆM ====================
export interface XetNghiem {
    // Công thức máu
    wbc: number | null;
    neutrophil: number | null;
    lymphocyte: number | null;
    rbc: number | null;
    hemoglobin: number | null;
    hct: number | null;
    plt: number | null;
    // Sinh hoá máu
    ure: number | null;
    creatinin: number | null;
    ast: number | null;
    alt: number | null;
    ggt: number | null;
    glucose: number | null;
    protein: number | null;
    albumin: number | null;
    crp: number | null;
    procalcitonin: number | null;
    // Điện giải đồ
    na: number | null;
    k: number | null;
    cl: number | null;
    // Khí máu
    ph: number | null;
    saO2: number | null;
    paCO2: number | null;
    hcO3: number | null;
    be: number | null;
    // Dấu ấn sinh học
    sTREM1: number | null;
    tIMP1: number | null;
    il6: number | null;
    il10: number | null;
    il17: number | null;
}

// ==================== CHỈ SỐ TÍNH TOÁN ====================
export interface ChiSoTinhToan {
    nlr: number | null; // Neutrophil / Lymphocyte
    plr: number | null; // PLT / Lymphocyte
    car: number | null; // CRP / Albumin
}

// ==================== HÌNH ẢNH ====================
export interface XquangTonThuong {
    id: string;
    viTri: '1/2 trên' | '1/2 dưới' | 'cả 1/2 trên-dưới' | '';
    ben: 'phải' | 'trái' | 'hai bên' | '';
    hinhThai: string;
    dien: string;
}

export interface CTTonThuong {
    id: string;
    thuy: 'thuỳ trên' | 'thuỳ giữa' | 'thuỳ dưới' | '';
    ben: 'phải' | 'trái' | 'hai bên' | '';
    hinhThai: string; // kính mờ, đông đặc, nốt mờ, hang
    dien: 'hẹp' | 'vừa' | 'rộng' | '';
}

export interface HinhAnh {
    xquangTonThuong: XquangTonThuong[];
    ctTonThuong: CTTonThuong[];
    xquangTranDichMangPhoi: boolean;
    xquangTranKhiMangPhoi: boolean;
    ctTranDichMangPhoi: boolean;
    ctTranKhiMangPhoi: boolean;
}

// ==================== VI KHUẨN ====================
export interface KhangSinhResult {
    tenKhangSinh: string;
    mucDo: 'S' | 'I' | 'R' | '';
}

export interface ViKhuan {
    id: string;
    tenViKhuan: string;
    coKhong: boolean;
    khangSinhDo: KhangSinhResult[];
}

// ==================== PSI ====================
export interface PSICriteria {
    // Đặc điểm dân số học
    tuoiDiem: number;
    gioiTinhNu: boolean; // nữ: tuổi - 10
    nhaDuongLao: boolean; // +10
    // Bệnh đồng mắc
    ungThu: boolean; // +30
    benhGan: boolean; // +20
    suyTimUHuyet: boolean; // +10
    benhMachMauNao: boolean; // +10
    benhThan: boolean; // +10
    // Triệu chứng thực thể
    thayDoiTriGiac: boolean; // +20
    tanSoTho30: boolean; // +20
    huyetApTamThu90: boolean; // +20
    thanNhiet3540: boolean; // +15
    mach125: boolean; // +10
    // Kết quả xét nghiệm
    ph735: boolean; // +30
    bun30: boolean; // +20
    hematocrit30: boolean; // +10
    naMau130: boolean; // +20
    glucoseMau250: boolean; // +10
    paO2_60: boolean; // +10
    tranDichMangPhoi: boolean; // +10
}

export interface PSIData {
    criteria: PSICriteria;
    tongDiem: number;
    phanTang: string; // Class I-V
}

// ==================== KẾT CỤC ====================
export interface KetCuc {
    // Diễn biến điều trị (multichoice) — legacy booleans + flexible array
    thoMay: boolean;
    socNhiemKhuan: boolean;
    locMau: boolean;
    soNgayLocMau: number | null;
    dienBienDieuTri: string[]; // dynamic list from settings
    // Tình trạng ra viện (single choice)
    tinhTrangRaVien: string;
    // Legacy booleans — derived from tinhTrangRaVien for compatibility
    tuVong: boolean;
    xinVe: boolean;
    tienTrienTotXuatVien: boolean;
    // Other
    tongSoNgayDieuTri: number | null;
    ngayBatDauKhangSinh: string;
    ngayKetThucKhangSinh: string;
}

// ==================== PATIENT (ROOT) ====================
export interface Patient {
    id: string;
    maBenhNhanNghienCuu: string; // CAPxxx
    maBenhAnNoiTru: string;
    hanhChinh: HanhChinh;
    tienSu: TienSu;
    lamSang: LamSang;
    xetNghiem: XetNghiem;
    chiSoTinhToan: ChiSoTinhToan;
    hinhAnh: HinhAnh;
    viKhuan: ViKhuan[];
    psi: PSIData;
    ketCuc: KetCuc;
    createdAt: Timestamp | null;
    updatedAt: Timestamp | null;
}

// ==================== DEFAULTS ====================
export const createDefaultHanhChinh = (): HanhChinh => ({
    hoTen: '', tuoi: null, gioiTinh: '', ngheNghiep: '',
    diaChiXaPhuong: '', diaChiTinhThanh: '', noiO: '',
    ngayVaoVien: '', ngayRaVien: '', ghiChu: '',
});

export const createDefaultTienSu = (): TienSu => ({
    daiThaoDuong: false, tangHuyetAp: false, viemDaDay: false,
    viemGanMan: false, benhThanMan: false, gut: false,
    ungThu: false, suyTimUHuyet: false, benhMachMauNao: false,
    khac: '', hutThuocLa: false, soBaoNam: null,
});

export const createDefaultLamSang = (): LamSang => ({
    thoiDiemTrieuChung: '', mach: null, huyetAp: '', nhietDo: null,
    nhipTho: null, spO2: null, bmi: null, diemGlasgow: null,
    hoKhan: false, hoMau: false, hoKhacDom: false,
    domTinh: [], domMauSac: '', dauNguc: false, khoTho: false,
    ranAm: false, ranNo: false, ranRit: false, ranNgay: false,
    hoiChungTDMP: { co: false, ben: '' },
    hoiChungDongDac: { co: false, ben: '' },
    hoiChungTKMP: { co: false, ben: '' },
});

export const createDefaultXetNghiem = (): XetNghiem => ({
    wbc: null, neutrophil: null, lymphocyte: null, rbc: null,
    hemoglobin: null, hct: null, plt: null,
    ure: null, creatinin: null, ast: null, alt: null, ggt: null,
    glucose: null, protein: null, albumin: null, crp: null, procalcitonin: null,
    na: null, k: null, cl: null,
    ph: null, saO2: null, paCO2: null, hcO3: null, be: null,
    sTREM1: null, tIMP1: null, il6: null, il10: null, il17: null,
});

export const createDefaultPSICriteria = (): PSICriteria => ({
    tuoiDiem: 0, gioiTinhNu: false, nhaDuongLao: false,
    ungThu: false, benhGan: false, suyTimUHuyet: false,
    benhMachMauNao: false, benhThan: false,
    thayDoiTriGiac: false, tanSoTho30: false, huyetApTamThu90: false,
    thanNhiet3540: false, mach125: false,
    ph735: false, bun30: false, hematocrit30: false, naMau130: false,
    glucoseMau250: false, paO2_60: false, tranDichMangPhoi: false,
});

export const createDefaultKetCuc = (): KetCuc => ({
    thoMay: false, socNhiemKhuan: false, locMau: false, soNgayLocMau: null,
    dienBienDieuTri: [],
    tinhTrangRaVien: '',
    tuVong: false, xinVe: false, tienTrienTotXuatVien: false,
    tongSoNgayDieuTri: null,
    ngayBatDauKhangSinh: '', ngayKetThucKhangSinh: '',
});

export const createDefaultPatient = (): Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> => ({
    maBenhNhanNghienCuu: '',
    maBenhAnNoiTru: '',
    hanhChinh: createDefaultHanhChinh(),
    tienSu: createDefaultTienSu(),
    lamSang: createDefaultLamSang(),
    xetNghiem: createDefaultXetNghiem(),
    chiSoTinhToan: { nlr: null, plr: null, car: null },
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
        tongDiem: 0,
        phanTang: '',
    },
    ketCuc: createDefaultKetCuc(),
});
