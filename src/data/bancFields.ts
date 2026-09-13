/**
 * bancFields.ts
 * Danh mục toàn bộ các trường/biến trên Bệnh án nghiên cứu (BANC)
 * Phục vụ bật/tắt hiển thị linh hoạt trong Cài đặt > BANC > Xuất BANC
 */

export interface BancSubField {
    key: string;
    label: string;
    defaultVisible?: boolean;
}

export interface BancField {
    key: string;
    label: string;
    section: 'hanhChinh' | 'tienSu' | 'lamSang' | 'canLamSang' | 'hinhAnh' | 'viKhuan' | 'phanDo' | 'ketCuc';
    sectionName: string;
    description?: string;
    defaultVisible: boolean;
    subFields?: BancSubField[];
}

export const BANC_SECTIONS = [
    { key: 'hanhChinh', name: 'A. Thông tin hành chính' },
    { key: 'tienSu', name: 'B. Tiền sử bệnh & Dùng thuốc' },
    { key: 'lamSang', name: 'C. Triệu chứng lâm sàng' },
    { key: 'canLamSang', name: 'D1. Xét nghiệm cận lâm sàng' },
    { key: 'hinhAnh', name: 'D2. Chẩn đoán hình ảnh' },
    { key: 'viKhuan', name: 'D3. Vi khuẩn & Kháng sinh đồ' },
    { key: 'phanDo', name: 'E. Phân độ nặng (CURB-65 & PSI)' },
    { key: 'ketCuc', name: 'F. Kết cục điều trị' },
] as const;

export const BANC_FIELDS: BancField[] = [
    // ── A. Hành chính ──
    { key: 'hc_hoTen', label: 'Họ và tên', section: 'hanhChinh', sectionName: 'A. Thông tin hành chính', defaultVisible: true },
    { key: 'hc_tuoi', label: 'Tuổi', section: 'hanhChinh', sectionName: 'A. Thông tin hành chính', defaultVisible: true },
    { key: 'hc_gioiTinh', label: 'Giới tính', section: 'hanhChinh', sectionName: 'A. Thông tin hành chính', defaultVisible: true },
    { key: 'hc_ngheNghiep', label: 'Nghề nghiệp', section: 'hanhChinh', sectionName: 'A. Thông tin hành chính', defaultVisible: true },
    {
        key: 'hc_diaChi',
        label: 'Địa chỉ (Xã/Phường, Tỉnh/Thành)',
        section: 'hanhChinh',
        sectionName: 'A. Thông tin hành chính',
        defaultVisible: true,
        subFields: [
            { key: 'hc_diaChi_xaPhuong', label: 'Xã / Phường' },
            { key: 'hc_diaChi_tinhThanh', label: 'Tỉnh / Thành phố' },
        ],
    },
    { key: 'hc_noiO', label: 'Nơi ở (Nông thôn/Thành thị/Hải đảo)', section: 'hanhChinh', sectionName: 'A. Thông tin hành chính', defaultVisible: true },
    { key: 'hc_ngayVaoVien', label: 'Ngày vào viện', section: 'hanhChinh', sectionName: 'A. Thông tin hành chính', defaultVisible: true },
    { key: 'hc_ngayRaVien', label: 'Ngày ra viện', section: 'hanhChinh', sectionName: 'A. Thông tin hành chính', defaultVisible: true },
    { key: 'hc_maBenhAnNoiTru', label: 'Mã bệnh án nội trú', section: 'hanhChinh', sectionName: 'A. Thông tin hành chính', defaultVisible: true },

    // ── B. Tiền sử ──
    { key: 'ts_daiThaoDuong', label: 'Đái tháo đường', section: 'tienSu', sectionName: 'B. Tiền sử bệnh & Dùng thuốc', defaultVisible: true },
    { key: 'ts_tangHuyetAp', label: 'Tăng huyết áp', section: 'tienSu', sectionName: 'B. Tiền sử bệnh & Dùng thuốc', defaultVisible: true },
    { key: 'ts_viemDaDay', label: 'Viêm dạ dày', section: 'tienSu', sectionName: 'B. Tiền sử bệnh & Dùng thuốc', defaultVisible: true },
    { key: 'ts_viemGanMan', label: 'Viêm gan mạn', section: 'tienSu', sectionName: 'B. Tiền sử bệnh & Dùng thuốc', defaultVisible: true },
    { key: 'ts_benhThanMan', label: 'Bệnh thận mạn', section: 'tienSu', sectionName: 'B. Tiền sử bệnh & Dùng thuốc', defaultVisible: true },
    { key: 'ts_gut', label: 'Gút (Gout)', section: 'tienSu', sectionName: 'B. Tiền sử bệnh & Dùng thuốc', defaultVisible: true },
    { key: 'ts_ungThu', label: 'Ung thư', section: 'tienSu', sectionName: 'B. Tiền sử bệnh & Dùng thuốc', defaultVisible: true },
    { key: 'ts_suyTim', label: 'Suy tim ứ huyết', section: 'tienSu', sectionName: 'B. Tiền sử bệnh & Dùng thuốc', defaultVisible: true },
    { key: 'ts_benhMachMauNao', label: 'Bệnh mạch máu não', section: 'tienSu', sectionName: 'B. Tiền sử bệnh & Dùng thuốc', defaultVisible: true },
    { key: 'ts_khac', label: 'Bệnh đồng mắc khác (ghi rõ)', section: 'tienSu', sectionName: 'B. Tiền sử bệnh & Dùng thuốc', defaultVisible: true },
    {
        key: 'ts_hutThuocLa',
        label: 'Hút thuốc lá & Số bao-năm',
        section: 'tienSu',
        sectionName: 'B. Tiền sử bệnh & Dùng thuốc',
        defaultVisible: true,
        subFields: [
            { key: 'ts_hutThuocLa_coKhong', label: 'Có / Không hút thuốc' },
            { key: 'ts_hutThuocLa_soBaoNam', label: 'Số bao-năm' },
        ],
    },
    { key: 'ts_thuocDaDung', label: 'Bảng thuốc đã dùng trước nhập viện', section: 'tienSu', sectionName: 'B. Tiền sử bệnh & Dùng thuốc', defaultVisible: true },

    // ── C. Lâm sàng ──
    { key: 'ls_thoiDiemTrieuChung', label: 'Thời điểm xuất hiện triệu chứng', section: 'lamSang', sectionName: 'C. Triệu chứng lâm sàng', defaultVisible: true },
    {
        key: 'ls_sinhHieu',
        label: 'Dấu hiệu sinh tồn (Mạch, HA, Nhiệt độ, Nhịp thở, SpO2, BMI)',
        section: 'lamSang',
        sectionName: 'C. Triệu chứng lâm sàng',
        defaultVisible: true,
        subFields: [
            { key: 'ls_sinhHieu_mach', label: 'Mạch (l/p)' },
            { key: 'ls_sinhHieu_huyetAp', label: 'Huyết áp (mmHg)' },
            { key: 'ls_sinhHieu_nhietDo', label: 'Nhiệt độ (°C)' },
            { key: 'ls_sinhHieu_nhipTho', label: 'Nhịp thở (l/p)' },
            { key: 'ls_sinhHieu_spO2', label: 'SpO₂ (%)' },
            { key: 'ls_sinhHieu_bmi', label: 'BMI (kg/m²)' },
        ],
    },
    { key: 'ls_diemGlasgow', label: 'Điểm Glasgow', section: 'lamSang', sectionName: 'C. Triệu chứng lâm sàng', defaultVisible: true },
    {
        key: 'ls_ho',
        label: 'Triệu chứng ho (Ho khan, Ho máu, Ho khạc đờm, màu sắc/tính chất)',
        section: 'lamSang',
        sectionName: 'C. Triệu chứng lâm sàng',
        defaultVisible: true,
        subFields: [
            { key: 'ls_ho_khan', label: 'Ho khan' },
            { key: 'ls_ho_mau', label: 'Ho máu' },
            { key: 'ls_ho_khacDom', label: 'Ho khạc đờm' },
            { key: 'ls_ho_tinhChatMauSac', label: 'Tính chất & Màu sắc đờm' },
        ],
    },
    {
        key: 'ls_coNang',
        label: 'Đau ngực & Khó thở',
        section: 'lamSang',
        sectionName: 'C. Triệu chứng lâm sàng',
        defaultVisible: true,
        subFields: [
            { key: 'ls_coNang_dauNguc', label: 'Đau ngực' },
            { key: 'ls_coNang_khoTho', label: 'Khó thở' },
        ],
    },
    {
        key: 'ls_ranPhoi',
        label: 'Ran phổi (Ran ẩm, Ran nổ, Ran rít, Ran ngáy)',
        section: 'lamSang',
        sectionName: 'C. Triệu chứng lâm sàng',
        defaultVisible: true,
        subFields: [
            { key: 'ls_ranPhoi_ranAm', label: 'Ran ẩm' },
            { key: 'ls_ranPhoi_ranNo', label: 'Ran nổ' },
            { key: 'ls_ranPhoi_ranRit', label: 'Ran rít' },
            { key: 'ls_ranPhoi_ranNgay', label: 'Ran ngáy' },
        ],
    },
    { key: 'ls_hoiChungTDMP', label: 'Hội chứng tràn dịch màng phổi', section: 'lamSang', sectionName: 'C. Triệu chứng lâm sàng', defaultVisible: true },
    { key: 'ls_hoiChungDongDac', label: 'Hội chứng đông đặc', section: 'lamSang', sectionName: 'C. Triệu chứng lâm sàng', defaultVisible: true },
    { key: 'ls_hoiChungTKMP', label: 'Hội chứng tràn khí màng phổi', section: 'lamSang', sectionName: 'C. Triệu chứng lâm sàng', defaultVisible: true },

    // ── D1. Xét nghiệm Cận lâm sàng ──
    {
        key: 'cls_congThucMau',
        label: 'Công thức máu (WBC, Neutro, Lympho, RBC, Hb, Hct, PLT)',
        section: 'canLamSang',
        sectionName: 'D1. Xét nghiệm cận lâm sàng',
        defaultVisible: true,
        subFields: [
            { key: 'cls_ctm_wbc', label: 'WBC (Bạch cầu)' },
            { key: 'cls_ctm_neutro', label: 'Neutrophil (%)' },
            { key: 'cls_ctm_lympho', label: 'Lympho (%)' },
            { key: 'cls_ctm_rbc', label: 'RBC (Hồng cầu)' },
            { key: 'cls_ctm_hb', label: 'Hemoglobin (Hb)' },
            { key: 'cls_ctm_hct', label: 'Hematocrit (Hct)' },
            { key: 'cls_ctm_plt', label: 'PLT (Tiểu cầu)' },
        ],
    },
    {
        key: 'cls_dienGiaiDo',
        label: 'Điện giải đồ (Na, K, Cl)',
        section: 'canLamSang',
        sectionName: 'D1. Xét nghiệm cận lâm sàng',
        defaultVisible: true,
        subFields: [
            { key: 'cls_dgd_na', label: 'Na (Natri)' },
            { key: 'cls_dgd_k', label: 'K (Kali)' },
            { key: 'cls_dgd_cl', label: 'Cl (Clo)' },
        ],
    },
    {
        key: 'cls_khiMau',
        label: 'Khí máu động mạch (pH, SaO2, PaCO2, HCO3, BE)',
        section: 'canLamSang',
        sectionName: 'D1. Xét nghiệm cận lâm sàng',
        defaultVisible: true,
        subFields: [
            { key: 'cls_km_ph', label: 'pH' },
            { key: 'cls_km_sao2', label: 'SaO₂' },
            { key: 'cls_km_paco2', label: 'PaCO₂' },
            { key: 'cls_km_hco3', label: 'HCO₃' },
            { key: 'cls_km_be', label: 'BE' },
        ],
    },
    {
        key: 'cls_sinhHoaMau',
        label: 'Sinh hóa máu (Ure, Creatinin, AST, ALT, GGT, Glucose, Protein, Albumin)',
        section: 'canLamSang',
        sectionName: 'D1. Xét nghiệm cận lâm sàng',
        defaultVisible: true,
        subFields: [
            { key: 'cls_shm_ure', label: 'Ure máu' },
            { key: 'cls_shm_creatinin', label: 'Creatinin' },
            { key: 'cls_shm_ast', label: 'AST (GOT)' },
            { key: 'cls_shm_alt', label: 'ALT (GPT)' },
            { key: 'cls_shm_ggt', label: 'GGT' },
            { key: 'cls_shm_glucose', label: 'Glucose máu' },
            { key: 'cls_shm_protein', label: 'Protein' },
            { key: 'cls_shm_albumin', label: 'Albumin' },
        ],
    },
    {
        key: 'cls_viem',
        label: 'Dấu ấn viêm (CRP, Procalcitonin)',
        section: 'canLamSang',
        sectionName: 'D1. Xét nghiệm cận lâm sàng',
        defaultVisible: true,
        subFields: [
            { key: 'cls_viem_crp', label: 'CRP (mg/l)' },
            { key: 'cls_viem_pct', label: 'Procalcitonin (pg/ml)' },
        ],
    },
    {
        key: 'cls_dauAnSinhHoc',
        label: 'Dấu ấn sinh học (Barcode, sTREM-1, TIMP-1, IL6, IL10, IL17)',
        section: 'canLamSang',
        sectionName: 'D1. Xét nghiệm cận lâm sàng',
        defaultVisible: true,
        subFields: [
            { key: 'cls_dash_barcode', label: 'Mã vạch (Barcode)' },
            { key: 'cls_dash_strem1', label: 'sTREM-1' },
            { key: 'cls_dash_timp1', label: 'TIMP-1' },
            { key: 'cls_dash_il6', label: 'IL-6' },
            { key: 'cls_dash_il10', label: 'IL-10' },
            { key: 'cls_dash_il17', label: 'IL-17' },
        ],
    },
    {
        key: 'cls_chiSoTinhToan',
        label: 'Các chỉ số tỷ lệ tính toán (NLR, PLR, CAR)',
        section: 'canLamSang',
        sectionName: 'D1. Xét nghiệm cận lâm sàng',
        defaultVisible: true,
        subFields: [
            { key: 'cls_cstt_nlr', label: 'NLR' },
            { key: 'cls_cstt_plr', label: 'PLR' },
            { key: 'cls_cstt_car', label: 'CAR' },
        ],
    },

    // ── D2. Chẩn đoán hình ảnh ──
    { key: 'ha_xquang', label: 'Tổn thương X-quang ngực thẳng', section: 'hinhAnh', sectionName: 'D2. Chẩn đoán hình ảnh', defaultVisible: true },
    { key: 'ha_ct', label: 'Tổn thương Cắt lớp vi tính (CT-Scanner) ngực', section: 'hinhAnh', sectionName: 'D2. Chẩn đoán hình ảnh', defaultVisible: true },

    // ── D3. Vi khuẩn & KS đồ ──
    { key: 'cls_viKhuan', label: 'Kết quả cấy vi khuẩn & Kháng sinh đồ (S/I/R)', section: 'viKhuan', sectionName: 'D3. Vi khuẩn & Kháng sinh đồ', defaultVisible: true },

    // ── E. Phân độ nặng ──
    {
        key: 'score_curb65',
        label: 'Thang điểm & Phân nhóm CURB-65 (Chi tiết C-U-R-B-65)',
        section: 'phanDo',
        sectionName: 'E. Phân độ nặng (CURB-65 & PSI)',
        defaultVisible: true,
        subFields: [
            { key: 'curb65_tongDiem', label: 'Tổng điểm & Phân nhóm CURB-65' },
            { key: 'curb65_c', label: 'C — Confusion (Rối loạn ý thức)' },
            { key: 'curb65_u', label: 'U — Ure > 7 mmol/L' },
            { key: 'curb65_r', label: 'R — Nhịp thở ≥ 30' },
            { key: 'curb65_b', label: 'B — HA < 90/60 mmHg' },
            { key: 'curb65_age65', label: '65 — Tuổi ≥ 65' },
        ],
    },
    { key: 'score_psi', label: 'Thang điểm & Phân tầng nguy cơ PSI', section: 'phanDo', sectionName: 'E. Phân độ nặng (CURB-65 & PSI)', defaultVisible: true },

    // ── F. Kết cục ──
    {
        key: 'kc_dienBien',
        label: 'Diễn biến điều trị (Thở máy, Sốc NK, Lọc máu)',
        section: 'ketCuc',
        sectionName: 'F. Kết cục điều trị',
        defaultVisible: true,
        subFields: [
            { key: 'kc_dienBien_thoMay', label: 'Thở máy' },
            { key: 'kc_dienBien_socNhiemKhuan', label: 'Sốc nhiễm khuẩn' },
            { key: 'kc_dienBien_locMau', label: 'Lọc máu' },
        ],
    },
    {
        key: 'kc_tinhTrangRaVien',
        label: 'Tình trạng ra viện (Tử vong, Xin về, Xuất viện, Chuyển tuyến)',
        section: 'ketCuc',
        sectionName: 'F. Kết cục điều trị',
        defaultVisible: true,
        subFields: [
            { key: 'kc_tinhTrangRaVien_xuatVien', label: 'Tiến triển tốt, xuất viện' },
            { key: 'kc_tinhTrangRaVien_tuVong', label: 'Tử vong' },
            { key: 'kc_tinhTrangRaVien_xinVe', label: 'Xin về' },
            { key: 'kc_tinhTrangRaVien_chuyenTuyen', label: 'Chuyển tuyến' },
        ],
    },
    {
        key: 'kc_khangSinh',
        label: 'Thời gian dùng kháng sinh (Ngày BĐ, Ngày KT, Tổng số ngày)',
        section: 'ketCuc',
        sectionName: 'F. Kết cục điều trị',
        defaultVisible: true,
        subFields: [
            { key: 'kc_khangSinh_ngayBatDau', label: 'Ngày bắt đầu kháng sinh' },
            { key: 'kc_khangSinh_ngayKetThuc', label: 'Ngày kết thúc kháng sinh' },
            { key: 'kc_khangSinh_soNgay', label: 'Số ngày sử dụng KS' },
        ],
    },
    { key: 'kc_soNgayDieuTri', label: 'Tổng số ngày điều trị nội trú', section: 'ketCuc', sectionName: 'F. Kết cục điều trị', defaultVisible: true },
];

export type BancFieldVisibility = Record<string, boolean>;

export const DEFAULT_BANC_VISIBILITY: BancFieldVisibility = (() => {
    const map: BancFieldVisibility = {};
    for (const f of BANC_FIELDS) {
        map[f.key] = f.defaultVisible;
        if (f.subFields) {
            for (const sub of f.subFields) {
                map[sub.key] = sub.defaultVisible ?? true;
            }
        }
    }
    return map;
})();

export const BANC_STORAGE_KEY = 'cap_banc_field_visibility';

export function loadBancVisibility(): BancFieldVisibility {
    try {
        const raw = localStorage.getItem(BANC_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (typeof parsed === 'object' && parsed !== null) {
                return { ...DEFAULT_BANC_VISIBILITY, ...parsed };
            }
        }
    } catch { /* ignore */ }
    return { ...DEFAULT_BANC_VISIBILITY };
}
