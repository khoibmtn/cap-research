/**
 * spssDefaultConfig.ts
 * Default SPSS variable definitions for the CAP Research dataset.
 *
 * Convention:
 *   - Binary clinical vars (bệnh lý/yếu tố nguy cơ): { 0: 'Có', 1: 'Không' }
 *     → For 2×2 table OR analysis: cell (0,0) = disease + exposure
 *   - Binary non-clinical vars: { 0: 'Không', 1: 'Có' }
 *   - Categorical vars: numeric codes, valueLabels defined inline
 *   - Continuous vars: type 'numeric', decimals = 2 (or as appropriate)
 *   - Free-text vars: type 'string', no valueLabels
 *
 * Dynamic slot vars (xquang, ct, vk, thuoc) use isSlotTemplate=true
 * and are expanded at export time.
 */

import type { SpssVarDef, SpssVarConfig, SpssSlotConfig } from '../types/spssTypes';

// ─── Reusable value label sets ──────────────────────────────────────────────
const VL_CO_KHONG: Record<number, string> = { 0: 'Không', 1: 'Có' };
/** Reversed coding for clinical/risk factor binary vars: 0=Có (exposed), 1=Không (not exposed) */
const VL_CO_KHONG_BENH: Record<number, string> = { 0: 'Có', 1: 'Không' };
const VL_GIOI_TINH: Record<number, string> = { 0: 'Nam', 1: 'Nữ' };
const VL_NOI_O: Record<number, string> = {
    0: 'Nông thôn',
    1: 'Thành thị',
    2: 'Hải đảo',
};
const VL_THOIDIEM_DIEU_TRI: Record<number, string> = {
    0: 'Trước điều trị',
    1: 'Trong điều trị',
    2: 'Kết thúc điều trị',
};
const VL_XQ_VITRI: Record<number, string> = {
    0: '1/2 trên',
    1: '1/2 dưới',
    2: 'Cả 1/2 trên-dưới',
};
const VL_XQ_BEN: Record<number, string> = {
    0: 'Phải',
    1: 'Trái',
    2: 'Hai bên',
};
const VL_CT_THUY: Record<number, string> = {
    0: 'Thuỳ trên',
    1: 'Thuỳ giữa',
    2: 'Thuỳ dưới',
};
const VL_CT_DIEN: Record<number, string> = {
    0: 'Hẹp',
    1: 'Vừa',
    2: 'Rộng',
};
const VL_KS_MUCDO: Record<number, string> = {
    0: 'S (Nhạy)',
    1: 'I (Trung gian)',
    2: 'R (Kháng)',
};
const VL_PSI_PHAN_TANG: Record<number, string> = {
    1: 'Class I',
    2: 'Class II',
    3: 'Class III',
    4: 'Class IV',
    5: 'Class V',
};
const VL_CURB65_NHOM: Record<number, string> = {
    0: 'Nhẹ (0-1)',
    1: 'Trung bình (2)',
    2: 'Nặng (3-5)',
};

// ─── Variable definition builder helpers ────────────────────────────────────

const num = (name: string, label: string, group: SpssVarDef['group'], opts: Partial<SpssVarDef> = {}): SpssVarDef => ({
    name, label, type: 'numeric', decimals: 2, measureLevel: 'scale', group, ...opts,
});

const str = (name: string, label: string, group: SpssVarDef['group'], opts: Partial<SpssVarDef> = {}): SpssVarDef => ({
    name, label, type: 'string', width: 64, group, measureLevel: 'nominal', ...opts,
});

/** Binary checkbox variable — numeric 0/1 (non-clinical: 0=Không, 1=Có) */
const bin = (name: string, label: string, group: SpssVarDef['group']): SpssVarDef => ({
    name, label: `${label} (0=Không, 1=Có)`, type: 'numeric',
    decimals: 0, measureLevel: 'nominal', valueLabels: VL_CO_KHONG, group,
});

/** Binary clinical/risk factor variable — reversed: 0=Có (exposed/disease), 1=Không */
const binClinical = (name: string, label: string, group: SpssVarDef['group']): SpssVarDef => ({
    name, label: `${label} (0=Có, 1=Không)`, type: 'numeric',
    decimals: 0, measureLevel: 'nominal', valueLabels: VL_CO_KHONG_BENH, group,
});

/** Categorical numeric variable */
const cat = (name: string, label: string, group: SpssVarDef['group'], valueLabels: Record<number, string>, opts: Partial<SpssVarDef> = {}): SpssVarDef => ({
    name, label, type: 'numeric', decimals: 0, measureLevel: 'nominal', valueLabels, group, ...opts,
});

// ─── GROUP 1: Hành chính ────────────────────────────────────────────────────
const HANH_CHINH: SpssVarDef[] = [
    str('ma_bnnc', 'Mã bệnh nhân nghiên cứu', 'hanh_chinh', { width: 16 }),
    str('ma_ba', 'Mã bệnh án nội trú', 'hanh_chinh', { width: 24 }),
    str('ho_ten', 'Họ tên bệnh nhân', 'hanh_chinh', { width: 64 }),
    num('tuoi', 'Tuổi (năm)', 'hanh_chinh', { decimals: 0, measureLevel: 'scale' }),
    cat('gioi_tinh', 'Giới tính', 'hanh_chinh', VL_GIOI_TINH),
    str('nghe_nghiep', 'Nghề nghiệp', 'hanh_chinh', { width: 64 }),
    str('xa_phuong', 'Xã/Phường', 'hanh_chinh', { width: 64 }),
    str('tinh_thanh', 'Tỉnh/Thành phố', 'hanh_chinh', { width: 64 }),
    cat('noi_o', 'Nơi ở', 'hanh_chinh', VL_NOI_O),
    str('ngay_vao_vien', 'Ngày vào viện (dd/mm/yyyy)', 'hanh_chinh', { width: 16 }),
    str('ngay_ra_vien', 'Ngày ra viện (dd/mm/yyyy)', 'hanh_chinh', { width: 16 }),
    str('ghi_chu', 'Ghi chú hành chính', 'hanh_chinh', { width: 255 }),
];

// ─── GROUP 2: Tiền sử ────────────────────────────────────────────────────────
const TIEN_SU: SpssVarDef[] = [
    binClinical('ts_dtd', 'Tiền sử: Đái tháo đường', 'tien_su'),
    binClinical('ts_tha', 'Tiền sử: Tăng huyết áp', 'tien_su'),
    binClinical('ts_vdd', 'Tiền sử: Viêm dạ dày', 'tien_su'),
    binClinical('ts_vgm', 'Tiền sử: Viêm gan mạn', 'tien_su'),
    binClinical('ts_btnm', 'Tiền sử: Bệnh thận mạn', 'tien_su'),
    binClinical('ts_gut', 'Tiền sử: Gút', 'tien_su'),
    binClinical('ts_ung_thu', 'Tiền sử: Ung thư', 'tien_su'),
    binClinical('ts_suy_tim', 'Tiền sử: Suy tim ứ huyết', 'tien_su'),
    binClinical('ts_mach_nao', 'Tiền sử: Bệnh mạch máu não', 'tien_su'),
    str('ts_khac', 'Tiền sử: Khác (mô tả)', 'tien_su', { width: 128 }),
    binClinical('ts_hut_thuoc', 'Tiền sử: Hút thuốc lá', 'tien_su'),
    num('ts_bao_nam', 'Tiền sử: Số bao-năm hút thuốc', 'tien_su', { decimals: 1, measureLevel: 'scale' }),
];

// ─── GROUP 3: Lâm sàng ───────────────────────────────────────────────────────
const LAM_SANG: SpssVarDef[] = [
    str('ls_tg_tc', 'Lâm sàng: Thời điểm triệu chứng (dd/mm/yyyy)', 'lam_sang', { width: 16 }),
    num('ls_mach', 'Lâm sàng: Mạch (lần/phút)', 'lam_sang', { decimals: 0, measureLevel: 'scale' }),
    num('ls_ha_tam_thu', 'Lâm sàng: Huyết áp tâm thu (mmHg)', 'lam_sang', { decimals: 0, measureLevel: 'scale' }),
    num('ls_ha_tam_truong', 'Lâm sàng: Huyết áp tâm trương (mmHg)', 'lam_sang', { decimals: 0, measureLevel: 'scale' }),
    num('ls_nhiet_do', 'Lâm sàng: Nhiệt độ (°C)', 'lam_sang', { decimals: 1, measureLevel: 'scale' }),
    num('ls_nhip_tho', 'Lâm sàng: Nhịp thở (lần/phút)', 'lam_sang', { decimals: 0, measureLevel: 'scale' }),
    num('ls_spo2', 'Lâm sàng: SpO2 (%)', 'lam_sang', { decimals: 1, measureLevel: 'scale' }),
    num('ls_bmi', 'Lâm sàng: BMI (kg/m²)', 'lam_sang', { decimals: 2, measureLevel: 'scale' }),
    num('ls_glasgow', 'Lâm sàng: Điểm Glasgow', 'lam_sang', { decimals: 0, measureLevel: 'ordinal' }),
    binClinical('ls_ho_khan', 'Lâm sàng: Ho khan', 'lam_sang'),
    binClinical('ls_ho_mau', 'Lâm sàng: Ho máu', 'lam_sang'),
    binClinical('ls_ho_dom', 'Lâm sàng: Ho khạc đờm', 'lam_sang'),
    str('ls_dom_mau_sac', 'Lâm sàng: Màu sắc đờm', 'lam_sang', { width: 64 }),
    binClinical('ls_dau_nguc', 'Lâm sàng: Đau ngực', 'lam_sang'),
    binClinical('ls_kho_tho', 'Lâm sàng: Khó thở', 'lam_sang'),
    binClinical('ls_ran_am', 'Lâm sàng: Ran ẩm', 'lam_sang'),
    binClinical('ls_ran_no', 'Lâm sàng: Ran nổ', 'lam_sang'),
    binClinical('ls_ran_rit', 'Lâm sàng: Ran rít', 'lam_sang'),
    binClinical('ls_ran_ngay', 'Lâm sàng: Ran ngáy', 'lam_sang'),
    binClinical('ls_tdmp_co', 'Lâm sàng: Hội chứng TĐMP', 'lam_sang'),
    str('ls_tdmp_ben', 'Lâm sàng: Hội chứng TĐMP - Bên', 'lam_sang', { width: 16 }),
    binClinical('ls_dongdac_co', 'Lâm sàng: Hội chứng Đông đặc', 'lam_sang'),
    str('ls_dongdac_ben', 'Lâm sàng: Hội chứng Đông đặc - Bên', 'lam_sang', { width: 16 }),
    binClinical('ls_tkmp_co', 'Lâm sàng: Hội chứng TKMP', 'lam_sang'),
    str('ls_tkmp_ben', 'Lâm sàng: Hội chứng TKMP - Bên', 'lam_sang', { width: 16 }),
];

// ─── GROUP 4: Xét nghiệm ─────────────────────────────────────────────────────
const XET_NGHIEM: SpssVarDef[] = [
    // Công thức máu
    num('xn_wbc', 'XN: WBC (G/l)', 'xet_nghiem', { decimals: 2 }),
    num('xn_neutrophil', 'XN: Neutrophil (%)', 'xet_nghiem', { decimals: 1 }),
    num('xn_lymphocyte', 'XN: Lymphocyte (%)', 'xet_nghiem', { decimals: 1 }),
    num('xn_rbc', 'XN: RBC (T/l)', 'xet_nghiem', { decimals: 2 }),
    num('xn_hemoglobin', 'XN: Hemoglobin (g/l)', 'xet_nghiem', { decimals: 1 }),
    num('xn_hct', 'XN: Hematocrit (%)', 'xet_nghiem', { decimals: 1 }),
    num('xn_plt', 'XN: PLT (G/l)', 'xet_nghiem', { decimals: 0 }),
    // Sinh hoá
    num('xn_ure', 'XN: Ure (mmol/l)', 'xet_nghiem', { decimals: 2 }),
    num('xn_creatinin', 'XN: Creatinin (µmol/l)', 'xet_nghiem', { decimals: 1 }),
    num('xn_ast', 'XN: AST (U/l)', 'xet_nghiem', { decimals: 1 }),
    num('xn_alt', 'XN: ALT (U/l)', 'xet_nghiem', { decimals: 1 }),
    num('xn_ggt', 'XN: GGT (U/l)', 'xet_nghiem', { decimals: 1 }),
    num('xn_glucose', 'XN: Glucose (µmol/l)', 'xet_nghiem', { decimals: 2 }),
    num('xn_protein', 'XN: Protein toàn phần (g/l)', 'xet_nghiem', { decimals: 1 }),
    num('xn_albumin', 'XN: Albumin (g/l)', 'xet_nghiem', { decimals: 1 }),
    num('xn_crp', 'XN: CRP (mg/l)', 'xet_nghiem', { decimals: 2 }),
    num('xn_pct', 'XN: Procalcitonin (pg/ml)', 'xet_nghiem', { decimals: 3 }),
    // Điện giải
    num('xn_na', 'XN: Na+ (mmol/l)', 'xet_nghiem', { decimals: 1 }),
    num('xn_k', 'XN: K+ (mmol/l)', 'xet_nghiem', { decimals: 1 }),
    num('xn_cl', 'XN: Cl- (mmol/l)', 'xet_nghiem', { decimals: 1 }),
    // Khí máu
    num('xn_ph', 'XN: pH máu', 'xet_nghiem', { decimals: 2 }),
    num('xn_sao2', 'XN: SaO2 (%)', 'xet_nghiem', { decimals: 1 }),
    num('xn_paco2', 'XN: PaCO2 (mmHg)', 'xet_nghiem', { decimals: 1 }),
    num('xn_hco3', 'XN: HCO3- (mmol/l)', 'xet_nghiem', { decimals: 1 }),
    num('xn_be', 'XN: BE (mmol/l)', 'xet_nghiem', { decimals: 1 }),
    // Biomarker
    str('xn_bm_barcode', 'XN: Biomarker Barcode', 'xet_nghiem', { width: 32 }),
    num('xn_strem1', 'XN: sTREM-1 (pg/ml)', 'xet_nghiem', { decimals: 2 }),
    num('xn_timp1', 'XN: TIMP-1 (pg/ml)', 'xet_nghiem', { decimals: 2 }),
    num('xn_il6', 'XN: IL-6 (pg/ml)', 'xet_nghiem', { decimals: 2 }),
    num('xn_il10', 'XN: IL-10 (pg/ml)', 'xet_nghiem', { decimals: 2 }),
    num('xn_il17', 'XN: IL-17 (pg/ml)', 'xet_nghiem', { decimals: 2 }),
];

// ─── GROUP 5: Chỉ số tính toán ───────────────────────────────────────────────
const CHI_SO: SpssVarDef[] = [
    num('cs_nlr', 'Chỉ số: NLR (Neutrophil/Lymphocyte Ratio)', 'chi_so', { decimals: 2 }),
    num('cs_plr', 'Chỉ số: PLR (PLT/Lymphocyte Ratio)', 'chi_so', { decimals: 2 }),
    num('cs_car', 'Chỉ số: CAR (CRP/Albumin Ratio)', 'chi_so', { decimals: 3 }),
];

// ─── GROUP 6: Hình ảnh — static boolean fields ────────────────────────────────
const HINH_ANH_STATIC: SpssVarDef[] = [
    binClinical('ha_xq_tran_dich', 'XQ: Tràn dịch màng phổi', 'hinh_anh'),
    binClinical('ha_xq_tran_khi', 'XQ: Tràn khí màng phổi', 'hinh_anh'),
    binClinical('ha_ct_tran_dich', 'CT: Tràn dịch màng phổi', 'hinh_anh'),
    binClinical('ha_ct_tran_khi', 'CT: Tràn khí màng phổi', 'hinh_anh'),
];

/**
 * Slot template for X-quang lesions.
 * At export time, this generates vars: xq1_vitri, xq1_ben, xq1_hinhthai, xq1_dien, xq1_thoiDiem
 * ... up to xq{n}_... where n = slotConfig.xquang
 */
const HINH_ANH_XQ_TEMPLATE: SpssVarDef[] = [
    { name: 'xq{n}_vitri', label: 'X-quang [{n}]: Vị trí tổn thương', type: 'numeric', decimals: 0, measureLevel: 'nominal', valueLabels: VL_XQ_VITRI, templateKey: 'xq_vitri', group: 'hinh_anh', isSlotTemplate: true },
    { name: 'xq{n}_ben', label: 'X-quang [{n}]: Bên tổn thương', type: 'numeric', decimals: 0, measureLevel: 'nominal', valueLabels: VL_XQ_BEN, templateKey: 'xq_ben', group: 'hinh_anh', isSlotTemplate: true },
    { name: 'xq{n}_hinhthai', label: 'X-quang [{n}]: Hình thái tổn thương', type: 'string', width: 64, measureLevel: 'nominal', group: 'hinh_anh', isSlotTemplate: true },
    { name: 'xq{n}_dien', label: 'X-quang [{n}]: Diện tổn thương', type: 'string', width: 32, measureLevel: 'nominal', group: 'hinh_anh', isSlotTemplate: true },
    { name: 'xq{n}_thoiDiem', label: 'X-quang [{n}]: Thời điểm chụp', type: 'numeric', decimals: 0, measureLevel: 'nominal', valueLabels: VL_THOIDIEM_DIEU_TRI, templateKey: 'thoiDiem_dieuTri', group: 'hinh_anh', isSlotTemplate: true },
];

/** Slot template for CT lesions */
const HINH_ANH_CT_TEMPLATE: SpssVarDef[] = [
    { name: 'ct{n}_thuy', label: 'CT [{n}]: Thuỳ phổi tổn thương', type: 'numeric', decimals: 0, measureLevel: 'nominal', valueLabels: VL_CT_THUY, templateKey: 'ct_thuy', group: 'hinh_anh', isSlotTemplate: true },
    { name: 'ct{n}_ben', label: 'CT [{n}]: Bên tổn thương', type: 'numeric', decimals: 0, measureLevel: 'nominal', valueLabels: VL_XQ_BEN, templateKey: 'xq_ben', group: 'hinh_anh', isSlotTemplate: true },
    { name: 'ct{n}_hinhthai', label: 'CT [{n}]: Hình thái tổn thương', type: 'string', width: 64, measureLevel: 'nominal', group: 'hinh_anh', isSlotTemplate: true },
    { name: 'ct{n}_dien', label: 'CT [{n}]: Diện tổn thương', type: 'numeric', decimals: 0, measureLevel: 'nominal', valueLabels: VL_CT_DIEN, templateKey: 'ct_dien', group: 'hinh_anh', isSlotTemplate: true },
    { name: 'ct{n}_thoiDiem', label: 'CT [{n}]: Thời điểm chụp', type: 'numeric', decimals: 0, measureLevel: 'nominal', valueLabels: VL_THOIDIEM_DIEU_TRI, templateKey: 'thoiDiem_dieuTri', group: 'hinh_anh', isSlotTemplate: true },
];

// ─── GROUP 7: Vi khuẩn slot templates ────────────────────────────────────────
const VI_KHUAN_STATIC: SpssVarDef[] = [
    bin('vk_khong_moc', 'Vi khuẩn: Cấy không mọc vi khuẩn (xác nhận)', 'vi_khuan'),
];

const VI_KHUAN_TEMPLATE: SpssVarDef[] = [
    { name: 'vk{n}_co', label: 'Vi khuẩn [{n}]: Có mọc', type: 'numeric', decimals: 0, measureLevel: 'nominal', valueLabels: VL_CO_KHONG, templateKey: 'vk_co', group: 'vi_khuan', isSlotTemplate: true },
    { name: 'vk{n}_ten', label: 'Vi khuẩn [{n}]: Tên vi khuẩn', type: 'string', width: 64, measureLevel: 'nominal', group: 'vi_khuan', isSlotTemplate: true },
];

/** Antibiogram template — expands per (VK slot × KS slot) */
const KHANG_SINH_TEMPLATE: SpssVarDef[] = [
    { name: 'vk{n}_ks{k}_ten', label: 'VK [{n}] - Kháng sinh [{k}]: Tên', type: 'string', width: 64, measureLevel: 'nominal', group: 'vi_khuan', isSlotTemplate: true },
    { name: 'vk{n}_ks{k}_kq', label: 'VK [{n}] - Kháng sinh [{k}]: Kết quả (S/I/R)', type: 'numeric', decimals: 0, measureLevel: 'ordinal', valueLabels: VL_KS_MUCDO, templateKey: 'ks_mucdo', group: 'vi_khuan', isSlotTemplate: true },
];

// ─── GROUP 8: Thuốc đã dùng slot templates ───────────────────────────────────
const THUOC_TEMPLATE: SpssVarDef[] = [
    { name: 'thuoc{n}_ten_goc', label: 'Thuốc [{n}]: Tên gốc (generic)', type: 'string', width: 64, measureLevel: 'nominal', group: 'thuoc', isSlotTemplate: true },
    { name: 'thuoc{n}_ten', label: 'Thuốc [{n}]: Tên biệt dược', type: 'string', width: 64, measureLevel: 'nominal', group: 'thuoc', isSlotTemplate: true },
    { name: 'thuoc{n}_lieu', label: 'Thuốc [{n}]: Liều lượng', type: 'string', width: 32, measureLevel: 'nominal', group: 'thuoc', isSlotTemplate: true },
    { name: 'thuoc{n}_tong_lieu', label: 'Thuốc [{n}]: Tổng liều', type: 'string', width: 32, measureLevel: 'nominal', group: 'thuoc', isSlotTemplate: true },
    { name: 'thuoc{n}_duong_dung', label: 'Thuốc [{n}]: Đường dùng', type: 'string', width: 32, measureLevel: 'nominal', group: 'thuoc', isSlotTemplate: true },
    { name: 'thuoc{n}_thoi_gian', label: 'Thuốc [{n}]: Thời gian dùng (ngày)', type: 'numeric', decimals: 0, measureLevel: 'scale', group: 'thuoc', isSlotTemplate: true },
];

// ─── GROUP 9: PSI ─────────────────────────────────────────────────────────────
const PSI: SpssVarDef[] = [
    // Criteria — all numeric 0/1 (boolean flags)
    binClinical('psi_nha_duong_lao', 'PSI: Nhà dưỡng lão', 'psi'),
    binClinical('psi_ung_thu', 'PSI: Ung thư', 'psi'),
    binClinical('psi_benh_gan', 'PSI: Bệnh gan', 'psi'),
    binClinical('psi_suy_tim', 'PSI: Suy tim ứ huyết', 'psi'),
    binClinical('psi_mach_nao', 'PSI: Bệnh mạch máu não', 'psi'),
    binClinical('psi_benh_than', 'PSI: Bệnh thận', 'psi'),
    binClinical('psi_thay_doi_tri_giac', 'PSI: Thay đổi tri giác', 'psi'),
    binClinical('psi_tan_so_tho30', 'PSI: Tần số thở ≥ 30 lần/phút', 'psi'),
    binClinical('psi_ha_tam_thu90', 'PSI: Huyết áp tâm thu < 90 mmHg', 'psi'),
    binClinical('psi_than_nhiet_3540', 'PSI: Thân nhiệt < 35°C hoặc ≥ 40°C', 'psi'),
    binClinical('psi_mach125', 'PSI: Mạch ≥ 125 lần/phút', 'psi'),
    binClinical('psi_ph735', 'PSI: pH máu < 7.35', 'psi'),
    binClinical('psi_bun30', 'PSI: BUN ≥ 30 mg/dl (Ure ≥ 10.7 mmol/l)', 'psi'),
    binClinical('psi_hematocrit30', 'PSI: Hematocrit < 30%', 'psi'),
    binClinical('psi_na_mau130', 'PSI: Na+ < 130 mEq/l', 'psi'),
    binClinical('psi_glucose250', 'PSI: Glucose ≥ 250 mg/dl (13.9 mmol/l)', 'psi'),
    binClinical('psi_pao2_60', 'PSI: PaO2 < 60 mmHg', 'psi'),
    binClinical('psi_tran_dich_mp', 'PSI: Tràn dịch màng phổi', 'psi'),
    // Summary
    num('psi_tong_diem', 'PSI: Tổng điểm', 'psi', { decimals: 0, measureLevel: 'scale' }),
    cat('psi_phan_tang', 'PSI: Phân tầng nguy cơ', 'psi', VL_PSI_PHAN_TANG, { measureLevel: 'ordinal' }),
];

// ─── GROUP 10: CURB-65 ────────────────────────────────────────────────────────
const CURB65: SpssVarDef[] = [
    binClinical('curb_c', 'CURB-65: C — Rối loạn ý thức (Confusion)', 'curb65'),
    binClinical('curb_u', 'CURB-65: U — Ure > 7 mmol/l', 'curb65'),
    binClinical('curb_r', 'CURB-65: R — Nhịp thở ≥ 30 lần/phút', 'curb65'),
    binClinical('curb_b', 'CURB-65: B — Huyết áp tâm thu < 90 hoặc tâm trương ≤ 60 mmHg', 'curb65'),
    binClinical('curb_age65', 'CURB-65: 65 — Tuổi ≥ 65', 'curb65'),
    num('curb_tong_diem', 'CURB-65: Tổng điểm (0-5)', 'curb65', { decimals: 0, measureLevel: 'ordinal' }),
    cat('curb_phan_nhom', 'CURB-65: Phân nhóm nguy cơ', 'curb65', VL_CURB65_NHOM, { measureLevel: 'ordinal' }),
    bin('curb_du_du_lieu', 'CURB-65: Đủ dữ liệu để tính điểm', 'curb65'),
];

// ─── GROUP 11: Kết cục ───────────────────────────────────────────────────────
const KET_CUC: SpssVarDef[] = [
    // Diễn biến điều trị — mỗi mục là 1 biến nhị phân riêng
    binClinical('kc_tho_may', 'Kết cục: Thở máy', 'ket_cuc'),
    binClinical('kc_soc_nk', 'Kết cục: Sốc nhiễm khuẩn', 'ket_cuc'),
    binClinical('kc_loc_mau', 'Kết cục: Lọc máu', 'ket_cuc'),
    num('kc_ngay_loc_mau', 'Kết cục: Số ngày lọc máu', 'ket_cuc', { decimals: 0, measureLevel: 'scale' }),
    // Tình trạng ra viện — chuỗi (text từ dropdown)
    str('kc_tinh_trang_ra_vien', 'Kết cục: Tình trạng ra viện', 'ket_cuc', { width: 64 }),
    // Legacy binary outcomes
    binClinical('kc_tu_vong', 'Kết cục: Tử vong', 'ket_cuc'),
    binClinical('kc_xin_ve', 'Kết cục: Xin về', 'ket_cuc'),
    bin('kc_tien_trien_tot', 'Kết cục: Tiến triển tốt — xuất viện', 'ket_cuc'),
    // Thời gian
    num('kc_ngay_dieu_tri', 'Kết cục: Tổng số ngày điều trị', 'ket_cuc', { decimals: 0, measureLevel: 'scale' }),
    str('kc_ngay_bat_dau_ks', 'Kết cục: Ngày bắt đầu kháng sinh (dd/mm/yyyy)', 'ket_cuc', { width: 16 }),
    str('kc_ngay_ket_thuc_ks', 'Kết cục: Ngày kết thúc kháng sinh (dd/mm/yyyy)', 'ket_cuc', { width: 16 }),
];

// ─── Exported default config builder ─────────────────────────────────────────

/**
 * Builds the default SpssVarConfig including templates.
 * Templates are stored as-is in the config; slot expansion happens at export time.
 */
export function buildDefaultSpssConfig(slotConfig?: Partial<SpssSlotConfig>): SpssVarConfig {
    const slots: SpssSlotConfig = {
        xquang: 5,
        ct: 5,
        viKhuan: 5,
        khangSinhPerVK: 15,
        thuoc: 10,
        ...slotConfig,
    };

    const vars: SpssVarDef[] = [
        ...HANH_CHINH,
        ...TIEN_SU,
        ...LAM_SANG,
        ...XET_NGHIEM,
        ...CHI_SO,
        ...HINH_ANH_STATIC,
        // Slot templates — tagged with isSlotTemplate=true
        ...HINH_ANH_XQ_TEMPLATE,
        ...HINH_ANH_CT_TEMPLATE,
        ...VI_KHUAN_STATIC,
        ...VI_KHUAN_TEMPLATE,
        ...KHANG_SINH_TEMPLATE,
        ...THUOC_TEMPLATE,
        ...PSI,
        ...CURB65,
        ...KET_CUC,
    ];

    return { vars, slotConfig: slots };
}

export {
    VL_CO_KHONG,
    VL_CO_KHONG_BENH,
    VL_GIOI_TINH,
    VL_NOI_O,
    VL_THOIDIEM_DIEU_TRI,
    VL_XQ_VITRI,
    VL_XQ_BEN,
    VL_CT_THUY,
    VL_CT_DIEN,
    VL_KS_MUCDO,
    VL_PSI_PHAN_TANG,
    VL_CURB65_NHOM,
};
