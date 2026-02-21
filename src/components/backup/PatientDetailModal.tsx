import { X } from 'lucide-react';
import type { BackupPatient } from '../../services/backupService';

interface Props {
    patient: BackupPatient;
    onClose: () => void;
}

function fmt(val: unknown): string {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'boolean') return val ? 'Có' : 'Không';
    return String(val);
}

function fmtDate(iso: string | null): string {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return iso;
    }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-4">
            <h4 className="text-sm font-semibold text-primary-700 border-b border-primary-200 pb-1 mb-2">{title}</h4>
            {children}
        </div>
    );
}

function Row({ label, value }: { label: string; value: unknown }) {
    return (
        <div className="grid grid-cols-[160px_1fr] gap-2 py-0.5 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-900 font-medium">{fmt(value)}</span>
        </div>
    );
}

export default function PatientDetailModal({ patient, onClose }: Props) {
    const p = patient;
    const hc = p.hanhChinh;
    const ts = p.tienSu;
    const ls = p.lamSang;
    const xn = p.xetNghiem;
    const ct = p.chiSoTinhToan;
    const psi = p.psi;
    const kc = p.ketCuc;

    const tienSuList = [
        ts.daiThaoDuong && 'Đái tháo đường',
        ts.tangHuyetAp && 'Tăng huyết áp',
        ts.viemDaDay && 'Viêm dạ dày',
        ts.viemGanMan && 'Viêm gan mạn',
        ts.benhThanMan && 'Bệnh thận mạn',
        ts.gut && 'Gut',
        ts.ungThu && 'Ung thư',
        ts.suyTimUHuyet && 'Suy tim ứ huyết',
        ts.benhMachMauNao && 'Bệnh mạch máu não',
        ts.hutThuocLa && `Hút thuốc lá${ts.soBaoNam ? ` (${ts.soBaoNam} bao-năm)` : ''}`,
        ts.khac,
    ].filter(Boolean);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40" />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {p.maBenhNhanNghienCuu || '—'} — {hc.hoTen || 'Không tên'}
                        </h3>
                        <span className="text-xs text-gray-500">Mã BA: {p.maBenhAnNoiTru || '—'}</span>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                    {/* Timestamps */}
                    <Section title="Thời gian">
                        <Row label="Ngày tạo hồ sơ" value={fmtDate(p.createdAt)} />
                        <Row label="Sửa lần cuối" value={fmtDate(p.updatedAt)} />
                    </Section>

                    {/* Hành chính */}
                    <Section title="Hành chính">
                        <Row label="Họ tên" value={hc.hoTen} />
                        <Row label="Tuổi" value={hc.tuoi} />
                        <Row label="Giới tính" value={hc.gioiTinh === 'nam' ? 'Nam' : hc.gioiTinh === 'nu' ? 'Nữ' : '—'} />
                        <Row label="Nghề nghiệp" value={hc.ngheNghiep} />
                        <Row label="Nơi ở" value={hc.noiO || '—'} />
                        <Row label="Địa chỉ" value={[hc.diaChiXaPhuong, hc.diaChiTinhThanh].filter(Boolean).join(', ')} />
                        <Row label="Ngày vào viện" value={hc.ngayVaoVien} />
                        <Row label="Ngày ra viện" value={hc.ngayRaVien} />
                    </Section>

                    {/* Tiền sử */}
                    <Section title="Tiền sử">
                        <Row label="Bệnh nền" value={tienSuList.length ? tienSuList.join(', ') : 'Không'} />
                    </Section>

                    {/* Lâm sàng */}
                    <Section title="Lâm sàng">
                        <Row label="Thời điểm triệu chứng" value={ls.thoiDiemTrieuChung} />
                        <Row label="Mạch" value={ls.mach ? `${ls.mach} l/p` : null} />
                        <Row label="Huyết áp" value={ls.huyetAp ? `${ls.huyetAp} mmHg` : null} />
                        <Row label="Nhiệt độ" value={ls.nhietDo ? `${ls.nhietDo}°C` : null} />
                        <Row label="Nhịp thở" value={ls.nhipTho ? `${ls.nhipTho} l/p` : null} />
                        <Row label="SpO₂" value={ls.spO2 ? `${ls.spO2}%` : null} />
                        <Row label="BMI" value={ls.bmi} />
                        <Row label="Glasgow" value={ls.diemGlasgow} />
                    </Section>

                    {/* Xét nghiệm */}
                    <Section title="Xét nghiệm">
                        <div className="grid grid-cols-2 gap-x-6">
                            <Row label="WBC" value={xn.wbc} />
                            <Row label="Neutrophil" value={xn.neutrophil} />
                            <Row label="Lymphocyte" value={xn.lymphocyte} />
                            <Row label="Hemoglobin" value={xn.hemoglobin} />
                            <Row label="PLT" value={xn.plt} />
                            <Row label="CRP" value={xn.crp} />
                            <Row label="Procalcitonin" value={xn.procalcitonin} />
                            <Row label="Creatinin" value={xn.creatinin} />
                            <Row label="Albumin" value={xn.albumin} />
                            <Row label="Na⁺" value={xn.na} />
                            <Row label="K⁺" value={xn.k} />
                            <Row label="pH" value={xn.ph} />
                            <Row label="PaCO₂" value={xn.paCO2} />
                        </div>
                    </Section>

                    {/* Chỉ số tính toán */}
                    <Section title="Chỉ số tính toán">
                        <div className="grid grid-cols-2 gap-x-6">
                            <Row label="NLR" value={ct?.nlr} />
                            <Row label="PLR" value={ct?.plr} />
                            <Row label="CAR" value={ct?.car} />
                        </div>
                    </Section>

                    {/* Hình ảnh */}
                    <Section title="Chẩn đoán hình ảnh">
                        {/* Xquang */}
                        {p.hinhAnh.xquangTonThuong?.length > 0 && (
                            <div className="mb-2">
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Xquang</span>
                                {p.hinhAnh.xquangTonThuong.map((t, i) => (
                                    <div key={t.id || i} className="text-sm text-gray-800 pl-3 py-0.5">
                                        Tổn thương {[t.hinhThai, t.dien].filter(Boolean).map(s => s.toLowerCase()).join(' ')} ở {[t.viTri, t.ben].filter(Boolean).map(s => s.toLowerCase()).join(' ') || '—'}
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* CT */}
                        {p.hinhAnh.ctTonThuong?.length > 0 && (
                            <div className="mb-2">
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">CT</span>
                                {p.hinhAnh.ctTonThuong.map((t, i) => (
                                    <div key={t.id || i} className="text-sm text-gray-800 pl-3 py-0.5">
                                        Tổn thương {[t.hinhThai, t.dien].filter(Boolean).map(s => s.toLowerCase()).join(' ')} ở {[t.thuy, t.ben].filter(Boolean).map(s => s.toLowerCase()).join(' ') || '—'}
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Empty state */}
                        {!p.hinhAnh.xquangTonThuong?.length && !p.hinhAnh.ctTonThuong?.length && (
                            <div className="text-sm text-gray-400 italic">Chưa có dữ liệu</div>
                        )}
                    </Section>

                    {/* Vi sinh */}
                    <Section title="Vi sinh">
                        {p.viKhuan?.length > 0 ? (
                            <div className="space-y-1">
                                {p.viKhuan.filter(vk => vk.coKhong && vk.tenViKhuan).map((vk, i) => {
                                    const s = vk.khangSinhDo?.filter(k => k.mucDo === 'S').map(k => k.tenKhangSinh) || [];
                                    const iList = vk.khangSinhDo?.filter(k => k.mucDo === 'I').map(k => k.tenKhangSinh) || [];
                                    const r = vk.khangSinhDo?.filter(k => k.mucDo === 'R').map(k => k.tenKhangSinh) || [];
                                    const hasKSD = s.length > 0 || iList.length > 0 || r.length > 0;

                                    return (
                                        <div key={vk.id || i} className="text-sm text-gray-800 py-0.5">
                                            <span className="font-medium">{vk.tenViKhuan}</span>
                                            {hasKSD && (
                                                <span className="text-gray-600">
                                                    , KSĐ:{' '}
                                                    {s.length > 0 && <><span className="text-green-700 font-medium">S</span> ({s.join(', ')})</>}
                                                    {s.length > 0 && (iList.length > 0 || r.length > 0) && ', '}
                                                    {iList.length > 0 && <><span className="text-yellow-600 font-medium">I</span> ({iList.join(', ')})</>}
                                                    {iList.length > 0 && r.length > 0 && ', '}
                                                    {r.length > 0 && <><span className="text-red-600 font-medium">R</span> ({r.join(', ')})</>}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                                {p.viKhuan.filter(vk => vk.coKhong && vk.tenViKhuan).length === 0 && (
                                    <div className="text-sm text-gray-400 italic">Không phân lập vi khuẩn</div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 italic">Chưa có dữ liệu</div>
                        )}
                    </Section>

                    {/* PSI */}
                    <Section title="PSI (Pneumonia Severity Index)">
                        <Row label="Tổng điểm" value={psi.tongDiem > 0 ? psi.tongDiem : null} />
                        <Row label="Phân tầng" value={psi.phanTang} />
                    </Section>

                    {/* Kết cục */}
                    <Section title="Kết cục">
                        {kc.dienBienDieuTri?.length > 0 && (
                            <Row label="Diễn biến" value={kc.dienBienDieuTri.join(', ')} />
                        )}
                        <Row label="Kháng sinh" value={(() => {
                            if (!kc.ngayBatDauKhangSinh) return null;
                            if (!kc.ngayKetThucKhangSinh) return kc.ngayBatDauKhangSinh;
                            // Calculate days between
                            const parse = (s: string) => {
                                const [d, m, y] = s.split('/');
                                return new Date(+y, +m - 1, +d);
                            };
                            try {
                                const d1 = parse(kc.ngayBatDauKhangSinh);
                                const d2 = parse(kc.ngayKetThucKhangSinh);
                                const days = Math.round((d2.getTime() - d1.getTime()) / 86400000);
                                return `${kc.ngayBatDauKhangSinh} → ${kc.ngayKetThucKhangSinh} (${days} ngày)`;
                            } catch {
                                return `${kc.ngayBatDauKhangSinh} → ${kc.ngayKetThucKhangSinh}`;
                            }
                        })()} />
                        <Row label="Tổng ngày điều trị" value={kc.tongSoNgayDieuTri} />
                        <Row label="Tình trạng ra viện" value={kc.tinhTrangRaVien} />
                    </Section>
                </div>
            </div>
        </div>
    );
}
