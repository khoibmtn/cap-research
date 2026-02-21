export const DEFAULT_BACTERIA = [
    'Klebsiella pneumoniae',
    'Pseudomonas aeruginosa',
    'Aeromonas hydrophila',
    'Enterobacter cloacae',
    'Acinetobacter baumannii',
    'Streptococcus pneumoniae',
    'Klebsiella oxytoca',
    'Escherichia coli',
    'Serratia marcescens',
    'Burkholderia cepacia',
    'Proteus mirabilis',
    'Stenotrophomonas maltophila',
    'Staphylococcus aureus',
];

export const DEFAULT_ANTIBIOTICS = [
    'Ampicillin',
    'Ceftriaxone',
    'Levofloxacin',
    'Gentamycin',
    'Trimethoprim',
    'Ticarcillin',
    'Cefoperazone',
    'Ciprofloxacin',
    'Cefoxitin',
    'Cefuroxim',
    'Cefotaxim',
    'Tetracyclin',
    'Meropenem',
    'Amikacin',
    'Piperacillin/Tazobactam',
];

export const NGHE_NGHIEP_OPTIONS = [
    'Lao động tự do',
    'Công nhân',
    'Nông dân',
    'Viên chức - Văn phòng',
    'HSSV',
    'Hưu trí',
    'Khác',
];

export const XQUANG_VI_TRI = ['1/2 trên', '1/2 dưới', 'cả 1/2 trên-dưới'];
export const XQUANG_HINH_THAI = ['Nốt', 'Đám mờ', 'Dải mờ', 'Hang', 'Tràn dịch màng phổi', 'Tràn khí màng phổi'];
export const CT_THUY = ['Thuỳ trên', 'Thuỳ giữa', 'Thuỳ dưới'];
export const CT_HINH_THAI = ['Kính mờ', 'Đông đặc', 'Nốt mờ', 'Hang', 'Tràn dịch màng phổi', 'Tràn khí màng phổi'];
export const CT_DIEN = ['Hẹp', 'Vừa', 'Rộng'];
export const BEN_OPTIONS = ['Phải', 'Trái', 'Hai bên'];
export const MUC_DO_KHANG_SINH = [
    { value: 'S', label: 'S (Nhạy cảm)' },
    { value: 'I', label: 'I (Trung gian)' },
    { value: 'R', label: 'R (Kháng)' },
];

export const DOM_TINH_OPTIONS = ['Trong', 'Nhầy', 'Đục'];

export const DEFAULT_NOI_O = ['Nông thôn', 'Thành thị', 'Hải đảo'];

export const DEFAULT_DIEN_BIEN_DIEU_TRI = ['Thở máy', 'Sốc nhiễm khuẩn', 'Lọc máu'];

export const DEFAULT_TINH_TRANG_RA_VIEN = ['Tử vong', 'Xin về', 'Tiến triển tốt, xuất viện'];

export const PSI_LABELS: Record<string, { label: string; diem: number }> = {
    nhaDuongLao: { label: 'Sống ở nhà dưỡng lão/điều dưỡng', diem: 10 },
    ungThu: { label: 'Bệnh ung thư', diem: 30 },
    benhGan: { label: 'Bệnh gan', diem: 20 },
    suyTimUHuyet: { label: 'Suy tim ứ huyết', diem: 10 },
    benhMachMauNao: { label: 'Bệnh mạch máu não', diem: 10 },
    benhThan: { label: 'Bệnh thận', diem: 10 },
    thayDoiTriGiac: { label: 'Thay đổi tri giác', diem: 20 },
    tanSoTho30: { label: 'Tần số thở ≥ 30 lần/phút', diem: 20 },
    huyetApTamThu90: { label: 'Huyết áp tâm thu < 90 mmHg', diem: 20 },
    thanNhiet3540: { label: 'Thân nhiệt < 35°C hoặc ≥ 40°C', diem: 15 },
    mach125: { label: 'Mạch ≥ 125 lần/phút', diem: 10 },
    ph735: { label: 'pH < 7,35', diem: 30 },
    bun30: { label: 'BUN ≥ 30 mg/dl (11 mmol/L)', diem: 20 },
    hematocrit30: { label: 'Hematocrit < 30%', diem: 10 },
    naMau130: { label: 'Na+ máu < 130 mmol/L', diem: 20 },
    glucoseMau250: { label: 'Đường máu ≥ 250 mg/dl (14 mmol/L)', diem: 10 },
    paO2_60: { label: 'PaO2 < 60 mmHg hoặc SpO2 < 90%', diem: 10 },
    tranDichMangPhoi: { label: 'Tràn dịch màng phổi', diem: 10 },
};
