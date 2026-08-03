import type { CURB65Data, LamSang, XetNghiem } from '../../types/patient';
import { CURB65_LABELS } from '../../data/formOptions';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface Props {
    data: CURB65Data;
    tuoi: number | null;
    lamSang: LamSang;
    xetNghiem: XetNghiem;
    curb65Result: {
        tongDiem: number;
        phanNhom: string;
        chiTiet: CURB65Data['chiTiet'];
        duDuLieu: boolean;
        glasgowBelowThreshold: boolean;
    };
    onChange: (data: CURB65Data) => void;
}

function parseHuyetAp(s: string): { tamThu: number | null; tamTruong: number | null } {
    if (!s) return { tamThu: null, tamTruong: null };
    const parts = s.split('/');
    const tamThu = Number(parts[0]);
    const tamTruong = parts.length > 1 ? Number(parts[1]) : null;
    return {
        tamThu: isNaN(tamThu) ? null : tamThu,
        tamTruong: tamTruong !== null && !isNaN(tamTruong) ? tamTruong : null,
    };
}

export default function StepCURB65({ data, tuoi, lamSang, xetNghiem, curb65Result, onChange }: Props) {
    const { tongDiem, phanNhom, chiTiet, duDuLieu, glasgowBelowThreshold } = curb65Result;
    const { tamThu, tamTruong } = parseHuyetAp(lamSang.huyetAp);

    const riskColor = () => {
        if (!duDuLieu) return 'bg-gray-50 border-gray-200 text-gray-600';
        if (tongDiem <= 1) return 'bg-green-50 border-green-200 text-green-800';
        if (tongDiem === 2) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        return 'bg-red-50 border-red-200 text-red-800';
    };

    const componentIcon = (val: boolean | null) => {
        if (val === null) return <HelpCircle className="w-4 h-4 text-gray-400" />;
        return val
            ? <CheckCircle2 className="w-4 h-4 text-red-500" />
            : <XCircle className="w-4 h-4 text-green-500" />;
    };

    const componentScore = (val: boolean | null) => {
        if (val === null) return <span className="text-gray-400 text-xs">N/A</span>;
        return val
            ? <span className="text-red-600 font-bold text-sm">+1</span>
            : <span className="text-gray-300 text-sm">0</span>;
    };

    // Source values for display
    const sourceValues: Record<string, string> = {
        c: lamSang.diemGlasgow !== null ? `Glasgow: ${lamSang.diemGlasgow}` : 'Chưa nhập Glasgow',
        u: xetNghiem.ure !== null ? `Ure: ${xetNghiem.ure} mmol/L` : 'Chưa nhập Ure',
        r: lamSang.nhipTho !== null ? `RR: ${lamSang.nhipTho}/phút` : 'Chưa nhập nhịp thở',
        b: tamThu !== null ? `HA: ${tamThu}/${tamTruong ?? '?'} mmHg` : 'Chưa nhập huyết áp',
        age65: tuoi !== null ? `Tuổi: ${tuoi}` : 'Chưa nhập tuổi',
    };

    // Missing fields list
    const missingFields: string[] = [];
    if (tuoi === null) missingFields.push('Tuổi (tab Hành chính)');
    if (xetNghiem.ure === null) missingFields.push('Ure (tab Xét nghiệm)');
    if (lamSang.nhipTho === null) missingFields.push('Nhịp thở (tab Lâm sàng)');
    if (tamThu === null && tamTruong === null) missingFields.push('Huyết áp (tab Lâm sàng)');
    if (lamSang.diemGlasgow === null) missingFields.push('Glasgow (tab Lâm sàng)');

    const handleConfusionChange = (value: boolean) => {
        onChange({ ...data, confusion: value, confusionAsked: true });
    };

    return (
        <div className="space-y-6">
            <h2 className="font-heading font-semibold text-lg text-gray-900">G. CURB-65</h2>

            {/* Auto-calculation notice */}
            <div className="text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-2">
                💡 CURB-65 được tính <strong>hoàn toàn tự động</strong> từ dữ liệu đã nhập ở các tab trước (Lâm sàng, Xét nghiệm, Hành chính).
            </div>

            {/* Summary card */}
            <div className={`rounded-xl border-2 p-5 ${riskColor()}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium">Tổng điểm CURB-65</p>
                        <p className="text-4xl font-bold mt-1">
                            {duDuLieu ? `${tongDiem}/5` : '—'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium">Phân nhóm</p>
                        <p className="text-lg font-semibold mt-1">
                            {duDuLieu ? phanNhom : '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Missing data warning */}
            {!duDuLieu && missingFields.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                        <strong>Chưa đủ dữ liệu để tính CURB-65.</strong> Cần bổ sung:
                        <ul className="mt-1 list-disc list-inside">
                            {missingFields.map(f => <li key={f}>{f}</li>)}
                        </ul>
                    </div>
                </div>
            )}

            {/* Component details (read-only) */}
            <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Chi tiết cấu phần</h3>
                {(['c', 'u', 'r', 'b', 'age65'] as const).map(key => {
                    const info = CURB65_LABELS[key];
                    const val = chiTiet[key];
                    return (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                                {componentIcon(val)}
                                <div>
                                    <span className="text-sm font-medium text-gray-800">{info.label}</span>
                                    <p className="text-xs text-gray-500">{info.moTa}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 font-mono">{sourceValues[key]}</span>
                                {componentScore(val)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Confusion question — only when Glasgow < threshold */}
            {glasgowBelowThreshold && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
                    <div className="flex items-start gap-2">
                        <span className="text-lg">⚕️</span>
                        <div>
                            <p className="text-sm font-semibold text-blue-900">
                                Glasgow = {lamSang.diemGlasgow} → Đánh giá Confusion
                            </p>
                            <p className="text-sm text-blue-800 mt-1">
                                Có rối loạn ý thức và/hoặc định hướng (người, nơi chốn, thời gian) <strong>mới xuất hiện</strong> không?
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 ml-8">
                        <button
                            type="button"
                            onClick={() => handleConfusionChange(true)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                data.confusion && data.confusionAsked
                                    ? 'bg-red-100 border-red-300 text-red-800 ring-2 ring-red-400'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Có
                        </button>
                        <button
                            type="button"
                            onClick={() => handleConfusionChange(false)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                !data.confusion && data.confusionAsked
                                    ? 'bg-green-100 border-green-300 text-green-800 ring-2 ring-green-400'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Không
                        </button>
                    </div>
                </div>
            )}

            {/* Reference table */}
            <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Bảng tham chiếu CURB-65</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-500">
                            <th className="pb-1 font-medium">Điểm</th>
                            <th className="pb-1 font-medium">Mức độ</th>
                            <th className="pb-1 font-medium">Tỷ lệ tử vong (30 ngày)</th>
                            <th className="pb-1 font-medium">Khuyến cáo</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        <tr className={duDuLieu && tongDiem <= 1 ? 'bg-green-100 font-medium' : ''}>
                            <td className="py-1">0–1</td>
                            <td>Nhẹ</td>
                            <td>0.7% – 2.1%</td>
                            <td>Điều trị ngoại trú</td>
                        </tr>
                        <tr className={duDuLieu && tongDiem === 2 ? 'bg-yellow-100 font-medium' : ''}>
                            <td className="py-1">2</td>
                            <td>Trung bình</td>
                            <td>~9.2%</td>
                            <td>Nhập viện ngắn / theo dõi</td>
                        </tr>
                        <tr className={duDuLieu && tongDiem >= 3 ? 'bg-red-100 font-medium' : ''}>
                            <td className="py-1">3–5</td>
                            <td>Nặng</td>
                            <td>14.5% – 40%</td>
                            <td>Cân nhắc nhập ICU</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
