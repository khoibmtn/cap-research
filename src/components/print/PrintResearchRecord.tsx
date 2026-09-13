import type { Patient } from '../../types/patient';
import {
    DEFAULT_DIEN_BIEN_DIEU_TRI,
    DEFAULT_TINH_TRANG_RA_VIEN,
} from '../../data/formOptions';

// ─── Types ───────────────────────────────────────────────────
interface PrintSettings {
    paperSize: 'A4' | 'A5' | 'Letter';
    margins: { top: number; left: number; right: number; bottom: number };
    fontSize: number;
    titleLine1: string;
    titleLine2: string;
    signLeft: string;
    signRight: string;
    showPsiLevel: boolean;
    fieldVisibility?: Record<string, boolean>;
}

interface Props {
    patients: Patient[];
    settings: PrintSettings;
}

// ─── Helpers ─────────────────────────────────────────────────
const CB = (checked: boolean) => (
    <span className="print-checkbox">{checked ? '☑' : '☐'}</span>
);

const val = (v: string | number | null | undefined, suffix = '') =>
    v !== null && v !== undefined && v !== '' ? `${v}${suffix}` : '';

const dotFill = (v: string | number | null | undefined) => (
    <span className="print-field-value">{val(v) || '\u00a0'}</span>
);

/** Recalculate PSI class from score (matches usePSICalculator logic) */
const getPhanTang = (tongDiem: number | null | undefined): string => {
    if (tongDiem == null) return '';
    if (tongDiem <= 50) return 'I - Nguy cơ thấp';
    if (tongDiem <= 70) return 'II - Nguy cơ thấp';
    if (tongDiem <= 90) return 'III - Nguy cơ trung bình';
    if (tongDiem <= 130) return 'IV - Nguy cơ cao';
    return 'V - Nguy cơ rất cao';
};

function loadList(key: string, defaults: string[]): string[] {
    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            const p = JSON.parse(raw);
            if (Array.isArray(p) && p.length > 0) {
                if (key === 'cap_tinh_trang_ra_vien') {
                    const filtered = (p as string[]).filter(x => x !== 'Chuyển tuyến trên' && x !== 'Chuyển tuyến dưới');
                    if (!filtered.includes('Chuyển tuyến')) filtered.push('Chuyển tuyến');
                    return filtered;
                }
                return p;
            }
        }
    } catch { /* ignore */ }
    return defaults;
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

function countDays(start: string, end: string): number | null {
    const s = parseDate(start);
    const e = parseDate(end);
    if (!s || !e || e < s) return null;
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function formatDate(s: string): string {
    if (!s) return '';
    if (s.includes('/')) return s;
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
}

const benMatch = (actual: string, expected: string) =>
    actual.toLowerCase() === expected.toLowerCase();

const formatMABNNC = (code: string) => {
    if (!code) return '..........';
    if (/^CAP/i.test(code)) return code;
    const num = parseInt(code, 10);
    if (!isNaN(num)) return `CAP${String(num).padStart(3, '0')}`;
    return code;
};

// ─── Single Patient Print ────────────────────────────────────
function PatientRecord({ patient: p, settings }: { patient: Patient; settings: PrintSettings }) {
    const hc = p.hanhChinh;
    const ts = p.tienSu;
    const ls = p.lamSang;
    const xn = p.xetNghiem;
    const ct = p.chiSoTinhToan;
    const ha = p.hinhAnh;
    const kc = p.ketCuc;
    const psi = p.psi;

    const dienBienList = loadList('cap_dien_bien_dieu_tri', DEFAULT_DIEN_BIEN_DIEU_TRI);
    const tinhTrangList = loadList('cap_tinh_trang_ra_vien', DEFAULT_TINH_TRANG_RA_VIEN);

    const selectedDienBien = kc.dienBienDieuTri?.length
        ? kc.dienBienDieuTri
        : [
            ...(kc.thoMay ? ['Thở máy'] : []),
            ...(kc.socNhiemKhuan ? ['Sốc nhiễm khuẩn'] : []),
            ...(kc.locMau ? ['Lọc máu'] : []),
        ];

    const soNgayDieuTri = countDays(hc.ngayVaoVien, hc.ngayRaVien);
    const soNgayKS = countDays(kc.ngayBatDauKhangSinh, kc.ngayKetThucKhangSinh);

    const isVis = (key: string, parentKey?: string) => {
        if (parentKey && settings.fieldVisibility && settings.fieldVisibility[parentKey] === false) {
            return false;
        }
        return settings.fieldVisibility ? settings.fieldVisibility[key] !== false : true;
    };

    return (
        <div className="print-record">
            {/* ══════ HEADER ══════ */}
            <div className="print-header">
                {settings.titleLine1 && <div className="print-header-line1" style={{ textAlign: 'left', paddingLeft: '5ch' }}>{settings.titleLine1}</div>}
                {settings.titleLine2 && <div className="print-header-line2" style={{ textAlign: 'left' }}>{settings.titleLine2}</div>}
                <div className="print-header-title">BỆNH ÁN NGHIÊN CỨU</div>
            </div>
            <div className="print-header-code">
                Mã bệnh nhân nghiên cứu (BNNC): {formatMABNNC(p.maBenhNhanNghienCuu)}
            </div>
            <div className="print-header-topic">
                Đề tài: Nghiên cứu đặc điểm căn nguyên vi sinh và một số dấu ấn sinh học ở bệnh nhân viêm phổi mắc phải cộng đồng nhập viện
            </div>

            {/* ══════ A. HÀNH CHÍNH ══════ */}
            {(isVis('hc_hoTen') || isVis('hc_tuoi') || isVis('hc_gioiTinh') || isVis('hc_ngheNghiep') || isVis('hc_diaChi') || isVis('hc_noiO') || isVis('hc_ngayVaoVien') || isVis('hc_ngayRaVien') || isVis('hc_maBenhAnNoiTru')) && (
                <div className="print-section">
                    <h2>A. HÀNH CHÍNH</h2>
                    {(isVis('hc_hoTen') || isVis('hc_tuoi') || isVis('hc_gioiTinh')) && (
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 4 }}>
                            {isVis('hc_hoTen') && <span>Họ và tên: {dotFill(hc.hoTen)}</span>}
                            {isVis('hc_tuoi') && <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap', paddingLeft: 16 }}>Tuổi: {dotFill(hc.tuoi)}</span>}
                            {isVis('hc_gioiTinh') && <span style={{ whiteSpace: 'nowrap', paddingLeft: 16 }}>Giới: {dotFill(hc.gioiTinh === 'nam' ? 'Nam' : hc.gioiTinh === 'nu' ? 'Nữ' : '')}</span>}
                        </div>
                    )}
                    {isVis('hc_ngheNghiep') && <div>Nghề nghiệp: {dotFill(hc.ngheNghiep)}</div>}
                    {(isVis('hc_diaChi') || isVis('hc_noiO')) && (
                        <div className="print-row">
                            {isVis('hc_diaChi') ? <div>Địa chỉ: {dotFill([hc.diaChiXaPhuong, hc.diaChiTinhThanh].filter(Boolean).join(', '))}</div> : <div />}
                            {isVis('hc_noiO') ? <div>Nơi ở: {dotFill(hc.noiO)}</div> : <div />}
                        </div>
                    )}
                    {(isVis('hc_ngayVaoVien') || isVis('hc_ngayRaVien')) && (
                        <div className="print-row">
                            {isVis('hc_ngayVaoVien') ? <div>Ngày vào viện: {dotFill(formatDate(hc.ngayVaoVien))}</div> : <div />}
                            {isVis('hc_ngayRaVien') ? <div>Ngày ra viện: {dotFill(formatDate(hc.ngayRaVien))}</div> : <div />}
                        </div>
                    )}
                    {isVis('hc_maBenhAnNoiTru') && <div>Mã bệnh án nội trú: {dotFill(p.maBenhAnNoiTru)}</div>}
                </div>
            )}

            {/* ══════ B. TIỀN SỬ ══════ */}
            {(isVis('ts_daiThaoDuong') || isVis('ts_tangHuyetAp') || isVis('ts_viemDaDay') || isVis('ts_viemGanMan') || isVis('ts_benhThanMan') || isVis('ts_gut') || isVis('ts_ungThu') || isVis('ts_suyTim') || isVis('ts_benhMachMauNao') || isVis('ts_khac') || isVis('ts_hutThuocLa') || isVis('ts_thuocDaDung')) && (
                <div className="print-section">
                    <h2>B. TIỀN SỬ</h2>
                    <div className="print-flex-row">
                        {isVis('ts_daiThaoDuong') && <span className="print-checkbox-item">{CB(ts.daiThaoDuong)} Đái tháo đường</span>}
                        {isVis('ts_tangHuyetAp') && <span className="print-checkbox-item">{CB(ts.tangHuyetAp)} Tăng huyết áp</span>}
                        {isVis('ts_viemDaDay') && <span className="print-checkbox-item">{CB(ts.viemDaDay)} Viêm dạ dày</span>}
                    </div>
                    <div className="print-flex-row">
                        {isVis('ts_viemGanMan') && <span className="print-checkbox-item">{CB(ts.viemGanMan)} Viêm gan mạn</span>}
                        {isVis('ts_benhThanMan') && <span className="print-checkbox-item">{CB(ts.benhThanMan)} Bệnh thận mạn</span>}
                        {isVis('ts_gut') && <span className="print-checkbox-item">{CB(ts.gut)} Gút</span>}
                    </div>
                    <div className="print-flex-row">
                        {isVis('ts_ungThu') && <span className="print-checkbox-item">{CB(ts.ungThu)} Ung thư{ts.ungThu && ts.khac ? `: ${ts.khac}` : ''}</span>}
                        {isVis('ts_suyTim') && <span className="print-checkbox-item">{CB(ts.suyTimUHuyet)} Suy tim ứ huyết</span>}
                        {isVis('ts_benhMachMauNao') && <span className="print-checkbox-item">{CB(ts.benhMachMauNao)} Bệnh mạch máu não</span>}
                    </div>
                    {isVis('ts_khac') && !ts.ungThu && ts.khac && <div>Khác (ghi rõ): {dotFill(ts.khac)}</div>}
                    {isVis('ts_hutThuocLa') && (
                        <div className="print-flex-row" style={{ marginTop: 4 }}>
                            <span>Hút thuốc lá: {CB(ts.hutThuocLa)} có {CB(!ts.hutThuocLa)} không</span>
                            {ts.hutThuocLa && <span>Số bao-năm: {dotFill(ts.soBaoNam)}</span>}
                        </div>
                    )}
                    {/* Thuốc đã dùng trước nhập viện */}
                    {isVis('ts_thuocDaDung') && (
                        <div style={{ marginTop: 8 }}>
                            <strong>* Thuốc đã dùng trước nhập viện:</strong>
                            {ts.thuocDaDung?.length > 0 ? (
                                <table className="print-table" style={{ marginTop: 4 }}>
                                    <thead>
                                        <tr><th>Tên thuốc</th><th>Liều lượng</th><th>Tổng liều</th><th>Đường dùng</th><th>Thời gian (ngày)</th></tr>
                                    </thead>
                                    <tbody>
                                        {ts.thuocDaDung.map((t) => (
                                            <tr key={t.id}>
                                                <td>{t.tenThuoc}</td>
                                                <td>{t.lieuLuong}</td>
                                                <td>{t.tongLieu}</td>
                                                <td>{t.duongDung}</td>
                                                <td>{val(t.thoiGianDung)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <span> Không</span>}
                        </div>
                    )}
                </div>
            )}

            {/* ══════ C. TRIỆU CHỨNG LÂM SÀNG ══════ */}
            {(isVis('ls_thoiDiemTrieuChung') || isVis('ls_sinhHieu') || isVis('ls_diemGlasgow') || isVis('ls_ho') || isVis('ls_coNang') || isVis('ls_ranPhoi') || isVis('ls_hoiChungTDMP') || isVis('ls_hoiChungDongDac') || isVis('ls_hoiChungTKMP')) && (
                <div className="print-section">
                    <h2>C. TRIỆU CHỨNG LÂM SÀNG</h2>
                    {isVis('ls_thoiDiemTrieuChung') && <div>Thời điểm xuất hiện triệu chứng so với nhập viện: {dotFill(formatDate(ls.thoiDiemTrieuChung))}</div>}
                    {isVis('ls_sinhHieu') && (
                        <>
                            <div className="print-vitals-row">
                                {isVis('ls_sinhHieu_mach', 'ls_sinhHieu') && <span>Mạch: {dotFill(ls.mach)} l/p</span>}
                                {isVis('ls_sinhHieu_huyetAp', 'ls_sinhHieu') && <span style={{ marginLeft: 16 }}>HA: {dotFill(ls.huyetAp)} mmHg</span>}
                                {isVis('ls_sinhHieu_nhietDo', 'ls_sinhHieu') && <span style={{ marginLeft: 16 }}>Nhiệt độ: {dotFill(ls.nhietDo)} °C</span>}
                            </div>
                            <div className="print-vitals-row">
                                {isVis('ls_sinhHieu_nhipTho', 'ls_sinhHieu') && <span>Nhịp thở: {dotFill(ls.nhipTho)} l/p</span>}
                                {isVis('ls_sinhHieu_spO2', 'ls_sinhHieu') && <span style={{ marginLeft: 16 }}>SpO₂: {dotFill(ls.spO2)} %</span>}
                                {isVis('ls_sinhHieu_bmi', 'ls_sinhHieu') && <span style={{ marginLeft: 16 }}>BMI: {dotFill(ls.bmi)} kg/m²</span>}
                            </div>
                        </>
                    )}
                    {isVis('ls_diemGlasgow') && ls.diemGlasgow !== null && ls.diemGlasgow !== undefined && (
                        <div>Điểm Glasgow: {dotFill(ls.diemGlasgow)}</div>
                    )}
                    {isVis('ls_ho') && (
                        <>
                            <div className="print-flex-row" style={{ marginTop: 6 }}>
                                {isVis('ls_ho_khan', 'ls_ho') && <span className="print-checkbox-item">{CB(ls.hoKhan)} Ho khan</span>}
                                {isVis('ls_ho_mau', 'ls_ho') && <span className="print-checkbox-item">{CB(ls.hoMau)} Ho máu</span>}
                            </div>
                            <div className="print-flex-row">
                                {isVis('ls_ho_khacDom', 'ls_ho') && <span className="print-checkbox-item">{CB(ls.hoKhacDom)} Ho khạc đờm</span>}
                                {ls.hoKhacDom && isVis('ls_ho_tinhChatMauSac', 'ls_ho') && (
                                    <>
                                        <span>Tính chất: {val(ls.domTinh?.join(', '))}</span>
                                        <span>Màu sắc: {dotFill(ls.domMauSac)}</span>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                    {isVis('ls_coNang') && (
                        <div className="print-flex-row">
                            {isVis('ls_coNang_dauNguc', 'ls_coNang') && <span className="print-checkbox-item">{CB(ls.dauNguc)} Đau ngực</span>}
                            {isVis('ls_coNang_khoTho', 'ls_coNang') && <span className="print-checkbox-item">{CB(ls.khoTho)} Khó thở</span>}
                        </div>
                    )}
                    {isVis('ls_ranPhoi') && (
                        <div className="print-flex-row">
                            {isVis('ls_ranPhoi_ranAm', 'ls_ranPhoi') && <span className="print-checkbox-item">{CB(ls.ranAm)} Ran ẩm</span>}
                            {isVis('ls_ranPhoi_ranNo', 'ls_ranPhoi') && <span className="print-checkbox-item">{CB(ls.ranNo)} Ran nổ</span>}
                            {isVis('ls_ranPhoi_ranRit', 'ls_ranPhoi') && <span className="print-checkbox-item">{CB(ls.ranRit)} Ran rít</span>}
                            {isVis('ls_ranPhoi_ranNgay', 'ls_ranPhoi') && <span className="print-checkbox-item">{CB(ls.ranNgay)} Ran ngáy</span>}
                        </div>
                    )}
                    {/* Hội chứng */}
                    {isVis('ls_hoiChungTDMP') && (
                        <div className="print-hoi-chung-row">
                            <span>{CB(ls.hoiChungTDMP.co)} Hội chứng TDMP:</span>
                            <span className="print-hoi-chung-ben">
                                {CB(benMatch(ls.hoiChungTDMP.ben, 'Trái'))} bên trái{' '}
                                {CB(benMatch(ls.hoiChungTDMP.ben, 'Phải'))} bên phải{' '}
                                {CB(benMatch(ls.hoiChungTDMP.ben, 'Hai bên'))} hai bên
                            </span>
                        </div>
                    )}
                    {isVis('ls_hoiChungDongDac') && (
                        <div className="print-hoi-chung-row">
                            <span>{CB(ls.hoiChungDongDac.co)} Hội chứng đông đặc:</span>
                            <span className="print-hoi-chung-ben">
                                {CB(benMatch(ls.hoiChungDongDac.ben, 'Trái'))} bên trái{' '}
                                {CB(benMatch(ls.hoiChungDongDac.ben, 'Phải'))} bên phải{' '}
                                {CB(benMatch(ls.hoiChungDongDac.ben, 'Hai bên'))} hai bên
                            </span>
                        </div>
                    )}
                    {isVis('ls_hoiChungTKMP') && (
                        <div className="print-hoi-chung-row">
                            <span>{CB(ls.hoiChungTKMP.co)} Hội chứng TKMP:</span>
                            <span className="print-hoi-chung-ben">
                                {CB(benMatch(ls.hoiChungTKMP.ben, 'Trái'))} bên trái{' '}
                                {CB(benMatch(ls.hoiChungTKMP.ben, 'Phải'))} bên phải{' '}
                                {CB(benMatch(ls.hoiChungTKMP.ben, 'Hai bên'))} hai bên
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ══════ D. CẬN LÂM SÀNG ══════ */}
            {(isVis('cls_congThucMau') || isVis('cls_dienGiaiDo') || isVis('cls_khiMau') || isVis('cls_sinhHoaMau') || isVis('cls_viem') || isVis('cls_dauAnSinhHoc') || isVis('cls_chiSoTinhToan')) && (
                <div className="print-section">
                    <h2>D. CẬN LÂM SÀNG</h2>
                    <table className="print-lab-table">
                        <thead>
                            <tr>
                                <th>Chỉ số</th>
                                <th>Kết quả</th>
                                <th>Chỉ số</th>
                                <th>Kết quả</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="lab-header">{isVis('cls_congThucMau') ? '1. Công thức máu' : ''}</td>
                                <td></td>
                                <td className="lab-header">{isVis('cls_dienGiaiDo') ? 'Điện giải đồ' : ''}</td>
                                <td></td>
                            </tr>
                            <tr><td>{isVis('cls_ctm_wbc', 'cls_congThucMau') ? 'WBC (G/l)' : ''}</td><td>{isVis('cls_ctm_wbc', 'cls_congThucMau') ? val(xn.wbc) : ''}</td><td>{isVis('cls_dgd_na', 'cls_dienGiaiDo') ? 'Na' : ''}</td><td>{isVis('cls_dgd_na', 'cls_dienGiaiDo') ? val(xn.na) : ''}</td></tr>
                            <tr><td>{isVis('cls_ctm_neutro', 'cls_congThucMau') ? 'Neutrophil (%)' : ''}</td><td>{isVis('cls_ctm_neutro', 'cls_congThucMau') ? val(xn.neutrophil) : ''}</td><td>{isVis('cls_dgd_k', 'cls_dienGiaiDo') ? 'K' : ''}</td><td>{isVis('cls_dgd_k', 'cls_dienGiaiDo') ? val(xn.k) : ''}</td></tr>
                            <tr><td>{isVis('cls_ctm_lympho', 'cls_congThucMau') ? 'Lympho (%)' : ''}</td><td>{isVis('cls_ctm_lympho', 'cls_congThucMau') ? val(xn.lymphocyte) : ''}</td><td>{isVis('cls_dgd_cl', 'cls_dienGiaiDo') ? 'Cl' : ''}</td><td>{isVis('cls_dgd_cl', 'cls_dienGiaiDo') ? val(xn.cl) : ''}</td></tr>
                            <tr><td>{isVis('cls_ctm_rbc', 'cls_congThucMau') ? 'RBC (T/l)' : ''}</td><td>{isVis('cls_ctm_rbc', 'cls_congThucMau') ? val(xn.rbc) : ''}</td><td className="lab-header">{isVis('cls_khiMau') ? 'Khí máu' : ''}</td><td></td></tr>
                            <tr><td>{isVis('cls_ctm_hb', 'cls_congThucMau') ? 'Hemoglobin (g/l)' : ''}</td><td>{isVis('cls_ctm_hb', 'cls_congThucMau') ? val(xn.hemoglobin) : ''}</td><td>{isVis('cls_km_ph', 'cls_khiMau') ? 'pH' : ''}</td><td>{isVis('cls_km_ph', 'cls_khiMau') ? val(xn.ph) : ''}</td></tr>
                            <tr><td>{isVis('cls_ctm_hct', 'cls_congThucMau') ? 'Hct (%)' : ''}</td><td>{isVis('cls_ctm_hct', 'cls_congThucMau') ? val(xn.hct) : ''}</td><td>{isVis('cls_km_sao2', 'cls_khiMau') ? 'SaO2' : ''}</td><td>{isVis('cls_km_sao2', 'cls_khiMau') ? val(xn.saO2) : ''}</td></tr>
                            <tr><td>{isVis('cls_ctm_plt', 'cls_congThucMau') ? 'PLT (G/l)' : ''}</td><td>{isVis('cls_ctm_plt', 'cls_congThucMau') ? val(xn.plt) : ''}</td><td>{isVis('cls_km_paco2', 'cls_khiMau') ? 'PaCO2' : ''}</td><td>{isVis('cls_km_paco2', 'cls_khiMau') ? val(xn.paCO2) : ''}</td></tr>
                            <tr>
                                <td className="lab-header">{isVis('cls_sinhHoaMau') ? '2. Sinh hóa máu' : ''}</td>
                                <td></td>
                                <td>{isVis('cls_km_hco3', 'cls_khiMau') ? 'HCO3' : ''}</td>
                                <td>{isVis('cls_km_hco3', 'cls_khiMau') ? val(xn.hcO3) : ''}</td>
                            </tr>
                            <tr><td>{isVis('cls_shm_ure', 'cls_sinhHoaMau') ? 'Ure máu (mmol/l)' : ''}</td><td>{isVis('cls_shm_ure', 'cls_sinhHoaMau') ? val(xn.ure) : ''}</td><td>{isVis('cls_km_be', 'cls_khiMau') ? 'BE' : ''}</td><td>{isVis('cls_km_be', 'cls_khiMau') ? val(xn.be) : ''}</td></tr>
                            <tr><td>{isVis('cls_shm_creatinin', 'cls_sinhHoaMau') ? 'Creatinin (µmol/l)' : ''}</td><td>{isVis('cls_shm_creatinin', 'cls_sinhHoaMau') ? val(xn.creatinin) : ''}</td><td className="lab-header">{isVis('cls_dauAnSinhHoc') ? 'Dấu ấn sinh học' : ''}</td><td>{isVis('cls_dash_barcode', 'cls_dauAnSinhHoc') ? `BC: ${val(xn.biomarkerBarcode)}` : ''}</td></tr>
                            <tr><td>{isVis('cls_shm_ast', 'cls_sinhHoaMau') ? 'AST (U/l)' : ''}</td><td>{isVis('cls_shm_ast', 'cls_sinhHoaMau') ? val(xn.ast) : ''}</td><td>{isVis('cls_dash_strem1', 'cls_dauAnSinhHoc') ? 'sTREM-1' : ''}</td><td>{isVis('cls_dash_strem1', 'cls_dauAnSinhHoc') ? val(xn.sTREM1) : ''}</td></tr>
                            <tr><td>{isVis('cls_shm_alt', 'cls_sinhHoaMau') ? 'ALT (U/l)' : ''}</td><td>{isVis('cls_shm_alt', 'cls_sinhHoaMau') ? val(xn.alt) : ''}</td><td>{isVis('cls_dash_timp1', 'cls_dauAnSinhHoc') ? 'TIMP-1' : ''}</td><td>{isVis('cls_dash_timp1', 'cls_dauAnSinhHoc') ? val(xn.tIMP1) : ''}</td></tr>
                            <tr><td>{isVis('cls_shm_ggt', 'cls_sinhHoaMau') ? 'GGT (U/l)' : ''}</td><td>{isVis('cls_shm_ggt', 'cls_sinhHoaMau') ? val(xn.ggt) : ''}</td><td>{isVis('cls_dash_il6', 'cls_dauAnSinhHoc') ? 'IL6' : ''}</td><td>{isVis('cls_dash_il6', 'cls_dauAnSinhHoc') ? val(xn.il6) : ''}</td></tr>
                            <tr><td>{isVis('cls_shm_glucose', 'cls_sinhHoaMau') ? 'Glucose máu (µmol/l)' : ''}</td><td>{isVis('cls_shm_glucose', 'cls_sinhHoaMau') ? val(xn.glucose) : ''}</td><td>{isVis('cls_dash_il10', 'cls_dauAnSinhHoc') ? 'IL10' : ''}</td><td>{isVis('cls_dash_il10', 'cls_dauAnSinhHoc') ? val(xn.il10) : ''}</td></tr>
                            <tr><td>{isVis('cls_shm_protein', 'cls_sinhHoaMau') ? 'Protein (g/l)' : ''}</td><td>{isVis('cls_shm_protein', 'cls_sinhHoaMau') ? val(xn.protein) : ''}</td><td>{isVis('cls_dash_il17', 'cls_dauAnSinhHoc') ? 'IL17' : ''}</td><td>{isVis('cls_dash_il17', 'cls_dauAnSinhHoc') ? val(xn.il17) : ''}</td></tr>
                            <tr><td>{isVis('cls_shm_albumin', 'cls_sinhHoaMau') ? 'Albumin (g/l)' : ''}</td><td>{isVis('cls_shm_albumin', 'cls_sinhHoaMau') ? val(xn.albumin) : ''}</td><td className="lab-header">{isVis('cls_chiSoTinhToan') ? '3. Các chỉ số tính toán' : ''}</td><td></td></tr>
                            <tr><td>{isVis('cls_viem_crp', 'cls_viem') ? 'CRP (mg/l)' : ''}</td><td>{isVis('cls_viem_crp', 'cls_viem') ? val(xn.crp) : ''}</td><td>{isVis('cls_cstt_nlr', 'cls_chiSoTinhToan') ? 'NLR' : ''}</td><td>{isVis('cls_cstt_nlr', 'cls_chiSoTinhToan') ? val(ct.nlr) : ''}</td></tr>
                            <tr><td>{isVis('cls_viem_pct', 'cls_viem') ? 'Procalcitonin (pg/ml)' : ''}</td><td>{isVis('cls_viem_pct', 'cls_viem') ? val(xn.procalcitonin) : ''}</td><td>{isVis('cls_cstt_plr', 'cls_chiSoTinhToan') ? 'PLR' : ''}</td><td>{isVis('cls_cstt_plr', 'cls_chiSoTinhToan') ? val(ct.plr) : ''}</td></tr>
                            <tr><td></td><td></td><td>{isVis('cls_cstt_car', 'cls_chiSoTinhToan') ? 'CAR' : ''}</td><td>{isVis('cls_cstt_car', 'cls_chiSoTinhToan') ? val(ct.car) : ''}</td></tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* ══════ 4. CHẨN ĐOÁN HÌNH ẢNH ══════ */}
            {(isVis('ha_xquang') || isVis('ha_ct')) && (
                <div className="print-section">
                    <h2>4. Chẩn đoán hình ảnh</h2>

                    {isVis('ha_xquang') && (
                        <div style={{ marginBottom: 8 }}>
                            <strong>* Xquang ngực thẳng:</strong>
                            {ha.xquangTonThuong.length > 0 ? (
                                <table className="print-table">
                                    <thead>
                                        <tr><th>Vị trí</th><th>Tổn thương</th><th>Diện</th><th>Thời điểm</th></tr>
                                    </thead>
                                    <tbody>
                                        {ha.xquangTonThuong.map((t) => (
                                            <tr key={t.id}>
                                                <td>{[t.viTri, t.ben].filter(Boolean).join(', ')}</td>
                                                <td>{t.hinhThai}</td>
                                                <td>{t.dien}</td>
                                                <td>{(t as { thoiDiem?: string }).thoiDiem || ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <span> Không có tổn thương</span>}
                        </div>
                    )}

                    {isVis('ha_ct') && (
                        <div>
                            <strong>* Cắt lớp vi tính lồng ngực:</strong>
                            {ha.ctTonThuong.length > 0 ? (
                                <table className="print-table">
                                    <thead>
                                        <tr><th>Vị trí</th><th>Tổn thương</th><th>Mức độ</th><th>Thời điểm</th></tr>
                                    </thead>
                                    <tbody>
                                        {ha.ctTonThuong.map((t) => (
                                            <tr key={t.id}>
                                                <td>{[t.thuy, t.ben].filter(Boolean).join(', ')}</td>
                                                <td>{t.hinhThai}</td>
                                                <td>{t.dien}</td>
                                                <td>{(t as { thoiDiem?: string }).thoiDiem || ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <span> Không có tổn thương</span>}
                        </div>
                    )}
                </div>
            )}

            {/* ══════ 5. VI KHUẨN + KHÁNG SINH ĐỒ ══════ */}
            {isVis('cls_viKhuan') && (
                <div className="print-section">
                    <h2>5. Xét nghiệm vi khuẩn</h2>
                    {p.viKhuan.length === 0 ? (
                        <div>Không có kết quả vi khuẩn.</div>
                    ) : (
                        p.viKhuan.map((vk, idx) => (
                            <div key={vk.id} style={{ marginBottom: 12 }}>
                                <div><strong>Vi khuẩn {idx + 1}:</strong> {vk.tenViKhuan || '...............'}</div>
                                {(() => {
                                    const tested = vk.khangSinhDo.filter(ks => ks.mucDo === 'S' || ks.mucDo === 'R' || ks.mucDo === 'I');
                                    return tested.length > 0 ? (
                                        <table className="print-table" style={{ marginTop: 4 }}>
                                            <thead>
                                                <tr>
                                                    <th rowSpan={2}>Kháng sinh</th>
                                                    <th colSpan={3}>Kết quả</th>
                                                </tr>
                                                <tr>
                                                    <th>S</th>
                                                    <th>R</th>
                                                    <th>I</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tested.map((ks, kIdx) => (
                                                    <tr key={kIdx}>
                                                        <td>{ks.tenKhangSinh}</td>
                                                        <td style={{ textAlign: 'center' }}>{ks.mucDo === 'S' ? 'x' : ''}</td>
                                                        <td style={{ textAlign: 'center' }}>{ks.mucDo === 'R' ? 'x' : ''}</td>
                                                        <td style={{ textAlign: 'center' }}>{ks.mucDo === 'I' ? 'x' : ''}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : null;
                                })()}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ══════ PHÂN ĐỘ MỨC ĐỘ NẶNG ══════ */}
            {(isVis('score_curb65') || isVis('score_psi')) && (
                <div className="print-section">
                    <h2>D. PHÂN ĐỘ MỨC ĐỘ NẶNG</h2>
                    {isVis('score_curb65') && (
                        <div style={{ marginBottom: 8 }}>
                            <strong>1. CURB-65:</strong>
                            <div style={{ marginLeft: 16 }}>
                                {isVis('curb65_tongDiem', 'score_curb65') && (
                                    <>
                                        <div>- Tổng điểm: {dotFill(p.curb65?.duDuLieu ? p.curb65.tongDiem : 'Chưa đủ dữ liệu')}</div>
                                        <div>- Phân nhóm: {dotFill(p.curb65?.duDuLieu ? p.curb65.phanNhom : '')}</div>
                                    </>
                                )}
                                <div style={{ marginTop: 4 }}>
                                    {isVis('curb65_c', 'score_curb65') && <>{CB(p.curb65?.chiTiet?.c === true)} C — Confusion (Rối loạn ý thức mới){'  '}</>}
                                    {isVis('curb65_u', 'score_curb65') && <>{CB(p.curb65?.chiTiet?.u === true)} U — Ure {'>'} 7 mmol/L{'  '}</>}
                                    {isVis('curb65_r', 'score_curb65') && <>{CB(p.curb65?.chiTiet?.r === true)} R — Nhịp thở ≥ 30{'  '}</>}
                                </div>
                                <div>
                                    {isVis('curb65_b', 'score_curb65') && <>{CB(p.curb65?.chiTiet?.b === true)} B — HA {'<'} 90/60 mmHg{'  '}</>}
                                    {isVis('curb65_age65', 'score_curb65') && <>{CB(p.curb65?.chiTiet?.age65 === true)} 65 — Tuổi ≥ 65</>}
                                </div>
                            </div>
                        </div>
                    )}
                    {isVis('score_psi') && (
                        <div>
                            <strong>2. PSI:</strong>
                            <div style={{ marginLeft: 16 }}>
                                <div>- Tổng điểm: {dotFill(psi.tongDiem)}</div>
                                {settings.showPsiLevel && (
                                    <div>- Mức độ: {dotFill(getPhanTang(psi.tongDiem))}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══════ E. KẾT CỤC ĐIỀU TRỊ ══════ */}
            {(isVis('kc_dienBien') || isVis('kc_tinhTrangRaVien') || isVis('kc_khangSinh') || isVis('kc_soNgayDieuTri')) && (
                <div className="print-section">
                    <h2>E. KẾT CỤC ĐIỀU TRỊ</h2>
                    {isVis('kc_dienBien') && (
                        <>
                            <div>1. Diễn biến điều trị:</div>
                            <div className="print-flex-row" style={{ marginLeft: 16 }}>
                                {dienBienList.map((label) => {
                                    let subKey = '';
                                    if (label === 'Thở máy') subKey = 'kc_dienBien_thoMay';
                                    else if (label === 'Sốc nhiễm khuẩn') subKey = 'kc_dienBien_socNhiemKhuan';
                                    else if (label === 'Lọc máu') subKey = 'kc_dienBien_locMau';
                                    if (subKey && !isVis(subKey, 'kc_dienBien')) return null;

                                    return (
                                        <span key={label} className="print-checkbox-item">
                                            {CB(selectedDienBien.includes(label))} {label}
                                            {label === 'Lọc máu' && kc.soNgayLocMau != null && ` (${kc.soNgayLocMau} ngày)`}
                                        </span>
                                    );
                                })}
                            </div>
                        </>
                    )}
                    {isVis('kc_tinhTrangRaVien') && (
                        <>
                            <div style={{ marginTop: 6 }}>2. Tình trạng ra viện:</div>
                            <div className="print-flex-row" style={{ marginLeft: 16 }}>
                                {tinhTrangList.map((label) => {
                                    let subKey = '';
                                    if (label === 'Tử vong') subKey = 'kc_tinhTrangRaVien_tuVong';
                                    else if (label === 'Xin về') subKey = 'kc_tinhTrangRaVien_xinVe';
                                    else if (label === 'Tiến triển tốt, xuất viện') subKey = 'kc_tinhTrangRaVien_xuatVien';
                                    else if (label === 'Chuyển tuyến') subKey = 'kc_tinhTrangRaVien_chuyenTuyen';
                                    if (subKey && !isVis(subKey, 'kc_tinhTrangRaVien')) return null;

                                    return (
                                        <span key={label} className="print-checkbox-item">
                                            {CB(kc.tinhTrangRaVien === label)} {label}
                                        </span>
                                    );
                                })}
                            </div>
                        </>
                    )}
                    {isVis('kc_khangSinh') && (
                        <div style={{ marginTop: 6 }}>
                            Sử dụng kháng sinh:
                            {isVis('kc_khangSinh_ngayBatDau', 'kc_khangSinh') && (
                                <span> từ ngày {dotFill(formatDate(kc.ngayBatDauKhangSinh))}</span>
                            )}
                            {isVis('kc_khangSinh_ngayKetThuc', 'kc_khangSinh') && (
                                <span> đến ngày: {dotFill(formatDate(kc.ngayKetThucKhangSinh))}</span>
                            )}
                            {isVis('kc_khangSinh_soNgay', 'kc_khangSinh') && (
                                <span> ({dotFill(soNgayKS)} ngày)</span>
                            )}
                        </div>
                    )}
                    {isVis('kc_soNgayDieuTri') && <div>Tổng số ngày điều trị: {dotFill(soNgayDieuTri)}</div>}
                </div>
            )}

            {/* ══════ SIGNATURE ══════ */}
            <div className="print-signature">
                <div>{settings.signLeft || 'THẦY HƯỚNG DẪN'}</div>
                <div>{settings.signRight || 'HỌC VIÊN NGHIÊN CỨU'}</div>
            </div>
        </div>
    );
}

// ─── Main Export ─────────────────────────────────────────────
export default function PrintResearchRecord({ patients, settings }: Props) {
    return (
        <>
            {patients.map((p, idx) => (
                <div key={p.id} className={idx < patients.length - 1 ? 'print-record-break' : ''}>
                    <PatientRecord patient={p} settings={settings} />
                </div>
            ))}
        </>
    );
}
