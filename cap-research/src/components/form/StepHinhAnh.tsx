import type { HinhAnh, XquangTonThuong, CTTonThuong } from '../../types/patient';
import { XQUANG_VI_TRI, XQUANG_HINH_THAI, CT_THUY, CT_HINH_THAI, CT_DIEN, BEN_OPTIONS } from '../../data/formOptions';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
    data: HinhAnh;
    onChange: (data: HinhAnh) => void;
}

export default function StepHinhAnh({ data, onChange }: Props) {
    const addXquang = () => {
        onChange({
            ...data,
            xquangTonThuong: [...data.xquangTonThuong, { id: crypto.randomUUID(), viTri: '', ben: '', hinhThai: '', dien: '' }],
        });
    };

    const removeXquang = (id: string) => {
        const newList = data.xquangTonThuong.filter((x) => x.id !== id);
        const xquangTranDich = newList.some((x) => x.hinhThai === 'Tràn dịch màng phổi');
        const xquangTranKhi = newList.some((x) => x.hinhThai === 'Tràn khí màng phổi');
        onChange({ ...data, xquangTonThuong: newList, xquangTranDichMangPhoi: xquangTranDich, xquangTranKhiMangPhoi: xquangTranKhi });
    };

    const updateXquang = (id: string, field: keyof XquangTonThuong, value: string) => {
        const newList = data.xquangTonThuong.map((x) => (x.id === id ? { ...x, [field]: value } : x));
        const xquangTranDich = newList.some((x) => x.hinhThai === 'Tràn dịch màng phổi');
        const xquangTranKhi = newList.some((x) => x.hinhThai === 'Tràn khí màng phổi');
        onChange({ ...data, xquangTonThuong: newList, xquangTranDichMangPhoi: xquangTranDich, xquangTranKhiMangPhoi: xquangTranKhi });
    };

    const addCT = () => {
        onChange({
            ...data,
            ctTonThuong: [...data.ctTonThuong, { id: crypto.randomUUID(), thuy: '', ben: '', hinhThai: '', dien: '' }],
        });
    };

    const removeCT = (id: string) => {
        const newList = data.ctTonThuong.filter((c) => c.id !== id);
        const ctTranDich = newList.some((c) => c.hinhThai === 'Tràn dịch màng phổi');
        const ctTranKhi = newList.some((c) => c.hinhThai === 'Tràn khí màng phổi');
        onChange({ ...data, ctTonThuong: newList, ctTranDichMangPhoi: ctTranDich, ctTranKhiMangPhoi: ctTranKhi });
    };

    const updateCT = (id: string, field: keyof CTTonThuong, value: string) => {
        const newList = data.ctTonThuong.map((c) => (c.id === id ? { ...c, [field]: value } : c));
        const ctTranDich = newList.some((c) => c.hinhThai === 'Tràn dịch màng phổi');
        const ctTranKhi = newList.some((c) => c.hinhThai === 'Tràn khí màng phổi');
        onChange({ ...data, ctTonThuong: newList, ctTranDichMangPhoi: ctTranDich, ctTranKhiMangPhoi: ctTranKhi });
    };

    return (
        <div className="space-y-6">
            <h2 className="font-heading font-semibold text-lg text-gray-900">E. Hình ảnh X-quang &amp; CT Scan</h2>

            {/* X-quang */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">X-quang ngực</h3>
                    <button onClick={addXquang}
                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
                        <Plus className="w-3.5 h-3.5" /> Thêm tổn thương
                    </button>
                </div>

                {data.xquangTonThuong.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Chưa có tổn thương. Nhấn "Thêm tổn thương" để bắt đầu.</p>
                ) : (
                    <div className="space-y-3">
                        {data.xquangTonThuong.map((x, i) => (
                            <div key={x.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-400 font-mono w-5">{i + 1}.</span>
                                <select value={x.viTri} onChange={(e) => updateXquang(x.id, 'viTri', e.target.value)}
                                    className="w-32 px-2 py-1.5 rounded border border-gray-200 text-sm">
                                    <option value="">Vị trí</option>
                                    {XQUANG_VI_TRI.map((v) => <option key={v} value={v}>{v}</option>)}
                                </select>
                                <select value={x.ben} onChange={(e) => updateXquang(x.id, 'ben', e.target.value)}
                                    className="w-24 px-2 py-1.5 rounded border border-gray-200 text-sm">
                                    <option value="">Bên</option>
                                    {BEN_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <select value={x.hinhThai} onChange={(e) => updateXquang(x.id, 'hinhThai', e.target.value)}
                                    className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm">
                                    <option value="">Hình thái</option>
                                    {XQUANG_HINH_THAI.map((h) => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <select value={x.dien || ''} onChange={(e) => updateXquang(x.id, 'dien', e.target.value)}
                                    className="w-20 px-2 py-1.5 rounded border border-gray-200 text-sm">
                                    <option value="">Diện</option>
                                    {CT_DIEN.map((d) => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <button onClick={() => removeXquang(x.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CT Scan */}
            <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">CT Scan</h3>
                    <button onClick={addCT}
                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
                        <Plus className="w-3.5 h-3.5" /> Thêm tổn thương
                    </button>
                </div>

                {data.ctTonThuong.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Chưa có tổn thương CT.</p>
                ) : (
                    <div className="space-y-3">
                        {data.ctTonThuong.map((c, i) => (
                            <div key={c.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg flex-wrap sm:flex-nowrap">
                                <span className="text-xs text-gray-400 font-mono w-5">{i + 1}.</span>
                                <select value={c.thuy} onChange={(e) => updateCT(c.id, 'thuy', e.target.value)}
                                    className="w-32 px-2 py-1.5 rounded border border-gray-200 text-sm">
                                    <option value="">Thuỳ</option>
                                    {CT_THUY.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select value={c.ben} onChange={(e) => updateCT(c.id, 'ben', e.target.value)}
                                    className="w-24 px-2 py-1.5 rounded border border-gray-200 text-sm">
                                    <option value="">Bên</option>
                                    {BEN_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <select value={c.hinhThai} onChange={(e) => updateCT(c.id, 'hinhThai', e.target.value)}
                                    className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm">
                                    <option value="">Hình thái</option>
                                    {CT_HINH_THAI.map((h) => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <select value={c.dien} onChange={(e) => updateCT(c.id, 'dien', e.target.value)}
                                    className="w-20 px-2 py-1.5 rounded border border-gray-200 text-sm">
                                    <option value="">Diện</option>
                                    {CT_DIEN.map((d) => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <button onClick={() => removeCT(c.id)}
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
