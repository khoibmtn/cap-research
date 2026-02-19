import { useState, useEffect, useCallback } from 'react';
import { generateAddressTemplate, parseAddressExcel, type AddressEntry } from '../services/exportService';
import { patientService } from '../services/patientService';
import { settingsService } from '../services/settingsService';
import {
    DEFAULT_BACTERIA, DEFAULT_ANTIBIOTICS, NGHE_NGHIEP_OPTIONS,
    DEFAULT_NOI_O, DEFAULT_DIEN_BIEN_DIEU_TRI, DEFAULT_TINH_TRANG_RA_VIEN,
} from '../data/formOptions';
import { Upload, Download, Info, Plus, Trash2, Pencil, Check, X, ShieldAlert, MapPin, Stethoscope, Bug, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Editable List Table ─────────────────────────────────────────────
interface EditableListTableProps {
    title: string;
    description: string;
    storageKey: string;
    items: string[];
    setItems: (items: string[]) => void;
    usedItems: Set<string>;
    placeholder: string;
}

function EditableListTable({ title, description, storageKey, items, setItems, usedItems, placeholder }: EditableListTableProps) {
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [newValue, setNewValue] = useState('');

    const persist = useCallback((list: string[]) => {
        setItems(list);
        localStorage.setItem(storageKey, JSON.stringify(list));
        // Auto-save to Firestore
        settingsService.saveList(storageKey, list).catch(() => { });
    }, [setItems, storageKey]);

    const handleAdd = () => {
        const v = newValue.trim();
        if (!v) return;
        if (items.includes(v)) { toast.error('Tên này đã tồn tại'); return; }
        persist([...items, v]);
        setNewValue('');
        toast.success(`Đã thêm "${v}"`);
    };

    const startEdit = (idx: number) => { setEditIdx(idx); setEditValue(items[idx]); };

    const saveEdit = (idx: number) => {
        const v = editValue.trim();
        if (!v) return;
        if (v !== items[idx] && items.includes(v)) { toast.error('Tên này đã tồn tại'); return; }
        const updated = [...items];
        updated[idx] = v;
        persist(updated);
        setEditIdx(null);
        toast.success('Đã cập nhật');
    };

    const cancelEdit = () => { setEditIdx(null); };

    const handleDelete = (idx: number) => {
        const name = items[idx];
        if (usedItems.has(name)) {
            toast.error(`Không thể xóa "${name}" vì đang được sử dụng trong dữ liệu bệnh nhân`);
            return;
        }
        persist(items.filter((_, i) => i !== idx));
        toast.success(`Đã xóa "${name}"`);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-heading font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 mb-4">{description}</p>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-12">#</th>
                                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Tên</th>
                                <th className="text-center px-4 py-2.5 font-medium text-gray-600 w-10">Đang dùng</th>
                                <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-24">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.length === 0 && (
                                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 italic">Chưa có dữ liệu</td></tr>
                            )}
                            {items.map((item, idx) => {
                                const inUse = usedItems.has(item);
                                const isEditing = editIdx === idx;
                                return (
                                    <tr key={idx} className={`hover:bg-gray-50/50 transition-colors ${inUse ? 'bg-amber-50/40' : ''}`}>
                                        <td className="px-4 py-2 text-gray-400 tabular-nums">{idx + 1}</td>
                                        <td className="px-4 py-2">
                                            {isEditing ? (
                                                <input autoFocus value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(idx); if (e.key === 'Escape') cancelEdit(); }}
                                                    className="w-full px-2 py-1 rounded border border-primary-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                            ) : (
                                                <span className="text-gray-800">{item}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {inUse && (
                                                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                                                    <ShieldAlert className="w-3 h-3" /> Có
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={() => saveEdit(idx)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Lưu">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Hủy">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEdit(idx)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Sửa">
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(idx)} disabled={inUse}
                                                            className={`p-1.5 rounded-lg transition-colors ${inUse ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
                                                            title={inUse ? 'Đang được sử dụng — không thể xóa' : 'Xóa'}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-3 flex gap-2">
                <input value={newValue} onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                <button onClick={handleAdd} disabled={!newValue.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <Plus className="w-4 h-4" /> Thêm
                </button>
            </div>
            <p className="mt-2 text-xs text-gray-400">Tổng: {items.length} mục • {usedItems.size} đang sử dụng</p>
        </div>
    );
}

// ─── Helper: load from localStorage or init from defaults ─────────
function loadListLocal(key: string, defaults: string[]): string[] {
    const raw = localStorage.getItem(key);
    if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(key, JSON.stringify(defaults));
    return [...defaults];
}

// ─── Tab definitions ─────────────────────────────────────────────────
const TABS = [
    { key: 'hanhchinh', label: 'Hành chính', icon: MapPin },
    { key: 'lamsang', label: 'Lâm sàng', icon: Stethoscope },
    { key: 'vikhuan', label: 'Vi khuẩn', icon: Bug },
    { key: 'inbanc', label: 'In BANC', icon: Printer },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ─── Print settings type ─────────────────────────────────────────────
interface PrintSettings {
    paperSize: 'A4' | 'A5' | 'Letter';
    margins: { top: number; left: number; right: number; bottom: number };
    fontSize: number;
    titleLine1: string;
    titleLine2: string;
    signLeft: string;
    signRight: string;
    showPsiLevel: boolean;
}

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
    paperSize: 'A4',
    margins: { top: 2, left: 2.5, right: 2, bottom: 2 },
    fontSize: 13,
    titleLine1: '',
    titleLine2: '',
    signLeft: '',
    signRight: '',
    showPsiLevel: false,
};

// ─── Settings Page ───────────────────────────────────────────────────
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('hanhchinh');

    // Hành chính tab
    const [addresses, setAddresses] = useState<AddressEntry[]>([]);
    const [ngheNghiep, setNgheNghiep] = useState<string[]>([]);
    const [noiO, setNoiO] = useState<string[]>([]);

    // Lâm sàng tab
    const [dienBien, setDienBien] = useState<string[]>([]);
    const [tinhTrang, setTinhTrang] = useState<string[]>([]);

    // Vi khuẩn tab
    const [bacteria, setBacteria] = useState<string[]>([]);
    const [antibiotics, setAntibiotics] = useState<string[]>([]);
    const [usedBacteria, setUsedBacteria] = useState<Set<string>>(new Set());
    const [usedAntibiotics, setUsedAntibiotics] = useState<Set<string>>(new Set());

    // Used items for lâm sàng tab
    const [usedDienBien, setUsedDienBien] = useState<Set<string>>(new Set());
    const [usedTinhTrang, setUsedTinhTrang] = useState<Set<string>>(new Set());

    // Used items for hành chính tab
    const [usedNgheNghiep, setUsedNgheNghiep] = useState<Set<string>>(new Set());
    const [usedNoiO, setUsedNoiO] = useState<Set<string>>(new Set());

    // In BANC tab
    const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);

    // Load all data on mount
    useEffect(() => {
        // Load all lists from Firestore, fall back to localStorage
        const listKeys = [
            { key: 'cap_bacteria', setter: setBacteria, defaults: DEFAULT_BACTERIA },
            { key: 'cap_antibiotics', setter: setAntibiotics, defaults: DEFAULT_ANTIBIOTICS },
            { key: 'cap_nghe_nghiep', setter: setNgheNghiep, defaults: NGHE_NGHIEP_OPTIONS },
            { key: 'cap_noi_o', setter: setNoiO, defaults: DEFAULT_NOI_O },
            { key: 'cap_dien_bien_dieu_tri', setter: setDienBien, defaults: DEFAULT_DIEN_BIEN_DIEU_TRI },
            { key: 'cap_tinh_trang_ra_vien', setter: setTinhTrang, defaults: DEFAULT_TINH_TRANG_RA_VIEN },
        ];

        listKeys.forEach(({ key, setter, defaults }) => {
            settingsService.getList(key).then((items) => {
                if (items && items.length > 0) {
                    setter(items);
                    localStorage.setItem(key, JSON.stringify(items));
                } else {
                    // Fallback to localStorage or defaults
                    const local = loadListLocal(key, defaults);
                    setter(local);
                    // Migrate to Firestore
                    settingsService.saveList(key, local).catch(() => { });
                }
            }).catch(() => {
                // Offline: use localStorage
                setter(loadListLocal(key, defaults));
            });
        });

        // Addresses
        const storedAddr = localStorage.getItem('cap_addresses');
        if (storedAddr) {
            const parsed = JSON.parse(storedAddr);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setAddresses(parsed);
            }
        } else {
            settingsService.getAddresses().then((entries) => {
                if (entries.length > 0) {
                    setAddresses(entries);
                    localStorage.setItem('cap_addresses', JSON.stringify(entries));
                }
            });
        }

        // Print settings: load from Firestore (primary), fall back to localStorage
        settingsService.getPrintSettings().then((data) => {
            if (data) {
                const merged = { ...DEFAULT_PRINT_SETTINGS, ...data } as PrintSettings;
                setPrintSettings(merged);
                localStorage.setItem('cap_print_settings', JSON.stringify(merged));
            } else {
                // Fallback to localStorage
                const storedPrint = localStorage.getItem('cap_print_settings');
                if (storedPrint) {
                    try {
                        const parsed = JSON.parse(storedPrint);
                        setPrintSettings({ ...DEFAULT_PRINT_SETTINGS, ...parsed });
                        // Migrate to Firestore
                        settingsService.savePrintSettings(parsed).catch(() => { });
                    } catch { /* ignore */ }
                }
            }
        }).catch(() => {
            // Offline fallback
            const storedPrint = localStorage.getItem('cap_print_settings');
            if (storedPrint) {
                try { setPrintSettings({ ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(storedPrint) }); } catch { /* ignore */ }
            }
        });
    }, []);

    // Fetch used items from patient data
    useEffect(() => {
        patientService.getAll().then((patients) => {
            const bSet = new Set<string>();
            const aSet = new Set<string>();
            const dbSet = new Set<string>();
            const ttSet = new Set<string>();
            const nnSet = new Set<string>();
            const noSet = new Set<string>();

            if (patients.length > 0) {
                // console.log('[DEBUG] Fetched patients:', patients.length);
            }
            patients.forEach((p) => {
                // Hanh chinh
                if (p.hanhChinh?.ngheNghiep) nnSet.add(p.hanhChinh.ngheNghiep);
                if (p.hanhChinh?.noiO) noSet.add(p.hanhChinh.noiO);

                // Bacteria & antibiotics
                p.viKhuan?.forEach((vk) => {
                    if (vk.tenViKhuan) bSet.add(vk.tenViKhuan);
                    vk.khangSinhDo?.forEach((ks) => {
                        if (ks.tenKhangSinh) aSet.add(ks.tenKhangSinh);
                    });
                });
                // Diễn biến điều trị — check both dynamic array and legacy booleans
                const kc = p.ketCuc;
                if (kc) {
                    if (kc.dienBienDieuTri?.length) {
                        kc.dienBienDieuTri.forEach((d: string) => dbSet.add(d));
                    } else {
                        // Legacy boolean fields
                        if (kc.thoMay) dbSet.add('Thở máy');
                        if (kc.socNhiemKhuan) dbSet.add('Sốc nhiễm khuẩn');
                        if (kc.locMau) dbSet.add('Lọc máu');
                    }
                    if (kc.tinhTrangRaVien) ttSet.add(kc.tinhTrangRaVien);
                }
            });
            setUsedBacteria(bSet);
            setUsedAntibiotics(aSet);
            setUsedDienBien(dbSet);
            setUsedTinhTrang(ttSet);
            setUsedNgheNghiep(nnSet);
            setUsedNoiO(noSet);
        }).catch(() => { });
    }, []);

    const handleAddressUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const entries = await parseAddressExcel(file);
            setAddresses(entries);
            localStorage.setItem('cap_addresses', JSON.stringify(entries));
            await settingsService.saveAddresses(entries);
            toast.success(`Đã import ${entries.length} địa chỉ`);
        } catch {
            toast.error('Lỗi khi đọc file Excel');
        }
    };

    const updatePrint = (patch: Partial<PrintSettings>) => {
        const next = { ...printSettings, ...patch };
        setPrintSettings(next);
        localStorage.setItem('cap_print_settings', JSON.stringify(next));
        // Auto-save to Firestore
        settingsService.savePrintSettings(next as unknown as Record<string, unknown>).catch(() => {
            console.warn('Failed to save print settings to Firestore');
        });
    };

    const updateMargin = (side: keyof PrintSettings['margins'], value: string) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return;
        updatePrint({ margins: { ...printSettings.margins, [side]: num } });
    };

    // ─── EMPTY sets for lists that don't track "used" ─────
    // const emptySet = new Set<string>();

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="font-heading text-2xl font-bold text-gray-900 mb-6">Cài đặt</h1>

            {/* ── Tab bar ── */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === key
                            ? 'border-primary-600 text-primary-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}>
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* ══════════════ TAB 1: Hành chính ══════════════ */}
            {activeTab === 'hanhchinh' && (
                <div className="space-y-6">
                    {/* Address */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="font-heading font-semibold text-gray-900 mb-2">Dữ liệu địa chỉ</h3>
                        <p className="text-sm text-gray-500 mb-4">Import file Excel danh sách xã/phường để dùng cho combobox địa chỉ.</p>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={generateAddressTemplate}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                <Download className="w-4 h-4" /> Tải template
                            </button>
                            <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 cursor-pointer transition-colors">
                                <Upload className="w-4 h-4" /> Import Excel
                                <input type="file" accept=".xlsx,.xls" onChange={handleAddressUpload} className="hidden" />
                            </label>
                        </div>
                        {addresses.length > 0 && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                                <Info className="w-4 h-4 inline mr-1" />
                                Đã có {addresses.length} địa chỉ trong hệ thống.
                            </div>
                        )}
                    </div>

                    {/* Nghề nghiệp */}
                    <EditableListTable
                        title="Danh sách nghề nghiệp"
                        description="Quản lý danh sách nghề nghiệp hiển thị trong form nhập liệu."
                        storageKey="cap_nghe_nghiep"
                        items={ngheNghiep}
                        setItems={setNgheNghiep}
                        usedItems={usedNgheNghiep}
                        placeholder="Nhập nghề nghiệp mới..."
                    />

                    {/* Nơi ở */}
                    <EditableListTable
                        title="Danh sách nơi ở"
                        description="Quản lý danh sách phân loại nơi ở (Nông thôn, Thành thị, ...)."
                        storageKey="cap_noi_o"
                        items={noiO}
                        setItems={setNoiO}
                        usedItems={usedNoiO}
                        placeholder="Nhập loại nơi ở mới..."
                    />
                </div>
            )}

            {/* ══════════════ TAB 2: Lâm sàng ══════════════ */}
            {activeTab === 'lamsang' && (
                <div className="space-y-6">
                    <EditableListTable
                        title="Diễn biến điều trị"
                        description="Danh sách các diễn biến điều trị hiển thị dạng multichoice trong form kết cục."
                        storageKey="cap_dien_bien_dieu_tri"
                        items={dienBien}
                        setItems={setDienBien}
                        usedItems={usedDienBien}
                        placeholder="Nhập diễn biến mới..."
                    />

                    <EditableListTable
                        title="Tình trạng ra viện"
                        description="Danh sách các tình trạng ra viện hiển thị dạng single-choice trong form kết cục."
                        storageKey="cap_tinh_trang_ra_vien"
                        items={tinhTrang}
                        setItems={setTinhTrang}
                        usedItems={usedTinhTrang}
                        placeholder="Nhập tình trạng mới..."
                    />
                </div>
            )}

            {/* ══════════════ TAB 3: Vi khuẩn ══════════════ */}
            {activeTab === 'vikhuan' && (
                <div className="space-y-6">
                    <EditableListTable
                        title="Danh sách vi khuẩn"
                        description="Quản lý danh sách vi khuẩn hiển thị trong form nhập liệu. Những vi khuẩn đang dùng trong dữ liệu bệnh nhân sẽ không thể xóa."
                        storageKey="cap_bacteria"
                        items={bacteria}
                        setItems={setBacteria}
                        usedItems={usedBacteria}
                        placeholder="Nhập tên vi khuẩn mới..."
                    />

                    <EditableListTable
                        title="Danh sách kháng sinh"
                        description="Quản lý danh sách kháng sinh hiển thị trong kháng sinh đồ. Những kháng sinh đang dùng trong dữ liệu bệnh nhân sẽ không thể xóa."
                        storageKey="cap_antibiotics"
                        items={antibiotics}
                        setItems={setAntibiotics}
                        usedItems={usedAntibiotics}
                        placeholder="Nhập tên kháng sinh mới..."
                    />
                </div>
            )}

            {/* ══════════════ TAB 4: In BANC ══════════════ */}
            {activeTab === 'inbanc' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="font-heading font-semibold text-gray-900 mb-4">Thiết lập trang in</h3>

                        {/* Paper size */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cỡ giấy</label>
                            <div className="flex gap-3">
                                {(['A4', 'A5', 'Letter'] as const).map((s) => (
                                    <label key={s} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-colors text-sm font-medium ${printSettings.paperSize === s
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}>
                                        <input type="radio" name="paperSize" value={s}
                                            checked={printSettings.paperSize === s}
                                            onChange={() => updatePrint({ paperSize: s })}
                                            className="sr-only" />
                                        {s}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Margins */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Căn lề (cm)</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {([
                                    { key: 'top' as const, label: 'Trên' },
                                    { key: 'left' as const, label: 'Trái' },
                                    { key: 'right' as const, label: 'Phải' },
                                    { key: 'bottom' as const, label: 'Dưới' },
                                ]).map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="block text-xs text-gray-500 mb-1">{label}</label>
                                        <input type="number" step="0.1" min="0" max="5"
                                            value={printSettings.margins[key]}
                                            onChange={(e) => updateMargin(key, e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Font size */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cỡ chữ (px)</label>
                            <input type="number" step="1" min="8" max="20"
                                value={printSettings.fontSize}
                                onChange={(e) => updatePrint({ fontSize: Number(e.target.value) || 13 })}
                                className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                            <p className="text-xs text-gray-500 mt-1">Mặc định: 13px</p>
                        </div>
                    </div>

                    {/* Titles */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="font-heading font-semibold text-gray-900 mb-4">Tiêu đề trang in</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dòng 1</label>
                                <input type="text" value={printSettings.titleLine1}
                                    onChange={(e) => updatePrint({ titleLine1: e.target.value })}
                                    placeholder="Ví dụ: BỘ Y TẾ / SỞ Y TẾ..."
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dòng 2</label>
                                <input type="text" value={printSettings.titleLine2}
                                    onChange={(e) => updatePrint({ titleLine2: e.target.value })}
                                    placeholder="Ví dụ: BỆNH VIỆN..."
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                            </div>
                        </div>
                    </div>

                    {/* Sign titles */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="font-heading font-semibold text-gray-900 mb-4">Tiêu đề ký</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bên trái</label>
                                <input type="text" value={printSettings.signLeft}
                                    onChange={(e) => updatePrint({ signLeft: e.target.value })}
                                    placeholder="Ví dụ: TRƯỞNG KHOA"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bên phải</label>
                                <input type="text" value={printSettings.signRight}
                                    onChange={(e) => updatePrint({ signRight: e.target.value })}
                                    placeholder="Ví dụ: BÁC SĨ ĐIỀU TRỊ"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                            </div>
                        </div>
                    </div>

                    {/* PSI options */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="font-heading font-semibold text-gray-900 mb-4">Tuỳ chọn nội dung in</h3>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={printSettings.showPsiLevel}
                                onChange={(e) => updatePrint({ showPsiLevel: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                            <div>
                                <span className="text-sm font-medium text-gray-800">Hiển thị phân tầng PSI (mức độ nặng)</span>
                                <p className="text-xs text-gray-500">Mặc định chỉ in tổng điểm. Bật để in thêm mức độ phân tầng.</p>
                            </div>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
