/**
 * CrosstabTab.tsx
 * Bảng chéo m×n (Contingency Table / Crosstab) với phân tích thống kê đầy đủ.
 * Output tương đương SPSS Crosstabs + diễn giải kết quả.
 */
import { useState, useMemo } from 'react';
import type { Patient } from '../../types/patient';
import {
    chiSquareTest, likelihoodRatioTest, yatesCorrectedChiSquare,
    fisherExactTest, phiCoefficient, cramersV, contingencyCoefficient,
    oddsRatio, relativeRisk, diagnosticMetrics,
    standardizedResiduals, adjustedStdResiduals, linearByLinear,
    formatPValue,
    interpretCramersV, interpretOR, interpretChiSquare,
} from '../../utils/statisticalTests';
import { Plus, X, Table2, AlertTriangle, CheckCircle, Info, ArrowUpDown, ArrowLeftRight } from 'lucide-react';

// ====================================================================
// VARIABLE DEFINITIONS
// ====================================================================

interface CategoricalVar {
    id: string;
    label: string;
    group: string;
    extract: (p: Patient) => string | null;
}

const DEFAULT_VARIABLES: CategoricalVar[] = [
    // Hành chính
    { id: 'gioiTinh', label: 'Giới tính', group: 'Hành chính', extract: p => p.hanhChinh.gioiTinh === 'nam' ? 'Nam' : p.hanhChinh.gioiTinh === 'nu' ? 'Nữ' : null },
    { id: 'noiO', label: 'Nơi ở', group: 'Hành chính', extract: p => p.hanhChinh.noiO === 'nong_thon' ? 'Nông thôn' : p.hanhChinh.noiO === 'thanh_thi' ? 'Thành thị' : p.hanhChinh.noiO === 'hai_dao' ? 'Hải đảo' : null },
    { id: 'tuoiNhom', label: 'Tuổi (nhóm)', group: 'Hành chính', extract: p => { const t = p.hanhChinh.tuoi; if (!t) return null; return t >= 65 ? '≥65' : '<65'; } },
    // Tiền sử
    { id: 'ts_dtd', label: 'Đái tháo đường', group: 'Tiền sử', extract: p => p.tienSu.daiThaoDuong ? 'Có' : 'Không' },
    { id: 'ts_tha', label: 'Tăng huyết áp', group: 'Tiền sử', extract: p => p.tienSu.tangHuyetAp ? 'Có' : 'Không' },
    { id: 'ts_btnm', label: 'Bệnh thận mạn', group: 'Tiền sử', extract: p => p.tienSu.benhThanMan ? 'Có' : 'Không' },
    { id: 'ts_suyTim', label: 'Suy tim ứ huyết', group: 'Tiền sử', extract: p => p.tienSu.suyTimUHuyet ? 'Có' : 'Không' },
    { id: 'ts_ungThu', label: 'Ung thư', group: 'Tiền sử', extract: p => p.tienSu.ungThu ? 'Có' : 'Không' },
    { id: 'ts_hutThuoc', label: 'Hút thuốc lá', group: 'Tiền sử', extract: p => p.tienSu.hutThuocLa ? 'Có' : 'Không' },
    { id: 'ts_mmnao', label: 'Bệnh mạch máu não', group: 'Tiền sử', extract: p => p.tienSu.benhMachMauNao ? 'Có' : 'Không' },
    // Lâm sàng
    { id: 'ls_hoKhan', label: 'Ho khan', group: 'Lâm sàng', extract: p => p.lamSang.hoKhan ? 'Có' : 'Không' },
    { id: 'ls_khoTho', label: 'Khó thở', group: 'Lâm sàng', extract: p => p.lamSang.khoTho ? 'Có' : 'Không' },
    { id: 'ls_dauNguc', label: 'Đau ngực', group: 'Lâm sàng', extract: p => p.lamSang.dauNguc ? 'Có' : 'Không' },
    { id: 'ls_ranAm', label: 'Ran ẩm', group: 'Lâm sàng', extract: p => p.lamSang.ranAm ? 'Có' : 'Không' },
    // PSI
    { id: 'psi_class', label: 'PSI Class', group: 'PSI', extract: p => p.psi.phanTang || null },
    { id: 'psi_nhom', label: 'PSI Nhóm (Nhẹ/Nặng)', group: 'PSI', extract: p => { const s = p.psi.phanTang; if (!s) return null; return (s === 'Class I' || s === 'Class II' || s === 'I' || s === 'II') ? 'Nhẹ (I–II)' : 'Nặng (III–V)'; } },
    // CURB-65
    { id: 'curb65_nhom', label: 'CURB-65 Nhóm', group: 'CURB-65', extract: p => { const c = p.curb65; if (!c || !c.duDuLieu) return null; return c.tongDiem <= 1 ? '0–1' : '≥2'; } },
    // Kết cục
    { id: 'kc_tuVong', label: 'Tử vong', group: 'Kết cục', extract: p => p.ketCuc.tuVong ? 'Có' : 'Không' },
    { id: 'kc_thoMay', label: 'Thở máy', group: 'Kết cục', extract: p => p.ketCuc.thoMay ? 'Có' : 'Không' },
    { id: 'kc_socNK', label: 'Sốc nhiễm khuẩn', group: 'Kết cục', extract: p => p.ketCuc.socNhiemKhuan ? 'Có' : 'Không' },
    // Vi khuẩn
    { id: 'vk_duongTinh', label: 'Cấy VK dương tính', group: 'Vi khuẩn', extract: p => { if (p.khongMocViKhuan) return 'Âm tính'; if (p.viKhuan?.some(v => v.coKhong && v.tenViKhuan)) return 'Dương tính'; return null; } },
    // Hình ảnh
    { id: 'ha_xq_tranDich', label: 'XQ Tràn dịch MP', group: 'Hình ảnh', extract: p => p.hinhAnh?.xquangTranDichMangPhoi ? 'Có' : 'Không' },
    { id: 'ha_ct_tranDich', label: 'CT Tràn dịch MP', group: 'Hình ảnh', extract: p => p.hinhAnh?.ctTranDichMangPhoi ? 'Có' : 'Không' },
];

// Additional variable pool: variables user can add
const ADDITIONAL_VARIABLES: CategoricalVar[] = [
    { id: 'ts_viemDaDay', label: 'Viêm dạ dày', group: 'Tiền sử', extract: p => p.tienSu.viemDaDay ? 'Có' : 'Không' },
    { id: 'ts_viemGanMan', label: 'Viêm gan mạn', group: 'Tiền sử', extract: p => p.tienSu.viemGanMan ? 'Có' : 'Không' },
    { id: 'ts_gut', label: 'Gout', group: 'Tiền sử', extract: p => p.tienSu.gut ? 'Có' : 'Không' },
    { id: 'ls_hoMau', label: 'Ho máu', group: 'Lâm sàng', extract: p => p.lamSang.hoMau ? 'Có' : 'Không' },
    { id: 'ls_hoKhacDom', label: 'Ho khạc đờm', group: 'Lâm sàng', extract: p => p.lamSang.hoKhacDom ? 'Có' : 'Không' },
    { id: 'ls_ranNo', label: 'Ran nổ', group: 'Lâm sàng', extract: p => p.lamSang.ranNo ? 'Có' : 'Không' },
    { id: 'ls_ranRit', label: 'Ran rít', group: 'Lâm sàng', extract: p => p.lamSang.ranRit ? 'Có' : 'Không' },
    { id: 'ls_tdmp', label: 'HC tràn dịch MP', group: 'Lâm sàng', extract: p => p.lamSang.hoiChungTDMP?.co ? 'Có' : 'Không' },
    { id: 'ls_dongdac', label: 'HC đông đặc', group: 'Lâm sàng', extract: p => p.lamSang.hoiChungDongDac?.co ? 'Có' : 'Không' },
    { id: 'kc_locMau', label: 'Lọc máu', group: 'Kết cục', extract: p => p.ketCuc.locMau ? 'Có' : 'Không' },
    { id: 'kc_xinVe', label: 'Xin về', group: 'Kết cục', extract: p => p.ketCuc.xinVe ? 'Có' : 'Không' },
    { id: 'ha_xq_tranKhi', label: 'XQ Tràn khí MP', group: 'Hình ảnh', extract: p => p.hinhAnh?.xquangTranKhiMangPhoi ? 'Có' : 'Không' },
    { id: 'psi_nhaDuongLao', label: 'PSI: Nhà dưỡng lão', group: 'PSI', extract: p => p.psi.criteria?.nhaDuongLao ? 'Có' : 'Không' },
];

// ====================================================================
// COMPONENT
// ====================================================================

export default function CrosstabTab({ patients }: { patients: Patient[] }) {
    const [activeVarIds, setActiveVarIds] = useState<string[]>(DEFAULT_VARIABLES.map(v => v.id));
    const [rowVarId, setRowVarId] = useState<string>('');
    const [colVarId, setColVarId] = useState<string>('');
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showExpected, setShowExpected] = useState(false);
    const [showResiduals, setShowResiduals] = useState(false);
    const [rowFlipped, setRowFlipped] = useState(false);
    const [colFlipped, setColFlipped] = useState(false);

    // All available variables (default + user-added)
    const allVars = useMemo(() => {
        const defaultIds = new Set(DEFAULT_VARIABLES.map(v => v.id));
        const additionalActive = ADDITIONAL_VARIABLES.filter(v => activeVarIds.includes(v.id));
        return [
            ...DEFAULT_VARIABLES,
            ...additionalActive.filter(v => !defaultIds.has(v.id)),
        ];
    }, [activeVarIds]);

    // Variables available for selection (only from activeVarIds)
    const selectableVars = useMemo(() => allVars.filter(v => activeVarIds.includes(v.id)), [allVars, activeVarIds]);

    // Variables available to add (not yet active)
    const addableVars = useMemo(() => ADDITIONAL_VARIABLES.filter(v => !activeVarIds.includes(v.id)), [activeVarIds]);

    const rowVar = allVars.find(v => v.id === rowVarId);
    const colVar = allVars.find(v => v.id === colVarId);

    // Build contingency table
    const analysis = useMemo(() => {
        if (!rowVar || !colVar || rowVarId === colVarId) return null;

        // Extract values
        const data: { row: string; col: string }[] = [];
        for (const p of patients) {
            const r = rowVar.extract(p);
            const c = colVar.extract(p);
            if (r !== null && c !== null) {
                data.push({ row: r, col: c });
            }
        }

        if (data.length < 2) return null;

        // Get unique labels — auto-sort: positive/exposure first (SPSS convention)
        const rowLabelsSet = new Set<string>();
        const colLabelsSet = new Set<string>();
        data.forEach(d => { rowLabelsSet.add(d.row); colLabelsSet.add(d.col); });
        const rowLabelsRaw = sortPositiveFirst(Array.from(rowLabelsSet));
        const colLabelsRaw = sortPositiveFirst(Array.from(colLabelsSet));
        // Apply manual flip if user toggled
        const rowLabels = rowFlipped ? [...rowLabelsRaw].reverse() : rowLabelsRaw;
        const colLabels = colFlipped ? [...colLabelsRaw].reverse() : colLabelsRaw;

        if (rowLabels.length < 2 || colLabels.length < 2) return null;

        // Build m×n table
        const m = rowLabels.length, n = colLabels.length;
        const observed: number[][] = Array.from({ length: m }, () => Array(n).fill(0));
        data.forEach(d => {
            const ri = rowLabels.indexOf(d.row);
            const ci = colLabels.indexOf(d.col);
            if (ri >= 0 && ci >= 0) observed[ri][ci]++;
        });

        const total = data.length;
        const rowTotals = observed.map(r => r.reduce((a, b) => a + b, 0));
        const colTotals = Array.from({ length: n }, (_, j) => observed.reduce((a, r) => a + r[j], 0));

        // Run statistical tests
        const chi2 = chiSquareTest(observed);
        const lr = likelihoodRatioTest(observed);
        const lbl = linearByLinear(observed);
        const is2x2 = m === 2 && n === 2;
        const yates = is2x2 ? yatesCorrectedChiSquare(observed) : null;
        const fisher = is2x2 ? fisherExactTest(observed) : null;

        // Effect sizes
        const minDim = Math.min(m, n);
        const phi = is2x2 ? phiCoefficient(chi2.chiSq, total) : null;
        const cv = cramersV(chi2.chiSq, total, minDim);
        const cc = contingencyCoefficient(chi2.chiSq, total);

        // 2×2 only
        const or = is2x2 ? oddsRatio(observed) : null;
        const rr = is2x2 ? relativeRisk(observed) : null;
        const diag = is2x2 ? diagnosticMetrics(observed) : null;

        // Residuals
        const stdRes = chi2.expected.length > 0 ? standardizedResiduals(observed, chi2.expected) : null;
        const adjRes = chi2.expected.length > 0 ? adjustedStdResiduals(observed, chi2.expected) : null;

        return {
            rowLabels, colLabels, observed, total, rowTotals, colTotals,
            chi2, lr, lbl, yates, fisher,
            phi, cv, cc,
            or, rr, diag,
            stdRes, adjRes,
            is2x2, m, n, validN: data.length,
        };
    }, [rowVar, colVar, rowVarId, colVarId, patients, rowFlipped, colFlipped]);

    const fmtP = (p: number | null | undefined) => formatPValue(p);
    const fmtN = (n: number) => n.toFixed(2);
    const pctFmt = (n: number, total: number) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Table2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-sm font-semibold text-blue-900">Bảng chéo (Crosstab) — Phân tích mối liên quan</h3>
                    <p className="text-xs text-blue-700 mt-0.5">
                        Chọn 2 biến phân loại để tạo bảng m×n. Hệ thống tự động tính Chi-square, Fisher's exact (2×2),
                        OR, RR, Se/Sp/PPV/NPV và diễn giải kết quả.
                    </p>
                </div>
            </div>

            {/* Variable selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Biến hàng (Row)</label>
                    <select
                        value={rowVarId}
                        onChange={e => setRowVarId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">— Chọn biến —</option>
                        {Object.entries(groupVars(selectableVars)).map(([group, vars]) => (
                            <optgroup key={group} label={group}>
                                {vars.map(v => (
                                    <option key={v.id} value={v.id} disabled={v.id === colVarId}>{v.label}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Biến cột (Column)</label>
                    <select
                        value={colVarId}
                        onChange={e => setColVarId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">— Chọn biến —</option>
                        {Object.entries(groupVars(selectableVars)).map(([group, vars]) => (
                            <optgroup key={group} label={group}>
                                {vars.map(v => (
                                    <option key={v.id} value={v.id} disabled={v.id === rowVarId}>{v.label}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
            </div>

            {/* Manage variable pool — compact */}
            <div className="relative inline-block">
                <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Quản lý biến
                    <span className="text-gray-400">({selectableVars.length})</span>
                </button>
                {showAddMenu && (
                    <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-auto">
                            {/* Active variables */}
                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                Đang sử dụng ({selectableVars.length})
                            </div>
                            {Object.entries(groupVars(selectableVars)).map(([group, vars]) => (
                                <div key={`active-${group}`}>
                                    <div className="px-3 py-1 text-[10px] font-medium text-gray-400 bg-gray-50/50">{group}</div>
                                    {vars.map(v => {
                                        const isDefault = DEFAULT_VARIABLES.some(dv => dv.id === v.id);
                                        return (
                                            <div key={v.id} className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                                                    {v.label}
                                                </span>
                                                {!isDefault && (
                                                    <button
                                                        onClick={() => {
                                                            setActiveVarIds(prev => prev.filter(id => id !== v.id));
                                                            if (rowVarId === v.id) setRowVarId('');
                                                            if (colVarId === v.id) setColVarId('');
                                                        }}
                                                        className="text-gray-300 hover:text-red-500 p-0.5"
                                                        title="Xóa biến"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                            {/* Addable variables */}
                            {addableVars.length > 0 && (
                                <>
                                    <div className="px-3 py-2 bg-primary-50 border-t border-b border-gray-200 text-[10px] font-semibold text-primary-700 uppercase tracking-wide">
                                        Thêm biến mới
                                    </div>
                                    {Object.entries(groupVars(addableVars)).map(([group, vars]) => (
                                        <div key={`add-${group}`}>
                                            <div className="px-3 py-1 text-[10px] font-medium text-gray-400 bg-gray-50/50">{group}</div>
                                            {vars.map(v => (
                                                <button
                                                    key={v.id}
                                                    onClick={() => setActiveVarIds(prev => [...prev, v.id])}
                                                    className="w-full flex items-center gap-1.5 text-left px-3 py-1.5 text-xs hover:bg-primary-50 text-gray-500"
                                                >
                                                    <Plus className="w-3 h-3 text-primary-400" />
                                                    {v.label}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Prompt if not selected */}
            {(!rowVarId || !colVarId) && (
                <div className="text-center py-12 text-gray-400 text-sm">
                    <Table2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    Chọn 2 biến phân loại ở trên để tạo bảng chéo
                </div>
            )}

            {/* Same variable warning */}
            {rowVarId && colVarId && rowVarId === colVarId && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4" /> Vui lòng chọn 2 biến khác nhau.
                </div>
            )}

            {/* Not enough data */}
            {rowVarId && colVarId && rowVarId !== colVarId && !analysis && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4" /> Không đủ dữ liệu hoặc biến chỉ có 1 giá trị. Cần ít nhất 2 hàng × 2 cột.
                </div>
            )}

            {/* RESULTS */}
            {analysis && (
                <div className="space-y-6">
                    {/* Table header info + reorder buttons */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold">{rowVar!.label}</span>
                        <span>×</span>
                        <span className="font-semibold">{colVar!.label}</span>
                        <span className="text-gray-400 ml-2">
                            ({analysis.m}×{analysis.n} | N = {analysis.validN})
                        </span>
                        <span className="mx-1 text-gray-300">|</span>
                        <button
                            onClick={() => setRowFlipped(f => !f)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            title="Đảo thứ tự hàng"
                        >
                            <ArrowUpDown className="w-3 h-3" /> Hàng
                        </button>
                        <button
                            onClick={() => setColFlipped(f => !f)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            title="Đảo thứ tự cột"
                        >
                            <ArrowLeftRight className="w-3 h-3" /> Cột
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 -mt-4">
                        Mặc định: Có/Dương tính ở trên-trái (SPSS convention). Bấm nút ↕↔ để đảo.
                    </p>

                    {/* Observed contingency table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2 text-left font-semibold">{rowVar!.label} \ {colVar!.label}</th>
                                    {analysis.colLabels.map(c => (
                                        <th key={c} className="border border-gray-300 p-2 text-center font-semibold">{c}</th>
                                    ))}
                                    <th className="border border-gray-300 p-2 text-center font-bold bg-gray-200">Tổng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysis.rowLabels.map((r, ri) => (
                                    <tr key={r} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 p-2 font-semibold bg-gray-50">{r}</td>
                                        {analysis.observed[ri].map((count, ci) => (
                                            <td key={ci} className="border border-gray-300 p-2 text-center">
                                                <div className="font-semibold">{count}</div>
                                                <div className="text-[10px] text-gray-400">
                                                    R: {pctFmt(count, analysis.rowTotals[ri])} |
                                                    C: {pctFmt(count, analysis.colTotals[ci])} |
                                                    T: {pctFmt(count, analysis.total)}
                                                </div>
                                            </td>
                                        ))}
                                        <td className="border border-gray-300 p-2 text-center font-bold bg-gray-100">
                                            {analysis.rowTotals[ri]}
                                            <div className="text-[10px] text-gray-400">{pctFmt(analysis.rowTotals[ri], analysis.total)}</div>
                                        </td>
                                    </tr>
                                ))}
                                {/* Column totals */}
                                <tr className="bg-gray-200 font-bold">
                                    <td className="border border-gray-300 p-2">Tổng</td>
                                    {analysis.colTotals.map((ct, ci) => (
                                        <td key={ci} className="border border-gray-300 p-2 text-center">
                                            {ct}
                                            <div className="text-[10px] text-gray-400 font-normal">{pctFmt(ct, analysis.total)}</div>
                                        </td>
                                    ))}
                                    <td className="border border-gray-300 p-2 text-center text-base">{analysis.total}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="text-[10px] text-gray-400 mt-1">R = Row %, C = Column %, T = Total %</p>
                    </div>

                    {/* Toggle: Expected & Residuals */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowExpected(!showExpected)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showExpected ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                            {showExpected ? '▼' : '▶'} Tần suất kỳ vọng
                        </button>
                        <button
                            onClick={() => setShowResiduals(!showResiduals)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showResiduals ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                            {showResiduals ? '▼' : '▶'} Residuals
                        </button>
                    </div>

                    {/* Expected frequencies */}
                    {showExpected && analysis.chi2.expected.length > 0 && (
                        <div className="overflow-x-auto">
                            <h4 className="text-xs font-semibold text-gray-600 mb-1">Tần suất kỳ vọng (Expected Count)</h4>
                            <table className="w-full text-xs border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-blue-50">
                                        <th className="border border-gray-300 p-1.5 text-left">{rowVar!.label} \ {colVar!.label}</th>
                                        {analysis.colLabels.map(c => <th key={c} className="border border-gray-300 p-1.5 text-center">{c}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.rowLabels.map((r, ri) => (
                                        <tr key={r}>
                                            <td className="border border-gray-300 p-1.5 font-medium bg-blue-50">{r}</td>
                                            {analysis.chi2.expected[ri].map((e, ci) => (
                                                <td key={ci} className={`border border-gray-300 p-1.5 text-center ${e < 5 ? 'text-red-600 font-semibold' : ''}`}>
                                                    {fmtN(e)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Residuals */}
                    {showResiduals && analysis.stdRes && analysis.adjRes && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ResidualTable title="Standardized Residuals" data={analysis.stdRes} rowLabels={analysis.rowLabels} colLabels={analysis.colLabels} rowVarLabel={rowVar!.label} colVarLabel={colVar!.label} />
                            <ResidualTable title="Adjusted Std. Residuals" data={analysis.adjRes} rowLabels={analysis.rowLabels} colLabels={analysis.colLabels} rowVarLabel={rowVar!.label} colVarLabel={colVar!.label} />
                        </div>
                    )}

                    {/* Chi-Square Tests */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-800">Chi-Square Tests</h4>
                        </div>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left p-2 pl-4 font-medium">Test</th>
                                    <th className="text-center p-2 font-medium">Value</th>
                                    <th className="text-center p-2 font-medium">df</th>
                                    <th className="text-center p-2 font-medium">p (2-sided)</th>
                                    <th className="text-center p-2 font-medium">Sig.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <StatRow label="Pearson Chi-Square" value={analysis.chi2.chiSq} df={analysis.chi2.df} p={analysis.chi2.p} />
                                <StatRow label="Likelihood Ratio" value={analysis.lr.g2} df={analysis.lr.df} p={analysis.lr.p} />
                                {analysis.yates && <StatRow label="Continuity Correction (Yates')" value={analysis.yates.chiSq} df={1} p={analysis.yates.p} />}
                                {analysis.fisher && <StatRow label="Fisher's Exact Test" value={null} df={null} p={analysis.fisher.p} />}
                                {analysis.lbl && <StatRow label="Linear-by-Linear Association" value={analysis.lbl.chiSq} df={1} p={analysis.lbl.p} />}
                                <tr className="border-t border-gray-100 bg-gray-50">
                                    <td className="p-2 pl-4 text-gray-500">N of Valid Cases</td>
                                    <td className="p-2 text-center font-semibold">{analysis.validN}</td>
                                    <td colSpan={3}></td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Warning */}
                        {analysis.chi2.warning && (
                            <div className="flex items-start gap-2 px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-800">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>{analysis.chi2.warning}</span>
                            </div>
                        )}

                        {/* Interpretation */}
                        <div className="px-4 py-3 bg-blue-50 border-t border-blue-200 text-xs text-blue-900 space-y-1">
                            <div className="flex items-start gap-1.5">
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span className="font-medium">Diễn giải:</span>
                            </div>
                            <p>{interpretChiSquare(analysis.chi2.p, analysis.chi2.df)}</p>
                            {analysis.is2x2 && analysis.fisher && (
                                <p>Fisher's Exact (khuyến nghị cho bảng 2×2 / mẫu nhỏ): p = {fmtP(analysis.fisher.p)} — {analysis.fisher.p < 0.05 ? '✓ Có ý nghĩa' : '✗ Không ý nghĩa'}</p>
                            )}
                        </div>
                    </div>

                    {/* Effect Size */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-800">Symmetric Measures (Mức độ liên quan)</h4>
                        </div>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left p-2 pl-4 font-medium">Measure</th>
                                    <th className="text-center p-2 font-medium">Value</th>
                                    <th className="text-left p-2 font-medium">Diễn giải</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysis.phi !== null && (
                                    <tr className="border-b border-gray-100">
                                        <td className="p-2 pl-4">Phi (φ)</td>
                                        <td className="p-2 text-center font-mono">{fmtN(analysis.phi)}</td>
                                        <td className="p-2 text-gray-600">Chỉ dùng cho bảng 2×2</td>
                                    </tr>
                                )}
                                <tr className="border-b border-gray-100">
                                    <td className="p-2 pl-4">Cramér's V</td>
                                    <td className="p-2 text-center font-mono">{fmtN(analysis.cv)}</td>
                                    <td className="p-2 text-gray-600">{interpretCramersV(analysis.cv)}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="p-2 pl-4">Contingency Coefficient (C)</td>
                                    <td className="p-2 text-center font-mono">{fmtN(analysis.cc)}</td>
                                    <td className="p-2 text-gray-600">Giá trị tối đa phụ thuộc kích thước bảng</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 2×2 specific: OR, RR, Diagnostic */}
                    {analysis.is2x2 && (
                        <>
                            {/* Risk Estimates */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-800">Risk Estimate (Ước lượng nguy cơ — chỉ bảng 2×2)</h4>
                                </div>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="text-left p-2 pl-4 font-medium">Measure</th>
                                            <th className="text-center p-2 font-medium">Value</th>
                                            <th className="text-center p-2 font-medium">95% CI Lower</th>
                                            <th className="text-center p-2 font-medium">95% CI Upper</th>
                                            <th className="text-center p-2 font-medium">p</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.or && (
                                            <tr className="border-b border-gray-100">
                                                <td className="p-2 pl-4 font-medium">Odds Ratio (OR)</td>
                                                <td className="p-2 text-center font-mono font-semibold">{fmtN(analysis.or.or)}</td>
                                                <td className="p-2 text-center font-mono">{fmtN(analysis.or.ci[0])}</td>
                                                <td className="p-2 text-center font-mono">{fmtN(analysis.or.ci[1])}</td>
                                                <td className="p-2 text-center">{fmtP(analysis.or.p)}</td>
                                            </tr>
                                        )}
                                        {analysis.rr && (
                                            <tr className="border-b border-gray-100">
                                                <td className="p-2 pl-4 font-medium">Relative Risk (RR)</td>
                                                <td className="p-2 text-center font-mono font-semibold">{fmtN(analysis.rr.rr)}</td>
                                                <td className="p-2 text-center font-mono">{fmtN(analysis.rr.ci[0])}</td>
                                                <td className="p-2 text-center font-mono">{fmtN(analysis.rr.ci[1])}</td>
                                                <td className="p-2 text-center">{fmtP(analysis.rr.p)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {/* OR Interpretation */}
                                {analysis.or && (
                                    <div className="px-4 py-2.5 bg-blue-50 border-t border-blue-200 text-xs text-blue-900 space-y-1">
                                        <div className="flex items-start gap-1.5">
                                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium">Diễn giải OR:</p>
                                                <p>{interpretOR(analysis.or.or, analysis.or.ci)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Diagnostic Metrics */}
                            {analysis.diag && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                        <h4 className="text-sm font-semibold text-gray-800">Diagnostic Performance (Giá trị chẩn đoán — bảng 2×2)</h4>
                                        <p className="text-[10px] text-gray-500">
                                            Hàng 1 = "{analysis.rowLabels[0]}" (positive), Cột 1 = "{analysis.colLabels[0]}" (disease)
                                        </p>
                                    </div>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left p-2 pl-4 font-medium">Metric</th>
                                                <th className="text-center p-2 font-medium">Value</th>
                                                <th className="text-center p-2 font-medium">95% CI</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {([
                                                ['Sensitivity (Se)', analysis.diag.sensitivity],
                                                ['Specificity (Sp)', analysis.diag.specificity],
                                                ['PPV', analysis.diag.ppv],
                                                ['NPV', analysis.diag.npv],
                                            ] as const).map(([label, m]) => (
                                                <tr key={label} className="border-b border-gray-100">
                                                    <td className="p-2 pl-4">{label}</td>
                                                    <td className="p-2 text-center font-mono font-semibold">{(m.value * 100).toFixed(1)}%</td>
                                                    <td className="p-2 text-center font-mono text-gray-500">{(m.ci[0] * 100).toFixed(1)}–{(m.ci[1] * 100).toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* Disclaimer */}
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold">Lưu ý:</span> Kết quả thống kê sử dụng các phương pháp xấp xỉ (approximation).
                            Để công bố khoa học, vui lòng xác minh lại bằng SPSS hoặc R.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ====================================================================
// SUB-COMPONENTS
// ====================================================================

function StatRow({ label, value, df, p }: { label: string; value: number | null; df: number | null; p: number }) {
    const sig = p < 0.05;
    return (
        <tr className="border-b border-gray-100">
            <td className="p-2 pl-4">{label}</td>
            <td className="p-2 text-center font-mono">{value !== null ? value.toFixed(3) : '—'}</td>
            <td className="p-2 text-center">{df !== null ? df : '—'}</td>
            <td className="p-2 text-center font-mono">{formatPValue(p)}</td>
            <td className="p-2 text-center">
                {sig
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-600 mx-auto" />
                    : <span className="text-gray-400">ns</span>
                }
            </td>
        </tr>
    );
}

function ResidualTable({ title, data, rowLabels, colLabels, rowVarLabel, colVarLabel }: {
    title: string; data: number[][]; rowLabels: string[]; colLabels: string[];
    rowVarLabel: string; colVarLabel: string;
}) {
    return (
        <div className="overflow-x-auto">
            <h4 className="text-xs font-semibold text-gray-600 mb-1">{title}</h4>
            <table className="w-full text-xs border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-orange-50">
                        <th className="border border-gray-300 p-1.5 text-left">{rowVarLabel} \ {colVarLabel}</th>
                        {colLabels.map(c => <th key={c} className="border border-gray-300 p-1.5 text-center">{c}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rowLabels.map((r, ri) => (
                        <tr key={r}>
                            <td className="border border-gray-300 p-1.5 font-medium bg-orange-50">{r}</td>
                            {data[ri].map((v, ci) => {
                                const abs = Math.abs(v);
                                const bgColor = abs > 1.96 ? 'bg-red-100 text-red-800 font-semibold' : abs > 1.645 ? 'bg-amber-50 text-amber-700' : '';
                                return (
                                    <td key={ci} className={`border border-gray-300 p-1.5 text-center font-mono ${bgColor}`}>
                                        {v.toFixed(2)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="text-[10px] text-gray-400 mt-0.5">Giá trị |z| &gt; 1.96 → có ý nghĩa thống kê (đỏ)</p>
        </div>
    );
}

// ====================================================================
// HELPERS
// ====================================================================

function groupVars(vars: CategoricalVar[]): Record<string, CategoricalVar[]> {
    const groups: Record<string, CategoricalVar[]> = {};
    for (const v of vars) {
        if (!groups[v.group]) groups[v.group] = [];
        groups[v.group].push(v);
    }
    return groups;
}

/**
 * Sort labels so positive/exposure values come first (top-left of table).
 * SPSS convention: 0 = Có (positive/exposed), 1 = Không (negative/unexposed).
 * This ensures OR/RR are calculated correctly with disease+exposure in cell [0,0].
 */
const POSITIVE_FIRST = ['Có', 'Dương tính', 'Nam', '≥2', '≥65', 'Nặng (III–V)', 'Nặng (3–5)'];
const NEGATIVE_LAST = ['Không', 'Âm tính', 'Nữ', '0–1', '<65', 'Nhẹ (I–II)', 'Nhẹ (0–1)'];

function sortPositiveFirst(labels: string[]): string[] {
    return [...labels].sort((a, b) => {
        const aPos = POSITIVE_FIRST.includes(a) ? -1 : NEGATIVE_LAST.includes(a) ? 1 : 0;
        const bPos = POSITIVE_FIRST.includes(b) ? -1 : NEGATIVE_LAST.includes(b) ? 1 : 0;
        if (aPos !== bPos) return aPos - bPos;
        // For multi-level (e.g. PSI Class), keep natural order
        return a.localeCompare(b, 'vi');
    });
}
