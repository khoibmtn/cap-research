import type { ViKhuan, KhangSinhResult } from '../../types/patient';
import { DEFAULT_BACTERIA, DEFAULT_ANTIBIOTICS, MUC_DO_KHANG_SINH } from '../../data/formOptions';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Props {
    data: ViKhuan[];
    onChange: (data: ViKhuan[]) => void;
}

export default function StepViKhuan({ data, onChange }: Props) {
    // Default: all bacteria with coKhong=true start expanded
    const defaultExpanded = useMemo(() => new Set(data.filter(v => v.coKhong).map(v => v.id)), []);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(defaultExpanded);

    const addBacteria = () => {
        const usedNames = data.map((v) => v.tenViKhuan);
        const available = DEFAULT_BACTERIA.filter((b) => !usedNames.includes(b));
        const newVk: ViKhuan = {
            id: crypto.randomUUID(),
            tenViKhuan: available[0] || '',
            coKhong: false,
            khangSinhDo: DEFAULT_ANTIBIOTICS.map((ks) => ({ tenKhangSinh: ks, mucDo: '' as const })),
        };
        onChange([...data, newVk]);
        setExpandedIds(prev => new Set(prev).add(newVk.id));
    };

    const removeBacteria = (id: string) => {
        onChange(data.filter((v) => v.id !== id));
        setExpandedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    };

    const updateBacteria = (id: string, field: keyof ViKhuan, value: unknown) => {
        onChange(data.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
    };

    const updateKhangSinh = (vkId: string, ksName: string, mucDo: string) => {
        onChange(
            data.map((v) => {
                if (v.id !== vkId) return v;
                return {
                    ...v,
                    khangSinhDo: v.khangSinhDo.map((ks) =>
                        ks.tenKhangSinh === ksName ? { ...ks, mucDo: mucDo as KhangSinhResult['mucDo'] } : ks
                    ),
                };
            })
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-lg text-gray-900">F. Vi khuẩn & Kháng sinh đồ</h2>
                <button onClick={addBacteria}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Thêm vi khuẩn mọc
                </button>
            </div>

            {data.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-8">
                    Chưa có vi khuẩn. Nhấn "+ Thêm vi khuẩn mọc" để bắt đầu.
                </p>
            ) : (
                <div className="space-y-3">
                    {data.map((vk) => (
                        <div key={vk.id} className="border border-gray-200 rounded-xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                                <select value={vk.tenViKhuan}
                                    onChange={(e) => updateBacteria(vk.id, 'tenViKhuan', e.target.value)}
                                    className="flex-1 px-2 py-1 rounded border border-gray-200 text-sm font-medium bg-white">
                                    <option value="">-- Chọn vi khuẩn --</option>
                                    {DEFAULT_BACTERIA.filter((b) =>
                                        b === vk.tenViKhuan || !data.some((other) => other.id !== vk.id && other.tenViKhuan === b)
                                    ).map((b) => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                                    <input type="checkbox" checked={vk.coKhong}
                                        onChange={(e) => {
                                            updateBacteria(vk.id, 'coKhong', e.target.checked);
                                            if (e.target.checked) {
                                                setExpandedIds(prev => new Set(prev).add(vk.id));
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                    <span className="text-xs font-medium text-gray-600 select-none">KS đồ</span>
                                </label>
                                {vk.coKhong && (
                                    <button onClick={() => setExpandedIds(prev => { const next = new Set(prev); if (next.has(vk.id)) next.delete(vk.id); else next.add(vk.id); return next; })}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors flex-shrink-0">
                                        {expandedIds.has(vk.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                )}
                                <button onClick={() => removeBacteria(vk.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors flex-shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Antibiotic susceptibility (expanded when checked) */}
                            {vk.coKhong && expandedIds.has(vk.id) && (
                                <div className="p-4 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kháng sinh đồ</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {vk.khangSinhDo.map((ks) => (
                                            <div key={ks.tenKhangSinh} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                                                <span className="text-xs text-gray-700 flex-1 truncate">{ks.tenKhangSinh}</span>
                                                <div className="flex gap-1">
                                                    {MUC_DO_KHANG_SINH.map(({ value }) => (
                                                        <button key={value}
                                                            onClick={() => updateKhangSinh(vk.id, ks.tenKhangSinh, ks.mucDo === value ? '' : value)}
                                                            className={`px-2 py-0.5 text-xs rounded font-medium transition-colors
                                ${ks.mucDo === value
                                                                    ? value === 'S' ? 'bg-green-500 text-white'
                                                                        : value === 'I' ? 'bg-yellow-500 text-white'
                                                                            : 'bg-red-500 text-white'
                                                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                                                }`}>
                                                            {value}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
