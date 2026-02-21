import { useEffect, useRef, useMemo } from 'react';
import type { KetCuc } from '../../types/patient';
import { DEFAULT_DIEN_BIEN_DIEU_TRI, DEFAULT_TINH_TRANG_RA_VIEN } from '../../data/formOptions';
import DateInput from '../ui/DateInput';
import toast from 'react-hot-toast';

interface Props {
    data: KetCuc;
    ngayVaoVien: string;
    ngayRaVien: string;
    onChange: (data: KetCuc) => void;
}

function parseDate(s: string): Date | null {
    if (!s) return null;
    if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length !== 3) return null;
        const [d, m, y] = parts.map(Number);
        if (!d || !m || !y) return null;
        return new Date(y, m - 1, d);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

export default function StepKetCuc({ data, ngayVaoVien, ngayRaVien, onChange }: Props) {
    const autoCalcDone = useRef(false);

    const update = (field: keyof KetCuc, value: boolean | string | number | string[] | null) => {
        onChange({ ...data, [field]: value });
    };

    // Load configurable lists from localStorage
    const dienBienList = useMemo(() => {
        try {
            const raw = localStorage.getItem('cap_dien_bien_dieu_tri');
            if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) return p as string[]; }
        } catch { /* ignore */ }
        return DEFAULT_DIEN_BIEN_DIEU_TRI;
    }, []);

    const tinhTrangList = useMemo(() => {
        try {
            const raw = localStorage.getItem('cap_tinh_trang_ra_vien');
            if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) return p as string[]; }
        } catch { /* ignore */ }
        return DEFAULT_TINH_TRANG_RA_VIEN;
    }, []);

    // Auto-calculate total days
    useEffect(() => {
        if (autoCalcDone.current) return;
        const vao = parseDate(ngayVaoVien);
        const ra = parseDate(ngayRaVien);
        if (vao && ra && ra >= vao) {
            const days = Math.round((ra.getTime() - vao.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (data.tongSoNgayDieuTri === null) {
                autoCalcDone.current = true;
                onChange({ ...data, tongSoNgayDieuTri: days });
            }
        }
    }, [ngayVaoVien, ngayRaVien]); // eslint-disable-line react-hooks/exhaustive-deps

    const suggestedDays = (() => {
        const vao = parseDate(ngayVaoVien);
        const ra = parseDate(ngayRaVien);
        if (vao && ra && ra >= vao) {
            return Math.round((ra.getTime() - vao.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
        return null;
    })();

    // onBlur validation for antibiotic dates
    const validateNgayBatDauKS = (newBatDau: string) => {
        if (!newBatDau) return;
        const batDau = parseDate(newBatDau);
        if (!batDau) return;
        const vao = parseDate(ngayVaoVien);
        const ra = parseDate(ngayRaVien);
        if (vao && batDau < vao) {
            toast.error('Ngày bắt đầu KS phải ≥ ngày nhập viện. Đã xóa.', { duration: 4000 });
            onChange({ ...data, ngayBatDauKhangSinh: '' });
            return;
        }
        if (ra && batDau > ra) {
            toast.error('Ngày bắt đầu KS phải ≤ ngày ra viện. Đã xóa.', { duration: 4000 });
            onChange({ ...data, ngayBatDauKhangSinh: '' });
        }
    };

    const validateNgayKetThucKS = (newKetThuc: string) => {
        if (!newKetThuc) return;
        const ketThuc = parseDate(newKetThuc);
        if (!ketThuc) return;
        const batDau = parseDate(data.ngayBatDauKhangSinh);
        const ra = parseDate(ngayRaVien);
        if (batDau && ketThuc < batDau) {
            toast.error('Ngày kết thúc KS phải ≥ ngày bắt đầu KS. Đã xóa.', { duration: 4000 });
            onChange({ ...data, ngayKetThucKhangSinh: '' });
            return;
        }
        if (ra && ketThuc > ra) {
            toast.error('Ngày kết thúc KS phải ≤ ngày ra viện. Đã xóa.', { duration: 4000 });
            onChange({ ...data, ngayKetThucKhangSinh: '' });
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="font-heading font-semibold text-lg text-gray-900">H. Kết cục</h2>

            {/* ── 1. Diễn biến điều trị (multichoice — dynamic from settings) ── */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Diễn biến điều trị <span className="text-gray-400 font-normal">(chọn nhiều)</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {dienBienList.map((label) => {
                        const selected = (data.dienBienDieuTri || []);
                        const checked = selected.includes(label);
                        const colors = ['amber', 'orange', 'rose', 'red', 'purple', 'blue'];
                        const color = colors[dienBienList.indexOf(label) % colors.length];
                        const bgMap: Record<string, string> = {
                            amber: 'bg-amber-50 border-amber-300',
                            orange: 'bg-orange-50 border-orange-300',
                            rose: 'bg-rose-50 border-rose-300',
                            red: 'bg-red-50 border-red-300',
                            purple: 'bg-purple-50 border-purple-300',
                            blue: 'bg-blue-50 border-blue-300',
                        };
                        return (
                            <label key={label}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${checked ? bgMap[color] : 'border-gray-200 hover:border-gray-300'}`}>
                                <input type="checkbox" checked={checked}
                                    onChange={(e) => {
                                        const next = e.target.checked
                                            ? [...selected, label]
                                            : selected.filter((s: string) => s !== label);
                                        // Update both dynamic array and legacy booleans for backward compat
                                        const updated = { ...data, dienBienDieuTri: next };
                                        // Sync legacy booleans
                                        if (label === 'Thở máy') updated.thoMay = e.target.checked;
                                        if (label === 'Sốc nhiễm khuẩn') updated.socNhiemKhuan = e.target.checked;
                                        if (label === 'Lọc máu') {
                                            updated.locMau = e.target.checked;
                                            if (!e.target.checked) updated.soNgayLocMau = null;
                                        }
                                        onChange(updated);
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm font-medium text-gray-800">{label}</span>
                            </label>
                        );
                    })}
                </div>

                {/* Số ngày lọc máu — conditional */}
                {(data.locMau || (data.dienBienDieuTri || []).includes('Lọc máu')) && (
                    <div className="mt-3 ml-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số ngày lọc máu</label>
                        <input type="number" value={data.soNgayLocMau ?? ''}
                            onChange={(e) => update('soNgayLocMau', e.target.value ? Number(e.target.value) : null)}
                            inputMode="numeric"
                            onKeyDown={(e) => { if (['e', 'E', '+', '.'].includes(e.key)) e.preventDefault(); }}
                            className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            step="1" min="1" placeholder="Nhập số ngày" />
                    </div>
                )}
            </div>

            {/* ── 2. Tình trạng ra viện (single choice — dynamic from settings) ── */}
            <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Tình trạng ra viện <span className="text-gray-400 font-normal">(chọn 1)</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {tinhTrangList.map((label) => {
                        const selected = data.tinhTrangRaVien === label;
                        const colors = ['red', 'orange', 'green', 'blue', 'purple'];
                        const color = colors[tinhTrangList.indexOf(label) % colors.length];
                        const bgMap: Record<string, string> = {
                            red: 'bg-red-50 border-red-300',
                            orange: 'bg-orange-50 border-orange-300',
                            green: 'bg-green-50 border-green-300',
                            blue: 'bg-blue-50 border-blue-300',
                            purple: 'bg-purple-50 border-purple-300',
                        };
                        return (
                            <label key={label}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${selected ? bgMap[color] : 'border-gray-200 hover:border-gray-300'}`}>
                                <input type="radio" name="tinhTrangRaVien"
                                    checked={selected}
                                    onChange={() => {
                                        const updated = {
                                            ...data,
                                            tinhTrangRaVien: label,
                                            // Sync legacy booleans
                                            tuVong: label === 'Tử vong',
                                            xinVe: label === 'Xin về',
                                            tienTrienTotXuatVien: label === 'Tiến triển tốt, xuất viện',
                                        };
                                        onChange(updated);
                                    }}
                                    className="w-4 h-4 border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm font-medium text-gray-800">{label}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* ── Tổng số ngày điều trị ── */}
            <div className="border-t border-gray-100 pt-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tổng số ngày điều trị
                    {suggestedDays !== null && (
                        <span className="text-xs text-gray-400 font-normal ml-2">
                            (Tự động: {suggestedDays} ngày
                            {data.tongSoNgayDieuTri !== suggestedDays && data.tongSoNgayDieuTri !== null && (
                                <button type="button" onClick={() => update('tongSoNgayDieuTri', suggestedDays)}
                                    className="ml-1 text-primary-600 hover:text-primary-700 underline">Đặt lại</button>
                            )}
                            )
                        </span>
                    )}
                </label>
                <input type="number" value={data.tongSoNgayDieuTri ?? ''}
                    onChange={(e) => update('tongSoNgayDieuTri', e.target.value ? Number(e.target.value) : null)}
                    inputMode="numeric"
                    onKeyDown={(e) => { if (['e', 'E', '+', '.'].includes(e.key)) e.preventDefault(); }}
                    className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    step="1" />
            </div>

            {/* ── Ngày kháng sinh ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateInput label="Ngày bắt đầu kháng sinh" value={data.ngayBatDauKhangSinh}
                    onChange={(v) => update('ngayBatDauKhangSinh', v)}
                    onBlur={validateNgayBatDauKS} className="w-full" />
                <DateInput label="Ngày kết thúc kháng sinh" value={data.ngayKetThucKhangSinh}
                    onChange={(v) => update('ngayKetThucKhangSinh', v)}
                    onBlur={validateNgayKetThucKS} className="w-full" />
            </div>
        </div>
    );
}
