import type { XetNghiem, ChiSoTinhToan } from '../../types/patient';

interface Props {
    data: XetNghiem;
    indices: ChiSoTinhToan;
    onChange: (data: XetNghiem) => void;
}

// ── Extracted outside to avoid remount/focus-loss on every render ──
function NumField({ label, value, unit, step, onChange }: {
    label: string; value: number | null; unit?: string; step?: string;
    onChange: (v: number | null) => void;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
                {label} {unit && <span className="text-gray-400">({unit})</span>}
            </label>
            <input
                type="number"
                inputMode="decimal"
                step={step || '0.01'}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                onKeyDown={(e) => { if (['e', 'E', '+'].includes(e.key)) e.preventDefault(); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
        </div>
    );
}

export default function StepXetNghiem({ data, indices, onChange }: Props) {
    const update = (field: keyof XetNghiem, value: number | null) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6">
            <h2 className="font-heading font-semibold text-lg text-gray-900">D. Xét nghiệm</h2>

            {/* Công thức máu */}
            <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">1. Công thức máu</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <NumField label="WBC" value={data.wbc} unit="G/l" onChange={(v) => update('wbc', v)} />
                    <NumField label="Neutrophil" value={data.neutrophil} unit="%" onChange={(v) => update('neutrophil', v)} />
                    <NumField label="Lymphocyte" value={data.lymphocyte} unit="%" onChange={(v) => update('lymphocyte', v)} />
                    <NumField label="RBC" value={data.rbc} unit="T/l" onChange={(v) => update('rbc', v)} />
                    <NumField label="Hemoglobin" value={data.hemoglobin} unit="g/l" onChange={(v) => update('hemoglobin', v)} />
                    <NumField label="Hct" value={data.hct} unit="%" onChange={(v) => update('hct', v)} />
                    <NumField label="PLT" value={data.plt} unit="G/l" onChange={(v) => update('plt', v)} />
                </div>
            </div>

            {/* Sinh hoá máu */}
            <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">2. Sinh hoá máu</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <NumField label="Ure" value={data.ure} unit="mmol/l" onChange={(v) => update('ure', v)} />
                    <NumField label="Creatinin" value={data.creatinin} unit="µmol/l" onChange={(v) => update('creatinin', v)} />
                    <NumField label="AST" value={data.ast} unit="U/l" onChange={(v) => update('ast', v)} />
                    <NumField label="ALT" value={data.alt} unit="U/l" onChange={(v) => update('alt', v)} />
                    <NumField label="GGT" value={data.ggt} unit="U/l" onChange={(v) => update('ggt', v)} />
                    <NumField label="Glucose" value={data.glucose} unit="µmol/l" onChange={(v) => update('glucose', v)} />
                    <NumField label="Protein" value={data.protein} unit="g/l" onChange={(v) => update('protein', v)} />
                    <NumField label="Albumin" value={data.albumin} unit="g/l" onChange={(v) => update('albumin', v)} />
                    <NumField label="CRP" value={data.crp} unit="mg/L" onChange={(v) => update('crp', v)} />
                    <NumField label="Procalcitonin" value={data.procalcitonin} unit="pg/ml" onChange={(v) => update('procalcitonin', v)} />
                </div>
            </div>

            {/* Điện giải đồ */}
            <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">3. Điện giải đồ</h3>
                <div className="grid grid-cols-3 gap-3">
                    <NumField label="Na+" value={data.na} unit="mmol/l" onChange={(v) => update('na', v)} />
                    <NumField label="K+" value={data.k} unit="mmol/l" onChange={(v) => update('k', v)} />
                    <NumField label="Cl-" value={data.cl} unit="mmol/l" onChange={(v) => update('cl', v)} />
                </div>
            </div>

            {/* Khí máu */}
            <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">4. Khí máu</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <NumField label="pH" value={data.ph} onChange={(v) => update('ph', v)} />
                    <NumField label="SaO2" value={data.saO2} unit="%" onChange={(v) => update('saO2', v)} />
                    <NumField label="PaCO2" value={data.paCO2} unit="mmHg" onChange={(v) => update('paCO2', v)} />
                    <NumField label="HCO3-" value={data.hcO3} unit="mmol/l" onChange={(v) => update('hcO3', v)} />
                    <NumField label="BE" value={data.be} onChange={(v) => update('be', v)} />
                </div>
            </div>

            {/* Dấu ấn sinh học */}
            <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">5. Dấu ấn sinh học</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <NumField label="sTREM-1" value={data.sTREM1} onChange={(v) => update('sTREM1', v)} />
                    <NumField label="TIMP-1" value={data.tIMP1} onChange={(v) => update('tIMP1', v)} />
                    <NumField label="IL-6" value={data.il6} onChange={(v) => update('il6', v)} />
                    <NumField label="IL-10" value={data.il10} onChange={(v) => update('il10', v)} />
                    <NumField label="IL-17" value={data.il17} onChange={(v) => update('il17', v)} />
                </div>
            </div>

            {/* Auto-calculated indices */}
            <div>
                <h3 className="text-sm font-semibold text-primary-700 mb-3 pb-2 border-b border-primary-100">6. Chỉ số tính toán (tự động)</h3>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'NLR (Neutrophil/Lymphocyte)', value: indices.nlr },
                        { label: 'PLR (PLT/Lymphocyte)', value: indices.plr },
                        { label: 'CAR (CRP/Albumin)', value: indices.car },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-primary-50 rounded-lg p-3">
                            <p className="text-xs text-primary-600 font-medium mb-1">{label}</p>
                            <p className="text-lg font-bold text-primary-800">{value !== null ? value : '—'}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
