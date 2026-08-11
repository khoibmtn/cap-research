import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEditGuardConfirm } from '../contexts/EditGuardContext';
import { generateAddressTemplate, parseAddressExcel, exportPatientsToSAV, type AddressEntry } from '../services/exportService';
import { patientService } from '../services/patientService';
import { settingsService } from '../services/settingsService';
import { backupService, type BackupMetadata, type BackupPatient, type SearchResult } from '../services/backupService';
import { parseExcelToPatients, detectConflicts, type ConflictPair } from '../services/importService';
import ConflictDialog from '../components/backup/ConflictDialog';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import PatientDetailModal from '../components/backup/PatientDetailModal';
import {
    DEFAULT_BACTERIA, DEFAULT_ANTIBIOTICS, NGHE_NGHIEP_OPTIONS,
    DEFAULT_NOI_O, DEFAULT_DIEN_BIEN_DIEU_TRI, DEFAULT_TINH_TRANG_RA_VIEN,
    DEFAULT_DRUG_GROUP_1,
} from '../data/formOptions';
import type { DrugGenericName } from '../types/patient';
import type { SpssVarConfig, SpssVarDef, SpssSlotConfig, SpssVarGroup, SpssProfile } from '../types/spssTypes';
import { SPSS_VAR_GROUP_LABELS } from '../types/spssTypes';

import { buildDefaultSpssConfig } from '../utils/spssDefaultConfig';
import {
    Upload, Download, Info, Plus, Trash2, Pencil, Check, X,
    ShieldAlert, MapPin, Stethoscope, Bug, Printer, HardDrive,
    Loader2, Eye, RotateCcw, FileSpreadsheet, ChevronUp, Search, Settings2, Pill,
    Database, Tag, CircleCheck,
} from 'lucide-react';
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
    { key: 'thuoc', label: 'Thuốc', icon: Pill },
    { key: 'inbanc', label: 'In BANC', icon: Printer },
    { key: 'spss', label: 'SPSS Variables', icon: Database },
    { key: 'backup', label: 'Backup', icon: HardDrive },
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

// ─── SpssSettingsTab Component ────────────────────────────────────────────────

interface SpssSettingsTabProps {
    profiles: SpssProfile[];
    activeProfileId: string;
    loading: boolean;
    patients: import('../types/patient').Patient[];
    onChangeProfile: (id: string) => void;
    onUpdateActiveProfile: (config: SpssVarConfig) => void;
    onCreateProfile: (name: string) => void;
    onDeleteProfile: (id: string) => void;
    onExport: () => void;
    isAdmin: boolean;
}

function ValueLabelEditorModal({
    varDef,
    onSave,
    onClose,
}: {
    varDef: SpssVarDef;
    onSave: (labels: Record<number, string>) => void;
    onClose: () => void;
}) {
    const [pairs, setPairs] = useState<{ code: string; label: string }[]>(() =>
        Object.entries(varDef.valueLabels ?? {}).map(([k, v]) => ({ code: k, label: v }))
    );

    const addRow = () => setPairs(prev => [...prev, { code: '', label: '' }]);
    const removeRow = (i: number) => setPairs(prev => prev.filter((_, idx) => idx !== i));
    const updateRow = (i: number, field: 'code' | 'label', value: string) =>
        setPairs(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

    const handleSave = () => {
        const labels: Record<number, string> = {};
        for (const { code, label } of pairs) {
            const num = parseFloat(code);
            if (!isNaN(num) && label.trim()) labels[num] = label.trim();
        }
        onSave(labels);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Sửa bảng mã giá trị</h3>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">{varDef.name}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="px-6 py-4 max-h-80 overflow-y-auto space-y-2">
                    <div className="grid grid-cols-[80px_1fr_32px] gap-2 text-xs font-medium text-gray-500 px-1">
                        <span>Mã (số)</span><span>Nhãn hiển thị</span><span />
                    </div>
                    {pairs.map((p, i) => (
                        <div key={i} className="grid grid-cols-[80px_1fr_32px] gap-2 items-center">
                            <input
                                type="number"
                                value={p.code}
                                onChange={e => updateRow(i, 'code', e.target.value)}
                                className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="0"
                            />
                            <input
                                type="text"
                                value={p.label}
                                onChange={e => updateRow(i, 'label', e.target.value)}
                                className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Nhãn..."
                            />
                            <button onClick={() => removeRow(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addRow}
                        className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium mt-2 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Thêm hàng
                    </button>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">Lưu</button>
                </div>
            </div>
        </div>
    );
}

function SpssSettingsTab({ profiles, activeProfileId, loading, patients, onChangeProfile, onUpdateActiveProfile, onCreateProfile, onDeleteProfile, onExport, isAdmin }: SpssSettingsTabProps) {
    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
    const config = activeProfile?.config;
    
    const [search, setSearch] = useState('');
    const [filterGroup, setFilterGroup] = useState<SpssVarGroup | 'all'>('all');
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editLabel, setEditLabel] = useState('');
    const [valueLabelVar, setValueLabelVar] = useState<{ varDef: SpssVarDef; index: number } | null>(null);
    const [slots, setSlots] = useState<SpssSlotConfig>(config?.slotConfig || { xquang: 5, ct: 5, viKhuan: 5, khangSinhPerVK: 15, thuoc: 10 });

    const canEdit = activeProfileId !== 'default' || isAdmin;

    // Sync slots from config on mount
    useEffect(() => { if (config?.slotConfig) setSlots(config.slotConfig); }, [config?.slotConfig]);

    const vars = config?.vars || [];

    // Filter non-template vars for display (templates shown as group summary)
    const displayVars = vars.filter(v => {
        const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.label.toLowerCase().includes(search.toLowerCase());
        const matchGroup = filterGroup === 'all' || v.group === filterGroup;
        return matchSearch && matchGroup;
    });

    const startEdit = (idx: number, v: SpssVarDef) => {
        setEditingIdx(idx);
        setEditName(v.name);
        setEditLabel(v.label);
    };

    const saveEdit = (idx: number) => {
        if (!config || !canEdit) return;
        const updated = vars.map((v, i) =>
            i === idx ? { ...v, name: editName.trim() || v.name, label: editLabel.trim() || v.label } : v
        );
        onUpdateActiveProfile({ ...config, vars: updated });
        setEditingIdx(null);
    };

    const saveValueLabels = (idx: number, labels: Record<number, string>) => {
        if (!config || !canEdit) return;
        const updated = vars.map((v, i) => i === idx ? { ...v, valueLabels: labels } : v);
        onUpdateActiveProfile({ ...config, vars: updated });
        setValueLabelVar(null);
    };

    const saveSlots = () => {
        if (!config || !canEdit) return;
        onUpdateActiveProfile({ ...config, slotConfig: slots });
    };

    const groups = Object.entries(SPSS_VAR_GROUP_LABELS) as [SpssVarGroup, string][];

    return (
        <div className="space-y-6">
            {/* ── Profiles Manager ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 className="font-heading font-semibold text-gray-900">Profiles cấu hình SPSS</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Chọn hoặc tạo profile để tùy chỉnh cấu trúc file SPSS. <br/>
                            <span className="text-xs text-gray-400">Chỉ admin mới có quyền sửa profile Mặc định.</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const name = prompt('Nhập tên cho Profile mới (sẽ copy từ profile hiện tại):');
                                if (name?.trim()) {
                                    onCreateProfile(name.trim());
                                }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Tạo Profile từ cấu hình hiện tại
                        </button>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {profiles.map(p => (
                        <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${p.id === activeProfileId ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
                            <button onClick={() => onChangeProfile(p.id)} className="font-medium">
                                {p.name}
                            </button>
                            {p.id === activeProfileId && <CircleCheck className="w-4 h-4 text-primary-600" />}
                            {p.id !== 'default' && (
                                <button onClick={() => { if (window.confirm('Xóa profile này?')) onDeleteProfile(p.id); }} className="ml-1 p-0.5 text-gray-400 hover:text-red-600 rounded">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Header actions ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h3 className="font-heading font-semibold text-gray-900">Chi tiết biến: {activeProfile?.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {patients.length > 0 ? (
                                <span><strong className="text-primary-600">{patients.filter(p => !p.disabled).length} case</strong> sẵn sàng xuất theo cấu hình này.</span>
                            ) : (
                                <span>Chưa có case nào để xuất.</span>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={onExport}
                            disabled={loading || patients.filter(p => !p.disabled).length === 0}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Xuất SPSS (.sav)
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Slot config ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Số slot tối đa (biến động)</h3>
                <p className="text-xs text-gray-500 mb-4">
                    Xác định số cột SPSS dành cho dữ liệu có thể thay đổi số lượng theo bệnh nhân.
                    Thay đổi rồi nhấn <strong>Áp dụng</strong>.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                        { key: 'xquang' as const, label: 'X-quang tổn thương' },
                        { key: 'ct' as const, label: 'CT tổn thương' },
                        { key: 'viKhuan' as const, label: 'Vi khuẩn' },
                        { key: 'khangSinhPerVK' as const, label: 'Kháng sinh / vi khuẩn' },
                        { key: 'thuoc' as const, label: 'Thuốc đã dùng' },
                    ].map(({ key, label }) => (
                        <div key={key}>
                            <label className="block text-xs text-gray-600 font-medium mb-1">{label}</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    max={key === 'khangSinhPerVK' ? 30 : 20}
                                    value={slots[key]}
                                    onChange={e => setSlots(prev => ({ ...prev, [key]: Math.max(1, parseInt(e.target.value) || 1) }))}
                                    className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                <span className="text-xs text-gray-400">slot</span>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={saveSlots}
                    disabled={!canEdit}
                    className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                    Áp dụng slot config
                </button>
                <p className="mt-2 text-xs text-gray-400">
                    Tổng biến ước tính: {
                        (() => {
                            const xq = slots.xquang * 5;
                            const ct = slots.ct * 5;
                            const vk = slots.viKhuan * (2 + slots.khangSinhPerVK * 2);
                            const thuoc = slots.thuoc * 6;
                            const fixed = 12 + 12 + 25 + 31 + 3 + 4 + 1 + 20 + 2 + 8 + 11;
                            return fixed + xq + ct + vk + thuoc;
                        })()
                    } biến
                </p>
            </div>

            {/* ── Variable list ── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm theo tên biến hoặc label..."
                            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={filterGroup}
                        onChange={e => setFilterGroup(e.target.value as SpssVarGroup | 'all')}
                        className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">Tất cả nhóm</option>
                        {groups.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <span className="text-xs text-gray-400">{displayVars.length} biến</span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="text-left px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap w-8">#</th>
                                <th className="text-left px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap">Nhóm</th>
                                <th className="text-left px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap">SPSS Name</th>
                                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Label</th>
                                <th className="text-center px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap w-16">Kiểu</th>
                                <th className="text-center px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap w-24">Bảng mã</th>
                                <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-20">Sửa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {displayVars.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 italic">Không tìm thấy biến</td></tr>
                            )}
                            {displayVars.map((v, displayIdx) => {
                                // Find actual index in config.vars
                                const actualIdx = vars.indexOf(v);
                                const isEditing = editingIdx === actualIdx;
                                const hasLabels = v.valueLabels && Object.keys(v.valueLabels).length > 0;
                                const isTemplate = v.isSlotTemplate;

                                return (
                                    <tr
                                        key={v.name}
                                        className={`hover:bg-gray-50/60 transition-colors ${isTemplate ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <td className="px-4 py-2 text-gray-400 tabular-nums text-xs">{displayIdx + 1}</td>
                                        <td className="px-4 py-2">
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {v.group ? SPSS_VAR_GROUP_LABELS[v.group] : '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {isEditing ? (
                                                <input
                                                    autoFocus
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(actualIdx); if (e.key === 'Escape') setEditingIdx(null); }}
                                                    className="w-40 px-2 py-1 rounded border border-primary-300 text-xs font-mono focus:ring-2 focus:ring-primary-500"
                                                />
                                            ) : (
                                                <span className={`font-mono text-xs ${isTemplate ? 'text-blue-700' : 'text-gray-800'}`}>
                                                    {v.name}
                                                    {isTemplate && <span className="ml-1 text-blue-400 text-[10px]">[template]</span>}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            {isEditing ? (
                                                <input
                                                    value={editLabel}
                                                    onChange={e => setEditLabel(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(actualIdx); if (e.key === 'Escape') setEditingIdx(null); }}
                                                    className="w-full px-2 py-1 rounded border border-primary-300 text-xs focus:ring-2 focus:ring-primary-500"
                                                />
                                            ) : (
                                                <span className="text-gray-700 text-xs">{v.label}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${v.type === 'string' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                                {v.type === 'string' ? 'Text' : 'Numeric'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {hasLabels ? (
                                                <button
                                                    onClick={() => canEdit && setValueLabelVar({ varDef: v, index: actualIdx })}
                                                    disabled={!canEdit}
                                                    className={`inline-flex items-center gap-1 text-xs transition-colors font-medium ${canEdit ? 'text-primary-600 hover:text-primary-800' : 'text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    <Tag className="w-3 h-3" />
                                                    {Object.keys(v.valueLabels!).length}
                                                </button>
                                            ) : (
                                                <span className="text-gray-300 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={() => saveEdit(actualIdx)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Lưu">
                                                            <Check className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => setEditingIdx(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Hủy">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button 
                                                        onClick={() => startEdit(actualIdx, v)} 
                                                        disabled={!canEdit}
                                                        className={`p-1.5 rounded-lg transition-colors ${canEdit ? 'text-gray-400 hover:text-primary-600 hover:bg-primary-50' : 'text-gray-300 cursor-not-allowed'}`} 
                                                        title={canEdit ? 'Sửa' : 'Không có quyền sửa'}
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
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

            {/* Template slot info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex gap-3">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800 space-y-1">
                        <p className="font-medium">Biến dạng template [n] và [k]</p>
                        <p className="text-xs text-blue-700">
                            Các biến có nhãn <span className="font-mono bg-blue-100 px-1 rounded text-[11px]">[template]</span> sẽ được nhân theo slot config.
                            Ví dụ: <span className="font-mono text-[11px]">xq{'{n}'}_vitri</span> với 5 slots sẽ sinh ra
                            <span className="font-mono text-[11px]"> xq1_vitri, xq2_vitri, ..., xq5_vitri</span> trong file .sav —
                            tất cả dùng chung một bảng mã giá trị.
                        </p>
                        <p className="text-xs text-blue-700">
                            Kháng sinh đồ dùng cả 2 placeholder: <span className="font-mono text-[11px]">vk{'{n}'}_ks{'{k}'}_kq</span> sinh ra
                            <em> viKhuan × khangSinhPerVK</em> biến.
                        </p>
                    </div>
                </div>
            </div>

            {/* Value label editor modal */}
            {valueLabelVar && (
                <ValueLabelEditorModal
                    varDef={valueLabelVar.varDef}
                    onSave={(labels) => saveValueLabels(valueLabelVar.index, labels)}
                    onClose={() => setValueLabelVar(null)}
                />
            )}
        </div>
    );
}

// ─── SPSS Config Encoding Migration ─────────────────────────────────
// Clinical/risk factor binary vars should use 0=Có, 1=Không (for OR 2x2 analysis)
// This function detects old config (0=Không, 1=Có) and migrates automatically

/** Prefixes/names of clinical binary vars that need reversed encoding */
const CLINICAL_VAR_PREFIXES = [
    'ts_dtd', 'ts_tha', 'ts_vdd', 'ts_vgm', 'ts_btnm', 'ts_gut',
    'ts_ung_thu', 'ts_suy_tim', 'ts_mach_nao', 'ts_hut_thuoc',
    'ls_ho_khan', 'ls_ho_mau', 'ls_ho_dom', 'ls_dau_nguc', 'ls_kho_tho',
    'ls_ran_am', 'ls_ran_no', 'ls_ran_rit', 'ls_ran_ngay',
    'ls_tdmp_co', 'ls_dongdac_co', 'ls_tkmp_co',
    'ha_xq_tran_dich', 'ha_xq_tran_khi', 'ha_ct_tran_dich', 'ha_ct_tran_khi',
    'psi_nha_duong_lao', 'psi_ung_thu', 'psi_benh_gan', 'psi_suy_tim',
    'psi_mach_nao', 'psi_benh_than', 'psi_thay_doi_tri_giac',
    'psi_tan_so_tho30', 'psi_ha_tam_thu90', 'psi_than_nhiet_3540',
    'psi_mach125', 'psi_ph735', 'psi_bun30', 'psi_hematocrit30',
    'psi_na_mau130', 'psi_glucose250', 'psi_pao2_60', 'psi_tran_dich_mp',
    'curb_c', 'curb_u', 'curb_r', 'curb_b', 'curb_age65',
    'kc_tho_may', 'kc_soc_nk', 'kc_loc_mau', 'kc_tu_vong', 'kc_xin_ve',
];

function migrateSpssConfigEncoding(config: SpssVarConfig): SpssVarConfig {
    let needsMigration = false;

    // Mapping: old _ben name → new _vitri var definition
    const BEN_TO_VITRI: Record<string, { name: string; label: string }> = {
        'ls_tdmp_ben': { name: 'ls_tdmp_vitri', label: 'Lâm sàng: Hội chứng TĐMP - Vị trí (0=Phải, 1=Trái, 2=Hai bên)' },
        'ls_dongdac_ben': { name: 'ls_dongdac_vitri', label: 'Lâm sàng: Hội chứng Đông đặc - Vị trí (0=Phải, 1=Trái, 2=Hai bên)' },
        'ls_tkmp_ben': { name: 'ls_tkmp_vitri', label: 'Lâm sàng: Hội chứng TKMP - Vị trí (0=Phải, 1=Trái, 2=Hai bên)' },
    };
    const VL_VITRI = { 0: 'Phải', 1: 'Trái', 2: 'Hai bên' };

    const updatedVars = config.vars.map((v) => {
        // Migrate _ben Text → _vitri Numeric
        if (BEN_TO_VITRI[v.name]) {
            needsMigration = true;
            const mapped = BEN_TO_VITRI[v.name];
            return {
                ...v,
                name: mapped.name,
                label: mapped.label,
                type: 'numeric' as const,
                decimals: 0,
                measureLevel: 'nominal' as const,
                valueLabels: VL_VITRI,
                width: undefined,
            };
        }

        // Migrate clinical binary encoding: 0='Không' → 0='Có'
        if (!CLINICAL_VAR_PREFIXES.includes(v.name)) return v;
        if (!v.valueLabels) return v;
        if (v.valueLabels[0] === 'Không' && v.valueLabels[1] === 'Có') {
            needsMigration = true;
            const newLabel = v.label
                .replace('(0=Không, 1=Có)', '(0=Có, 1=Không)')
                .replace('(0=Không,1=Có)', '(0=Có, 1=Không)');
            return {
                ...v,
                label: newLabel !== v.label ? newLabel : v.label,
                valueLabels: { 0: 'Có', 1: 'Không' },
            };
        }
        return v;
    });

    if (!needsMigration) return config;
    return { ...config, vars: updatedVars };
}

// ─── Settings Page ───────────────────────────────────────────────────
export default function SettingsPage() {
    const { user, role } = useAuth();
    const [activeTab, setActiveTab] = useState<TabKey>('hanhchinh');

    // Hành chính tab
    const [addresses, setAddresses] = useState<AddressEntry[]>([]);
    const [showAddrTable, setShowAddrTable] = useState(false);
    const [ngheNghiep, setNgheNghiep] = useState<string[]>([]);
    const [noiO, setNoiO] = useState<string[]>([]);

    // Lâm sàng tab
    const [dienBien, setDienBien] = useState<string[]>([]);
    const [tinhTrang, setTinhTrang] = useState<string[]>([]);
    const [glasgowThreshold, setGlasgowThreshold] = useState(13);
    const [glasgowSaving, setGlasgowSaving] = useState(false);

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

    // Thuốc tab
    const [drugGroup1, setDrugGroup1] = useState<string[]>([]);
    const [drugGroup2, setDrugGroup2] = useState<DrugGenericName[]>([]);
    const [usedDrugGroup1, setUsedDrugGroup1] = useState<Set<string>>(new Set());
    const [usedDrugGeneric, setUsedDrugGeneric] = useState<Set<string>>(new Set());

    // In BANC tab
    const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);

    // SPSS tab
    const [spssProfiles, setSpssProfiles] = useState<SpssProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string>('default');
    const [spssLoading, setSpssLoading] = useState(false);
    const [allPatients, setAllPatients] = useState<import('../types/patient').Patient[]>([]);

    // Backup tab
    const [backups, setBackups] = useState<BackupMetadata[]>([]);
    const [backupsLoading, setBackupsLoading] = useState(false);
    const [backupBusy, setBackupBusy] = useState(false);
    const [expandedBackup, setExpandedBackup] = useState<string | null>(null);
    const [expandedData, setExpandedData] = useState<BackupPatient[]>([]);
    const [renameId, setRenameId] = useState<string | null>(null);
    const [renameName, setRenameName] = useState('');
    // Restore flow
    const [restoreBackup, setRestoreBackup] = useState<BackupMetadata | null>(null);
    const [restoreData, setRestoreData] = useState<BackupPatient[]>([]);
    const [restoreSelected, setRestoreSelected] = useState<Set<number>>(new Set());
    const [restoreStep, setRestoreStep] = useState<'select' | 'conflict' | null>(null);
    const [conflicts, setConflicts] = useState<ConflictPair[]>([]);

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

        // Drug Group 1 (string list)
        settingsService.getList('cap_drug_group_1').then((items) => {
            if (items && items.length > 0) {
                setDrugGroup1(items);
                localStorage.setItem('cap_drug_group_1', JSON.stringify(items));
            } else {
                const local = loadListLocal('cap_drug_group_1', DEFAULT_DRUG_GROUP_1);
                setDrugGroup1(local);
                settingsService.saveList('cap_drug_group_1', local).catch(() => { });
            }
        }).catch(() => {
            setDrugGroup1(loadListLocal('cap_drug_group_1', DEFAULT_DRUG_GROUP_1));
        });

        // Drug Group 2 (generic names — objects)
        settingsService.getDrugGenericNames().then((items) => {
            if (items && items.length > 0) {
                setDrugGroup2(items);
                localStorage.setItem('cap_drug_group_2', JSON.stringify(items));
            } else {
                const raw = localStorage.getItem('cap_drug_group_2');
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) setDrugGroup2(parsed);
                    } catch { /* ignore */ }
                }
            }
        }).catch(() => {
            const raw = localStorage.getItem('cap_drug_group_2');
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) setDrugGroup2(parsed);
                } catch { /* ignore */ }
            }
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

        // Clinical settings (Glasgow threshold)
        settingsService.getClinicalSettings().then((data) => {
            if (data?.glasgowThreshold) setGlasgowThreshold(data.glasgowThreshold);
        }).catch(() => { /* use default */ });

        // SPSS profiles
        settingsService.getSpssProfiles().then((profiles) => {
            if (profiles && profiles.length > 0) {
                const migratedProfiles = profiles.map(p => {
                    const migratedConfig = migrateSpssConfigEncoding(p.config);
                    return migratedConfig !== p.config ? { ...p, config: migratedConfig } : p;
                });
                setSpssProfiles(migratedProfiles);
                if (JSON.stringify(profiles) !== JSON.stringify(migratedProfiles)) {
                    settingsService.saveSpssProfiles(migratedProfiles).catch(() => {});
                }
            } else {
                settingsService.getSpssConfig().then((data) => {
                    const baseConfig = data ? migrateSpssConfigEncoding(data) : buildDefaultSpssConfig();
                    const defaultProfile: SpssProfile = {
                        id: 'default',
                        name: 'Mặc định',
                        isDefault: true,
                        config: baseConfig,
                        createdAt: new Date().toISOString(),
                    };
                    setSpssProfiles([defaultProfile]);
                    settingsService.saveSpssProfiles([defaultProfile]).catch(() => {});
                }).catch(() => {
                    const defaultProfile: SpssProfile = {
                        id: 'default',
                        name: 'Mặc định',
                        isDefault: true,
                        config: buildDefaultSpssConfig(),
                        createdAt: new Date().toISOString(),
                    };
                    setSpssProfiles([defaultProfile]);
                });
            }
        }).catch(() => {});

        settingsService.getActiveSpssProfileId().then((id) => {
            if (id) setActiveProfileId(id);
        }).catch(() => {});

        // Load all patients for SAV export
        patientService.getAll().then(setAllPatients).catch(() => {});
    }, []);

    // Fetch used items from patient data
    useEffect(() => {
        patientService.getAll().then((patients) => {
            const bSet = new Set<string>();
            const aSet = new Set<string>();
            const dbSet = new Set<string>();
            const ttSet = new Set<string>();
            const dgSet = new Set<string>();
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
                // Thuốc đã dùng (tiền sử)
                p.tienSu?.thuocDaDung?.forEach((t) => {
                    if (t.tenGoc) {
                        dgSet.add(t.tenGoc);
                        // Find nhom1 for this tenGoc — we'll check later
                    }
                });
            });
            setUsedBacteria(bSet);
            setUsedAntibiotics(aSet);
            setUsedDienBien(dbSet);
            setUsedTinhTrang(ttSet);
            setUsedNgheNghiep(nnSet);
            setUsedNoiO(noSet);
            setUsedDrugGeneric(dgSet);
            // Derive used drug group 1 from used generics
            settingsService.getDrugGenericNames().then((items) => {
                if (items) {
                    const dg1Used = new Set<string>();
                    items.forEach(g => {
                        if (dgSet.has(g.ten)) dg1Used.add(g.nhom1);
                    });
                    setUsedDrugGroup1(dg1Used);
                }
            }).catch(() => { });
        }).catch(() => { });
    }, []);

    const showConfirm = useEditGuardConfirm();

    const handleAddressUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const entries = await parseAddressExcel(file);
            if (entries.length === 0) {
                toast.error('File không chứa dữ liệu địa chỉ');
                return;
            }

            // Calculate add vs replace
            const existingKeys = new Set(addresses.map((a) => `${a.xaPhuong}|${a.tinhThanh}`));
            const newCount = entries.filter((a) => !existingKeys.has(`${a.xaPhuong}|${a.tinhThanh}`)).length;
            const replaceCount = entries.length - newCount;

            const lines: string[] = [`Tổng cộng: ${entries.length} địa chỉ`];
            if (newCount > 0) lines.push(`• Bổ sung mới: ${newCount} địa chỉ`);
            if (replaceCount > 0) lines.push(`• Thay thế: ${replaceCount} địa chỉ`);
            if (addresses.length > 0) lines.push(`\nDữ liệu cũ (${addresses.length} địa chỉ) sẽ bị ghi đè.`);

            const ok = await showConfirm(
                lines.join('\n'),
                'Import',
                'Hủy',
                { title: 'Xác nhận import địa chỉ' },
            );
            if (!ok) {
                // Reset file input
                e.target.value = '';
                return;
            }

            setAddresses(entries);
            localStorage.setItem('cap_addresses', JSON.stringify(entries));
            await settingsService.saveAddresses(entries);
            toast.success(`Đã import ${entries.length} địa chỉ`);
        } catch {
            toast.error('Lỗi khi đọc file Excel');
        }
        e.target.value = '';
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
        <div className="max-w-5xl mx-auto">
            <h1 className="font-heading text-2xl font-bold text-gray-900 mb-6">Cài đặt</h1>

            {/* ── Tab bar ── */}
            <div className="flex flex-wrap border-b border-gray-200 mb-6">
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
                            <div className="mt-4">
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <span className="text-sm text-green-700">
                                        <Info className="w-4 h-4 inline mr-1" />
                                        Đã có {addresses.length} địa chỉ trong hệ thống.
                                    </span>
                                    <button
                                        onClick={() => setShowAddrTable(!showAddrTable)}
                                        className="text-xs font-medium text-green-700 hover:text-green-900 underline underline-offset-2"
                                    >
                                        {showAddrTable ? 'Ẩn bảng' : 'Xem bảng'}
                                    </button>
                                </div>
                                {showAddrTable && (
                                    <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="max-h-64 overflow-y-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2.5 text-left font-medium text-gray-600">#</th>
                                                        <th className="px-4 py-2.5 text-left font-medium text-gray-600">Tỉnh/TP</th>
                                                        <th className="px-4 py-2.5 text-left font-medium text-gray-600">Xã/Phường</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {addresses.map((a, i) => (
                                                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                                                            <td className="px-4 py-2 text-gray-400 tabular-nums">{i + 1}</td>
                                                            <td className="px-4 py-2 text-gray-700">{a.tinhThanh}</td>
                                                            <td className="px-4 py-2 text-gray-700">{a.xaPhuong}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
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

                    {/* Glasgow threshold setting */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="font-heading font-semibold text-base text-gray-900 mb-1">Ngưỡng rối loạn ý thức (Glasgow)</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Khi điểm Glasgow ≤ ngưỡng này, hệ thống sẽ hỏi xác nhận rối loạn ý thức để tính điểm CURB-65 (cấu phần C) và PSI (thay đổi tri giác).
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Glasgow ≤</label>
                                <select
                                    value={glasgowThreshold}
                                    onChange={(e) => setGlasgowThreshold(Number(e.target.value))}
                                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent w-20"
                                >
                                    {Array.from({ length: 13 }, (_, i) => 15 - i).map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                                <span className="text-xs text-gray-400">(mặc định: 13)</span>
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    setGlasgowSaving(true);
                                    try {
                                        await settingsService.saveClinicalSettings({ glasgowThreshold });
                                        toast.success('Đã lưu ngưỡng Glasgow');
                                    } catch {
                                        toast.error('Lỗi khi lưu');
                                    } finally {
                                        setGlasgowSaving(false);
                                    }
                                }}
                                disabled={glasgowSaving}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {glasgowSaving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
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

            {/* ══════════════ TAB 4: Thuốc ══════════════ */}
            {activeTab === 'thuoc' && (
                <DrugSettingsTab
                    drugGroup1={drugGroup1}
                    setDrugGroup1={setDrugGroup1}
                    drugGroup2={drugGroup2}
                    setDrugGroup2={setDrugGroup2}
                    usedDrugGroup1={usedDrugGroup1}
                    usedDrugGeneric={usedDrugGeneric}
                />
            )}

            {/* ══════════════ TAB 5: In BANC ══════════════ */}
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
            {/* ════════════ TAB 6: SPSS Variables ════════════ */}
            {activeTab === 'spss' && spssProfiles.length > 0 && (
                <SpssSettingsTab
                    profiles={spssProfiles}
                    activeProfileId={activeProfileId}
                    loading={spssLoading}
                    patients={allPatients}
                    isAdmin={role === 'admin'}
                    onChangeProfile={(id) => {
                        setActiveProfileId(id);
                        settingsService.saveActiveSpssProfileId(id).catch(() => {});
                    }}
                    onUpdateActiveProfile={(updatedConfig) => {
                        const updatedProfiles = spssProfiles.map(p => 
                            p.id === activeProfileId ? { ...p, config: updatedConfig } : p
                        );
                        setSpssProfiles(updatedProfiles);
                        setSpssLoading(true);
                        settingsService.saveSpssProfiles(updatedProfiles)
                            .then(() => toast.success('Đã lưu cấu hình profile SPSS'))
                            .catch(() => toast.error('Lỗi khi lưu cấu hình'))
                            .finally(() => setSpssLoading(false));
                    }}
                    onCreateProfile={(name) => {
                        const activeProfile = spssProfiles.find(p => p.id === activeProfileId);
                        if (!activeProfile) return;
                        const newProfile: SpssProfile = {
                            id: crypto.randomUUID(),
                            name,
                            isDefault: false,
                            config: activeProfile.config,
                            createdAt: new Date().toISOString(),
                        };
                        const updatedProfiles = [...spssProfiles, newProfile];
                        setSpssProfiles(updatedProfiles);
                        setActiveProfileId(newProfile.id);
                        settingsService.saveSpssProfiles(updatedProfiles).catch(() => {});
                        settingsService.saveActiveSpssProfileId(newProfile.id).catch(() => {});
                        toast.success('Đã tạo profile mới');
                    }}
                    onDeleteProfile={(id) => {
                        const updatedProfiles = spssProfiles.filter(p => p.id !== id);
                        setSpssProfiles(updatedProfiles);
                        if (activeProfileId === id) {
                            setActiveProfileId('default');
                            settingsService.saveActiveSpssProfileId('default').catch(() => {});
                        }
                        settingsService.saveSpssProfiles(updatedProfiles)
                            .then(() => toast.success('Đã xóa profile'))
                            .catch(() => toast.error('Lỗi khi xóa profile'));
                    }}
                    onExport={() => {
                        const statsPatients = allPatients.filter(p => !p.disabled);
                        if (statsPatients.length === 0) {
                            toast.error('Không có dữ liệu thống kê để xuất');
                            return;
                        }
                        try {
                            const activeProfile = spssProfiles.find(p => p.id === (activeProfileId || 'default'));
                            exportPatientsToSAV(statsPatients, activeProfile?.config || null);
                            toast.success(`Đã xuất ${statsPatients.length} case thống kê ra file SPSS (.sav)`);
                        } catch (e) {
                            console.error(e);
                            toast.error('Lỗi khi tạo file SPSS');
                        }
                    }}
                />
            )}
            {/* ════════════ TAB 7: Backup ════════════ */}
            {activeTab === 'backup' && (
                <BackupTab
                    backups={backups}
                    setBackups={setBackups}
                    backupsLoading={backupsLoading}
                    setBackupsLoading={setBackupsLoading}
                    backupBusy={backupBusy}
                    setBackupBusy={setBackupBusy}
                    expandedBackup={expandedBackup}
                    setExpandedBackup={setExpandedBackup}
                    expandedData={expandedData}
                    setExpandedData={setExpandedData}
                    renameId={renameId}
                    setRenameId={setRenameId}
                    renameName={renameName}
                    setRenameName={setRenameName}
                    restoreBackup={restoreBackup}
                    setRestoreBackup={setRestoreBackup}
                    restoreData={restoreData}
                    setRestoreData={setRestoreData}
                    restoreSelected={restoreSelected}
                    setRestoreSelected={setRestoreSelected}
                    restoreStep={restoreStep}
                    setRestoreStep={setRestoreStep}
                    conflicts={conflicts}
                    setConflicts={setConflicts}
                />
            )}
        </div>
    );
}

// ─── Drug Settings Tab ───────────────────────────────────────────────────
interface DrugSettingsTabProps {
    drugGroup1: string[];
    setDrugGroup1: (items: string[]) => void;
    drugGroup2: DrugGenericName[];
    setDrugGroup2: (items: DrugGenericName[]) => void;
    usedDrugGroup1: Set<string>;
    usedDrugGeneric: Set<string>;
}

function DrugSettingsTab({ drugGroup1, setDrugGroup1, drugGroup2, setDrugGroup2, usedDrugGroup1, usedDrugGeneric }: DrugSettingsTabProps) {
    const [newGenericName, setNewGenericName] = useState('');
    const [newGenericGroup, setNewGenericGroup] = useState('');
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editGroup, setEditGroup] = useState('');

    const persistGroup2 = useCallback((list: DrugGenericName[]) => {
        setDrugGroup2(list);
        localStorage.setItem('cap_drug_group_2', JSON.stringify(list));
        settingsService.saveDrugGenericNames(list).catch(() => { });
    }, [setDrugGroup2]);

    const handleAddGeneric = () => {
        const name = newGenericName.trim();
        if (!name || !newGenericGroup) return;
        if (drugGroup2.some(g => g.ten === name)) { toast.error('Tên gốc này đã tồn tại'); return; }
        persistGroup2([...drugGroup2, { ten: name, nhom1: newGenericGroup }]);
        setNewGenericName('');
        setNewGenericGroup('');
        toast.success(`Đã thêm "${name}"`);
    };

    const startEditGeneric = (idx: number) => {
        setEditIdx(idx);
        setEditName(drugGroup2[idx].ten);
        setEditGroup(drugGroup2[idx].nhom1);
    };

    const saveEditGeneric = (idx: number) => {
        const name = editName.trim();
        if (!name || !editGroup) return;
        if (name !== drugGroup2[idx].ten && drugGroup2.some(g => g.ten === name)) {
            toast.error('Tên gốc này đã tồn tại');
            return;
        }
        const updated = [...drugGroup2];
        updated[idx] = { ten: name, nhom1: editGroup };
        persistGroup2(updated);
        setEditIdx(null);
        toast.success('Đã cập nhật');
    };

    const deleteGeneric = (idx: number) => {
        const name = drugGroup2[idx].ten;
        if (usedDrugGeneric.has(name)) {
            toast.error(`Không thể xóa "${name}" vì đang được sử dụng trong dữ liệu bệnh nhân`);
            return;
        }
        persistGroup2(drugGroup2.filter((_, i) => i !== idx));
        toast.success(`Đã xóa "${name}"`);
    };

    return (
        <div className="space-y-6">
            {/* Frame 1: Nhóm 1 */}
            <EditableListTable
                title="Nhóm 1: Phân loại thuốc"
                description="Quản lý các nhóm thuốc lớn (Kháng sinh, Corticoid, ...). Nhóm đang được tên gốc sử dụng sẽ không thể xóa."
                storageKey="cap_drug_group_1"
                items={drugGroup1}
                setItems={setDrugGroup1}
                usedItems={usedDrugGroup1}
                placeholder="Nhập nhóm thuốc mới..."
            />

            {/* Frame 2: Nhóm 2 — Tên gốc */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-heading font-semibold text-gray-900 mb-1">Nhóm 2: Tên gốc</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Quản lý tên thuốc gốc (generic name). Mỗi tên gốc thuộc một nhóm thuốc ở Nhóm 1.
                </p>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-12">#</th>
                                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Tên gốc</th>
                                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-40">Nhóm</th>
                                    <th className="text-center px-4 py-2.5 font-medium text-gray-600 w-10">Đang dùng</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-24">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {drugGroup2.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 italic">Chưa có dữ liệu</td></tr>
                                )}
                                {drugGroup2.map((item, idx) => {
                                    const inUse = usedDrugGeneric.has(item.ten);
                                    const isEditing = editIdx === idx;
                                    return (
                                        <tr key={idx} className={`hover:bg-gray-50/50 transition-colors ${inUse ? 'bg-amber-50/40' : ''}`}>
                                            <td className="px-4 py-2 text-gray-400 tabular-nums">{idx + 1}</td>
                                            <td className="px-4 py-2">
                                                {isEditing ? (
                                                    <input autoFocus value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') saveEditGeneric(idx); if (e.key === 'Escape') setEditIdx(null); }}
                                                        className="w-full px-2 py-1 rounded border border-primary-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                                ) : (
                                                    <span className="text-gray-800">{item.ten}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                {isEditing ? (
                                                    <select value={editGroup} onChange={(e) => setEditGroup(e.target.value)}
                                                        className="w-full px-2 py-1 rounded border border-primary-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                                                        <option value="">Chọn nhóm</option>
                                                        {drugGroup1.map(g => <option key={g} value={g}>{g}</option>)}
                                                    </select>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                                        {item.nhom1}
                                                    </span>
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
                                                            <button onClick={() => saveEditGeneric(idx)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Lưu">
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => setEditIdx(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Hủy">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => startEditGeneric(idx)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Sửa">
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => deleteGeneric(idx)} disabled={inUse}
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
                    <input value={newGenericName} onChange={(e) => setNewGenericName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddGeneric(); }}
                        placeholder="Nhập tên gốc mới..."
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                    <select value={newGenericGroup} onChange={(e) => setNewGenericGroup(e.target.value)}
                        className="w-40 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <option value="">Chọn nhóm</option>
                        {drugGroup1.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button onClick={handleAddGeneric} disabled={!newGenericName.trim() || !newGenericGroup}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <Plus className="w-4 h-4" /> Thêm
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                    Tổng: {drugGroup2.length} tên gốc • {usedDrugGeneric.size} đang sử dụng
                </p>
            </div>
        </div>
    );
}

// ─── Backup Tab Component ────────────────────────────────────────────────
interface BackupTabProps {
    backups: BackupMetadata[];
    setBackups: (b: BackupMetadata[]) => void;
    backupsLoading: boolean;
    setBackupsLoading: (v: boolean) => void;
    backupBusy: boolean;
    setBackupBusy: (v: boolean) => void;
    expandedBackup: string | null;
    setExpandedBackup: (v: string | null) => void;
    expandedData: BackupPatient[];
    setExpandedData: (v: BackupPatient[]) => void;
    renameId: string | null;
    setRenameId: (v: string | null) => void;
    renameName: string;
    setRenameName: (v: string) => void;
    restoreBackup: BackupMetadata | null;
    setRestoreBackup: (v: BackupMetadata | null) => void;
    restoreData: BackupPatient[];
    setRestoreData: (v: BackupPatient[]) => void;
    restoreSelected: Set<number>;
    setRestoreSelected: (v: Set<number>) => void;
    restoreStep: 'select' | 'conflict' | null;
    setRestoreStep: (v: 'select' | 'conflict' | null) => void;
    conflicts: ConflictPair[];
    setConflicts: (v: ConflictPair[]) => void;
}

function BackupTab({
    backups, setBackups, backupsLoading, setBackupsLoading,
    backupBusy, setBackupBusy, expandedBackup, setExpandedBackup,
    expandedData, setExpandedData, renameId, setRenameId,
    renameName, setRenameName, restoreBackup, setRestoreBackup,
    restoreData, setRestoreData, restoreSelected, setRestoreSelected,
    restoreStep, setRestoreStep, conflicts, setConflicts,
}: BackupTabProps) {
    const { user } = useAuth();
    const uid = user?.uid ?? '';
    // Sub-tab state
    const [subTab, setSubTab] = useState<'list' | 'search' | 'config'>('list');

    // ─── Backup column config ───
    type BkCol = { key: string; label: string; align?: 'center' | 'left' };
    type BkGroup = { group: string; columns: BkCol[] };
    const BK_COLUMN_GROUPS: BkGroup[] = [
        {
            group: 'Hành chính',
            columns: [
                { key: 'maBNNC', label: 'Mã BNNC' },
                { key: 'maBA', label: 'Mã BA' },
                { key: 'hoTen', label: 'Họ tên' },
                { key: 'tuoi', label: 'Tuổi', align: 'center' },
                { key: 'gioiTinh', label: 'Giới' },
                { key: 'ngheNghiep', label: 'Nghề nghiệp' },
                { key: 'diaChiXaPhuong', label: 'Xã/Phường' },
                { key: 'diaChiTinhThanh', label: 'Tỉnh/TP' },
                { key: 'noiO', label: 'Nơi ở' },
                { key: 'ngayVaoVien', label: 'Ngày VV' },
                { key: 'ngayRaVien', label: 'Ngày RV' },
            ],
        },
        {
            group: 'Tiền sử',
            columns: [
                { key: 'daiThaoDuong', label: 'ĐTĐ' },
                { key: 'tangHuyetAp', label: 'THA' },
                { key: 'benhThanMan', label: 'Thận mạn' },
                { key: 'ungThuTS', label: 'Ung thư' },
                { key: 'suyTimTS', label: 'Suy tim' },
                { key: 'benhMMN', label: 'B. mạch máu não' },
                { key: 'hutThuocLa', label: 'Hút thuốc' },
            ],
        },
        {
            group: 'Lâm sàng',
            columns: [
                { key: 'mach', label: 'Mạch' },
                { key: 'huyetAp', label: 'HA' },
                { key: 'nhietDo', label: 'Nhiệt độ' },
                { key: 'nhipTho', label: 'Nhịp thở' },
                { key: 'spO2', label: 'SpO2' },
                { key: 'glasgow', label: 'Glasgow' },
            ],
        },
        {
            group: 'Xét nghiệm',
            columns: [
                { key: 'wbc', label: 'WBC' },
                { key: 'neutrophil', label: 'Neutro%' },
                { key: 'lymphocyte', label: 'Lympho%' },
                { key: 'hemoglobin', label: 'Hb' },
                { key: 'plt', label: 'PLT' },
                { key: 'crp', label: 'CRP' },
                { key: 'procalcitonin', label: 'PCT' },
                { key: 'ure', label: 'Ure' },
                { key: 'creatinin', label: 'Creatinin' },
                { key: 'albumin', label: 'Albumin' },
                { key: 'na', label: 'Na' },
                { key: 'k', label: 'K' },
                { key: 'nlr', label: 'NLR' },
                { key: 'plr', label: 'PLR' },
                { key: 'car', label: 'CAR' },
            ],
        },
        {
            group: 'Marker NC',
            columns: [
                { key: 'sTREM1', label: 'sTREM-1' },
                { key: 'tIMP1', label: 'TIMP-1' },
                { key: 'il6', label: 'IL-6' },
                { key: 'il10', label: 'IL-10' },
                { key: 'il17', label: 'IL-17' },
            ],
        },
        {
            group: 'PSI & Kết cục',
            columns: [
                { key: 'psiDiem', label: 'PSI', align: 'center' },
                { key: 'psiPhanTang', label: 'PSI Class' },
                { key: 'ketCuc', label: 'Kết cục' },
                { key: 'tongNgayDT', label: 'Ngày ĐT' },
            ],
        },
        {
            group: 'Backup',
            columns: [
                { key: 'ngayTao', label: 'Ngày tạo' },
                { key: 'suaCuoi', label: 'Sửa cuối' },
                { key: 'backupNguon', label: 'Backup nguồn' },
            ],
        },
    ];
    const ALL_BK_COLS = BK_COLUMN_GROUPS.flatMap(g => g.columns);
    const BK_DEFAULT_VISIBLE = new Set([
        'maBNNC', 'maBA', 'hoTen', 'tuoi', 'gioiTinh', 'noiO',
        'psiDiem', 'ketCuc', 'ngayTao', 'suaCuoi', 'backupNguon',
    ]);
    const BK_LS_KEY = `cap_backup_columns_${uid}`;

    const loadBkCols = (): Set<string> => {
        try {
            const s = localStorage.getItem(BK_LS_KEY);
            if (s) { const a = JSON.parse(s); if (Array.isArray(a) && a.length > 0) return new Set(a); }
        } catch { /* */ }
        return new Set(BK_DEFAULT_VISIBLE);
    };
    const [bkVisibleCols, setBkVisibleCols] = useState<Set<string>>(loadBkCols);

    // Sync from Firestore on mount
    useEffect(() => {
        if (!uid) return;
        settingsService.getBackupColumnConfig(uid).then((cols) => {
            if (cols && cols.length > 0) {
                const s = new Set(cols);
                setBkVisibleCols(s);
                localStorage.setItem(BK_LS_KEY, JSON.stringify(cols));
            }
        }).catch(() => { /* silent */ });
    }, [uid, BK_LS_KEY]);

    const saveBkCols = (next: Set<string>) => {
        setBkVisibleCols(next);
        const arr = [...next];
        localStorage.setItem(BK_LS_KEY, JSON.stringify(arr));
        if (uid) settingsService.saveBackupColumnConfig(uid, arr).catch(() => { });
    };
    const toggleBkCol = (key: string) => {
        const next = new Set(bkVisibleCols);
        if (next.has(key)) next.delete(key); else next.add(key);
        saveBkCols(next);
    };
    const activeBkCols = ALL_BK_COLS.filter(c => bkVisibleCols.has(c.key));

    const _boolLabel = (v: boolean) => (v ? 'Có' : '');
    const _numLabel = (v: number | null | undefined) => (v !== null && v !== undefined ? String(v) : '');

    const getBkCellValue = (p: BackupPatient, key: string, backupName?: string): string => {
        const hc = p.hanhChinh;
        const ts = p.tienSu;
        const ls = p.lamSang;
        const xn = p.xetNghiem;
        const cs = p.chiSoTinhToan;
        switch (key) {
            // Hành chính
            case 'maBNNC': return p.maBenhNhanNghienCuu || '—';
            case 'maBA': return p.maBenhAnNoiTru || '—';
            case 'hoTen': return hc.hoTen || '—';
            case 'tuoi': return hc.tuoi != null ? String(hc.tuoi) : '—';
            case 'gioiTinh': return hc.gioiTinh === 'nam' ? 'Nam' : hc.gioiTinh === 'nu' ? 'Nữ' : '—';
            case 'ngheNghiep': return hc.ngheNghiep || '';
            case 'diaChiXaPhuong': return hc.diaChiXaPhuong || '';
            case 'diaChiTinhThanh': return hc.diaChiTinhThanh || '';
            case 'noiO': return hc.noiO === 'nong_thon' ? 'Nông thôn' : hc.noiO === 'thanh_thi' ? 'Thành thị' : hc.noiO === 'hai_dao' ? 'Hải đảo' : '';
            case 'ngayVaoVien': return hc.ngayVaoVien || '';
            case 'ngayRaVien': return hc.ngayRaVien || '';
            // Tiền sử
            case 'daiThaoDuong': return _boolLabel(ts.daiThaoDuong);
            case 'tangHuyetAp': return _boolLabel(ts.tangHuyetAp);
            case 'benhThanMan': return _boolLabel(ts.benhThanMan);
            case 'ungThuTS': return _boolLabel(ts.ungThu);
            case 'suyTimTS': return _boolLabel(ts.suyTimUHuyet);
            case 'benhMMN': return _boolLabel(ts.benhMachMauNao);
            case 'hutThuocLa': return ts.hutThuocLa ? `Có (${_numLabel(ts.soBaoNam)} bao-năm)` : '';
            // Lâm sàng
            case 'mach': return _numLabel(ls.mach);
            case 'huyetAp': return ls.huyetAp || '';
            case 'nhietDo': return _numLabel(ls.nhietDo);
            case 'nhipTho': return _numLabel(ls.nhipTho);
            case 'spO2': return _numLabel(ls.spO2);
            case 'glasgow': return _numLabel(ls.diemGlasgow);
            // Xét nghiệm
            case 'wbc': return _numLabel(xn.wbc);
            case 'neutrophil': return _numLabel(xn.neutrophil);
            case 'lymphocyte': return _numLabel(xn.lymphocyte);
            case 'hemoglobin': return _numLabel(xn.hemoglobin);
            case 'plt': return _numLabel(xn.plt);
            case 'crp': return _numLabel(xn.crp);
            case 'procalcitonin': return _numLabel(xn.procalcitonin);
            case 'ure': return _numLabel(xn.ure);
            case 'creatinin': return _numLabel(xn.creatinin);
            case 'albumin': return _numLabel(xn.albumin);
            case 'na': return _numLabel(xn.na);
            case 'k': return _numLabel(xn.k);
            case 'nlr': return _numLabel(cs.nlr);
            case 'plr': return _numLabel(cs.plr);
            case 'car': return _numLabel(cs.car);
            // Marker NC
            case 'sTREM1': return _numLabel(xn.sTREM1);
            case 'tIMP1': return _numLabel(xn.tIMP1);
            case 'il6': return _numLabel(xn.il6);
            case 'il10': return _numLabel(xn.il10);
            case 'il17': return _numLabel(xn.il17);
            // PSI & Kết cục
            case 'psiDiem': return p.psi.tongDiem > 0 ? String(p.psi.tongDiem) : '—';
            case 'psiPhanTang': return p.psi.phanTang || '';
            case 'ketCuc': return p.ketCuc?.tuVong ? 'Tử vong' : p.ketCuc?.tienTrienTotXuatVien ? 'Xuất viện' : p.ketCuc?.xinVe ? 'Xin về' : p.ketCuc?.tinhTrangRaVien || '';
            case 'tongNgayDT': return _numLabel(p.ketCuc?.tongSoNgayDieuTri);
            // Backup
            case 'backupNguon': return backupName || '';
            case 'ngayTao': return fmtIso(p.createdAt);
            case 'suaCuoi': return fmtIso(p.updatedAt);
            default: return '—';
        }
    };

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchScope, setSearchScope] = useState<string>('all'); // 'all' or backupId
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Detail modal
    const [detailPatient, setDetailPatient] = useState<BackupPatient | null>(null);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<BackupMetadata | null>(null);

    // Restore single patient confirmation
    const [restoreTarget, setRestoreTarget] = useState<BackupPatient | null>(null);

    // Pending new patients count for ConflictDialog summary
    const [pendingNewCount, setPendingNewCount] = useState(0);
    const [identicalCount, setIdenticalCount] = useState(0);
    // Store pending new patients to restore along with selected conflicts
    const [pendingNewPatients, setPendingNewPatients] = useState<BackupPatient[]>([]);

    // Load backups on mount
    useEffect(() => {
        loadBackups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadBackups = async () => {
        setBackupsLoading(true);
        try {
            const list = await backupService.listBackups();
            setBackups(list);
        } catch (err) {
            console.error('[Backup] Load error:', err);
            toast.error('Lỗi khi tải danh sách backup');
        } finally {
            setBackupsLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setBackupBusy(true);
        try {
            const patients = await patientService.getAll();
            if (patients.length === 0) {
                toast.error('Không có bệnh nhân nào để backup');
                return;
            }
            await backupService.createBackup(patients);
            toast.success(`Đã backup ${patients.length} bệnh nhân`);
            await loadBackups();
        } catch (err) {
            console.error('[Backup] Create error:', err);
            toast.error('Lỗi khi tạo backup');
        } finally {
            setBackupBusy(false);
        }
    };

    const handleDelete = async (backup: BackupMetadata) => {
        try {
            await backupService.deleteBackup(backup);
            toast.success('Đã xóa backup');
            setBackups(backups.filter((b) => b.id !== backup.id));
        } catch {
            toast.error('Lỗi khi xóa backup');
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleRename = async (id: string) => {
        if (!renameName.trim()) return;
        try {
            await backupService.renameBackup(id, renameName.trim());
            setBackups(backups.map((b) => b.id === id ? { ...b, name: renameName.trim() } : b));
            setRenameId(null);
            toast.success('Đã đổi tên');
        } catch {
            toast.error('Lỗi khi đổi tên');
        }
    };

    const handleToggleExpand = async (backup: BackupMetadata) => {
        if (expandedBackup === backup.id) {
            setExpandedBackup(null);
            return;
        }
        try {
            const data = await backupService.getBackupData(backup);
            setExpandedData(data);
            setExpandedBackup(backup.id);
        } catch (err) {
            console.error('[Backup] Expand error:', err);
            toast.error('Lỗi khi tải dữ liệu backup');
        }
    };

    // ─── Search ──────────────────────────────────────────────────
    const handleSearch = async () => {
        setSearching(true);
        setHasSearched(true);
        try {
            const results = await backupService.searchBackups(
                backups,
                searchQuery.trim(),
                searchScope === 'all' ? undefined : searchScope,
            );
            setSearchResults(results);
            if (results.length === 0) {
                toast('Không tìm thấy kết quả', { icon: '🔍' });
            }
        } catch (err) {
            console.error('[Backup] Search error:', err);
            toast.error('Lỗi khi tìm kiếm');
        } finally {
            setSearching(false);
        }
    };

    // ─── Unified restore handler (single + bulk) ─────────────────
    const handleRestorePatients = async (patients: BackupPatient[]) => {
        setBackupBusy(true);
        try {
            const existingPatients = await patientService.getAll();
            const { newPatients, conflicts: foundConflicts, identicalPatients } =
                detectConflicts(patients, existingPatients);

            if (foundConflicts.length > 0) {
                // Has conflicts → show ConflictDialog
                setConflicts(foundConflicts);
                setPendingNewPatients(newPatients as BackupPatient[]);
                setPendingNewCount(newPatients.length);
                setIdenticalCount(identicalPatients.length);
                setRestoreStep('conflict');
            } else if (newPatients.length > 0) {
                // No conflicts, only new patients → restore directly
                const result = await backupService.restorePatients(
                    newPatients as BackupPatient[], existingPatients,
                );
                const msgs: string[] = [];
                if (result.created > 0) msgs.push(`thêm ${result.created} mới`);
                if (identicalPatients.length > 0) msgs.push(`${identicalPatients.length} giống hệt (bỏ qua)`);
                toast.success(`Đã ${msgs.join(', ')}`);
                closeRestore();
            } else {
                // All identical
                toast('Tất cả bản ghi đã tồn tại và giống hệt, không cần khôi phục', { icon: '✅' });
            }
        } catch (err) {
            console.error('[Backup] Restore error:', err);
            toast.error('Lỗi khi khôi phục');
        } finally {
            setBackupBusy(false);
            setRestoreTarget(null);
        }
    };

    // ─── Restore flow (bulk) ──────────────────────────────────────
    const startRestore = async (backup: BackupMetadata) => {
        setBackupBusy(true);
        try {
            const data = await backupService.getBackupData(backup);
            setRestoreBackup(backup);
            setRestoreData(data);
            setRestoreSelected(new Set(data.map((_, i) => i)));
            setRestoreStep('select');
        } catch {
            toast.error('Lỗi khi tải dữ liệu backup');
        } finally {
            setBackupBusy(false);
        }
    };

    const proceedRestore = async () => {
        const selectedPatients = restoreData.filter((_, i) => restoreSelected.has(i));
        if (selectedPatients.length === 0) {
            toast.error('Chưa chọn bệnh nhân nào');
            return;
        }
        // Use unified handler
        await handleRestorePatients(selectedPatients);
    };

    const handleConflictConfirm = async (overwriteIds: Set<string>) => {
        setBackupBusy(true);
        try {
            const existingPatients = await patientService.getAll();

            // Combine: pending new patients + selected conflict overwrites
            const conflictsToOverwrite = conflicts
                .filter((c) => overwriteIds.has(c.existing.maBenhAnNoiTru))
                .map((c) => c.incoming as BackupPatient);

            const toRestore = [...pendingNewPatients, ...conflictsToOverwrite];

            if (toRestore.length === 0) {
                toast('Không có bản ghi nào để khôi phục', { icon: 'ℹ️' });
                closeRestore();
                return;
            }

            const result = await backupService.restorePatients(toRestore, existingPatients);
            const msgs: string[] = [];
            if (result.created > 0) msgs.push(`thêm ${result.created} mới`);
            if (result.updated > 0) msgs.push(`ghi đè ${result.updated}`);
            toast.success(`Đã ${msgs.join(', ')}`);
            closeRestore();
        } catch {
            toast.error('Lỗi khi khôi phục');
        } finally {
            setBackupBusy(false);
        }
    };

    const closeRestore = () => {
        setRestoreBackup(null);
        setRestoreData([]);
        setRestoreSelected(new Set());
        setRestoreStep(null);
        setConflicts([]);
        setPendingNewPatients([]);
        setPendingNewCount(0);
        setIdenticalCount(0);
    };

    // ─── Import Excel ────────────────────────────────────────────
    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBackupBusy(true);
        try {
            const imported = await parseExcelToPatients(file);
            if (imported.length === 0) {
                toast.error('File không có dữ liệu');
                return;
            }
            setRestoreBackup({ id: 'excel', name: file.name, patientCount: imported.length } as BackupMetadata);
            setRestoreData(imported.map((p) => ({ ...p, createdAt: null, updatedAt: null })) as BackupPatient[]);
            setRestoreSelected(new Set(imported.map((_, i) => i)));
            setRestoreStep('select');
        } catch {
            toast.error('Lỗi khi đọc file Excel');
        } finally {
            setBackupBusy(false);
        }
        e.target.value = '';
    };

    // ─── Helpers ─────────────────────────────────────────────────
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatTimestamp = (ts: BackupMetadata['createdAt']) => {
        if (!ts) return '—';
        const d = ts.toDate();
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const fmtIso = (iso: string | null) => {
        if (!iso) return '—';
        try {
            const d = new Date(iso);
            const pad = (n: number) => String(n).padStart(2, '0');
            return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } catch {
            return iso;
        }
    };

    return (
        <div className="space-y-4">
            {/* ─── Sub-tab navigation ─── */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setSubTab('list')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${subTab === 'list'
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <HardDrive className="w-4 h-4" /> Danh sách
                </button>
                <button
                    onClick={() => setSubTab('search')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${subTab === 'search'
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Search className="w-4 h-4" /> Tìm kiếm
                </button>
                <button
                    onClick={() => setSubTab('config')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${subTab === 'config'
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Settings2 className="w-4 h-4" /> Cấu hình
                </button>
            </div>

            {/* ════════════ SUB-TAB 1: DANH SÁCH ════════════ */}
            {subTab === 'list' && (
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleCreateBackup}
                            disabled={backupBusy}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {backupBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                            Tạo backup
                        </button>
                        <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 cursor-pointer transition-colors">
                            <FileSpreadsheet className="w-4 h-4" /> Import Excel
                            <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
                        </label>
                        <span className="text-sm text-gray-500 self-center ml-auto">
                            {backups.length} bản backup
                        </span>
                    </div>

                    {/* Backup list */}
                    {backupsLoading ? (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải...
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            Chưa có bản backup nào
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {backups.map((backup) => (
                                <div key={backup.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            {renameId === backup.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        autoFocus
                                                        value={renameName}
                                                        onChange={(e) => setRenameName(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleRename(backup.id); if (e.key === 'Escape') setRenameId(null); }}
                                                        className="flex-1 px-2 py-1 rounded border border-primary-300 text-sm focus:ring-2 focus:ring-primary-500"
                                                    />
                                                    <button onClick={() => handleRename(backup.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setRenameId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="font-medium text-gray-900 text-sm">{backup.name}</span>
                                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                                        <span>{formatTimestamp(backup.createdAt)}</span>
                                                        <span>·</span>
                                                        <span>{backup.patientCount} BN</span>
                                                        <span>·</span>
                                                        <span>{formatSize(backup.fileSize)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Badge */}
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${backup.triggerType === 'auto'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'bg-green-50 text-green-700'
                                            }`}>
                                            {backup.triggerType === 'auto' ? 'Tự động' : 'Thủ công'}
                                        </span>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => handleToggleExpand(backup)} title="Xem nội dung"
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                                                {expandedBackup === backup.id ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => startRestore(backup)} title="Khôi phục" disabled={backupBusy}
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40">
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => { setRenameId(backup.id); setRenameName(backup.name); }} title="Đổi tên"
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => setDeleteTarget(backup)} title="Xóa"
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded: enhanced patient table */}
                                    {expandedBackup === backup.id && (
                                        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                                            <div className="max-h-64 overflow-auto rounded-lg border border-gray-200">
                                                <table className="w-full text-xs border-collapse" style={{ minWidth: 1100 }}>
                                                    <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                                                        <tr className="text-gray-500">
                                                            <th className="text-left px-3 py-2 font-semibold whitespace-nowrap w-8">#</th>
                                                            {activeBkCols.filter(c => c.key !== 'backupNguon').map(c => (
                                                                <th key={c.key} className={`${c.align === 'center' ? 'text-center' : 'text-left'} px-3 py-2 font-semibold whitespace-nowrap`}>{c.label}</th>
                                                            ))}
                                                            <th className="text-center px-3 py-2 font-semibold whitespace-nowrap sticky right-0 bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.06)]"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {expandedData.map((p, i) => {
                                                            return (
                                                                <tr key={i}
                                                                    className={`text-gray-700 hover:bg-primary-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-100/70'}`}
                                                                >
                                                                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                                                    {activeBkCols.filter(c => c.key !== 'backupNguon').map(c => (
                                                                        <td key={c.key} className={`px-3 py-2 whitespace-nowrap ${c.align === 'center' ? 'text-center' : ''} ${c.key === 'maBNNC' ? 'font-medium text-primary-700' : c.key === 'hoTen' ? 'font-medium' : c.key === 'psi' ? 'font-medium' : c.key === 'ngayTao' || c.key === 'suaCuoi' ? 'text-gray-500' : ''}`}>
                                                                            {getBkCellValue(p, c.key)}
                                                                        </td>
                                                                    ))}
                                                                    <td className={`px-3 py-2 text-center sticky right-0 shadow-[-2px_0_4px_rgba(0,0,0,0.06)] ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button onClick={() => setDetailPatient(p)} title="Xem chi tiết"
                                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50">
                                                                                <Eye className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button onClick={() => setRestoreTarget(p)} title="Khôi phục"
                                                                                disabled={backupBusy}
                                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 disabled:opacity-40">
                                                                                <RotateCcw className="w-3.5 h-3.5" />
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
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ════════════ SUB-TAB 2: TÌM KIẾM ════════════ */}
            {subTab === 'search' && (
                <div className="space-y-4">
                    {/* Search controls */}
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tìm theo Mã BNNC, Mã BA, Họ tên</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Nhập từ khóa..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>
                        <div className="w-48">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Phạm vi</label>
                            <select
                                value={searchScope}
                                onChange={(e) => setSearchScope(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                            >
                                <option value="all">Tất cả backup</option>
                                {backups.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={searching}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Tìm
                        </button>
                    </div>

                    {/* Search results */}
                    {searching ? (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tìm kiếm...
                        </div>
                    ) : hasSearched && searchResults.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            Không tìm thấy kết quả
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium">
                                Tìm thấy {searchResults.length} kết quả
                            </div>
                            <div className="max-h-[60vh] overflow-auto">
                                <table className="w-full text-xs border-collapse" style={{ minWidth: 1100 }}>
                                    <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                                        <tr className="text-gray-500">
                                            {activeBkCols.map(c => (
                                                <th key={c.key} className={`${c.align === 'center' ? 'text-center' : 'text-left'} px-3 py-2.5 font-semibold whitespace-nowrap`}>{c.label}</th>
                                            ))}
                                            <th className="text-center px-3 py-2.5 font-semibold whitespace-nowrap sticky right-0 bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.06)]">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {searchResults.map((r, i) => {
                                            return (
                                                <tr key={`${r.backupId}-${i}`}
                                                    className={`text-gray-700 hover:bg-primary-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-100/70'}`}
                                                >
                                                    {activeBkCols.map(c => (
                                                        <td key={c.key} className={`px-3 py-2 whitespace-nowrap ${c.align === 'center' ? 'text-center' : ''} ${c.key === 'maBNNC' ? 'font-medium text-primary-700' : c.key === 'hoTen' ? 'font-medium' : c.key === 'psi' ? 'font-medium' : c.key === 'ngayTao' || c.key === 'suaCuoi' ? 'text-gray-500' : ''}`}>
                                                            {c.key === 'backupNguon' ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium max-w-[140px] truncate" title={r.backupName}>
                                                                    🏷 {r.backupName}
                                                                </span>
                                                            ) : getBkCellValue(r.patient, c.key)}
                                                        </td>
                                                    ))}
                                                    <td className={`px-3 py-2 text-center sticky right-0 shadow-[-2px_0_4px_rgba(0,0,0,0.06)] ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => setDetailPatient(r.patient)} title="Xem chi tiết"
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50">
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => setRestoreTarget(r.patient)} title="Khôi phục"
                                                                disabled={backupBusy}
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 disabled:opacity-40">
                                                                <RotateCcw className="w-3.5 h-3.5" />
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
                    ) : !hasSearched ? (
                        <div className="text-center py-12 text-gray-400">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">Bấm "Tìm" để xem toàn bộ hoặc nhập từ khóa để lọc bệnh nhân</p>
                        </div>
                    ) : null}
                </div>
            )}

            {/* ════════════ SUB-TAB 3: CẤU HÌNH ════════════ */}
            {subTab === 'config' && (
                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-medium text-gray-900 text-sm">Cấu hình cột hiển thị</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Chọn các cột sẽ xuất hiện trong bảng backup và tìm kiếm</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => saveBkCols(new Set(ALL_BK_COLS.map(c => c.key)))}
                                    className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                                >
                                    Chọn hết
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    onClick={() => { saveBkCols(bkVisibleCols); toast.success('Đã lưu cấu hình mặc định'); }}
                                    className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                                >
                                    Mặc định
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {BK_COLUMN_GROUPS.map((group) => {
                                const gKeys = group.columns.map(c => c.key);
                                const checkedCount = gKeys.filter(k => bkVisibleCols.has(k)).length;
                                return (
                                    <div key={group.group}>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{group.group}</span>
                                            <span className="text-[10px] text-gray-400">{checkedCount}/{gKeys.length}</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
                                            {group.columns.map(c => (
                                                <label key={c.key} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={bkVisibleCols.has(c.key)}
                                                        onChange={() => toggleBkCol(c.key)}
                                                        className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{c.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="text-xs text-gray-400 mt-4">
                            Đang hiển thị {activeBkCols.length}/{ALL_BK_COLS.length} cột · Cài đặt được lưu tự động và áp dụng trên mọi thiết bị
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Patient Detail Modal ─── */}
            {detailPatient && (
                <PatientDetailModal patient={detailPatient} onClose={() => setDetailPatient(null)} />
            )}

            {/* ─── Restore: Step 1 — Select patients ─── */}
            {restoreStep === 'select' && restoreBackup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={closeRestore} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div>
                                <h2 className="font-heading font-semibold text-gray-900">Khôi phục từ: {restoreBackup.name}</h2>
                                <p className="text-sm text-gray-500">{restoreData.length} bệnh nhân — chọn những BN muốn khôi phục</p>
                            </div>
                            <button onClick={closeRestore} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-3">
                            <div className="flex gap-2 mb-3">
                                <button onClick={() => setRestoreSelected(new Set(restoreData.map((_, i) => i)))}
                                    className="text-sm text-primary-600 font-medium">Chọn tất cả</button>
                                <span className="text-gray-300">|</span>
                                <button onClick={() => setRestoreSelected(new Set())}
                                    className="text-sm text-gray-500 font-medium">Bỏ chọn</button>
                                <span className="ml-auto text-sm text-gray-500">Đã chọn {restoreSelected.size}/{restoreData.length}</span>
                            </div>
                            <div className="space-y-1">
                                {restoreData.map((p, i) => (
                                    <label key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${restoreSelected.has(i) ? 'bg-primary-50' : 'hover:bg-gray-50'
                                        }`}>
                                        <input type="checkbox" checked={restoreSelected.has(i)}
                                            onChange={() => {
                                                const next = new Set(restoreSelected);
                                                if (next.has(i)) next.delete(i); else next.add(i);
                                                setRestoreSelected(next);
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                        <span className="text-sm text-gray-800 flex-1">{p.hanhChinh.hoTen || '(Không tên)'}</span>
                                        <span className="text-xs text-gray-500">{p.maBenhAnNoiTru || '—'}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button onClick={closeRestore}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                Hủy
                            </button>
                            <button onClick={proceedRestore} disabled={restoreSelected.size === 0 || backupBusy}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                {backupBusy ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                                Khôi phục {restoreSelected.size} BN
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Restore: Step 2 — Conflict resolution ─── */}
            {restoreStep === 'conflict' && conflicts.length > 0 && (
                <ConflictDialog
                    conflicts={conflicts}
                    newCount={pendingNewCount}
                    identicalCount={identicalCount}
                    onConfirm={handleConflictConfirm}
                    onCancel={closeRestore}
                />
            )}

            {/* ─── Delete confirmation dialog ─── */}
            {deleteTarget && (
                <ConfirmDialog
                    open={!!deleteTarget}
                    title="Xóa backup"
                    message={`Bạn có chắc chắn muốn xóa backup "${deleteTarget.name}"?\nHành động này không thể hoàn tác.`}
                    confirmLabel="Xóa"
                    cancelLabel="Hủy"
                    destructive
                    onConfirm={() => handleDelete(deleteTarget)}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* ─── Restore single patient confirmation dialog ─── */}
            {restoreTarget && (
                <ConfirmDialog
                    open={!!restoreTarget}
                    title="Khôi phục bệnh nhân"
                    message={`Khôi phục bệnh nhân "${restoreTarget.hanhChinh.hoTen || restoreTarget.maBenhAnNoiTru}"?\nNếu trùng mã BA sẽ hiện so sánh chi tiết.`}
                    confirmLabel="Khôi phục"
                    cancelLabel="Hủy"
                    onConfirm={() => handleRestorePatients([restoreTarget])}
                    onCancel={() => setRestoreTarget(null)}
                />
            )}
        </div>
    );
}
