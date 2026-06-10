import { useState, useRef, useEffect } from 'react';
import type { TienSu, ThuocDaDung, DrugGenericName } from '../../types/patient';
import { DUONG_DUNG_THUOC } from '../../data/formOptions';
import { Plus, Trash2, Search, X } from 'lucide-react';

interface Props {
    data: TienSu;
    onChange: (data: TienSu) => void;
    drugGenericNames: DrugGenericName[];
}

const DISEASES = [
    { key: 'daiThaoDuong', label: 'Đái tháo đường' },
    { key: 'tangHuyetAp', label: 'Tăng huyết áp' },
    { key: 'viemDaDay', label: 'Viêm dạ dày' },
    { key: 'viemGanMan', label: 'Viêm gan mạn' },
    { key: 'benhThanMan', label: 'Bệnh thận mạn' },
    { key: 'gut', label: 'Gút' },
    { key: 'ungThu', label: 'Ung thư' },
    { key: 'suyTimUHuyet', label: 'Suy tim ứ huyết' },
    { key: 'benhMachMauNao', label: 'Bệnh mạch máu não' },
] as const;

// ─── Autocomplete for generic drug names ─────────────────────────
function DrugGenericAutocomplete({
    value,
    options,
    onChange,
}: {
    value: string;
    options: DrugGenericName[];
    onChange: (tenGoc: string) => void;
}) {
    const [query, setQuery] = useState(value || '');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Sync external value
    useEffect(() => { setQuery(value || ''); }, [value]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = query.trim()
        ? options.filter(o => o.ten.toLowerCase().includes(query.toLowerCase()))
        : options;

    const handleSelect = (item: DrugGenericName) => {
        onChange(item.ten);
        setQuery(item.ten);
        setOpen(false);
    };

    const handleInputChange = (val: string) => {
        setQuery(val);
        setOpen(true);
        // If user clears or changes, clear the actual value
        if (val !== value) {
            onChange('');
        }
    };


    const selectedItem = options.find(o => o.ten === value);

    return (
        <div ref={ref} className="relative">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder="Gõ để tìm tên gốc thuốc..."
                    className={`w-full pl-8 pr-3 py-2 rounded-lg border text-sm transition-colors ${value
                        ? 'border-green-300 bg-green-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                        } focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                />
                {selectedItem && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 whitespace-nowrap">
                        {selectedItem.nhom1}
                    </span>
                )}
                {value && (
                    <button
                        onClick={() => { onChange(''); setQuery(''); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        style={selectedItem ? { right: `${selectedItem.nhom1.length * 7 + 28}px` } : undefined}
                        title="Xóa lựa chọn"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            {open && filtered.length > 0 && (
                <div className="absolute z-50 mt-1 w-full min-w-[280px] bg-white border border-gray-200 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                    {filtered.map((item) => (
                        <button
                            key={item.ten}
                            onClick={() => handleSelect(item)}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-primary-50 flex items-center justify-between gap-3 transition-colors border-b border-gray-50 last:border-0 ${item.ten === value ? 'bg-primary-50 font-medium text-primary-700' : 'text-gray-700'
                                }`}
                        >
                            <span>{item.ten}</span>
                            <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                {item.nhom1}
                            </span>
                        </button>
                    ))}
                </div>
            )}
            {open && filtered.length === 0 && query.trim() && (
                <div className="absolute z-50 mt-1 w-full min-w-[280px] bg-white border border-gray-200 rounded-lg shadow-xl p-3 text-sm text-gray-400 italic">
                    Không tìm thấy "{query}"
                </div>
            )}
        </div>
    );
}

export default function StepTienSu({ data, onChange, drugGenericNames }: Props) {
    const update = (field: keyof TienSu, value: boolean | string | number | null) => {
        onChange({ ...data, [field]: value });
    };

    const addThuoc = () => {
        onChange({
            ...data,
            thuocDaDung: [...(data.thuocDaDung || []), {
                id: crypto.randomUUID(),
                tenGoc: '',
                tenThuoc: '',
                lieuLuong: '',
                tongLieu: '',
                duongDung: '',
                thoiGianDung: null,
            }],
        });
    };

    const removeThuoc = (id: string) => {
        onChange({
            ...data,
            thuocDaDung: (data.thuocDaDung || []).filter((t) => t.id !== id),
        });
    };

    const updateThuoc = (id: string, field: keyof ThuocDaDung, value: string | number | null) => {
        onChange({
            ...data,
            thuocDaDung: (data.thuocDaDung || []).map((t) =>
                t.id === id ? { ...t, [field]: value } : t
            ),
        });
    };

    return (
        <div className="space-y-6">
            <h2 className="font-heading font-semibold text-lg text-gray-900">B. Tiền sử</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DISEASES.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={data[key] as boolean} onChange={(e) => update(key, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm text-gray-700">{label}</span>
                    </label>
                ))}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khác (ghi rõ)</label>
                <input type="text" value={data.khac} onChange={(e) => update('khac', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Bệnh khác..." />
            </div>

            <div className="border-t border-gray-100 pt-4">
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input type="checkbox" checked={data.hutThuocLa} onChange={(e) => update('hutThuocLa', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm font-medium text-gray-700">Hút thuốc lá</span>
                </label>
                {data.hutThuocLa && (
                    <div className="ml-6">
                        <label className="block text-sm text-gray-600 mb-1">Số bao-năm</label>
                        <input type="number" value={data.soBaoNam ?? ''} onChange={(e) => update('soBaoNam', e.target.value ? Number(e.target.value) : null)}
                            className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            step="0.1" />
                    </div>
                )}
            </div>

            {/* Thuốc đã dùng trước nhập viện */}
            <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">Thuốc đã dùng trước nhập viện</h3>
                    <button onClick={addThuoc}
                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
                        <Plus className="w-3.5 h-3.5" /> Thêm thuốc
                    </button>
                </div>

                {(!data.thuocDaDung || data.thuocDaDung.length === 0) ? (
                    <p className="text-sm text-gray-400 italic">Chưa có thuốc. Nhấn "Thêm thuốc" để bắt đầu.</p>
                ) : (
                    <div className="space-y-3">
                        {data.thuocDaDung.map((t, i) => (
                            <div key={t.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                {/* Row 1: STT + Tên gốc (full width) + Delete */}
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400 font-mono shrink-0 w-5">{i + 1}.</span>
                                    <div className="flex-1">
                                        <label className="block text-[11px] text-gray-500 font-medium mb-1">Tên gốc (bắt buộc)</label>
                                        <DrugGenericAutocomplete
                                            value={t.tenGoc || ''}
                                            options={drugGenericNames}
                                            onChange={(v) => updateThuoc(t.id, 'tenGoc', v)}
                                        />
                                    </div>
                                    <button onClick={() => removeThuoc(t.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 self-end mb-0.5"
                                        title="Xóa thuốc này">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                {/* Row 2: Other fields in grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 ml-8">
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">Tên biệt dược</label>
                                        <input type="text" value={t.tenThuoc} onChange={(e) => updateThuoc(t.id, 'tenThuoc', e.target.value)}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm hover:border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="VD: Amikacin 1g" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">Đường dùng</label>
                                        <select value={t.duongDung} onChange={(e) => updateThuoc(t.id, 'duongDung', e.target.value)}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm hover:border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                                            <option value="">Chọn...</option>
                                            {DUONG_DUNG_THUOC.map((d) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">Liều lượng</label>
                                        <input type="text" value={t.lieuLuong} onChange={(e) => updateThuoc(t.id, 'lieuLuong', e.target.value)}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm hover:border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="VD: 1g/ngày" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">Số ngày</label>
                                        <input type="number" value={t.thoiGianDung ?? ''} onChange={(e) => updateThuoc(t.id, 'thoiGianDung', e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm hover:border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="Ngày" min="0" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">Tổng liều</label>
                                        <input type="text" value={t.tongLieu} onChange={(e) => updateThuoc(t.id, 'tongLieu', e.target.value)}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm hover:border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="Tổng" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
