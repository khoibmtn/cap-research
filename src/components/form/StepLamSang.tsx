import type { LamSang } from '../../types/patient';
import { DOM_TINH_OPTIONS, BEN_OPTIONS } from '../../data/formOptions';
import DateInput from '../ui/DateInput';
import toast from 'react-hot-toast';

interface Props {
    data: LamSang;
    ngayVaoVien: string;
    onChange: (data: LamSang) => void;
}

// ── Extracted outside to avoid remount/focus-loss on every render ──
function NumberInput({ label, value, unit, step, onChange }: {
    label: string; value: number | null; unit?: string; step?: string;
    onChange: (v: number | null) => void;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label} {unit && <span className="text-gray-400 font-normal">({unit})</span>}</label>
            <input
                type="number"
                inputMode="decimal"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                onKeyDown={(e) => { if (['e', 'E', '+'].includes(e.key)) e.preventDefault(); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                step={step || '0.1'}
            />
        </div>
    );
}

export default function StepLamSang({ data, ngayVaoVien, onChange }: Props) {
    const update = (field: keyof LamSang, value: unknown) => {
        onChange({ ...data, [field]: value });
    };

    const parseDateStr = (s: string): Date | null => {
        if (!s) return null;
        if (s.includes('-')) { const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
        const parts = s.split('/');
        if (parts.length !== 3) return null;
        const [d, m, y] = parts.map(Number);
        if (!d || !m || !y) return null;
        return new Date(y, m - 1, d);
    };

    const validateTrieuChung = (newTrieuChung: string) => {
        if (!newTrieuChung || !ngayVaoVien) return;
        const tc = parseDateStr(newTrieuChung);
        const vao = parseDateStr(ngayVaoVien);
        if (tc && vao && tc > vao) {
            toast.error('Thời điểm triệu chứng phải ≤ ngày nhập viện. Đã xóa giá trị.', { duration: 4000 });
            onChange({ ...data, thoiDiemTrieuChung: '' });
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="font-heading font-semibold text-lg text-gray-900">C. Triệu chứng lâm sàng</h2>

            <DateInput label="Thời điểm xuất hiện triệu chứng so với nhập viện"
                value={data.thoiDiemTrieuChung}
                onChange={(v) => update('thoiDiemTrieuChung', v)}
                onBlur={validateTrieuChung}
                className="w-full" />

            {/* Vital signs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <NumberInput label="Mạch" value={data.mach} unit="lần/phút" step="1" onChange={(v) => update('mach', v)} />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Huyết áp <span className="text-gray-400 font-normal">(mmHg)</span></label>
                    <input type="text" value={data.huyetAp} onChange={(e) => {
                        // Only allow digits and /
                        const val = e.target.value.replace(/[^0-9/]/g, '');
                        update('huyetAp', val);
                    }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="120/80" inputMode="numeric" />
                </div>
                <NumberInput label="Nhiệt độ" value={data.nhietDo} unit="°C" onChange={(v) => update('nhietDo', v)} />
                <NumberInput label="Nhịp thở" value={data.nhipTho} unit="lần/phút" step="1" onChange={(v) => update('nhipTho', v)} />
                <NumberInput label="SpO2" value={data.spO2} unit="%" onChange={(v) => update('spO2', v)} />
                <NumberInput label="BMI" value={data.bmi} unit="kg/m²" onChange={(v) => update('bmi', v)} />
                <NumberInput label="Điểm Glasgow" value={data.diemGlasgow} step="1" onChange={(v) => update('diemGlasgow', v)} />
            </div>

            {/* Respiratory symptoms */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Triệu chứng hô hấp</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                        { key: 'hoKhan', label: 'Ho khan' },
                        { key: 'hoMau', label: 'Ho máu' },
                        { key: 'dauNguc', label: 'Đau ngực' },
                        { key: 'khoTho', label: 'Khó thở' },
                        { key: 'ranAm', label: 'Ran ẩm' },
                        { key: 'ranNo', label: 'Ran nổ' },
                        { key: 'ranRit', label: 'Ran rít' },
                        { key: 'ranNgay', label: 'Ran ngáy' },
                    ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" checked={data[key as keyof LamSang] as boolean}
                                onChange={(e) => update(key as keyof LamSang, e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                            <span className="text-sm text-gray-700">{label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Sputum */}
            <div>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input type="checkbox" checked={data.hoKhacDom}
                        onChange={(e) => update('hoKhacDom', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm font-medium text-gray-700">Ho khạc đờm</span>
                </label>
                {data.hoKhacDom && (
                    <div className="ml-6 space-y-3">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Tính chất đờm:</label>
                            <div className="flex gap-3">
                                {DOM_TINH_OPTIONS.map((opt) => (
                                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" checked={data.domTinh.includes(opt)}
                                            onChange={(e) => {
                                                const newVals = e.target.checked ? [...data.domTinh, opt] : data.domTinh.filter((v) => v !== opt);
                                                update('domTinh', newVals);
                                            }}
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                        <span className="text-sm text-gray-600">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Màu sắc đờm:</label>
                            <input type="text" value={data.domMauSac} onChange={(e) => update('domMauSac', e.target.value)}
                                className="w-40 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                        </div>
                    </div>
                )}
            </div>

            {/* Syndromes */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Hội chứng</h3>
                {[
                    { key: 'hoiChungTDMP', label: 'Hội chứng TDMP (tràn dịch màng phổi)' },
                    { key: 'hoiChungDongDac', label: 'Hội chứng đông đặc' },
                    { key: 'hoiChungTKMP', label: 'Hội chứng TKMP (tràn khí màng phổi)' },
                ].map(({ key, label }) => {
                    const val = data[key as keyof LamSang] as { co: boolean; ben: string };
                    return (
                        <div key={key} className="flex items-center gap-4 mb-3">
                            <label className="flex items-center gap-2 cursor-pointer min-w-[240px]">
                                <input type="checkbox" checked={val.co}
                                    onChange={(e) => update(key as keyof LamSang, { ...val, co: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-700">{label}</span>
                            </label>
                            {val.co && (
                                <select value={val.ben}
                                    onChange={(e) => update(key as keyof LamSang, { ...val, ben: e.target.value })}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                                    <option value="">-- Bên --</option>
                                    {BEN_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                                </select>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
