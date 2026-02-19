import { useEffect, useRef } from 'react';
import type { PSIData, LamSang, XetNghiem, TienSu, HinhAnh } from '../../types/patient';
import { PSI_LABELS } from '../../data/formOptions';

interface Props {
    data: PSIData;
    tuoi: number | null;
    gioiTinh: string;
    lamSang: LamSang;
    xetNghiem: XetNghiem;
    tienSu: TienSu;
    hinhAnh: HinhAnh;
    psiResult: { tongDiem: number; phanTang: string; chiTietDiem: Record<string, number> };
    onChange: (data: PSIData) => void;
}

// Parse huyetAp "120/80" → { tamThu: 120, tamTruong: 80 }
function parseHuyetAp(s: string): { tamThu: number | null } {
    if (!s) return { tamThu: null };
    const parts = s.split('/');
    const tamThu = Number(parts[0]);
    return { tamThu: isNaN(tamThu) ? null : tamThu };
}

export default function StepPSI({ data, tuoi, gioiTinh, lamSang, xetNghiem, tienSu, hinhAnh, psiResult, onChange }: Props) {
    const hasAutoChecked = useRef(false);

    // Auto-check PSI criteria from clinical + lab data (once when navigating to this tab)
    useEffect(() => {
        if (hasAutoChecked.current) return;
        hasAutoChecked.current = true;

        const auto: Partial<Record<string, boolean>> = {};

        // ── From Tiền sử ──
        if (tienSu.ungThu) auto['ungThu'] = true;
        if (tienSu.suyTimUHuyet) auto['suyTimUHuyet'] = true;
        if (tienSu.benhMachMauNao) auto['benhMachMauNao'] = true;
        if (tienSu.benhThanMan) auto['benhThan'] = true;

        // ── From Lâm sàng ──
        if (lamSang.nhipTho !== null && lamSang.nhipTho >= 30) auto['tanSoTho30'] = true;
        const { tamThu } = parseHuyetAp(lamSang.huyetAp);
        if (tamThu !== null && tamThu < 90) auto['huyetApTamThu90'] = true;
        if (lamSang.nhietDo !== null && (lamSang.nhietDo < 35 || lamSang.nhietDo >= 40)) auto['thanNhiet3540'] = true;
        if (lamSang.mach !== null && lamSang.mach >= 125) auto['mach125'] = true;
        if (lamSang.diemGlasgow !== null && lamSang.diemGlasgow < 15) auto['thayDoiTriGiac'] = true;

        // ── From Xét nghiệm ──
        if (xetNghiem.ph !== null && xetNghiem.ph < 7.35) auto['ph735'] = true;
        // BUN ≥ 11 mmol/L (ure ≈ BUN in our data)
        if (xetNghiem.ure !== null && xetNghiem.ure >= 11) auto['bun30'] = true;
        if (xetNghiem.hct !== null && xetNghiem.hct < 30) auto['hematocrit30'] = true;
        if (xetNghiem.na !== null && xetNghiem.na < 130) auto['naMau130'] = true;
        // Glucose ≥ 14 mmol/L
        if (xetNghiem.glucose !== null && xetNghiem.glucose >= 14) auto['glucoseMau250'] = true;
        // PaO2 < 60 mmHg OR SpO2 < 90%
        if ((xetNghiem.paCO2 !== null) || (lamSang.spO2 !== null)) {
            // Note: paCO2 is stored but we need paO2 - we don't have paO2 directly
            // Check SpO2 from lamSang
            if (lamSang.spO2 !== null && lamSang.spO2 < 90) auto['paO2_60'] = true;
        }

        // ── From Hình ảnh ──
        if (hinhAnh.xquangTranDichMangPhoi || hinhAnh.ctTranDichMangPhoi) auto['tranDichMangPhoi'] = true;

        // Only apply auto-checks that haven't been manually unchecked
        const hasAnyAutoData = Object.keys(auto).length > 0;
        if (hasAnyAutoData) {
            const newCriteria = { ...data.criteria };
            let changed = false;
            for (const [key, val] of Object.entries(auto)) {
                if (val && !newCriteria[key as keyof typeof newCriteria]) {
                    (newCriteria as unknown as Record<string, boolean>)[key] = true;
                    changed = true;
                }
            }
            if (changed) {
                onChange({ ...data, criteria: newCriteria });
            }
        }
    }, []); // Run once on mount

    const toggleCriteria = (key: string) => {
        onChange({
            ...data,
            criteria: { ...data.criteria, [key]: !data.criteria[key as keyof typeof data.criteria] },
        });
    };

    const riskColor = () => {
        const d = psiResult.tongDiem;
        if (d <= 70) return 'bg-green-50 border-green-200 text-green-800';
        if (d <= 90) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        if (d <= 130) return 'bg-orange-50 border-orange-200 text-orange-800';
        return 'bg-red-50 border-red-200 text-red-800';
    };

    return (
        <div className="space-y-6">
            <h2 className="font-heading font-semibold text-lg text-gray-900">G. Tính điểm PSI</h2>

            {/* Auto-check notice */}
            <div className="text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-2">
                💡 Các mục đã được tự động đánh dấu dựa trên dữ liệu từ tab Lâm sàng, Xét nghiệm và Hình ảnh. Bạn vẫn có thể chỉnh sửa thủ công.
            </div>

            {/* Summary card */}
            <div className={`rounded-xl border-2 p-5 ${riskColor()}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium">Tổng điểm PSI</p>
                        <p className="text-4xl font-bold mt-1">{psiResult.tongDiem}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium">Phân tầng</p>
                        <p className="text-lg font-semibold mt-1">{psiResult.phanTang || '—'}</p>
                    </div>
                </div>

                {/* Age/gender auto-score */}
                <div className="mt-3 pt-3 border-t border-current/10 text-sm">
                    <span className="opacity-75">Tuổi:</span>{' '}
                    <span className="font-medium">{tuoi ?? '—'}</span>
                    {gioiTinh === 'nu' && <span className="opacity-75 ml-2">(Nữ: tuổi − 10)</span>}
                    <span className="opacity-75 ml-4">→ Điểm tuổi:</span>{' '}
                    <span className="font-medium">{psiResult.chiTietDiem['tuoi'] ?? '—'}</span>
                </div>
            </div>

            {/* Criteria checkboxes */}
            <div className="space-y-4">
                {/* Group: Đặc điểm dân số học */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Đặc điểm dân số học</h3>
                    <CriteriaItem k="nhaDuongLao" data={data} onToggle={toggleCriteria} />
                </div>

                {/* Group: Bệnh đồng mắc */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Bệnh đồng mắc</h3>
                    {(['ungThu', 'benhGan', 'suyTimUHuyet', 'benhMachMauNao', 'benhThan'] as const).map((k) => (
                        <CriteriaItem key={k} k={k} data={data} onToggle={toggleCriteria} />
                    ))}
                </div>

                {/* Group: Triệu chứng thực thể */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Triệu chứng thực thể</h3>
                    {(['thayDoiTriGiac', 'tanSoTho30', 'huyetApTamThu90', 'thanNhiet3540', 'mach125'] as const).map((k) => (
                        <CriteriaItem key={k} k={k} data={data} onToggle={toggleCriteria} />
                    ))}
                </div>

                {/* Group: Kết quả xét nghiệm */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Kết quả xét nghiệm & X-quang</h3>
                    {(['ph735', 'bun30', 'hematocrit30', 'naMau130', 'glucoseMau250', 'paO2_60', 'tranDichMangPhoi'] as const).map((k) => (
                        <CriteriaItem key={k} k={k} data={data} onToggle={toggleCriteria} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function CriteriaItem({ k, data, onToggle }: {
    k: string;
    data: PSIData;
    onToggle: (key: string) => void;
}) {
    const info = PSI_LABELS[k];
    if (!info) return null;

    const checked = data.criteria[k as keyof typeof data.criteria] as boolean;


    return (
        <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
                <input type="checkbox" checked={checked}
                    onChange={() => onToggle(k)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-gray-700">{info.label}</span>
            </div>
            <span className={`text-sm font-mono font-medium ${checked ? 'text-primary-700' : 'text-gray-300'}`}>
                +{info.diem}
            </span>
        </label>
    );
}
