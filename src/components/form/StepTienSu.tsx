import type { TienSu, ThuocDaDung } from '../../types/patient';
import { DUONG_DUNG_THUOC } from '../../data/formOptions';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
    data: TienSu;
    onChange: (data: TienSu) => void;
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

export default function StepTienSu({ data, onChange }: Props) {
    const update = (field: keyof TienSu, value: boolean | string | number | null) => {
        onChange({ ...data, [field]: value });
    };

    const addThuoc = () => {
        onChange({
            ...data,
            thuocDaDung: [...(data.thuocDaDung || []), {
                id: crypto.randomUUID(),
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
                        {/* Labels row */}
                        <div className="flex items-center gap-2 px-3 flex-wrap sm:flex-nowrap">
                            <span className="w-5"></span>
                            <span className="w-44 text-xs text-gray-500 font-medium">Tên thuốc</span>
                            <span className="w-36 text-xs text-gray-500 font-medium">Đường dùng</span>
                            <span className="w-48 text-xs text-gray-500 font-medium">Liều lượng</span>
                            <span className="w-20 text-xs text-gray-500 font-medium">Số ngày</span>
                            <span className="w-14 text-xs text-gray-500 font-medium">Tổng liều</span>
                            <span className="w-8"></span>
                        </div>
                        {data.thuocDaDung.map((t, i) => (
                            <div key={t.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg flex-wrap sm:flex-nowrap">
                                <span className="text-xs text-gray-400 font-mono w-5">{i + 1}.</span>
                                <input type="text" value={t.tenThuoc} onChange={(e) => updateThuoc(t.id, 'tenThuoc', e.target.value)}
                                    className="w-44 px-2 py-1.5 rounded border border-gray-200 text-sm"
                                    placeholder="Tên thuốc" />
                                <select value={t.duongDung} onChange={(e) => updateThuoc(t.id, 'duongDung', e.target.value)}
                                    className="w-36 px-2 py-1.5 rounded border border-gray-200 text-sm">
                                    <option value="">Đường dùng</option>
                                    {DUONG_DUNG_THUOC.map((d) => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <input type="text" value={t.lieuLuong} onChange={(e) => updateThuoc(t.id, 'lieuLuong', e.target.value)}
                                    className="w-48 px-2 py-1.5 rounded border border-gray-200 text-sm"
                                    placeholder="Liều lượng" />
                                <input type="number" value={t.thoiGianDung ?? ''} onChange={(e) => updateThuoc(t.id, 'thoiGianDung', e.target.value ? Number(e.target.value) : null)}
                                    className="w-20 px-2 py-1.5 rounded border border-gray-200 text-sm"
                                    placeholder="Ngày" min="0" />
                                <input type="text" value={t.tongLieu} onChange={(e) => updateThuoc(t.id, 'tongLieu', e.target.value)}
                                    className="w-14 px-2 py-1.5 rounded border border-gray-200 text-sm"
                                    placeholder="Tổng liều" />
                                <button onClick={() => removeThuoc(t.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
