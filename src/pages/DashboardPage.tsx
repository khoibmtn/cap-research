import { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileDown, Trash2, Eye, Edit, Printer, HardDrive, Loader2, Settings2, ChevronDown, ChevronRight, ChevronLeft, CircleCheck, CircleAlert, SlidersHorizontal, X } from 'lucide-react';
import { patientService } from '../services/patientService';
import { settingsService } from '../services/settingsService';
import { exportPatientsToExcel } from '../services/exportService';
import { usePrintRecord } from '../hooks/usePrintRecord';
import { useEditGuardConfirm } from '../contexts/EditGuardContext';
import type { Patient } from '../types/patient';
import { backupService } from '../services/backupService';
import toast from 'react-hot-toast';
import { DEFAULT_NOI_O } from '../data/formOptions';

// ─── Column config ──────────────────────────────────────────
interface ColumnDef {
    key: string;
    label: string;
    getValue: (p: Patient) => string;
    minWidth?: number;
}

interface ColumnGroup {
    group: string;
    columns: ColumnDef[];
}

const boolLabel = (v: boolean) => (v ? 'Có' : '');
const numLabel = (v: number | null) => (v !== null && v !== undefined ? String(v) : '');
const hoiChungLabel = (hc: { co: boolean; ben: string }) =>
    hc.co ? `Có${hc.ben ? ` (${hc.ben})` : ''}` : '';

const COLUMN_GROUPS: ColumnGroup[] = [
    {
        group: 'Hành chính',
        columns: [
            { key: 'maBNNC', label: 'Mã BNNC', getValue: (p) => p.maBenhNhanNghienCuu || '—' },
            { key: 'maBaNT', label: 'Mã BA', getValue: (p) => p.maBenhAnNoiTru },
            { key: 'hoTen', label: 'Họ tên', getValue: (p) => p.hanhChinh.hoTen || '—', minWidth: 160 },
            { key: 'tuoi', label: 'Tuổi', getValue: (p) => numLabel(p.hanhChinh.tuoi) },
            { key: 'gioiTinh', label: 'Giới', getValue: (p) => p.hanhChinh.gioiTinh === 'nam' ? 'Nam' : p.hanhChinh.gioiTinh === 'nu' ? 'Nữ' : '' },
            { key: 'ngheNghiep', label: 'Nghề nghiệp', getValue: (p) => p.hanhChinh.ngheNghiep },
            { key: 'diaChiXaPhuong', label: 'Xã/Phường', getValue: (p) => p.hanhChinh.diaChiXaPhuong },
            { key: 'diaChiTinhThanh', label: 'Tỉnh/TP', getValue: (p) => p.hanhChinh.diaChiTinhThanh },
            { key: 'noiO', label: 'Nơi ở', getValue: (p) => p.hanhChinh.noiO === 'nong_thon' ? 'Nông thôn' : p.hanhChinh.noiO === 'thanh_thi' ? 'Thành thị' : p.hanhChinh.noiO === 'hai_dao' ? 'Hải đảo' : '' },
            { key: 'ngayVaoVien', label: 'Ngày VV', getValue: (p) => p.hanhChinh.ngayVaoVien },
            { key: 'ngayRaVien', label: 'Ngày RV', getValue: (p) => p.hanhChinh.ngayRaVien },
        ],
    },
    {
        group: 'Tiền sử',
        columns: [
            { key: 'daiThaoDuong', label: 'ĐTĐ', getValue: (p) => boolLabel(p.tienSu.daiThaoDuong) },
            { key: 'tangHuyetAp', label: 'THA', getValue: (p) => boolLabel(p.tienSu.tangHuyetAp) },
            { key: 'benhThanMan', label: 'Thận mạn', getValue: (p) => boolLabel(p.tienSu.benhThanMan) },
            { key: 'ungThuTS', label: 'Ung thư', getValue: (p) => boolLabel(p.tienSu.ungThu) },
            { key: 'suyTimTS', label: 'Suy tim', getValue: (p) => boolLabel(p.tienSu.suyTimUHuyet) },
            { key: 'benhMMN', label: 'B. mạch máu não', getValue: (p) => boolLabel(p.tienSu.benhMachMauNao) },
            { key: 'hutThuocLa', label: 'Hút thuốc', getValue: (p) => p.tienSu.hutThuocLa ? `Có (${numLabel(p.tienSu.soBaoNam)} bao-năm)` : '' },
        ],
    },
    {
        group: 'Lâm sàng',
        columns: [
            { key: 'mach', label: 'Mạch', getValue: (p) => numLabel(p.lamSang.mach) },
            { key: 'huyetAp', label: 'HA', getValue: (p) => p.lamSang.huyetAp },
            { key: 'nhietDo', label: 'Nhiệt độ', getValue: (p) => numLabel(p.lamSang.nhietDo) },
            { key: 'nhipTho', label: 'Nhịp thở', getValue: (p) => numLabel(p.lamSang.nhipTho) },
            { key: 'spO2', label: 'SpO2', getValue: (p) => numLabel(p.lamSang.spO2) },
            { key: 'glasgow', label: 'Glasgow', getValue: (p) => numLabel(p.lamSang.diemGlasgow) },
            { key: 'hoKhan', label: 'Ho khan', getValue: (p) => boolLabel(p.lamSang.hoKhan) },
            { key: 'khoTho', label: 'Khó thở', getValue: (p) => boolLabel(p.lamSang.khoTho) },
            { key: 'hcTDMP', label: 'HC TDMP', getValue: (p) => hoiChungLabel(p.lamSang.hoiChungTDMP) },
            { key: 'hcDongDac', label: 'HC Đông đặc', getValue: (p) => hoiChungLabel(p.lamSang.hoiChungDongDac) },
            { key: 'hcTKMP', label: 'HC TKMP', getValue: (p) => hoiChungLabel(p.lamSang.hoiChungTKMP) },
        ],
    },
    {
        group: 'Xét nghiệm',
        columns: [
            { key: 'wbc', label: 'WBC', getValue: (p) => numLabel(p.xetNghiem.wbc) },
            { key: 'neutrophil', label: 'Neutro%', getValue: (p) => numLabel(p.xetNghiem.neutrophil) },
            { key: 'lymphocyte', label: 'Lympho%', getValue: (p) => numLabel(p.xetNghiem.lymphocyte) },
            { key: 'hemoglobin', label: 'Hb', getValue: (p) => numLabel(p.xetNghiem.hemoglobin) },
            { key: 'plt', label: 'PLT', getValue: (p) => numLabel(p.xetNghiem.plt) },
            { key: 'crp', label: 'CRP', getValue: (p) => numLabel(p.xetNghiem.crp) },
            { key: 'procalcitonin', label: 'PCT', getValue: (p) => numLabel(p.xetNghiem.procalcitonin) },
            { key: 'ure', label: 'Ure', getValue: (p) => numLabel(p.xetNghiem.ure) },
            { key: 'creatinin', label: 'Creatinin', getValue: (p) => numLabel(p.xetNghiem.creatinin) },
            { key: 'albumin', label: 'Albumin', getValue: (p) => numLabel(p.xetNghiem.albumin) },
            { key: 'na', label: 'Na', getValue: (p) => numLabel(p.xetNghiem.na) },
            { key: 'k', label: 'K', getValue: (p) => numLabel(p.xetNghiem.k) },
            { key: 'nlr', label: 'NLR', getValue: (p) => numLabel(p.chiSoTinhToan.nlr) },
            { key: 'plr', label: 'PLR', getValue: (p) => numLabel(p.chiSoTinhToan.plr) },
            { key: 'car', label: 'CAR', getValue: (p) => numLabel(p.chiSoTinhToan.car) },
        ],
    },
    {
        group: 'Marker NC',
        columns: [
            { key: 'sTREM1', label: 'sTREM-1', getValue: (p) => numLabel(p.xetNghiem.sTREM1) },
            { key: 'tIMP1', label: 'TIMP-1', getValue: (p) => numLabel(p.xetNghiem.tIMP1) },
            { key: 'il6', label: 'IL-6', getValue: (p) => numLabel(p.xetNghiem.il6) },
            { key: 'il10', label: 'IL-10', getValue: (p) => numLabel(p.xetNghiem.il10) },
            { key: 'il17', label: 'IL-17', getValue: (p) => numLabel(p.xetNghiem.il17) },
        ],
    },
    {
        group: 'CĐHA',
        columns: [
            {
                key: 'xquang', label: 'Xquang', minWidth: 220,
                getValue: (p) => {
                    const items = (p.hinhAnh.xquangTonThuong || []).map((t) => {
                        const tt = [t.hinhThai, t.dien].filter(Boolean).map(s => s.toLowerCase()).join(' ');
                        const vt = [t.viTri, t.ben].filter(Boolean).map(s => s.toLowerCase()).join(' ');
                        return `TT ${tt} ở ${vt || '—'}`;
                    });
                    const extras: string[] = [];
                    if (p.hinhAnh.xquangTranDichMangPhoi) extras.push('TDMP');
                    if (p.hinhAnh.xquangTranKhiMangPhoi) extras.push('TKMP');
                    return [...items, ...extras].join('; ') || '';
                },
            },
            {
                key: 'ctScanner', label: 'CT Scanner', minWidth: 220,
                getValue: (p) => {
                    const items = (p.hinhAnh.ctTonThuong || []).map((t) => {
                        const tt = [t.hinhThai, t.dien].filter(Boolean).map(s => s.toLowerCase()).join(' ');
                        const vt = [t.thuy, t.ben].filter(Boolean).map(s => s.toLowerCase()).join(' ');
                        return `TT ${tt} ở ${vt || '—'}`;
                    });
                    const extras: string[] = [];
                    if (p.hinhAnh.ctTranDichMangPhoi) extras.push('TDMP');
                    if (p.hinhAnh.ctTranKhiMangPhoi) extras.push('TKMP');
                    return [...items, ...extras].join('; ') || '';
                },
            },
        ],
    },
    {
        group: 'PSI & Kết cục',
        columns: [
            { key: 'psiDiem', label: 'PSI', getValue: (p) => p.psi.tongDiem > 0 ? String(p.psi.tongDiem) : '' },
            { key: 'psiPhanTang', label: 'PSI Class', getValue: (p) => p.psi.phanTang || '' },
            { key: 'ketCuc', label: 'Kết cục', getValue: (p) => p.ketCuc.tuVong ? 'Tử vong' : p.ketCuc.tienTrienTotXuatVien ? 'Xuất viện' : p.ketCuc.xinVe ? 'Xin về' : p.ketCuc.tinhTrangRaVien || '' },
            { key: 'dienBienDT', label: 'Diễn biến ĐT', getValue: (p) => p.ketCuc.dienBienDieuTri?.join(', ') || '' },
            { key: 'tongNgayDT', label: 'Ngày ĐT', getValue: (p) => numLabel(p.ketCuc.tongSoNgayDieuTri) },
        ],
    },
    {
        group: 'Checklist',
        columns: [
            {
                key: 'chk_hanhChinh', label: 'Hành chính',
                getValue: (p) => {
                    const hc = p.hanhChinh;
                    return (p.maBenhNhanNghienCuu && p.maBenhAnNoiTru && hc.hoTen && hc.tuoi !== null && hc.gioiTinh && hc.ngayVaoVien) ? '✅' : '⚠️';
                },
            },
            {
                key: 'chk_tienSu', label: 'Tiền sử',
                getValue: (p) => {
                    const ts = p.tienSu;
                    return (ts.daiThaoDuong || ts.tangHuyetAp || ts.viemDaDay || ts.viemGanMan || ts.benhThanMan || ts.gut || ts.ungThu || ts.suyTimUHuyet || ts.benhMachMauNao || ts.hutThuocLa || ts.khac) ? '✅' : '⚠️';
                },
            },
            {
                key: 'chk_lamSang', label: 'Lâm sàng',
                getValue: (p) => {
                    const ls = p.lamSang;
                    return (ls.mach !== null && ls.huyetAp && ls.nhietDo !== null && ls.nhipTho !== null && ls.spO2 !== null) ? '✅' : '⚠️';
                },
            },
            {
                key: 'chk_xetNghiem', label: 'Xét nghiệm',
                getValue: (p) => {
                    const xn = p.xetNghiem;
                    return (xn.wbc !== null && xn.neutrophil !== null && xn.lymphocyte !== null && xn.hemoglobin !== null && xn.plt !== null && xn.crp !== null) ? '✅' : '⚠️';
                },
            },
            {
                key: 'chk_cdha', label: 'CĐHA',
                getValue: (p) => {
                    return (p.hinhAnh.xquangTonThuong?.length > 0 || p.hinhAnh.ctTonThuong?.length > 0) ? '✅' : '⚠️';
                },
            },
            {
                key: 'chk_viKhuan', label: 'Vi khuẩn',
                getValue: (p) => (p.viKhuan?.length > 0) ? '✅' : '⚠️',
            },
            {
                key: 'chk_ksDo', label: 'KS đồ',
                getValue: (p) => {
                    if (!p.viKhuan?.length) return '—';
                    const hasKS = p.viKhuan.some((vk) =>
                        vk.khangSinhDo?.some((ks) => ks.mucDo === 'S' || ks.mucDo === 'I' || ks.mucDo === 'R')
                    );
                    return hasKS ? '✅' : '⚠️';
                },
            },
            {
                key: 'chk_ketCuc', label: 'Kết cục',
                getValue: (p) => {
                    const kc = p.ketCuc;
                    return (kc.tinhTrangRaVien || kc.tuVong || kc.xinVe || kc.tienTrienTotXuatVien) ? '✅' : '⚠️';
                },
            },
        ],
    },
];

const ALL_COLUMNS = COLUMN_GROUPS.flatMap((g) => g.columns);
const DEFAULT_VISIBLE = new Set(['maBNNC', 'hoTen', 'tuoi', 'gioiTinh', 'psiDiem', 'ketCuc']);
const LS_KEY = 'cap_dashboard_columns';

function loadVisibleColumns(): Set<string> {
    try {
        const stored = localStorage.getItem(LS_KEY);
        if (stored) {
            const arr = JSON.parse(stored);
            if (Array.isArray(arr) && arr.length > 0) return new Set(arr);
        }
    } catch { /* ignore */ }
    return new Set(DEFAULT_VISIBLE);
}

function saveVisibleColumns(cols: Set<string>) {
    const arr = [...cols];
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
    settingsService.saveColumnConfig(arr).catch(() => { /* silent */ });
}

// ─── Formatting helpers ──
const formatMABNNC = (code: string) => {
    if (!code) return '—';
    if (/^CAP/i.test(code)) return code;
    const num = parseInt(code, 10);
    if (!isNaN(num)) return `CAP${String(num).padStart(3, '0')}`;
    return code;
};

const psiColor = (score: number) =>
    score <= 70 ? 'bg-green-50 text-green-700' :
        score <= 90 ? 'bg-yellow-50 text-yellow-700' :
            'bg-red-50 text-red-700';

const ketCucBadge = (p: Patient) => {
    if (p.ketCuc.tuVong) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">Tử vong</span>;
    if (p.ketCuc.tienTrienTotXuatVien) return <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Xuất viện</span>;
    if (p.ketCuc.xinVe) return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium">Xin về</span>;
    if (p.ketCuc.tinhTrangRaVien) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">{p.ketCuc.tinhTrangRaVien}</span>;
    return '—';
};

// ─── Column config popover ─────────────────────────────────
function ColumnConfigPopover({
    visible,
    setVisible,
}: {
    visible: Set<string>;
    setVisible: (s: Set<string>) => void;
}) {
    const [open, setOpen] = useState(false);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const toggleCol = (key: string) => {
        const next = new Set(visible);
        if (next.has(key)) next.delete(key); else next.add(key);
        setVisible(next);
        saveVisibleColumns(next);
    };

    const toggleGroup = (group: ColumnGroup) => {
        const groupKeys = group.columns.map((c) => c.key);
        const allChecked = groupKeys.every((k) => visible.has(k));
        const next = new Set(visible);
        if (allChecked) {
            groupKeys.forEach((k) => next.delete(k));
        } else {
            groupKeys.forEach((k) => next.add(k));
        }
        setVisible(next);
        saveVisibleColumns(next);
    };

    const toggleCollapse = (group: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(group)) next.delete(group); else next.add(group);
            return next;
        });
    };

    const selectAll = () => {
        const all = new Set(ALL_COLUMNS.map((c) => c.key));
        setVisible(all);
        saveVisibleColumns(all);
    };

    const resetDefault = () => {
        saveVisibleColumns(visible);
        toast.success('Đã lưu cấu hình mặc định');
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition-colors ${open
                    ? 'text-primary-700 bg-primary-50 border-primary-300'
                    : 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                title="Cấu hình cột hiển thị"
            >
                <Settings2 className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-72 max-h-[70vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
                        <span className="text-sm font-semibold text-gray-900">Cấu hình cột</span>
                        <div className="flex gap-2">
                            <button onClick={selectAll} className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                                Chọn hết
                            </button>
                            <span className="text-gray-300">|</span>
                            <button onClick={resetDefault} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                                Mặc định
                            </button>
                        </div>
                    </div>

                    {/* Groups */}
                    <div className="py-1">
                        {COLUMN_GROUPS.map((group) => {
                            const groupKeys = group.columns.map((c) => c.key);
                            const checkedCount = groupKeys.filter((k) => visible.has(k)).length;
                            const allChecked = checkedCount === groupKeys.length;
                            const someChecked = checkedCount > 0 && !allChecked;
                            const isCollapsed = collapsed.has(group.group);

                            return (
                                <div key={group.group} className="border-b border-gray-50 last:border-0">
                                    {/* Group header */}
                                    <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                                        <button
                                            onClick={() => toggleCollapse(group.group)}
                                            className="p-0.5 text-gray-400"
                                        >
                                            {isCollapsed
                                                ? <ChevronRight className="w-3.5 h-3.5" />
                                                : <ChevronDown className="w-3.5 h-3.5" />
                                            }
                                        </button>
                                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={allChecked}
                                                ref={(el) => { if (el) el.indeterminate = someChecked; }}
                                                onChange={() => toggleGroup(group)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm font-semibold text-gray-800">{group.group}</span>
                                            <span className="text-xs text-gray-400 ml-auto">{checkedCount}/{groupKeys.length}</span>
                                        </label>
                                    </div>

                                    {/* Individual columns */}
                                    {!isCollapsed && (
                                        <div className="pl-11 pr-4 pb-1.5 space-y-0.5">
                                            {group.columns.map((col) => (
                                                <label key={col.key} className="flex items-center gap-2 py-1 cursor-pointer hover:text-primary-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={visible.has(col.key)}
                                                        onChange={() => toggleCol(col.key)}
                                                        className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <span className="text-sm text-gray-600">{col.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
export default function DashboardPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [backingUp, setBackingUp] = useState(false);
    const [visibleCols, setVisibleCols] = useState<Set<string>>(loadVisibleColumns);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const navigate = useNavigate();
    const showConfirm = useEditGuardConfirm();
    const { printPatients } = usePrintRecord();

    useEffect(() => {
        const unsub = patientService.subscribeAll((data) => {
            setPatients(data);
            setLoading(false);
        });
        return unsub;
    }, []);

    // Sync column config from Firestore (overrides localStorage cache)
    useEffect(() => {
        settingsService.getColumnConfig().then((cols) => {
            if (cols && cols.length > 0) {
                const s = new Set(cols);
                setVisibleCols(s);
                localStorage.setItem(LS_KEY, JSON.stringify(cols));
            }
        }).catch(() => { /* silent */ });
    }, []);

    // ─── Advanced filters ───
    const [filterOpen, setFilterOpen] = useState(false);
    type Filters = {
        hasXN: boolean | null;
        hasCDHA: boolean | null;
        hasVK: boolean | null;
        hasKSD: boolean | null;
        hasMarker: boolean | null;
        hasKetCuc: boolean | null;
        hasPSI: boolean | null;
        gioiTinh: '' | 'nam' | 'nu';
        noiO: Set<string>;
        psiClass: Set<string>;
        ketCucType: Set<string>;
        dienBien: Set<string>;
    };
    const EMPTY_FILTERS: Filters = {
        hasXN: null, hasCDHA: null, hasVK: null, hasKSD: null,
        hasMarker: null, hasKetCuc: null, hasPSI: null,
        gioiTinh: '', noiO: new Set(), psiClass: new Set(), ketCucType: new Set(), dienBien: new Set(),
    };
    const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, noiO: new Set(), psiClass: new Set(), ketCucType: new Set(), dienBien: new Set() });
    const activeFilterCount = [
        filters.hasXN, filters.hasCDHA, filters.hasVK, filters.hasKSD,
        filters.hasMarker, filters.hasKetCuc, filters.hasPSI,
    ].filter(v => v !== null).length
        + (filters.gioiTinh ? 1 : 0)
        + (filters.noiO.size > 0 ? 1 : 0)
        + (filters.psiClass.size > 0 ? 1 : 0)
        + (filters.ketCucType.size > 0 ? 1 : 0)
        + (filters.dienBien.size > 0 ? 1 : 0);
    const clearFilters = () => setFilters({ ...EMPTY_FILTERS, noiO: new Set(), psiClass: new Set(), ketCucType: new Set(), dienBien: new Set() });

    const toggleTriState = (key: keyof Filters) => {
        setFilters(prev => {
            const cur = prev[key] as boolean | null;
            const next = cur === null ? true : cur === true ? false : null;
            return { ...prev, [key]: next };
        });
    };

    const filtered = patients.filter((p) => {
        // Text search
        const q = search.toLowerCase();
        if (q && !(
            p.maBenhNhanNghienCuu.toLowerCase().includes(q) ||
            p.hanhChinh.hoTen.toLowerCase().includes(q) ||
            p.maBenhAnNoiTru.toLowerCase().includes(q)
        )) return false;

        // Advanced filters
        const xn = p.xetNghiem;
        const hasXNData = xn.wbc !== null && xn.neutrophil !== null && xn.lymphocyte !== null && xn.hemoglobin !== null && xn.plt !== null && xn.crp !== null;
        if (filters.hasXN === true && !hasXNData) return false;
        if (filters.hasXN === false && hasXNData) return false;

        const hasCDHAData = (p.hinhAnh.xquangTonThuong?.length > 0) || (p.hinhAnh.ctTonThuong?.length > 0);
        if (filters.hasCDHA === true && !hasCDHAData) return false;
        if (filters.hasCDHA === false && hasCDHAData) return false;

        const hasVKData = p.viKhuan?.length > 0;
        if (filters.hasVK === true && !hasVKData) return false;
        if (filters.hasVK === false && hasVKData) return false;

        const hasKSDData = p.viKhuan?.some(vk => vk.khangSinhDo?.some(ks => ks.mucDo === 'S' || ks.mucDo === 'I' || ks.mucDo === 'R'));
        if (filters.hasKSD === true && !hasKSDData) return false;
        if (filters.hasKSD === false && hasKSDData) return false;

        const hasMarkerData = xn.sTREM1 !== null || xn.tIMP1 !== null || xn.il6 !== null || xn.il10 !== null || xn.il17 !== null;
        if (filters.hasMarker === true && !hasMarkerData) return false;
        if (filters.hasMarker === false && hasMarkerData) return false;

        const hasKetCucData = !!(p.ketCuc?.tinhTrangRaVien || p.ketCuc?.tuVong || p.ketCuc?.xinVe || p.ketCuc?.tienTrienTotXuatVien);
        if (filters.hasKetCuc === true && !hasKetCucData) return false;
        if (filters.hasKetCuc === false && hasKetCucData) return false;

        const hasPSIData = p.psi.tongDiem > 0;
        if (filters.hasPSI === true && !hasPSIData) return false;
        if (filters.hasPSI === false && hasPSIData) return false;

        if (filters.gioiTinh && p.hanhChinh.gioiTinh !== filters.gioiTinh) return false;

        if (filters.noiO.size > 0 && !filters.noiO.has(p.hanhChinh.noiO)) return false;

        if (filters.psiClass.size > 0) {
            const pt = p.psi.phanTang || '';
            const matched = [...filters.psiClass].some(cls => pt.startsWith(cls + ' ') || pt === cls);
            if (!matched) return false;
        }

        if (filters.ketCucType.size > 0) {
            const matched = (filters.ketCucType.has('tu_vong') && p.ketCuc?.tuVong)
                || (filters.ketCucType.has('xin_ve') && p.ketCuc?.xinVe)
                || (filters.ketCucType.has('xuat_vien') && p.ketCuc?.tienTrienTotXuatVien);
            if (!matched) return false;
        }

        if (filters.dienBien.size > 0) {
            const db = p.ketCuc?.dienBienDieuTri || [];
            const matched = [...filters.dienBien].every(v => db.includes(v));
            if (!matched) return false;
        }

        return true;
    });

    // Count helpers — computed from ALL patients for accurate counts
    const filterCounts: Record<string, { yes: number; no: number }> = useMemo(() => {
        const xnTest = (p: Patient) => {
            const xn = p.xetNghiem;
            return xn.wbc !== null && xn.neutrophil !== null && xn.lymphocyte !== null && xn.hemoglobin !== null && xn.plt !== null && xn.crp !== null;
        };
        const cdhaTest = (p: Patient) => (p.hinhAnh.xquangTonThuong?.length > 0) || (p.hinhAnh.ctTonThuong?.length > 0);
        const vkTest = (p: Patient) => p.viKhuan?.length > 0;
        const ksdTest = (p: Patient) => !!p.viKhuan?.some(vk => vk.khangSinhDo?.some(ks => ks.mucDo === 'S' || ks.mucDo === 'I' || ks.mucDo === 'R'));
        const markerTest = (p: Patient) => {
            const xn = p.xetNghiem;
            return xn.sTREM1 !== null || xn.tIMP1 !== null || xn.il6 !== null || xn.il10 !== null || xn.il17 !== null;
        };
        const psiTest = (p: Patient) => p.psi.tongDiem > 0;
        const kcTest = (p: Patient) => !!(p.ketCuc?.tinhTrangRaVien || p.ketCuc?.tuVong || p.ketCuc?.xinVe || p.ketCuc?.tienTrienTotXuatVien);

        const make = (test: (p: Patient) => boolean) => {
            const yes = patients.filter(test).length;
            return { yes, no: patients.length - yes };
        };
        return {
            hasXN: make(xnTest), hasCDHA: make(cdhaTest), hasVK: make(vkTest),
            hasKSD: make(ksdTest), hasMarker: make(markerTest), hasPSI: make(psiTest),
            hasKetCuc: make(kcTest),
        };
    }, [patients]);

    const getFilterLabel = (key: string, label: string) => {
        const state = filters[key as keyof Filters];
        const counts = filterCounts[key];
        if (!counts || state === null) return label;
        const n = state === true ? counts.yes : counts.no;
        return `${label} (${n})`;
    };

    // Reset to page 1 on search/filter change
    useEffect(() => { setCurrentPage(1); }, [search, filters]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    const activeColumns = useMemo(
        () => ALL_COLUMNS.filter((c) => visibleCols.has(c.key)),
        [visibleCols],
    );

    // ─── Handlers ───
    const handleDelete = async (id: string, name: string) => {
        const ok = await showConfirm(
            `Bạn có chắc muốn xóa bệnh nhân "${name}"?\nThao tác này không thể hoàn tác.`,
            'Xóa',
            'Hủy',
            { title: 'Xóa bệnh nhân', destructive: true },
        );
        if (!ok) return;
        try {
            await patientService.delete(id);
            toast.success('Đã xóa bệnh nhân');
        } catch {
            toast.error('Lỗi khi xóa');
        }
    };

    const handleExport = () => {
        if (patients.length === 0) { toast.error('Không có dữ liệu để xuất'); return; }
        exportPatientsToExcel(patients);
        toast.success('Đã xuất file Excel');
    };

    const handleBackup = async () => {
        if (patients.length === 0) { toast.error('Không có dữ liệu để backup'); return; }
        setBackingUp(true);
        try {
            await backupService.createBackup(patients);
            toast.success(`Đã backup ${patients.length} bệnh nhân`);
        } catch (err) {
            console.error('[Backup] Error:', err);
            toast.error('Lỗi khi tạo backup');
        } finally {
            setBackingUp(false);
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };
    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(paged.map((p) => p.id)));
    };

    const allSelected = paged.length > 0 && paged.every((p) => selectedIds.has(p.id));

    const handlePrintSingle = (patient: Patient) => printPatients([patient]);
    const handlePrintBatch = () => {
        const selection = filtered.filter((p) => selectedIds.has(p.id));
        printPatients(selection);
    };

    // ─── Cell renderer (special formatting for PSI and kết cục) ───
    const renderCell = (col: ColumnDef, p: Patient) => {
        if (col.key === 'maBNNC') return <span className="font-medium text-primary-700">{formatMABNNC(p.maBenhNhanNghienCuu)}</span>;
        if (col.key === 'hoTen') return <span className="text-gray-900">{p.hanhChinh.hoTen || '—'}</span>;
        if (col.key === 'psiDiem' && p.psi.tongDiem > 0) {
            return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${psiColor(p.psi.tongDiem)}`}>{p.psi.tongDiem} điểm</span>;
        }
        if (col.key === 'ketCuc') return ketCucBadge(p);

        // Checklist columns — render icon
        if (col.key.startsWith('chk_')) {
            const val = col.getValue(p);
            if (val === '—') return <span className="text-gray-300 mx-auto block w-5 text-center">—</span>;
            return val === '✅'
                ? <CircleCheck className="w-5 h-5 text-green-500 mx-auto" />
                : <CircleAlert className="w-5 h-5 text-amber-400 mx-auto" />;
        }

        const val = col.getValue(p);
        return <span className="text-gray-600">{val || '—'}</span>;
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-gray-900">Danh sách bệnh nhân</h1>
                    <p className="text-sm text-gray-500 mt-1">Tổng cộng {patients.length} bệnh nhân nghiên cứu</p>
                </div>
                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handlePrintBatch}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                                text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100
                                transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">In {selectedIds.size} BN</span>
                        </button>
                    )}
                    <button
                        onClick={handleBackup}
                        disabled={backingUp}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
              text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {backingUp
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <HardDrive className="w-4 h-4" />
                        }
                        <span className="hidden sm:inline">{backingUp ? 'Đang backup...' : 'Backup'}</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
              text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50
              transition-colors"
                    >
                        <FileDown className="w-4 h-4" />
                        <span className="hidden sm:inline">Xuất Excel</span>
                    </button>
                    <Link
                        to="/patient/new"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
              text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors
              shadow-sm shadow-primary-200"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm BN
                    </Link>
                </div>
            </div>

            {/* Search + Column config + Filter */}
            <div className="flex gap-2 mb-2">
                <ColumnConfigPopover visible={visibleCols} setVisible={setVisibleCols} />
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm theo mã BNNC, họ tên, mã BA..."
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                            title="Xóa tìm kiếm"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition-colors ${filterOpen || activeFilterCount > 0
                        ? 'text-primary-700 bg-primary-50 border-primary-300'
                        : 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                    title="Lọc nâng cao"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">Lọc nâng cao</span>
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-primary-600 rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Advanced filter panel */}
            {filterOpen && (
                <div className="mb-4 p-4 rounded-xl border border-yellow-200 bg-yellow-50 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900">Lọc nâng cao</span>
                        <div className="flex items-center gap-2">
                            {activeFilterCount > 0 && (
                                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                                    <X className="w-3 h-3" /> Xóa lọc
                                </button>
                            )}
                            <button onClick={() => setFilterOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                        {/* 1. Hành chính */}
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hành chính</span>
                            <div className="mt-1.5 space-y-2">
                                <div>
                                    <span className="text-[11px] text-gray-400">Giới tính</span>
                                    <div className="mt-1 flex gap-1">
                                        {['Nam', 'Nữ'].map(v => {
                                            const val = v === 'Nam' ? 'nam' : 'nu';
                                            return (
                                                <button
                                                    key={val}
                                                    onClick={() => setFilters(prev => ({ ...prev, gioiTinh: prev.gioiTinh === val ? '' : val as '' | 'nam' | 'nu' }))}
                                                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${filters.gioiTinh === val
                                                        ? 'bg-primary-100 border-primary-400 text-primary-700'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {v}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[11px] text-gray-400">Nơi ở</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {(() => {
                                            try {
                                                const raw = localStorage.getItem('cap_noi_o');
                                                if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) return p as string[]; }
                                            } catch { /* ignore */ }
                                            return DEFAULT_NOI_O;
                                        })().map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setFilters(prev => {
                                                    const next = new Set(prev.noiO);
                                                    if (next.has(v)) next.delete(v); else next.add(v);
                                                    return { ...prev, noiO: next };
                                                })}
                                                className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${filters.noiO.has(v)
                                                    ? 'bg-primary-100 border-primary-400 text-primary-700'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Cận lâm sàng */}
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cận lâm sàng</span>
                            <div className="mt-1.5 space-y-1">
                                {[
                                    { key: 'hasXN' as const, label: 'Xét nghiệm' },
                                    { key: 'hasCDHA' as const, label: 'CĐHA (Xquang/CT)' },
                                    { key: 'hasVK' as const, label: 'Vi khuẩn' },
                                    { key: 'hasKSD' as const, label: 'Kháng sinh đồ' },
                                ].map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => toggleTriState(f.key)}
                                        className="flex items-center gap-2 w-full px-2 py-1 rounded-lg hover:bg-gray-50 text-sm text-left transition-colors"
                                    >
                                        <span className={`w-5 h-5 flex items-center justify-center rounded border text-xs font-bold ${filters[f.key] === true ? 'bg-green-100 border-green-400 text-green-700'
                                            : filters[f.key] === false ? 'bg-red-100 border-red-400 text-red-600'
                                                : 'bg-white border-gray-300 text-gray-400'
                                            }`}>
                                            {filters[f.key] === true ? '✓' : filters[f.key] === false ? '✗' : '—'}
                                        </span>
                                        <span className="text-gray-700">{getFilterLabel(f.key, f.label)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Marker & PSI */}
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Marker & PSI</span>
                            <div className="mt-1.5 space-y-1">
                                {[
                                    { key: 'hasMarker' as const, label: 'Marker NC (sTREM/TIMP/IL)' },
                                    { key: 'hasPSI' as const, label: 'PSI đã tính' },
                                ].map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => toggleTriState(f.key)}
                                        className="flex items-center gap-2 w-full px-2 py-1 rounded-lg hover:bg-gray-50 text-sm text-left transition-colors"
                                    >
                                        <span className={`w-5 h-5 flex items-center justify-center rounded border text-xs font-bold ${filters[f.key] === true ? 'bg-green-100 border-green-400 text-green-700'
                                            : filters[f.key] === false ? 'bg-red-100 border-red-400 text-red-600'
                                                : 'bg-white border-gray-300 text-gray-400'
                                            }`}>
                                            {filters[f.key] === true ? '✓' : filters[f.key] === false ? '✗' : '—'}
                                        </span>
                                        <span className="text-gray-700">{getFilterLabel(f.key, f.label)}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2">
                                <span className="text-[11px] text-gray-400">PSI Class</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {['I', 'II', 'III', 'IV', 'V'].map(cls => (
                                        <button
                                            key={cls}
                                            onClick={() => setFilters(prev => {
                                                const next = new Set(prev.psiClass);
                                                if (next.has(cls)) next.delete(cls); else next.add(cls);
                                                return { ...prev, psiClass: next };
                                            })}
                                            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${filters.psiClass.has(cls)
                                                ? 'bg-primary-100 border-primary-400 text-primary-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {cls}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 4. Kết cục */}
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kết cục</span>
                            <div className="mt-1.5 space-y-1">
                                {[
                                    { key: 'hasKetCuc' as const, label: 'Kết cục đã ghi' },
                                ].map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => toggleTriState(f.key)}
                                        className="flex items-center gap-2 w-full px-2 py-1 rounded-lg hover:bg-gray-50 text-sm text-left transition-colors"
                                    >
                                        <span className={`w-5 h-5 flex items-center justify-center rounded border text-xs font-bold ${filters[f.key] === true ? 'bg-green-100 border-green-400 text-green-700'
                                            : filters[f.key] === false ? 'bg-red-100 border-red-400 text-red-600'
                                                : 'bg-white border-gray-300 text-gray-400'
                                            }`}>
                                            {filters[f.key] === true ? '✓' : filters[f.key] === false ? '✗' : '—'}
                                        </span>
                                        <span className="text-gray-700">{getFilterLabel(f.key, f.label)}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2">
                                <span className="text-[11px] text-gray-400">Tình trạng ra viện</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {[{ v: 'xuat_vien', l: 'Xuất viện' }, { v: 'tu_vong', l: 'Tử vong' }, { v: 'xin_ve', l: 'Xin về' }].map(o => (
                                        <button
                                            key={o.v}
                                            onClick={() => setFilters(prev => {
                                                const next = new Set(prev.ketCucType);
                                                if (next.has(o.v)) next.delete(o.v); else next.add(o.v);
                                                return { ...prev, ketCucType: next };
                                            })}
                                            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${filters.ketCucType.has(o.v)
                                                ? 'bg-primary-100 border-primary-400 text-primary-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {o.l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-2">
                                <span className="text-[11px] text-gray-400">Diễn biến</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {['Thở máy', 'Sốc nhiễm khuẩn', 'Lọc máu'].map(db => (
                                        <button
                                            key={db}
                                            onClick={() => setFilters(prev => {
                                                const next = new Set(prev.dienBien);
                                                if (next.has(db)) next.delete(db); else next.add(db);
                                                return { ...prev, dienBien: next };
                                            })}
                                            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${filters.dienBien.has(db)
                                                ? 'bg-primary-100 border-primary-400 text-primary-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {db}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {activeFilterCount > 0 && (
                        <p className="text-xs font-bold text-red-500 mt-3">
                            {activeFilterCount} bộ lọc đang áp dụng · Hiển thị {filtered.length}/{patients.length} bệnh nhân
                        </p>
                    )}
                    <p className="text-[11px] text-gray-400 italic mt-1">Bỏ chọn tất cả các tùy chọn để hiển thị tất cả</p>
                </div>
            )
            }

            {/* Table */}
            {
                loading ? (
                    <div className="text-center py-12 text-gray-400">Đang tải...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-sm">Chưa có bệnh nhân nào</p>
                        <Link
                            to="/patient/new"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm text-primary-600
              hover:bg-primary-50 rounded-xl transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm bệnh nhân đầu tiên
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm" style={{ minWidth: activeColumns.length * 100 + 180 }}>
                                    <thead className="bg-primary-600 border-b border-primary-700">
                                        <tr>
                                            <th className="px-3 py-3 text-left w-10 sticky left-0 bg-primary-600 z-10">
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onChange={toggleSelectAll}
                                                    className="w-4 h-4 rounded border-white/60 text-primary-600 focus:ring-white cursor-pointer"
                                                />
                                            </th>
                                            {activeColumns.map((col) => (
                                                <th
                                                    key={col.key}
                                                    className="px-4 py-3 text-left font-medium text-white whitespace-nowrap"
                                                    style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                                                >
                                                    {col.label}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-right font-medium text-white sticky right-0 bg-primary-600 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paged.map((p, idx) => {
                                            const isSelected = selectedIds.has(p.id);
                                            const rowBg = isSelected
                                                ? 'bg-amber-50'
                                                : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60';
                                            const stickyBg = isSelected
                                                ? 'bg-amber-50'
                                                : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                                            return (
                                                <tr key={p.id} className={`hover:bg-gray-100/60 transition-colors ${rowBg}`}>
                                                    <td className={`px-3 py-3 sticky left-0 z-10 ${stickyBg}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSelect(p.id)}
                                                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                                        />
                                                    </td>
                                                    {activeColumns.map((col) => (
                                                        <td key={col.key} className={`px-4 py-3${col.key === 'xquang' || col.key === 'ctScanner' ? '' : ' whitespace-nowrap'}`}
                                                            style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                                                        >
                                                            {renderCell(col, p)}
                                                        </td>
                                                    ))}
                                                    <td className={`px-4 py-3 sticky right-0 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)] ${stickyBg}`}>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => navigate(`/patient/${p.id}`)}
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                                                title="Xem chi tiết"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => navigate(`/patient/${p.id}/edit`)}
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handlePrintSingle(p)}
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                                                                title="In bệnh án"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(p.id, p.hanhChinh.hoTen)}
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                title="Xóa"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {filtered.length > 0 && (
                            <div className="flex items-center justify-between gap-4 mt-4 px-1 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span>Hiển thị</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                        className="pl-2 pr-7 py-1 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        {[10, 20, 50].map((n) => <option key={n} value={n}>{n} dòng</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                                        disabled={safePage <= 1}
                                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span>Trang</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={safePage}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, '');
                                            if (v === '') return;
                                            const n = Math.min(Math.max(1, parseInt(v, 10)), totalPages);
                                            setCurrentPage(n);
                                        }}
                                        onBlur={(e) => {
                                            const n = parseInt(e.target.value, 10);
                                            if (isNaN(n) || n < 1) setCurrentPage(1);
                                            else if (n > totalPages) setCurrentPage(totalPages);
                                        }}
                                        className="w-12 text-center py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                    <span>/ {totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                                        disabled={safePage >= totalPages}
                                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <span className="text-gray-400 tabular-nums">
                                    {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} / {filtered.length} dòng
                                </span>
                            </div>
                        )}
                    </>
                )
            }
        </div >
    );
}
