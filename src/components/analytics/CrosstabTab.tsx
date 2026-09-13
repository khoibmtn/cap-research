/**
 * CrosstabTab.tsx
 * Bảng chéo m×n (Contingency Table / Crosstab) với phân tích thống kê đầy đủ.
 * Output tương đương SPSS Crosstabs + diễn giải kết quả.
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Patient } from '../../types/patient';
import {
    chiSquareTest, likelihoodRatioTest, yatesCorrectedChiSquare,
    fisherExactTest, phiCoefficient, cramersV, contingencyCoefficient,
    oddsRatio, relativeRisk, diagnosticMetrics,
    standardizedResiduals, adjustedStdResiduals, linearByLinear,
    formatPValue,
    interpretCramersV, interpretOR, interpretChiSquare,
} from '../../utils/statisticalTests';
import {
    Plus, X, Table2, AlertTriangle, CheckCircle, Info, ArrowUpDown, ArrowLeftRight,
    Bookmark, Star, Trash2, Save, Copy, Check, Sparkles, Pencil
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    type AnalysisTemplate,
    getTemplates, saveTemplate, deleteTemplate, setDefaultTemplate, renameTemplate,
    saveLastState, getLastState
} from '../../services/templateService';

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
    { id: 'kc_tuVong', label: 'Tử vong', group: 'Kết cục', extract: p => (p.ketCuc.tuVong || p.ketCuc.tinhTrangRaVien === 'Tử vong') ? 'Có' : 'Không' },
    { id: 'kc_chuyenTuyen', label: 'Chuyển tuyến', group: 'Kết cục', extract: p => (p.ketCuc.chuyenTuyen || p.ketCuc.tinhTrangRaVien === 'Chuyển tuyến') ? 'Có' : 'Không' },
    { id: 'kc_ketCucNang', label: 'Biến cố nặng (TV/Xin về/Chuyển tuyến)', group: 'Kết cục', extract: p => (p.ketCuc.tuVong || p.ketCuc.xinVe || p.ketCuc.chuyenTuyen || p.ketCuc.tinhTrangRaVien === 'Tử vong' || p.ketCuc.tinhTrangRaVien === 'Xin về' || p.ketCuc.tinhTrangRaVien === 'Chuyển tuyến') ? 'Có' : 'Không' },
    { id: 'kc_tinhTrangRaVien', label: 'Tình trạng ra viện (nhóm)', group: 'Kết cục', extract: p => p.ketCuc.tinhTrangRaVien || (p.ketCuc.tuVong ? 'Tử vong' : p.ketCuc.xinVe ? 'Xin về' : p.ketCuc.tienTrienTotXuatVien ? 'Tiến triển tốt, xuất viện' : p.ketCuc.chuyenTuyen ? 'Chuyển tuyến' : null) },
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

    // Template & Persistence State
    const [templates, setTemplates] = useState<AnalysisTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [renameTemplateName, setRenameTemplateName] = useState('');
    const [newTemplateIsDefault, setNewTemplateIsDefault] = useState(false);
    const [copiedInterpretation, setCopiedInterpretation] = useState(false);
    const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

    const applyTemplateConfig = useCallback((tmpl: AnalysisTemplate) => {
        const cfg = tmpl.config;
        if (cfg.rowVarId) setRowVarId(cfg.rowVarId);
        if (cfg.colVarId) setColVarId(cfg.colVarId);
        if (cfg.showExpected !== undefined) setShowExpected(cfg.showExpected);
        if (cfg.showResiduals !== undefined) setShowResiduals(cfg.showResiduals);
        if (cfg.rowFlipped !== undefined) setRowFlipped(cfg.rowFlipped);
        if (cfg.colFlipped !== undefined) setColFlipped(cfg.colFlipped);
        if (Array.isArray(cfg.activeVarIds)) setActiveVarIds(cfg.activeVarIds);
        setSelectedTemplateId(tmpl.id);
    }, []);

    // Load templates and restore last state or default template
    useEffect(() => {
        getTemplates('crosstab').then(list => {
            setTemplates(list);
            
            const last = getLastState<any>('crosstab');
            const defaultTmpl = list.find(t => t.isDefault);
            
            if (last && (last.rowVarId || last.colVarId)) {
                if (last.rowVarId) setRowVarId(last.rowVarId);
                if (last.colVarId) setColVarId(last.colVarId);
                if (last.showExpected !== undefined) setShowExpected(last.showExpected);
                if (last.showResiduals !== undefined) setShowResiduals(last.showResiduals);
                if (last.rowFlipped !== undefined) setRowFlipped(last.rowFlipped);
                if (last.colFlipped !== undefined) setColFlipped(last.colFlipped);
                if (Array.isArray(last.activeVarIds)) setActiveVarIds(last.activeVarIds);
                if (last.templateId) setSelectedTemplateId(last.templateId);
            } else if (defaultTmpl?.config) {
                applyTemplateConfig(defaultTmpl);
            }
            setIsLoadedFromStorage(true);
        });
    }, [applyTemplateConfig]);

    // Auto-save last state whenever configuration changes
    useEffect(() => {
        if (!isLoadedFromStorage) return;
        saveLastState('crosstab', {
            rowVarId,
            colVarId,
            showExpected,
            showResiduals,
            rowFlipped,
            colFlipped,
            activeVarIds,
            templateId: selectedTemplateId
        });
    }, [rowVarId, colVarId, showExpected, showResiduals, rowFlipped, colFlipped, activeVarIds, selectedTemplateId, isLoadedFromStorage]);

    const handleSelectTemplate = (id: string) => {
        if (!id) {
            setSelectedTemplateId('');
            return;
        }
        const tmpl = templates.find(t => t.id === id);
        if (tmpl) {
            applyTemplateConfig(tmpl);
            toast.success(`Đã áp dụng mẫu "${tmpl.name}"`);
        }
    };

    const handleSaveNewTemplate = async () => {
        if (!newTemplateName.trim()) {
            toast.error('Vui lòng nhập tên mẫu');
            return;
        }
        try {
            const saved = await saveTemplate({
                name: newTemplateName.trim(),
                type: 'crosstab',
                isDefault: newTemplateIsDefault,
                config: {
                    rowVarId,
                    colVarId,
                    showExpected,
                    showResiduals,
                    rowFlipped,
                    colFlipped,
                    activeVarIds,
                }
            });
            const updated = await getTemplates('crosstab');
            setTemplates(updated);
            setSelectedTemplateId(saved.id);
            setShowSaveModal(false);
            setNewTemplateName('');
            setNewTemplateIsDefault(false);
            toast.success('Đã lưu mẫu phân tích mới');
        } catch {
            toast.error('Không thể lưu mẫu phân tích');
        }
    };

    const handleUpdateCurrentTemplate = async () => {
        const current = templates.find(t => t.id === selectedTemplateId);
        if (!current) return;
        try {
            await saveTemplate({
                id: current.id,
                name: current.name,
                type: 'crosstab',
                isDefault: current.isDefault,
                config: {
                    rowVarId,
                    colVarId,
                    showExpected,
                    showResiduals,
                    rowFlipped,
                    colFlipped,
                    activeVarIds,
                }
            });
            const updated = await getTemplates('crosstab');
            setTemplates(updated);
            toast.success(`Đã cập nhật mẫu "${current.name}"`);
        } catch {
            toast.error('Lỗi khi cập nhật mẫu');
        }
    };

    const handleRenameTemplate = async () => {
        if (!renameTemplateName.trim()) {
            toast.error('Vui lòng nhập tên mẫu');
            return;
        }
        try {
            await renameTemplate(selectedTemplateId, renameTemplateName.trim(), 'crosstab');
            const updated = await getTemplates('crosstab');
            setTemplates(updated);
            setShowRenameModal(false);
            toast.success(`Đã đổi tên mẫu thành "${renameTemplateName.trim()}"`);
        } catch {
            toast.error('Lỗi khi đổi tên mẫu');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        const tmpl = templates.find(t => t.id === id);
        if (!window.confirm(`Bạn có chắc muốn xóa mẫu "${tmpl?.name || 'này'}"?`)) return;
        try {
            await deleteTemplate(id, 'crosstab');
            const updated = await getTemplates('crosstab');
            setTemplates(updated);
            if (selectedTemplateId === id) setSelectedTemplateId('');
            toast.success('Đã xóa mẫu phân tích');
        } catch {
            toast.error('Lỗi khi xóa mẫu');
        }
    };

    const handleSetDefaultTemplate = async (id: string) => {
        try {
            await setDefaultTemplate(id, 'crosstab');
            const updated = await getTemplates('crosstab');
            setTemplates(updated);
            toast.success('Đã đặt làm mẫu mặc định');
        } catch {
            toast.error('Lỗi khi đặt mặc định');
        }
    };

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

    // Advanced Medical Interpretation for m×n / 2×2
    const medicalInterpretation = useMemo(() => {
        if (!analysis || !rowVar || !colVar) return null;

        const pVal = analysis.chi2.p;
        const isSig = pVal < 0.05;
        const pStr = fmtP(pVal);
        const chiSqStr = analysis.chi2.chiSq.toFixed(2);
        const df = analysis.chi2.df;
        const cv = analysis.cv;
        const cvStr = cv.toFixed(3);
        const effectLabel = interpretCramersV(cv);

        // Analyze extreme residuals
        const cells: Array<{
            row: string;
            col: string;
            z: number;
            isHigher: boolean;
            isVerySig: boolean;
        }> = [];

        if (analysis.adjRes) {
            for (let r = 0; r < analysis.m; r++) {
                for (let c = 0; c < analysis.n; c++) {
                    const z = analysis.adjRes[r][c];
                    const absZ = Math.abs(z);
                    if (absZ >= 1.96) {
                        cells.push({
                            row: analysis.rowLabels[r],
                            col: analysis.colLabels[c],
                            z,
                            isHigher: z > 0,
                            isVerySig: absZ >= 2.58
                        });
                    }
                }
            }
        }

        // Text generation
        const lines: string[] = [];
        
        if (isSig) {
            lines.push(`Phân tích kiểm định Chi-bình phương Pearson cho thấy có mối liên quan có ý nghĩa thống kê giữa "${rowVar.label}" và "${colVar.label}" (χ² = ${chiSqStr}, df = ${df}, ${pStr}).`);
            lines.push(`Hệ số tương quan Cramer's V = ${cvStr} cho thấy mức độ gắn kết giữa hai biến ở mức ${effectLabel.toLowerCase()}.`);
        } else {
            lines.push(`Phân tích kiểm định Chi-bình phương Pearson chưa ghi nhận mối liên quan có ý nghĩa thống kê giữa "${rowVar.label}" và "${colVar.label}" (χ² = ${chiSqStr}, df = ${df}, ${pStr}, p ≥ 0.05).`);
            lines.push(`Hệ số tương quan Cramer's V = ${cvStr} (mức độ gắn kết ${effectLabel.toLowerCase()}).`);
        }

        if (cells.length > 0) {
            const cellDescriptions = cells.map(c => {
                const dir = c.isHigher ? 'cao hơn đáng kể' : 'thấp hơn đáng kể';
                const pLevel = c.isVerySig ? 'p < 0.01' : 'p < 0.05';
                const sign = c.z > 0 ? `+${c.z.toFixed(2)}` : c.z.toFixed(2);
                return `nhóm "${c.row}" xuất hiện ở phân loại "${c.col}" ${dir} so với kỳ vọng ngẫu nhiên (phần dư chuẩn hóa hiệu chỉnh z = ${sign}, ${pLevel})`;
            });
            lines.push(`Phân tích phần dư chuẩn hóa hiệu chỉnh (Adjusted Residuals) xác định các ô có biến động vượt trội: ${cellDescriptions.join('; ')}.`);
        } else if (isSig) {
            lines.push('Mặc dù kiểm định tổng thể có ý nghĩa thống kê, không có từng ô riêng lẻ nào vượt ngưỡng phần dư hiệu chỉnh chuẩn hóa (|z| ≥ 1.96), cho thấy mức độ khác biệt phân tán đều khắp bảng.');
        }

        if (analysis.is2x2 && analysis.or) {
            lines.push(`Ước lượng tỷ suất chênh (Odds Ratio - OR): ${interpretOR(analysis.or.or, analysis.or.ci)}.`);
        }

        if (isSig) {
            lines.push(`Khuyến nghị nghiên cứu: Biến "${rowVar.label}" có mối liên quan độc lập với "${colVar.label}". Khuyến nghị tiếp tục đưa biến này vào mô hình phân tích hồi quy đa biến (Multivariate Regression) để kiểm soát các yếu tố gây nhiễu.`);
        }

        return {
            isSig,
            cells,
            summaryText: lines.join('\n\n')
        };
    }, [analysis, rowVar, colVar]);

    const handleCopyInterpretation = () => {
        if (!medicalInterpretation?.summaryText) return;
        navigator.clipboard.writeText(medicalInterpretation.summaryText);
        setCopiedInterpretation(true);
        toast.success('Đã sao chép đoạn văn diễn giải vào bộ nhớ tạm');
        setTimeout(() => setCopiedInterpretation(false), 2000);
    };

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

            {/* ════════════════ 1. QUẢN LÝ & LƯU MẪU PHÂN TÍCH (XANH DƯƠNG NHẠT) ════════════════ */}
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-sky-200/70 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">1</span>
                        <div>
                            <h4 className="text-sm font-semibold text-sky-950">Quản lý & Lưu mẫu phân tích</h4>
                            <p className="text-xs text-sky-800/70">Lưu lại các cặp biến thường dùng hoặc đặt mẫu mặc định tự động nạp khi mở tab</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setNewTemplateName(rowVar && colVar ? `${rowVar.label} × ${colVar.label}` : 'Mẫu phân tích mới');
                            setNewTemplateIsDefault(false);
                            setShowSaveModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
                    >
                        <Bookmark className="w-3.5 h-3.5" />
                        Lưu thành mẫu...
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-900 bg-white px-2.5 py-1.5 rounded-lg border border-sky-200 shrink-0 shadow-2xs">
                            <Bookmark className="w-4 h-4 text-sky-600" />
                            <span>Mẫu phân tích:</span>
                        </div>
                        <select
                            value={selectedTemplateId}
                            onChange={(e) => handleSelectTemplate(e.target.value)}
                            className="text-xs sm:text-sm font-medium border border-sky-200 rounded-lg px-3 py-1.5 bg-white text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 min-w-[260px] sm:min-w-[360px] lg:min-w-[420px] max-w-2xl flex-1 shadow-2xs"
                            title={templates.find(t => t.id === selectedTemplateId)?.name || 'Chọn mẫu phân tích'}
                        >
                            <option value="">-- Mẫu mặc định / Chưa chọn mẫu --</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} {t.isDefault ? '⭐ [Mặc định]' : ''}
                                </option>
                            ))}
                        </select>
                        {selectedTemplateId && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const cur = templates.find(t => t.id === selectedTemplateId);
                                        if (cur) {
                                            setRenameTemplateName(cur.name);
                                            setShowRenameModal(true);
                                        }
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
                                    title="Đổi tên mẫu phân tích này"
                                >
                                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                    Đổi tên
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdateCurrentTemplate}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-sky-800 bg-sky-100/80 border border-sky-300 rounded-lg hover:bg-sky-200/80 transition-colors shadow-2xs"
                                    title="Lưu đè cấu hình hiện tại vào mẫu này"
                                >
                                    <Save className="w-3.5 h-3.5 text-sky-700" />
                                    Cập nhật
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetDefaultTemplate(selectedTemplateId)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors shadow-2xs"
                                    title="Đặt mẫu này tự động tải khi mở tab"
                                >
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    Mặc định
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteTemplate(selectedTemplateId)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                    title="Xóa mẫu này"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ════════════════ 2. THIẾT LẬP & ĐIỀU CHỈNH BIẾN (VÀNG NHẠT) ════════════════ */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">2</span>
                        <div>
                            <h4 className="text-sm font-semibold text-amber-950">Thêm & Điều chỉnh biến phân tích</h4>
                            <p className="text-xs text-amber-800/70">Chọn biến hàng (Row), biến cột (Column) và quản lý danh sách biến khả dụng</p>
                        </div>
                    </div>
                </div>

                {/* Variable selection + manage button — single row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                    <div className="flex-1 min-w-0">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Biến hàng (Row)</label>
                        <select
                            value={rowVarId}
                            onChange={e => setRowVarId(e.target.value)}
                            className="w-full border border-amber-200/90 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
                        >
                            <option value="">— Chọn biến hàng —</option>
                            {Object.entries(groupVars(selectableVars)).map(([group, vars]) => (
                                <optgroup key={group} label={group}>
                                    {vars.map(v => (
                                        <option key={v.id} value={v.id} disabled={v.id === colVarId}>{v.label}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Biến cột (Column)</label>
                        <select
                            value={colVarId}
                            onChange={e => setColVarId(e.target.value)}
                            className="w-full border border-amber-200/90 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
                        >
                            <option value="">— Chọn biến cột —</option>
                            {Object.entries(groupVars(selectableVars)).map(([group, vars]) => (
                                <optgroup key={group} label={group}>
                                    {vars.map(v => (
                                        <option key={v.id} value={v.id} disabled={v.id === rowVarId}>{v.label}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    {/* Manage variable pool */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setShowAddMenu(!showAddMenu)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors shadow-2xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Quản lý biến
                            <span className="text-amber-200">({selectableVars.length})</span>
                        </button>
                        {showAddMenu && (
                            <>
                                {/* Backdrop */}
                                <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                                <div className="absolute top-full right-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-auto">
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
                </div>

                {/* Warnings inside Block 2 */}
                {rowVarId && colVarId && rowVarId === colVarId && (
                    <div className="flex items-center gap-2 p-3 bg-white border border-amber-300 rounded-lg text-sm text-amber-800 shadow-2xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> Vui lòng chọn 2 biến khác nhau để tạo bảng chéo.
                    </div>
                )}
                {rowVarId && colVarId && rowVarId !== colVarId && !analysis && (
                    <div className="flex items-center gap-2 p-3 bg-white border border-amber-300 rounded-lg text-sm text-amber-800 shadow-2xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> Không đủ dữ liệu hoặc biến chỉ có 1 giá trị. Cần ít nhất 2 hàng × 2 cột.
                    </div>
                )}
            </div>

            {/* ════════════════ 3. HIỂN THỊ KẾT QUẢ & DIỄN GIẢI THỐNG KÊ (NỀN TRẮNG) ════════════════ */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">3</span>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900">Hiển thị kết quả & Diễn giải thống kê y khoa</h4>
                            <p className="text-xs text-gray-500">Bảng chéo m×n, kiểm định Chi-bình phương, kích thước hiệu ứng và báo cáo diễn giải</p>
                        </div>
                    </div>
                    {analysis && (
                        <div className="text-xs text-emerald-900 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 self-start sm:self-auto">
                            {rowVar?.label} × {colVar?.label} ({analysis.m}×{analysis.n} · N = {analysis.validN})
                        </div>
                    )}
                </div>

                {!analysis ? (
                    <div className="text-center py-12 text-gray-400 text-sm bg-gray-50/50 rounded-xl border border-gray-100">
                        <Table2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="font-medium text-gray-600">Chưa có kết quả phân tích</p>
                        <p className="text-xs text-gray-400 mt-1">Vui lòng chọn 2 biến phân loại ở khối trên để tạo bảng chéo và tính toán kiểm định thống kê.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Toolbar: Đảo thứ tự hàng/cột & Tùy chọn bảng bổ sung */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200 shadow-2xs">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-700">Đảo thứ tự bảng:</span>
                                <button
                                    type="button"
                                    onClick={() => setRowFlipped(f => !f)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${rowFlipped ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                                    title="Đảo ngược thứ tự các hàng trong bảng"
                                >
                                    <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                                    Đảo hàng {rowFlipped ? '(Đang đảo)' : ''}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setColFlipped(f => !f)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${colFlipped ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                                    title="Đảo ngược thứ tự các cột trong bảng"
                                >
                                    <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
                                    Đảo cột {colFlipped ? '(Đang đảo)' : ''}
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-700">Bảng bổ sung:</span>
                                <button
                                    type="button"
                                    onClick={() => setShowExpected(!showExpected)}
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${showExpected ? 'bg-emerald-600 border-emerald-600 text-white font-semibold shadow-2xs' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                                >
                                    {showExpected ? '✓' : '+'} Tần số kỳ vọng
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowResiduals(!showResiduals)}
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${showResiduals ? 'bg-emerald-600 border-emerald-600 text-white font-semibold shadow-2xs' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                                >
                                    {showResiduals ? '✓' : '+'} Phần dư chuẩn hóa
                                </button>
                            </div>
                        </div>

                        {/* Observed contingency table */}
                        <div className="overflow-x-auto bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
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

                    {/* Expected frequencies */}
                    {showExpected && analysis.chi2.expected.length > 0 && (
                        <div className="overflow-x-auto bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                            <h4 className="text-xs font-semibold text-gray-700 mb-2">Tần suất kỳ vọng (Expected Count)</h4>
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

                    {/* Medical Interpretation */}
                    {medicalInterpretation && (
                        <div className="border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-slate-50 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-blue-100/60 px-4 py-3 border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-700" />
                                    <h4 className="text-sm font-semibold text-blue-950">Diễn giải y khoa tổng hợp (Medical Interpretation Synthesis)</h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyInterpretation}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-800 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
                                >
                                    {copiedInterpretation ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-green-600" />
                                            Đã sao chép!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5 text-blue-600" />
                                            Sao chép diễn giải
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="p-4 space-y-3 text-xs leading-relaxed text-gray-800">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full font-medium ${medicalInterpretation.isSig ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                        {medicalInterpretation.isSig ? 'Có ý nghĩa thống kê (p < 0.05)' : 'Chưa có ý nghĩa thống kê (p ≥ 0.05)'}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                        Cramer's V = {analysis.cv.toFixed(3)}
                                    </span>
                                    {analysis.is2x2 && analysis.or && (
                                        <span className="px-2.5 py-0.5 rounded-full font-medium bg-sky-100 text-sky-800 border border-sky-200">
                                            OR = {analysis.or.or.toFixed(2)} (95% CI: {analysis.or.ci[0].toFixed(2)}–{analysis.or.ci[1].toFixed(2)})
                                        </span>
                                    )}
                                </div>

                                <div className="bg-white p-3.5 rounded-lg border border-blue-100 font-sans whitespace-pre-line text-gray-700 shadow-2xs">
                                    {medicalInterpretation.summaryText}
                                </div>

                                {medicalInterpretation.cells.length > 0 && (
                                    <div className="pt-2">
                                        <h5 className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Các ô có độ lệch phần dư chuẩn hóa hiệu chỉnh (|z| ≥ 1.96):</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {medicalInterpretation.cells.map((cell, idx) => (
                                                <div key={idx} className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${cell.isHigher ? 'bg-red-50/70 border-red-200 text-red-900' : 'bg-blue-50/70 border-blue-200 text-blue-900'}`}>
                                                    <div>
                                                        <span className="font-semibold">{cell.row}</span> × <span className="font-semibold">{cell.col}</span>
                                                        <span className="block text-[10px] text-gray-500">
                                                            {cell.isHigher ? 'Xuất hiện nhiều hơn kỳ vọng' : 'Xuất hiện ít hơn kỳ vọng'}
                                                        </span>
                                                    </div>
                                                    <div className="text-right font-mono">
                                                        <span className={`font-bold ${cell.isVerySig ? 'underline' : ''}`}>z = {cell.z > 0 ? `+${cell.z.toFixed(2)}` : cell.z.toFixed(2)}</span>
                                                        <span className="block text-[10px] text-gray-400">{cell.isVerySig ? 'p < 0.01' : 'p < 0.05'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
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

            {/* Modal Lưu Template */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4 border border-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                <Bookmark className="w-4 h-4 text-primary-600" />
                                Lưu mẫu phân tích Bảng chéo
                            </h3>
                            <button onClick={() => setShowSaveModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Tên mẫu phân tích</label>
                                <input
                                    type="text"
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                    placeholder="VD: Phân tầng PSI theo Tử vong..."
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    autoFocus
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newTemplateIsDefault}
                                    onChange={(e) => setNewTemplateIsDefault(e.target.checked)}
                                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                                />
                                <span className="text-xs text-gray-700">Tự động tải mẫu này khi mở tab Bảng chéo</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowSaveModal(false)}
                                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveNewTemplate}
                                className="px-4 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs transition-colors"
                            >
                                Lưu mẫu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Đổi tên Template */}
            {showRenameModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4 border border-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                <Pencil className="w-4 h-4 text-primary-600" />
                                Đổi tên mẫu phân tích
                            </h3>
                            <button onClick={() => setShowRenameModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Tên mẫu mới</label>
                                <input
                                    type="text"
                                    value={renameTemplateName}
                                    onChange={(e) => setRenameTemplateName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleRenameTemplate(); }}
                                    placeholder="Nhập tên mẫu phân tích..."
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowRenameModal(false)}
                                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleRenameTemplate}
                                disabled={!renameTemplateName.trim()}
                                className="px-4 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs transition-colors disabled:opacity-40"
                            >
                                Lưu tên mới
                            </button>
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
