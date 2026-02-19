import type { TienSu } from '../../types/patient';

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
        </div>
    );
}
