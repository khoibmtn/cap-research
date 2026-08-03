import { useEffect } from 'react';
import type { PSIData, LamSang, XetNghiem, TienSu, HinhAnh } from '../../types/patient';
import { PSI_LABELS } from '../../data/formOptions';
import toast from 'react-hot-toast';

interface Props {
    data: PSIData;
    tuoi: number | null;
    gioiTinh: string;
    lamSang: LamSang;
    xetNghiem: XetNghiem;
    tienSu: TienSu;
    hinhAnh: HinhAnh;
    psiResult: { tongDiem: number; phanTang: string; chiTietDiem: Record<string, number> };
    /** Confusion state from CURB-65 (answered in Lâm sàng tab) */
    confusion?: boolean;
    confusionAsked?: boolean;
    onChange: (data: PSIData) => void;
}

// Parse huyetAp "120/80" → { tamThu: 120, tamTruong: 80 }
function parseHuyetAp(s: string): { tamThu: number | null } {
    if (!s) return { tamThu: null };
    const parts = s.split('/');
    const tamThu = Number(parts[0]);
    return { tamThu: isNaN(tamThu) ? null : tamThu };
}

export default function StepPSI({ data, tuoi, gioiTinh, lamSang, xetNghiem, tienSu, hinhAnh, psiResult, confusion, confusionAsked, onChange }: Props) {

    // Reactive auto-sync: always derive checkboxes from source data


    useEffect(() => {
        const auto: Record<string, boolean> = {};

        // ── From Tiền sử ──
        auto['ungThu'] = !!tienSu.ungThu;
        auto['suyTimUHuyet'] = !!tienSu.suyTimUHuyet;
        auto['benhMachMauNao'] = !!tienSu.benhMachMauNao;
        auto['benhThan'] = !!tienSu.benhThanMan;

        // ── From Lâm sàng ──
        auto['tanSoTho30'] = lamSang.nhipTho !== null && lamSang.nhipTho >= 30;
        const { tamThu } = parseHuyetAp(lamSang.huyetAp);
        auto['huyetApTamThu90'] = tamThu !== null && tamThu < 90;
        auto['thanNhiet3540'] = lamSang.nhietDo !== null && (lamSang.nhietDo < 35 || lamSang.nhietDo >= 40);
        auto['mach125'] = lamSang.mach !== null && lamSang.mach >= 125;
        // thayDoiTriGiac: use confusion answer if asked, otherwise check Glasgow < 15
        if (confusionAsked && confusion !== undefined) {
            auto['thayDoiTriGiac'] = confusion;
        } else {
            auto['thayDoiTriGiac'] = lamSang.diemGlasgow !== null && lamSang.diemGlasgow < 15;
        }

        // ── From Xét nghiệm ──
        auto['ph735'] = xetNghiem.ph !== null && xetNghiem.ph < 7.35;
        auto['bun30'] = xetNghiem.ure !== null && xetNghiem.ure >= 11;
        auto['hematocrit30'] = xetNghiem.hct !== null && xetNghiem.hct < 30;
        auto['naMau130'] = xetNghiem.na !== null && xetNghiem.na < 130;
        auto['glucoseMau250'] = xetNghiem.glucose !== null && xetNghiem.glucose >= 14;
        auto['paO2_60'] = lamSang.spO2 !== null && lamSang.spO2 < 90;

        // ── From Hình ảnh ──
        auto['tranDichMangPhoi'] = !!(hinhAnh.xquangTranDichMangPhoi || hinhAnh.ctTranDichMangPhoi);

        // Compare with current criteria — only update if something changed
        const newCriteria = { ...data.criteria };
        let changed = false;
        for (const [key, val] of Object.entries(auto)) {
            const current = newCriteria[key as keyof typeof newCriteria] as boolean;
            if (current !== val) {
                (newCriteria as unknown as Record<string, boolean>)[key] = val;
                changed = true;
            }
        }
        if (changed) {
            onChange({ ...data, criteria: newCriteria });
        }
    }, [
        // Source data dependencies
        tienSu.ungThu, tienSu.suyTimUHuyet, tienSu.benhMachMauNao, tienSu.benhThanMan,
        lamSang.nhipTho, lamSang.huyetAp, lamSang.nhietDo, lamSang.mach, lamSang.diemGlasgow, lamSang.spO2,
        xetNghiem.ph, xetNghiem.ure, xetNghiem.hct, xetNghiem.na, xetNghiem.glucose,
        hinhAnh.xquangTranDichMangPhoi, hinhAnh.ctTranDichMangPhoi,
        confusion, confusionAsked,
    ]);

    const toggleCriteria = (key: string) => {
        const newValue = !data.criteria[key as keyof typeof data.criteria];
        // Warn if unchecking thayDoiTriGiac while confusion is confirmed
        if (key === 'thayDoiTriGiac' && !newValue && confusion && confusionAsked) {
            toast.error(
                'Cảnh báo: Bạn đã xác nhận BN có rối loạn ý thức mới ở tab Lâm sàng. Việc bỏ chọn "Thay đổi tri giác" ở PSI có thể không chính xác.',
                { duration: 5000, icon: '⚠️' }
            );
        }
        onChange({
            ...data,
            criteria: { ...data.criteria, [key]: newValue },
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
            <h2 className="font-heading font-semibold text-lg text-gray-900">H. Tính điểm PSI</h2>

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
