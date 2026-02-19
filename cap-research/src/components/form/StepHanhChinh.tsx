import { useState, useEffect, useMemo } from 'react';
import type { Patient, HanhChinh } from '../../types/patient';
import { NGHE_NGHIEP_OPTIONS, DEFAULT_NOI_O } from '../../data/formOptions';
import SearchableSelect from '../ui/SearchableSelect';
import DateInput from '../ui/DateInput';
import { settingsService } from '../../services/settingsService';
import type { AddressEntry } from '../../services/exportService';
import toast from 'react-hot-toast';

// ─── Cascading Address Fields ────────────────────────────────────────
function AddressFields({ hc, update, onChange }: { hc: HanhChinh; update: (field: keyof HanhChinh, value: string | number | null) => void; onChange: (section: 'hanhChinh', value: HanhChinh) => void }) {
    const [addresses, setAddresses] = useState<AddressEntry[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('cap_addresses');
        const parsed = stored ? JSON.parse(stored) as AddressEntry[] : [];
        if (parsed.length > 0) {
            setAddresses(parsed);
        } else {
            // Load from Firestore when localStorage is empty (e.g. different device/browser)
            settingsService.getAddresses().then((entries) => {
                if (entries.length > 0) {
                    setAddresses(entries);
                    localStorage.setItem('cap_addresses', JSON.stringify(entries));
                }
            });
        }
    }, []);

    // Unique provinces
    const tinhOptions = useMemo(() => {
        return [...new Set(addresses.map((a) => a.tinhThanh).filter(Boolean))].sort();
    }, [addresses]);

    // Wards filtered by selected province
    const xaOptions = useMemo(() => {
        if (!hc.diaChiTinhThanh) return [];
        return [...new Set(
            addresses.filter((a) => a.tinhThanh === hc.diaChiTinhThanh).map((a) => a.xaPhuong).filter(Boolean)
        )].sort();
    }, [addresses, hc.diaChiTinhThanh]);

    const handleTinhChange = (value: string) => {
        // Must update both fields in a single call to avoid stale hc reference
        onChange('hanhChinh', { ...hc, diaChiTinhThanh: value, diaChiXaPhuong: '' });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <SearchableSelect
                    label="Tỉnh/Thành phố"
                    value={hc.diaChiTinhThanh}
                    options={tinhOptions}
                    onChange={handleTinhChange}
                    placeholder="Chọn tỉnh/thành phố..."
                />
            </div>
            <div>
                <SearchableSelect
                    label="Xã/Phường"
                    value={hc.diaChiXaPhuong}
                    options={xaOptions}
                    onChange={(v) => update('diaChiXaPhuong', v)}
                    placeholder={hc.diaChiTinhThanh ? 'Chọn xã/phường...' : 'Chọn tỉnh/TP trước'}
                    disabled={!hc.diaChiTinhThanh}
                />
            </div>
        </div>
    );
}
type FormData = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;

interface Props {
    data: FormData;
    onChange: <K extends keyof FormData>(section: K, value: FormData[K]) => void;
    existingCodes?: Set<string>;
    currentPatientId?: string;
}

export default function StepHanhChinh({ data, onChange, existingCodes, currentPatientId }: Props) {
    const hc = data.hanhChinh;

    // Load configurable lists from localStorage
    const ngheNghiepList = useMemo(() => {
        try {
            const raw = localStorage.getItem('cap_nghe_nghiep');
            if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) return p; }
        } catch { /* ignore */ }
        return NGHE_NGHIEP_OPTIONS;
    }, []);

    const noiOList = useMemo(() => {
        try {
            const raw = localStorage.getItem('cap_noi_o');
            if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) return p; }
        } catch { /* ignore */ }
        return DEFAULT_NOI_O;
    }, []);

    const update = (field: keyof HanhChinh, value: string | number | null) => {
        onChange('hanhChinh', { ...hc, [field]: value });
    };

    // ── Validate mã BNNC: check duplicate on blur ──
    const validateMaBNNC = () => {
        const code = data.maBenhNhanNghienCuu.trim();
        if (!code || !existingCodes || existingCodes.size === 0) return;

        const isDuplicate = Array.from(existingCodes).some(
            (c) => c.toLowerCase() === code.toLowerCase()
        );

        if (!isDuplicate) return;

        // In edit mode, the patient's own code is in the set — allow keeping it
        if (currentPatientId) return;

        toast.error(`Mã "${code}" đã tồn tại! Vui lòng nhập mã khác.`, { duration: 4000 });
        onChange('maBenhNhanNghienCuu' as keyof FormData, '' as never);
    };

    const validateNgayRaVien = () => {
        if (!hc.ngayRaVien || !hc.ngayVaoVien) return;
        const vao = new Date(hc.ngayVaoVien);
        const ra = new Date(hc.ngayRaVien);
        if (!isNaN(vao.getTime()) && !isNaN(ra.getTime()) && ra < vao) {
            toast.error('Ngày ra viện phải ≥ ngày nhập viện. Đã xóa giá trị.', { duration: 4000 });
            onChange('hanhChinh', { ...hc, ngayRaVien: '' });
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="font-heading font-semibold text-lg text-gray-900">A. Hành chính</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã bệnh nhân nghiên cứu</label>
                    <input type="text" value={data.maBenhNhanNghienCuu}
                        onChange={(e) => onChange('maBenhNhanNghienCuu' as keyof FormData, e.target.value.toUpperCase() as never)}
                        onBlur={validateMaBNNC}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="CAPxxx" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã bệnh án nội trú</label>
                    <input type="text" value={data.maBenhAnNoiTru} onChange={(e) => onChange('maBenhAnNoiTru' as keyof FormData, e.target.value as never)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input type="text" value={hc.hoTen} onChange={(e) => update('hoTen', e.target.value)}
                        onBlur={() => update('hoTen', hc.hoTen.toUpperCase())}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi</label>
                        <input type="number" value={hc.tuoi ?? ''} onChange={(e) => update('tuoi', e.target.value ? Number(e.target.value) : null)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                        <select value={hc.gioiTinh} onChange={(e) => update('gioiTinh', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                            <option value="">-- Chọn --</option>
                            <option value="nam">Nam</option>
                            <option value="nu">Nữ</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp</label>
                <select value={hc.ngheNghiep} onChange={(e) => update('ngheNghiep', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">-- Chọn --</option>
                    {ngheNghiepList.map((o: string) => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>

            <AddressFields hc={hc} update={update} onChange={onChange} />

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nơi ở</label>
                <div className="flex gap-4">
                    {noiOList.map((l: string) => (
                        <label key={l} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="noiO" value={l} checked={hc.noiO === l} onChange={(e) => update('noiO', e.target.value)}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500" />
                            <span className="text-sm text-gray-700">{l}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateInput label="Ngày vào viện" value={hc.ngayVaoVien}
                    onChange={(v) => update('ngayVaoVien', v)} className="w-full" />
                <DateInput label="Ngày ra viện" value={hc.ngayRaVien}
                    onChange={(v) => update('ngayRaVien', v)} onBlur={validateNgayRaVien} className="w-full" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea value={hc.ghiChu} onChange={(e) => update('ghiChu', e.target.value)}
                    rows={3} placeholder="Ghi chú thêm về bệnh nhân..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y" />
            </div>
        </div>
    );
}
