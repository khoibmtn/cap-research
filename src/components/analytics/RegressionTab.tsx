/**
 * RegressionTab.tsx
 * Tab Hồi quy (Logistic nhị phân & Tuyến tính) cho trang Thống kê.
 * Output tương đương SPSS Regression + diễn giải kết quả.
 */
import { useState, useMemo } from 'react';
import type { Patient } from '../../types/patient';
import {
    runLinearRegression, runLogisticRegression,
    formatP, formatNum,
    type LinearRegressionResult, type LogisticRegressionResult,
} from '../../utils/regressionEngine';
import {
    ResponsiveContainer, Scatter, XAxis, YAxis,
    CartesianGrid, Tooltip, ComposedChart, Area, Legend, Line,
} from 'recharts';
import {
    Plus, X, AlertTriangle, CheckCircle, Info, TrendingUp, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════
// VARIABLE REGISTRY — All extractable numeric variables
// ═══════════════════════════════════════════════════════════

export type VarType = 'continuous' | 'binary';

export interface RegressionVar {
    id: string;
    label: string;
    group: string;
    type: VarType;
    extract: (p: Patient) => number | null;
}

/** Parse "120/80" → systolic */
function parseSystolic(ha: string): number | null {
    if (!ha) return null;
    const v = Number(ha.split('/')[0]);
    return isNaN(v) ? null : v;
}
function parseDiastolic(ha: string): number | null {
    if (!ha) return null;
    const parts = ha.split('/');
    if (parts.length < 2) return null;
    const v = Number(parts[1]);
    return isNaN(v) ? null : v;
}

/** Compute days between two date strings (dd/mm/yyyy or yyyy-mm-dd) */
function daysBetween(d1: string, d2: string): number | null {
    const parse = (s: string): Date | null => {
        if (!s) return null;
        if (s.includes('-')) { const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
        const [dd, mm, yy] = s.split('/').map(Number);
        if (!dd || !mm || !yy) return null;
        return new Date(yy, mm - 1, dd);
    };
    const a = parse(d1), b = parse(d2);
    if (!a || !b) return null;
    return Math.round((b.getTime() - a.getTime()) / 86400000);
}

const ALL_VARIABLES: RegressionVar[] = [
    // ── Hành chính ──
    { id: 'tuoi', label: 'Tuổi', group: 'Hành chính', type: 'continuous', extract: p => p.hanhChinh.tuoi },
    { id: 'gioiTinh', label: 'Giới tính (Nam=0, Nữ=1)', group: 'Hành chính', type: 'binary', extract: p => p.hanhChinh.gioiTinh === 'nam' ? 0 : p.hanhChinh.gioiTinh === 'nu' ? 1 : null },
    { id: 'noiO_thanhThi', label: 'Nơi ở — Thành thị (0=Không, 1=Có)', group: 'Hành chính', type: 'binary', extract: p => p.hanhChinh.noiO === 'thanh_thi' ? 1 : p.hanhChinh.noiO ? 0 : null },
    { id: 'tuoiNhom65', label: 'Tuổi ≥65 (0=Không, 1=Có)', group: 'Hành chính', type: 'binary', extract: p => { const t = p.hanhChinh.tuoi; return t !== null && t !== undefined ? (t >= 65 ? 1 : 0) : null; } },

    // ── Tiền sử ──
    { id: 'ts_dtd', label: 'Đái tháo đường', group: 'Tiền sử', type: 'binary', extract: p => p.tienSu.daiThaoDuong ? 1 : 0 },
    { id: 'ts_tha', label: 'Tăng huyết áp', group: 'Tiền sử', type: 'binary', extract: p => p.tienSu.tangHuyetAp ? 1 : 0 },
    { id: 'ts_vdd', label: 'Viêm dạ dày', group: 'Tiền sử', type: 'binary', extract: p => p.tienSu.viemDaDay ? 1 : 0 },
    { id: 'ts_vgm', label: 'Viêm gan mạn', group: 'Tiền sử', type: 'binary', extract: p => p.tienSu.viemGanMan ? 1 : 0 },
    { id: 'ts_btnm', label: 'Bệnh thận mạn', group: 'Tiền sử', type: 'binary', extract: p => p.tienSu.benhThanMan ? 1 : 0 },
    { id: 'ts_gut', label: 'Gút', group: 'Tiền sử', type: 'binary', extract: p => p.tienSu.gut ? 1 : 0 },
    { id: 'ts_ungThu', label: 'Ung thư', group: 'Tiền sử', type: 'binary', extract: p => p.tienSu.ungThu ? 1 : 0 },
    { id: 'ts_suyTim', label: 'Suy tim ứ huyết', group: 'Tiền sử', type: 'binary', extract: p => p.tienSu.suyTimUHuyet ? 1 : 0 },
    { id: 'ts_mmNao', label: 'Bệnh mạch máu não', group: 'Tiền sử', type: 'binary', extract: p => p.tienSu.benhMachMauNao ? 1 : 0 },
    { id: 'ts_hutThuoc', label: 'Hút thuốc lá', group: 'Tiền sử', type: 'binary', extract: p => p.tienSu.hutThuocLa ? 1 : 0 },
    { id: 'ts_baoNam', label: 'Số bao-năm hút thuốc', group: 'Tiền sử', type: 'continuous', extract: p => p.tienSu.soBaoNam },

    // ── Lâm sàng ──
    { id: 'ls_mach', label: 'Mạch (lần/phút)', group: 'Lâm sàng', type: 'continuous', extract: p => p.lamSang.mach },
    { id: 'ls_haTamThu', label: 'HA tâm thu (mmHg)', group: 'Lâm sàng', type: 'continuous', extract: p => parseSystolic(p.lamSang.huyetAp) },
    { id: 'ls_haTamTruong', label: 'HA tâm trương (mmHg)', group: 'Lâm sàng', type: 'continuous', extract: p => parseDiastolic(p.lamSang.huyetAp) },
    { id: 'ls_nhietDo', label: 'Nhiệt độ (°C)', group: 'Lâm sàng', type: 'continuous', extract: p => p.lamSang.nhietDo },
    { id: 'ls_nhipTho', label: 'Nhịp thở (lần/phút)', group: 'Lâm sàng', type: 'continuous', extract: p => p.lamSang.nhipTho },
    { id: 'ls_spo2', label: 'SpO2 (%)', group: 'Lâm sàng', type: 'continuous', extract: p => p.lamSang.spO2 },
    { id: 'ls_bmi', label: 'BMI (kg/m²)', group: 'Lâm sàng', type: 'continuous', extract: p => p.lamSang.bmi },
    { id: 'ls_glasgow', label: 'Điểm Glasgow', group: 'Lâm sàng', type: 'continuous', extract: p => p.lamSang.diemGlasgow },
    { id: 'ls_hoKhan', label: 'Ho khan', group: 'Lâm sàng', type: 'binary', extract: p => p.lamSang.hoKhan ? 1 : 0 },
    { id: 'ls_hoMau', label: 'Ho máu', group: 'Lâm sàng', type: 'binary', extract: p => p.lamSang.hoMau ? 1 : 0 },
    { id: 'ls_hoDom', label: 'Ho khạc đờm', group: 'Lâm sàng', type: 'binary', extract: p => p.lamSang.hoKhacDom ? 1 : 0 },
    { id: 'ls_dauNguc', label: 'Đau ngực', group: 'Lâm sàng', type: 'binary', extract: p => p.lamSang.dauNguc ? 1 : 0 },
    { id: 'ls_khoTho', label: 'Khó thở', group: 'Lâm sàng', type: 'binary', extract: p => p.lamSang.khoTho ? 1 : 0 },
    { id: 'ls_ranAm', label: 'Ran ẩm', group: 'Lâm sàng', type: 'binary', extract: p => p.lamSang.ranAm ? 1 : 0 },
    { id: 'ls_ranNo', label: 'Ran nổ', group: 'Lâm sàng', type: 'binary', extract: p => p.lamSang.ranNo ? 1 : 0 },
    { id: 'ls_ranRit', label: 'Ran rít', group: 'Lâm sàng', type: 'binary', extract: p => p.lamSang.ranRit ? 1 : 0 },
    { id: 'ls_tdmp', label: 'HC Tràn dịch MP', group: 'Lâm sàng', type: 'binary', extract: p => p.lamSang.hoiChungTDMP?.co ? 1 : 0 },
    { id: 'ls_dongDac', label: 'HC Đông đặc', group: 'Lâm sàng', type: 'binary', extract: p => p.lamSang.hoiChungDongDac?.co ? 1 : 0 },

    // ── Xét nghiệm ──
    { id: 'xn_wbc', label: 'WBC (G/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.wbc },
    { id: 'xn_neutrophil', label: 'Neutrophil (%)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.neutrophil },
    { id: 'xn_lymphocyte', label: 'Lymphocyte (%)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.lymphocyte },
    { id: 'xn_rbc', label: 'RBC (T/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.rbc },
    { id: 'xn_hemoglobin', label: 'Hemoglobin (g/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.hemoglobin },
    { id: 'xn_hct', label: 'Hematocrit (%)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.hct },
    { id: 'xn_plt', label: 'PLT (G/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.plt },
    { id: 'xn_ure', label: 'Ure (mmol/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.ure },
    { id: 'xn_creatinin', label: 'Creatinin (µmol/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.creatinin },
    { id: 'xn_ast', label: 'AST (U/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.ast },
    { id: 'xn_alt', label: 'ALT (U/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.alt },
    { id: 'xn_ggt', label: 'GGT (U/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.ggt },
    { id: 'xn_glucose', label: 'Glucose (µmol/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.glucose },
    { id: 'xn_protein', label: 'Protein (g/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.protein },
    { id: 'xn_albumin', label: 'Albumin (g/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.albumin },
    { id: 'xn_crp', label: 'CRP (mg/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.crp },
    { id: 'xn_pct', label: 'Procalcitonin (pg/ml)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.procalcitonin },
    { id: 'xn_na', label: 'Na+ (mmol/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.na },
    { id: 'xn_k', label: 'K+ (mmol/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.k },
    { id: 'xn_cl', label: 'Cl- (mmol/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.cl },
    { id: 'xn_ph', label: 'pH máu', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.ph },
    { id: 'xn_paco2', label: 'PaCO2 (mmHg)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.paCO2 },
    { id: 'xn_hco3', label: 'HCO3- (mmol/l)', group: 'Xét nghiệm', type: 'continuous', extract: p => p.xetNghiem.hcO3 },

    // ── Biomarkers ──
    { id: 'bm_strem1', label: 'sTREM-1 (pg/ml)', group: 'Biomarker', type: 'continuous', extract: p => p.xetNghiem.sTREM1 },
    { id: 'bm_timp1', label: 'TIMP-1 (pg/ml)', group: 'Biomarker', type: 'continuous', extract: p => p.xetNghiem.tIMP1 },
    { id: 'bm_il6', label: 'IL-6 (pg/ml)', group: 'Biomarker', type: 'continuous', extract: p => p.xetNghiem.il6 },
    { id: 'bm_il10', label: 'IL-10 (pg/ml)', group: 'Biomarker', type: 'continuous', extract: p => p.xetNghiem.il10 },
    { id: 'bm_il17', label: 'IL-17 (pg/ml)', group: 'Biomarker', type: 'continuous', extract: p => p.xetNghiem.il17 },

    // ── Chỉ số tính toán ──
    { id: 'cs_nlr', label: 'NLR (Neutrophil/Lymphocyte)', group: 'Chỉ số tính toán', type: 'continuous', extract: p => p.chiSoTinhToan?.nlr ?? null },
    { id: 'cs_plr', label: 'PLR (PLT/Lymphocyte)', group: 'Chỉ số tính toán', type: 'continuous', extract: p => p.chiSoTinhToan?.plr ?? null },
    { id: 'cs_car', label: 'CAR (CRP/Albumin)', group: 'Chỉ số tính toán', type: 'continuous', extract: p => p.chiSoTinhToan?.car ?? null },

    // ── PSI & CURB-65 ──
    { id: 'psi_score', label: 'PSI Tổng điểm', group: 'PSI/CURB-65', type: 'continuous', extract: p => p.psi?.tongDiem ?? null },
    { id: 'psi_nang', label: 'PSI Nặng (III-V) (0=Nhẹ, 1=Nặng)', group: 'PSI/CURB-65', type: 'binary', extract: p => { const c = p.psi?.phanTang; if (!c) return null; return (c === 'I' || c === 'II' || c === 'Class I' || c === 'Class II') ? 0 : 1; } },
    { id: 'curb65_score', label: 'CURB-65 Tổng điểm', group: 'PSI/CURB-65', type: 'continuous', extract: p => p.curb65?.tongDiem ?? null },
    { id: 'curb65_nang', label: 'CURB-65 Nặng (3-5) (0=Nhẹ/TB, 1=Nặng)', group: 'PSI/CURB-65', type: 'binary', extract: p => { const s = p.curb65?.tongDiem; if (s === null || s === undefined) return null; return s >= 3 ? 1 : 0; } },

    // ── Hình ảnh ──
    { id: 'ha_xq_tdmp', label: 'XQ: Tràn dịch MP', group: 'Hình ảnh', type: 'binary', extract: p => p.hinhAnh.xquangTranDichMangPhoi ? 1 : 0 },
    { id: 'ha_xq_tkmp', label: 'XQ: Tràn khí MP', group: 'Hình ảnh', type: 'binary', extract: p => p.hinhAnh.xquangTranKhiMangPhoi ? 1 : 0 },
    { id: 'ha_ct_tdmp', label: 'CT: Tràn dịch MP', group: 'Hình ảnh', type: 'binary', extract: p => p.hinhAnh.ctTranDichMangPhoi ? 1 : 0 },
    { id: 'ha_ct_tkmp', label: 'CT: Tràn khí MP', group: 'Hình ảnh', type: 'binary', extract: p => p.hinhAnh.ctTranKhiMangPhoi ? 1 : 0 },

    // ── Kết cục ──
    { id: 'kc_tuVong', label: 'Tử vong', group: 'Kết cục', type: 'binary', extract: p => p.ketCuc?.tinhTrangRaVien === 'Tử vong' ? 1 : p.ketCuc?.tinhTrangRaVien ? 0 : null },
    { id: 'kc_thoMay', label: 'Thở máy', group: 'Kết cục', type: 'binary', extract: p => p.ketCuc?.thoMay ? 1 : 0 },
    { id: 'kc_socNK', label: 'Sốc nhiễm khuẩn', group: 'Kết cục', type: 'binary', extract: p => p.ketCuc?.socNhiemKhuan ? 1 : 0 },
    { id: 'kc_locMau', label: 'Lọc máu', group: 'Kết cục', type: 'binary', extract: p => p.ketCuc?.locMau ? 1 : 0 },
    { id: 'kc_ngayDieuTri', label: 'Số ngày điều trị', group: 'Kết cục', type: 'continuous', extract: p => {
        const d = daysBetween(p.hanhChinh.ngayVaoVien, p.hanhChinh.ngayRaVien);
        return d !== null && d >= 0 ? d : null;
    }},
    { id: 'kc_ngayLocMau', label: 'Số ngày lọc máu', group: 'Kết cục', type: 'continuous', extract: p => p.ketCuc?.soNgayLocMau ?? null },
];

// Group vars for display
function groupVars(vars: RegressionVar[]): { group: string; vars: RegressionVar[] }[] {
    const map = new Map<string, RegressionVar[]>();
    for (const v of vars) {
        if (!map.has(v.group)) map.set(v.group, []);
        map.get(v.group)!.push(v);
    }
    return Array.from(map.entries()).map(([group, vars]) => ({ group, vars }));
}

// ═══════════════════════════════════════════════════════════
// VARIABLE PICKER (Add button + dropdown)
// ═══════════════════════════════════════════════════════════

function VarPicker({
    label,
    selectedIds,
    onAdd,
    onRemove,
    allowedTypes,
    single = false,
}: {
    label: string;
    selectedIds: string[];
    onAdd: (id: string) => void;
    onRemove: (id: string) => void;
    allowedTypes?: VarType[];
    single?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const available = ALL_VARIABLES.filter(v => !selectedIds.includes(v.id));
    const filtered = search
        ? available.filter(v =>
            v.label.toLowerCase().includes(search.toLowerCase()) ||
            v.group.toLowerCase().includes(search.toLowerCase())
        )
        : available;
    const grouped = groupVars(filtered);

    const handleAdd = (v: RegressionVar) => {
        if (allowedTypes && !allowedTypes.includes(v.type)) {
            toast.error(`Biến "${v.label}" là biến ${v.type === 'binary' ? 'nhị phân' : 'liên tục'}, không phù hợp cho trường ${label.toLowerCase()}.`);
            return;
        }
        onAdd(v.id);
        if (single) setOpen(false);
        setSearch('');
    };

    const selected = selectedIds.map(id => ALL_VARIABLES.find(v => v.id === id)).filter(Boolean) as RegressionVar[];

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">{label}</label>
                <button
                    onClick={() => setOpen(!open)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm biến
                </button>
            </div>

            {/* Selected tags */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {selected.length === 0 && (
                    <span className="text-xs text-gray-400 italic py-1">Chưa chọn biến nào</span>
                )}
                {selected.map(v => (
                    <span
                        key={v.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            v.type === 'continuous'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                    >
                        {v.label}
                        <button onClick={() => onRemove(v.id)} className="hover:text-red-500 ml-0.5">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>

            {/* Dropdown */}
            {open && (
                <div className="border border-gray-200 rounded-xl bg-white shadow-lg max-h-72 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm biến..."
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>
                    <div className="overflow-y-auto max-h-56">
                        {grouped.map(({ group, vars }) => (
                            <div key={group}>
                                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 sticky top-0">
                                    {group}
                                </div>
                                {vars.map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => handleAdd(v)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between gap-2 transition-colors"
                                    >
                                        <span className="text-gray-700">{v.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                            v.type === 'continuous'
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                            {v.type === 'continuous' ? 'Liên tục' : 'Nhị phân'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ))}
                        {grouped.length === 0 && (
                            <div className="px-3 py-4 text-sm text-gray-400 text-center">Không tìm thấy biến</div>
                        )}
                    </div>
                    <div className="px-3 py-2 border-t border-gray-100 flex justify-end">
                        <button onClick={() => { setOpen(false); setSearch(''); }} className="text-xs text-gray-500 hover:text-gray-700">Đóng</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// RESULT RENDERERS
// ═══════════════════════════════════════════════════════════

function LinearResultView({ result, depName, patients, depId, indepIds }: {
    result: LinearRegressionResult;
    depName: string;
    patients: Patient[];
    depId: string;
    indepIds: string[];
}) {
    const depVar = ALL_VARIABLES.find(v => v.id === depId);
    const indepVar = indepIds.length === 1 ? ALL_VARIABLES.find(v => v.id === indepIds[0]) : null;
    const isUnivariate = indepIds.length === 1 && indepVar;

    // Scatter data for univariate
    const scatterData = useMemo(() => {
        if (!isUnivariate || !depVar) return [];
        return patients
            .map(p => {
                const x = indepVar!.extract(p);
                const y = depVar.extract(p);
                return x !== null && y !== null ? { x, y } : null;
            })
            .filter(Boolean) as { x: number; y: number }[];
    }, [patients, isUnivariate, depVar, indepVar]);

    // CI band data
    const bandData = result.predictionBand ?? [];

    return (
        <div className="space-y-6">
            {/* Model Summary */}
            <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">📊 Model Summary</h4>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">R</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">R²</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Adjusted R²</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Std. Error</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Durbin-Watson</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-gray-100">
                            <td className="px-3 py-2 font-mono text-gray-700">{formatNum(result.R)}</td>
                            <td className="px-3 py-2 font-mono text-gray-700">{formatNum(result.R2)}</td>
                            <td className="px-3 py-2 font-mono text-gray-700">{formatNum(result.adjR2)}</td>
                            <td className="px-3 py-2 font-mono text-gray-700">{formatNum(result.stdError)}</td>
                            <td className="px-3 py-2 font-mono text-gray-700">{formatNum(result.durbinWatson)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ANOVA */}
            <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">📋 ANOVA</h4>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nguồn</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">SS</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">df</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">MS</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">F</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Sig.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-700">Regression</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(result.anova.ssReg, 2)}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{result.anova.dfReg}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(result.anova.msReg, 2)}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(result.anova.F, 2)}</td>
                            <td className={`px-3 py-2 font-mono text-right font-medium ${result.anova.pValue < 0.05 ? 'text-green-600' : 'text-gray-500'}`}>{formatP(result.anova.pValue)}</td>
                        </tr>
                        <tr className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-700">Residual</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(result.anova.ssRes, 2)}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{result.anova.dfRes}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(result.anova.msRes, 2)}</td>
                            <td className="px-3 py-2 text-right">—</td>
                            <td className="px-3 py-2 text-right">—</td>
                        </tr>
                        <tr className="border-t border-gray-100 bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-700">Total</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(result.anova.ssTotal, 2)}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{result.anova.dfTotal}</td>
                            <td className="px-3 py-2" colSpan={3}></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Coefficients */}
            <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">📐 Coefficients</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Biến</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">B</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Std. Error</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Beta</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">t</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Sig.</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500" colSpan={2}>95% CI for B</th>
                                {indepIds.length > 1 && <>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tolerance</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">VIF</th>
                                </>}
                            </tr>
                        </thead>
                        <tbody>
                            {result.coefficients.map((c, i) => (
                                <tr key={i} className={`border-t border-gray-100 ${c.pValue < 0.05 && i > 0 ? 'bg-green-50/50' : ''}`}>
                                    <td className="px-3 py-2 text-gray-700 font-medium">{c.name}</td>
                                    <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(c.B)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(c.SE)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-gray-500">{i === 0 ? '—' : formatNum(c.beta)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(c.t, 2)}</td>
                                    <td className={`px-3 py-2 font-mono text-right font-medium ${c.pValue < 0.05 ? 'text-green-600' : 'text-gray-500'}`}>{formatP(c.pValue)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-gray-500 text-xs">{formatNum(c.ciLow)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-gray-500 text-xs">{formatNum(c.ciHigh)}</td>
                                    {indepIds.length > 1 && <>
                                        <td className="px-3 py-2 font-mono text-right text-gray-500">{i === 0 ? '—' : c.tolerance !== undefined ? formatNum(c.tolerance) : '—'}</td>
                                        <td className={`px-3 py-2 font-mono text-right ${c.vif && c.vif > 5 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>{i === 0 ? '—' : c.vif !== undefined ? formatNum(c.vif, 2) : '—'}</td>
                                    </>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Scatter plot + regression line + 95% CI (univariate only) */}
            {isUnivariate && scatterData.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-2">📈 Scatter Plot — {indepVar!.label} vs {depVar!.label}</h4>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <ResponsiveContainer width="100%" height={380}>
                            <ComposedChart data={bandData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="x" type="number" name={indepVar!.label} tick={{ fontSize: 11 }}
                                    label={{ value: indepVar!.label, position: 'bottom', offset: -5, fontSize: 12 }} />
                                <YAxis type="number" name={depVar!.label} tick={{ fontSize: 11 }}
                                    label={{ value: depVar!.label, angle: -90, position: 'insideLeft', fontSize: 12 }} />
                                <Tooltip formatter={(v: number | undefined) => v?.toFixed(3) ?? '—'} />
                                <Legend />
                                {/* 95% CI Band */}
                                <Area dataKey="ciHigh" stroke="none" fill="#0d948822" name="95% CI Upper" legendType="none" />
                                <Area dataKey="ciLow" stroke="none" fill="#ffffff" name="95% CI Lower" legendType="none" />
                                {/* Regression line */}
                                <Line dataKey="yHat" stroke="#0d9488" strokeWidth={2.5} dot={false} name="Đường hồi quy" />
                                {/* Scatter points */}
                                <Scatter data={scatterData} fill="#0ea5e9" fillOpacity={0.7} name="Dữ liệu" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Interpretation */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Diễn giải kết quả
                </h4>
                <div className="text-sm text-blue-900 space-y-1.5">
                    <p>
                        <strong>Mô hình hồi quy tuyến tính</strong> {result.anova.pValue < 0.05
                            ? <span className="text-green-700">có ý nghĩa thống kê</span>
                            : <span className="text-red-700">chưa có ý nghĩa thống kê</span>
                        } (F = {formatNum(result.anova.F, 2)}, p = {formatP(result.anova.pValue)}).
                    </p>
                    <p>
                        Mô hình giải thích được <strong>{(result.R2 * 100).toFixed(1)}%</strong> phương sai
                        của biến <strong>{depName}</strong> (R² = {formatNum(result.R2)}, Adjusted R² = {formatNum(result.adjR2)}).
                    </p>
                    {result.coefficients.filter((c, i) => i > 0 && c.pValue < 0.05).map((c, i) => (
                        <p key={i}>
                            <CheckCircle className="w-3.5 h-3.5 inline text-green-600 mr-1" />
                            <strong>{c.name}</strong> có ý nghĩa (p = {formatP(c.pValue)}): khi tăng 1 đơn vị → {depName} {c.B > 0 ? 'tăng' : 'giảm'} trung bình <strong>{Math.abs(c.B).toFixed(3)}</strong> đơn vị (95% CI: {formatNum(c.ciLow)} – {formatNum(c.ciHigh)}).
                        </p>
                    ))}
                    {result.coefficients.filter((c, i) => i > 0 && c.pValue >= 0.05).map((c, i) => (
                        <p key={i} className="text-blue-700/70">
                            ✗ <strong>{c.name}</strong>: p = {formatP(c.pValue)} — không có ý nghĩa thống kê.
                        </p>
                    ))}
                    {indepIds.length > 1 && result.coefficients.some(c => c.vif && c.vif > 5) && (
                        <p className="text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                            <strong>Cảnh báo đa cộng tuyến:</strong> Một số biến có VIF &gt; 5, cần xem xét loại bỏ.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function LogisticResultView({ result, depName }: {
    result: LogisticRegressionResult;
    depName: string;
}) {
    return (
        <div className="space-y-6">
            {/* Convergence info */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${result.converged ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {result.converged ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {result.converged ? `Hội tụ sau ${result.iterations} vòng lặp` : `Chưa hội tụ sau ${result.iterations} vòng lặp`}
                {' '}— n = {result.n}, events = {result.nEvents}
            </div>

            {/* Omnibus Test */}
            <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">🔬 Omnibus Tests of Model Coefficients</h4>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Chi-square</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">df</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Sig.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-gray-100">
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(result.omnibus.chiSq, 2)}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{result.omnibus.df}</td>
                            <td className={`px-3 py-2 font-mono text-right font-medium ${result.omnibus.pValue < 0.05 ? 'text-green-600' : 'text-gray-500'}`}>{formatP(result.omnibus.pValue)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Model Summary */}
            <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">📊 Model Summary</h4>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">-2 Log Likelihood</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Cox & Snell R²</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Nagelkerke R²</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-gray-100">
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(result.neg2LL, 2)}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(result.coxSnellR2)}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(result.nagelkerkeR2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Hosmer-Lemeshow */}
            <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">🧪 Hosmer and Lemeshow Test</h4>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Chi-square</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">df</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Sig.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-gray-100">
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(result.hosmerLemeshow.chiSq, 2)}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{result.hosmerLemeshow.df}</td>
                            <td className={`px-3 py-2 font-mono text-right font-medium ${result.hosmerLemeshow.pValue > 0.05 ? 'text-green-600' : 'text-red-600'}`}>{formatP(result.hosmerLemeshow.pValue)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Variables in the Equation */}
            <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">📐 Variables in the Equation</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Biến</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">B</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">S.E.</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Wald</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">df</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Sig.</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Exp(B)</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500" colSpan={2}>95% CI for Exp(B)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.coefficients.map((c, i) => (
                                <tr key={i} className={`border-t border-gray-100 ${c.pValue < 0.05 && i > 0 ? 'bg-green-50/50' : ''}`}>
                                    <td className="px-3 py-2 text-gray-700 font-medium">{c.name}</td>
                                    <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(c.B)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(c.SE)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(c.wald, 2)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-gray-700">{c.df}</td>
                                    <td className={`px-3 py-2 font-mono text-right font-medium ${c.pValue < 0.05 ? 'text-green-600' : 'text-gray-500'}`}>{formatP(c.pValue)}</td>
                                    <td className="px-3 py-2 font-mono text-right font-medium text-gray-700">{i === 0 ? '—' : formatNum(c.expB, 2)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-gray-500 text-xs">{i === 0 ? '' : formatNum(c.ciLow, 2)}</td>
                                    <td className="px-3 py-2 font-mono text-right text-gray-500 text-xs">{i === 0 ? '' : formatNum(c.ciHigh, 2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Classification Table */}
            <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">📋 Classification Table (Cut-off = 0.5)</h4>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500" rowSpan={2}>Observed</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500" colSpan={2}>Predicted</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500" rowSpan={2}>% Correct</th>
                        </tr>
                        <tr>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">0</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">1</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-gray-100">
                            <td className="px-3 py-2 font-medium text-gray-700">0 (Không)</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{result.classification.trueNeg}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{result.classification.falsePos}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{result.classification.specificity.toFixed(1)}%</td>
                        </tr>
                        <tr className="border-t border-gray-100">
                            <td className="px-3 py-2 font-medium text-gray-700">1 (Có)</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{result.classification.falseNeg}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{result.classification.truePos}</td>
                            <td className="px-3 py-2 font-mono text-right text-gray-700">{result.classification.sensitivity.toFixed(1)}%</td>
                        </tr>
                        <tr className="border-t border-gray-200 bg-gray-50">
                            <td className="px-3 py-2 font-bold text-gray-700" colSpan={3}>Overall Percentage</td>
                            <td className="px-3 py-2 font-mono text-right font-bold text-gray-700">{result.classification.overallPct.toFixed(1)}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Interpretation */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Diễn giải kết quả
                </h4>
                <div className="text-sm text-blue-900 space-y-1.5">
                    <p>
                        <strong>Mô hình hồi quy logistic</strong> {result.omnibus.pValue < 0.05
                            ? <span className="text-green-700">có ý nghĩa thống kê tổng thể</span>
                            : <span className="text-red-700">chưa có ý nghĩa thống kê tổng thể</span>
                        } (Omnibus χ² = {formatNum(result.omnibus.chiSq, 2)}, p = {formatP(result.omnibus.pValue)}).
                    </p>
                    <p>
                        Mô hình giải thích <strong>{(result.nagelkerkeR2 * 100).toFixed(1)}%</strong> phương sai
                        (Nagelkerke R² = {formatNum(result.nagelkerkeR2)}). Độ chính xác phân loại: <strong>{result.classification.overallPct.toFixed(1)}%</strong>.
                    </p>
                    <p>
                        Hosmer-Lemeshow Test: p = {formatP(result.hosmerLemeshow.pValue)} → {result.hosmerLemeshow.pValue > 0.05
                            ? <span className="text-green-700">Mô hình phù hợp tốt (good fit)</span>
                            : <span className="text-red-700">Mô hình chưa phù hợp (poor fit)</span>
                        }.
                    </p>
                    {result.coefficients.filter((c, i) => i > 0 && c.pValue < 0.05).map((c, i) => (
                        <p key={i}>
                            <CheckCircle className="w-3.5 h-3.5 inline text-green-600 mr-1" />
                            <strong>{c.name}</strong> (p = {formatP(c.pValue)}): OR = <strong>{c.expB.toFixed(2)}</strong> (95% CI: {c.ciLow.toFixed(2)} – {c.ciHigh.toFixed(2)}).
                            {c.expB > 1
                                ? ` Tăng nguy cơ ${depName} gấp ${c.expB.toFixed(2)} lần.`
                                : ` Giảm nguy cơ ${depName} (yếu tố bảo vệ).`
                            }
                        </p>
                    ))}
                    {result.coefficients.filter((c, i) => i > 0 && c.pValue >= 0.05).map((c, i) => (
                        <p key={i} className="text-blue-700/70">
                            ✗ <strong>{c.name}</strong>: p = {formatP(c.pValue)} — không có ý nghĩa thống kê.
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// MAIN TAB COMPONENT
// ═══════════════════════════════════════════════════════════

type RegressionType = 'logistic' | 'linear';
type AnalysisMode = 'univariate' | 'multivariate';
type Result = LinearRegressionResult | LogisticRegressionResult | { error: string } | null;

export default function RegressionTab({ patients }: { patients: Patient[] }) {
    const [regType, setRegType] = useState<RegressionType>('logistic');
    const [mode, setMode] = useState<AnalysisMode>('multivariate');
    const [depVarId, setDepVarId] = useState<string[]>([]);
    const [indepVarIds, setIndepVarIds] = useState<string[]>([]);
    const [result, setResult] = useState<Result>(null);
    const [univariateResults, setUnivariateResults] = useState<{ varId: string; result: LinearRegressionResult | LogisticRegressionResult | { error: string } }[]>([]);
    const [running, setRunning] = useState(false);

    const enabledPatients = patients.filter(p => !p.disabled);
    const depVar = depVarId.length > 0 ? ALL_VARIABLES.find(v => v.id === depVarId[0]) : null;

    const allowedDepTypes: VarType[] = regType === 'logistic' ? ['binary'] : ['continuous'];

    // When switching regression type, clear results and incompatible selections
    const handleTypeChange = (t: RegressionType) => {
        setRegType(t);
        setResult(null);
        setUnivariateResults([]);
        // Clear dep var if type mismatch
        if (depVar && ((t === 'logistic' && depVar.type !== 'binary') || (t === 'linear' && depVar.type !== 'continuous'))) {
            setDepVarId([]);
        }
    };

    const runAnalysis = () => {
        if (!depVar) { toast.error('Chưa chọn biến phụ thuộc (Y)'); return; }
        if (indepVarIds.length === 0) { toast.error('Chưa chọn biến độc lập (X)'); return; }

        setRunning(true);

        setTimeout(() => {
            try {
                if (mode === 'univariate') {
                    // Run each X separately
                    const results = indepVarIds.map(xId => {
                        const xVar = ALL_VARIABLES.find(v => v.id === xId)!;
                        const data = buildData(enabledPatients, depVar, [xVar]);
                        if ('error' in data) return { varId: xId, result: data };
                        if (regType === 'logistic') {
                            return { varId: xId, result: runLogisticRegression(data.X, data.Y, [xVar.label]) as LogisticRegressionResult | { error: string } };
                        } else {
                            return { varId: xId, result: runLinearRegression(data.X, data.Y, [xVar.label]) as LinearRegressionResult | { error: string } };
                        }
                    });
                    setUnivariateResults(results);
                    setResult(null);
                } else {
                    // Multivariate
                    const xVars = indepVarIds.map(id => ALL_VARIABLES.find(v => v.id === id)!);
                    const data = buildData(enabledPatients, depVar, xVars);
                    if ('error' in data) { setResult(data); setUnivariateResults([]); }
                    else {
                        if (regType === 'logistic') {
                            setResult(runLogisticRegression(data.X, data.Y, xVars.map(v => v.label)));
                        } else {
                            setResult(runLinearRegression(data.X, data.Y, xVars.map(v => v.label)));
                        }
                        setUnivariateResults([]);
                    }
                }
            } catch (err) {
                setResult({ error: `Lỗi: ${err instanceof Error ? err.message : 'Unknown'}` });
            } finally {
                setRunning(false);
            }
        }, 50); // Defer to avoid blocking UI
    };

    return (
        <div className="space-y-6">
            {/* Controls panel */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
                {/* Regression type selector */}
                <div>
                    <label className="text-xs font-medium text-gray-700 mb-2 block">Loại hồi quy</label>
                    <div className="flex gap-2">
                        {[
                            { key: 'logistic' as const, label: 'Logistic nhị phân', desc: 'Y là biến nhị phân (0/1)' },
                            { key: 'linear' as const, label: 'Tuyến tính', desc: 'Y là biến liên tục' },
                        ].map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => handleTypeChange(opt.key)}
                                className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                                    regType === opt.key
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                            >
                                <div className={`text-sm font-bold ${regType === opt.key ? 'text-primary-700' : 'text-gray-700'}`}>
                                    {opt.label}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Analysis mode */}
                <div>
                    <label className="text-xs font-medium text-gray-700 mb-2 block">Phương pháp</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setMode('univariate'); setResult(null); setUnivariateResults([]); }}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                                mode === 'univariate' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >Phân tích đơn biến</button>
                        <button
                            onClick={() => { setMode('multivariate'); setResult(null); setUnivariateResults([]); }}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                                mode === 'multivariate' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >Phân tích đa biến</button>
                    </div>
                </div>

                {/* Variable selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <VarPicker
                        label={`Biến phụ thuộc (Y) — ${regType === 'logistic' ? 'Nhị phân' : 'Liên tục'}`}
                        selectedIds={depVarId}
                        onAdd={id => setDepVarId([id])}
                        onRemove={() => setDepVarId([])}
                        allowedTypes={allowedDepTypes}
                        single
                    />
                    <VarPicker
                        label="Biến độc lập (X)"
                        selectedIds={indepVarIds}
                        onAdd={id => setIndepVarIds(prev => [...prev, id])}
                        onRemove={id => setIndepVarIds(prev => prev.filter(v => v !== id))}
                    />
                </div>

                {/* Run button */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={runAnalysis}
                        disabled={running || !depVar || indepVarIds.length === 0}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                        Chạy hồi quy
                    </button>
                    <span className="text-xs text-gray-400">
                        n = {enabledPatients.length} bệnh nhân
                        {mode === 'univariate' && ` · ${indepVarIds.length} mô hình đơn biến`}
                    </span>
                </div>
            </div>

            {/* Error display */}
            {result && 'error' in result && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">{result.error}</div>
                </div>
            )}

            {/* Multivariate result */}
            {result && !('error' in result) && result.type === 'linear' && (
                <LinearResultView
                    result={result}
                    depName={depVar?.label ?? ''}
                    patients={enabledPatients}
                    depId={depVarId[0]}
                    indepIds={indepVarIds}
                />
            )}
            {result && !('error' in result) && result.type === 'logistic' && (
                <LogisticResultView result={result} depName={depVar?.label ?? ''} />
            )}

            {/* Univariate results */}
            {univariateResults.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-800">Kết quả phân tích đơn biến ({univariateResults.length} mô hình)</h3>
                    {/* Summary table first */}
                    <UnivariateSummaryTable results={univariateResults} regType={regType} />
                    {/* Detailed per variable */}
                    {univariateResults.map(({ varId, result: r }) => {
                        const xVar = ALL_VARIABLES.find(v => v.id === varId);
                        if (!xVar) return null;
                        return (
                            <details key={varId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                                    {'error' in r ? (
                                        <><AlertTriangle className="w-4 h-4 text-red-500" /> {xVar.label}: {r.error}</>
                                    ) : r.type === 'logistic' ? (
                                        <><span className={r.omnibus.pValue < 0.05 ? 'text-green-600' : 'text-gray-400'}>{r.omnibus.pValue < 0.05 ? '✓' : '✗'}</span> {xVar.label} — OR = {r.coefficients[1]?.expB.toFixed(2)}, p = {formatP(r.coefficients[1]?.pValue ?? 1)}</>
                                    ) : (
                                        <><span className={r.anova.pValue < 0.05 ? 'text-green-600' : 'text-gray-400'}>{r.anova.pValue < 0.05 ? '✓' : '✗'}</span> {xVar.label} — R² = {formatNum(r.R2)}, p = {formatP(r.anova.pValue)}</>
                                    )}
                                </summary>
                                <div className="px-4 py-4 border-t border-gray-100">
                                    {'error' in r ? (
                                        <p className="text-sm text-red-600">{r.error}</p>
                                    ) : r.type === 'linear' ? (
                                        <LinearResultView result={r} depName={depVar?.label ?? ''} patients={enabledPatients} depId={depVarId[0]} indepIds={[varId]} />
                                    ) : (
                                        <LogisticResultView result={r} depName={depVar?.label ?? ''} />
                                    )}
                                </div>
                            </details>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// UNIVARIATE SUMMARY TABLE
// ═══════════════════════════════════════════════════════════

function UnivariateSummaryTable({ results, regType }: {
    results: { varId: string; result: LinearRegressionResult | LogisticRegressionResult | { error: string } }[];
    regType: RegressionType;
}) {

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Biến (X)</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">n</th>
                        {regType === 'logistic' ? (
                            <>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">OR</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">95% CI</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Wald</th>
                            </>
                        ) : (
                            <>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">B</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">R²</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">F</th>
                            </>
                        )}
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">p</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Sig.</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map(({ varId, result: r }) => {
                        const xVar = ALL_VARIABLES.find(v => v.id === varId);
                        if (!xVar) return null;
                        if ('error' in r) {
                            return (
                                <tr key={varId} className="border-t border-gray-100 bg-red-50/50">
                                    <td className="px-3 py-2 text-gray-700">{xVar.label}</td>
                                    <td colSpan={5} className="px-3 py-2 text-xs text-red-600">{r.error}</td>
                                </tr>
                            );
                        }
                        const p = r.type === 'logistic' ? r.coefficients[1]?.pValue ?? 1 : r.anova.pValue;
                        const sig = p < 0.05;
                        return (
                            <tr key={varId} className={`border-t border-gray-100 ${sig ? 'bg-green-50/40' : ''}`}>
                                <td className="px-3 py-2 text-gray-700 font-medium">{xVar.label}</td>
                                <td className="px-3 py-2 font-mono text-right text-gray-700">{r.n}</td>
                                {r.type === 'logistic' ? (
                                    <>
                                        <td className="px-3 py-2 font-mono text-right text-gray-700 font-medium">{r.coefficients[1]?.expB.toFixed(2) ?? '—'}</td>
                                        <td className="px-3 py-2 font-mono text-right text-gray-500 text-xs">{r.coefficients[1] ? `${r.coefficients[1].ciLow.toFixed(2)}–${r.coefficients[1].ciHigh.toFixed(2)}` : '—'}</td>
                                        <td className="px-3 py-2 font-mono text-right text-gray-700">{r.coefficients[1]?.wald.toFixed(2) ?? '—'}</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-3 py-2 font-mono text-right text-gray-700">{r.coefficients[1]?.B.toFixed(3) ?? '—'}</td>
                                        <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(r.R2)}</td>
                                        <td className="px-3 py-2 font-mono text-right text-gray-700">{formatNum(r.anova.F, 2)}</td>
                                    </>
                                )}
                                <td className={`px-3 py-2 font-mono text-right font-medium ${sig ? 'text-green-600' : 'text-gray-500'}`}>{formatP(p)}</td>
                                <td className="px-3 py-2 text-center">
                                    {sig
                                        ? <CheckCircle className="w-4 h-4 text-green-500 inline" />
                                        : <span className="text-gray-300">—</span>
                                    }
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// DATA BUILDER — extract complete cases from patients
// ═══════════════════════════════════════════════════════════

function buildData(
    patients: Patient[],
    depVar: RegressionVar,
    xVars: RegressionVar[],
): { X: number[][]; Y: number[] } | { error: string } {
    const rows: { x: number[]; y: number }[] = [];
    for (const p of patients) {
        const y = depVar.extract(p);
        if (y === null || y === undefined) continue;
        const x: number[] = [];
        let valid = true;
        for (const xv of xVars) {
            const val = xv.extract(p);
            if (val === null || val === undefined) { valid = false; break; }
            x.push(val);
        }
        if (!valid) continue;
        rows.push({ x, y });
    }
    if (rows.length < 10) {
        return { error: `Chỉ có ${rows.length} quan sát đầy đủ (cần ≥ 10). Kiểm tra dữ liệu thiếu.` };
    }
    return {
        X: rows.map(r => r.x),
        Y: rows.map(r => r.y),
    };
}
