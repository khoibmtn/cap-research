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
            if (Array.isArray(p) && p.length > 0) return p;
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
            <div className="print-section">
                <h2>A. HÀNH CHÍNH</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 4 }}>
                    <span>Họ và tên: {dotFill(hc.hoTen)}</span>
                    <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap', paddingLeft: 16 }}>Tuổi: {dotFill(hc.tuoi)}</span>
                    <span style={{ whiteSpace: 'nowrap', paddingLeft: 16 }}>Giới: {dotFill(hc.gioiTinh === 'nam' ? 'Nam' : hc.gioiTinh === 'nu' ? 'Nữ' : '')}</span>
                </div>
                <div>Nghề nghiệp: {dotFill(hc.ngheNghiep)}</div>
                <div className="print-row">
                    <div>Địa chỉ: {dotFill([hc.diaChiXaPhuong, hc.diaChiTinhThanh].filter(Boolean).join(', '))}</div>
                    <div>Nơi ở: {dotFill(hc.noiO)}</div>
                </div>
                <div className="print-row">
                    <div>Ngày vào viện: {dotFill(formatDate(hc.ngayVaoVien))}</div>
                    <div>Ngày ra viện: {dotFill(formatDate(hc.ngayRaVien))}</div>
                </div>
                <div>Mã bệnh án nội trú: {dotFill(p.maBenhAnNoiTru)}</div>
            </div>

            {/* ══════ B. TIỀN SỬ ══════ */}
            <div className="print-section">
                <h2>B. TIỀN SỬ</h2>
                <div className="print-flex-row">
                    <span className="print-checkbox-item">{CB(ts.daiThaoDuong)} Đái tháo đường</span>
                    <span className="print-checkbox-item">{CB(ts.tangHuyetAp)} Tăng huyết áp</span>
                    <span className="print-checkbox-item">{CB(ts.viemDaDay)} Viêm dạ dày</span>
                </div>
                <div className="print-flex-row">
                    <span className="print-checkbox-item">{CB(ts.viemGanMan)} Viêm gan mạn</span>
                    <span className="print-checkbox-item">{CB(ts.benhThanMan)} Bệnh thận mạn</span>
                    <span className="print-checkbox-item">{CB(ts.gut)} Gút</span>
                </div>
                <div className="print-flex-row">
                    <span className="print-checkbox-item">{CB(ts.ungThu)} Ung thư{ts.ungThu && ts.khac ? `: ${ts.khac}` : ''}</span>
                    <span className="print-checkbox-item">{CB(ts.suyTimUHuyet)} Suy tim ứ huyết</span>
                </div>
                <div className="print-flex-row">
                    <span className="print-checkbox-item">{CB(ts.benhMachMauNao)} Bệnh mạch máu não</span>
                </div>
                {!ts.ungThu && ts.khac && <div>Khác (ghi rõ): {dotFill(ts.khac)}</div>}
                <div className="print-flex-row" style={{ marginTop: 4 }}>
                    <span>Hút thuốc lá: {CB(ts.hutThuocLa)} có {CB(!ts.hutThuocLa)} không</span>
                    {ts.hutThuocLa && <span>Số bao-năm: {dotFill(ts.soBaoNam)}</span>}
                </div>
            </div>

            {/* ══════ C. TRIỆU CHỨNG LÂM SÀNG ══════ */}
            <div className="print-section">
                <h2>C. TRIỆU CHỨNG LÂM SÀNG</h2>
                <div>Thời điểm xuất hiện triệu chứng so với nhập viện: {dotFill(formatDate(ls.thoiDiemTrieuChung))}</div>
                <div className="print-vitals-row">
                    <span>Mạch: {dotFill(ls.mach)} l/p</span>
                    <span style={{ marginLeft: 16 }}>HA: {dotFill(ls.huyetAp)} mmHg</span>
                    <span style={{ marginLeft: 16 }}>Nhiệt độ: {dotFill(ls.nhietDo)} °C</span>
                </div>
                <div className="print-vitals-row">
                    <span>Nhịp thở: {dotFill(ls.nhipTho)} l/p</span>
                    <span style={{ marginLeft: 16 }}>SpO₂: {dotFill(ls.spO2)} %</span>
                    <span style={{ marginLeft: 16 }}>BMI: {dotFill(ls.bmi)} kg/m²</span>
                </div>
                {ls.diemGlasgow !== null && ls.diemGlasgow !== undefined && (
                    <div>Điểm Glasgow: {dotFill(ls.diemGlasgow)}</div>
                )}
                <div className="print-flex-row" style={{ marginTop: 6 }}>
                    <span className="print-checkbox-item">{CB(ls.hoKhan)} Ho khan</span>
                    <span className="print-checkbox-item">{CB(ls.hoMau)} Ho máu</span>
                </div>
                <div className="print-flex-row">
                    <span className="print-checkbox-item">{CB(ls.hoKhacDom)} Ho khạc đờm</span>
                    {ls.hoKhacDom && (
                        <>
                            <span>Tính chất: {val(ls.domTinh?.join(', '))}</span>
                            <span>Màu sắc: {dotFill(ls.domMauSac)}</span>
                        </>
                    )}
                </div>
                <div className="print-flex-row">
                    <span className="print-checkbox-item">{CB(ls.dauNguc)} Đau ngực</span>
                    <span className="print-checkbox-item">{CB(ls.khoTho)} Khó thở</span>
                </div>
                <div className="print-flex-row">
                    <span className="print-checkbox-item">{CB(ls.ranAm)} Ran ẩm</span>
                    <span className="print-checkbox-item">{CB(ls.ranNo)} Ran nổ</span>
                    <span className="print-checkbox-item">{CB(ls.ranRit)} Ran rít</span>
                    <span className="print-checkbox-item">{CB(ls.ranNgay)} Ran ngáy</span>
                </div>
                {/* Hội chứng */}
                <div className="print-hoi-chung-row">
                    <span>{CB(ls.hoiChungTDMP.co)} Hội chứng TDMP:</span>
                    <span className="print-hoi-chung-ben">
                        {CB(benMatch(ls.hoiChungTDMP.ben, 'Trái'))} bên trái{' '}
                        {CB(benMatch(ls.hoiChungTDMP.ben, 'Phải'))} bên phải{' '}
                        {CB(benMatch(ls.hoiChungTDMP.ben, 'Hai bên'))} hai bên
                    </span>
                </div>
                <div className="print-hoi-chung-row">
                    <span>{CB(ls.hoiChungDongDac.co)} Hội chứng đông đặc:</span>
                    <span className="print-hoi-chung-ben">
                        {CB(benMatch(ls.hoiChungDongDac.ben, 'Trái'))} bên trái{' '}
                        {CB(benMatch(ls.hoiChungDongDac.ben, 'Phải'))} bên phải{' '}
                        {CB(benMatch(ls.hoiChungDongDac.ben, 'Hai bên'))} hai bên
                    </span>
                </div>
                <div className="print-hoi-chung-row">
                    <span>{CB(ls.hoiChungTKMP.co)} Hội chứng TKMP:</span>
                    <span className="print-hoi-chung-ben">
                        {CB(benMatch(ls.hoiChungTKMP.ben, 'Trái'))} bên trái{' '}
                        {CB(benMatch(ls.hoiChungTKMP.ben, 'Phải'))} bên phải{' '}
                        {CB(benMatch(ls.hoiChungTKMP.ben, 'Hai bên'))} hai bên
                    </span>
                </div>
            </div>

            {/* ══════ D. CẬN LÂM SÀNG ══════ */}
            <div className="print-section">
                <h2>D. CẬN LÂM SÀNG LÂM SÀNG</h2>
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
                        <tr><td className="lab-header">1. Công thức máu</td><td></td><td className="lab-header">Điện giải đồ</td><td></td></tr>
                        <tr><td>WBC (G/l)</td><td>{val(xn.wbc)}</td><td>Na</td><td>{val(xn.na)}</td></tr>
                        <tr><td>Neutrophil (%)</td><td>{val(xn.neutrophil)}</td><td>K</td><td>{val(xn.k)}</td></tr>
                        <tr><td>Lympho (%)</td><td>{val(xn.lymphocyte)}</td><td>Cl</td><td>{val(xn.cl)}</td></tr>
                        <tr><td>RBC (T/l)</td><td>{val(xn.rbc)}</td><td className="lab-header">Khí máu</td><td></td></tr>
                        <tr><td>Hemoglobin (g/l)</td><td>{val(xn.hemoglobin)}</td><td>pH</td><td>{val(xn.ph)}</td></tr>
                        <tr><td>Hct (%)</td><td>{val(xn.hct)}</td><td>SaO2</td><td>{val(xn.saO2)}</td></tr>
                        <tr><td>PLT (G/l)</td><td>{val(xn.plt)}</td><td>PaCO2</td><td>{val(xn.paCO2)}</td></tr>
                        <tr><td className="lab-header">2. Sinh hóa máu</td><td></td><td>HCO3</td><td>{val(xn.hcO3)}</td></tr>
                        <tr><td>Ure máu (mmol/l)</td><td>{val(xn.ure)}</td><td>BE</td><td>{val(xn.be)}</td></tr>
                        <tr><td>Creatinin (µmol/l)</td><td>{val(xn.creatinin)}</td><td className="lab-header">Dấu ấn sinh học</td><td></td></tr>
                        <tr><td>AST (U/l)</td><td>{val(xn.ast)}</td><td>sTREM-1</td><td>{val(xn.sTREM1)}</td></tr>
                        <tr><td>ALT (U/l)</td><td>{val(xn.alt)}</td><td>TIMP-1</td><td>{val(xn.tIMP1)}</td></tr>
                        <tr><td>GGT (U/l)</td><td>{val(xn.ggt)}</td><td>IL6</td><td>{val(xn.il6)}</td></tr>
                        <tr><td>Glucose máu (µmol/l)</td><td>{val(xn.glucose)}</td><td>IL10</td><td>{val(xn.il10)}</td></tr>
                        <tr><td>Protein (g/l)</td><td>{val(xn.protein)}</td><td>IL17</td><td>{val(xn.il17)}</td></tr>
                        <tr><td>Albumin (g/l)</td><td>{val(xn.albumin)}</td><td className="lab-header">3. Các chỉ số tính toán</td><td></td></tr>
                        <tr><td>CRP (mg/l)</td><td>{val(xn.crp)}</td><td>NLR</td><td>{val(ct.nlr)}</td></tr>
                        <tr><td>Procalcitonin (pg/ml)</td><td>{val(xn.procalcitonin)}</td><td>PLR</td><td>{val(ct.plr)}</td></tr>
                        <tr><td></td><td></td><td>CAR</td><td>{val(ct.car)}</td></tr>
                    </tbody>
                </table>
            </div>

            {/* ══════ 4. CHẨN ĐOÁN HÌNH ẢNH ══════ */}
            <div className="print-section">
                <h2>4. Chẩn đoán hình ảnh</h2>

                <div style={{ marginBottom: 8 }}>
                    <strong>* Xquang ngực thẳng:</strong>
                    {ha.xquangTonThuong.length > 0 ? (
                        <table className="print-table">
                            <thead>
                                <tr><th>Vị trí</th><th>Tổn thương</th><th>Diện</th></tr>
                            </thead>
                            <tbody>
                                {ha.xquangTonThuong.map((t) => (
                                    <tr key={t.id}>
                                        <td>{[t.viTri, t.ben].filter(Boolean).join(', ')}</td>
                                        <td>{t.hinhThai}</td>
                                        <td>{t.dien}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <span> Không có tổn thương</span>}
                </div>

                <div>
                    <strong>* Cắt lớp vi tính lồng ngực:</strong>
                    {ha.ctTonThuong.length > 0 ? (
                        <table className="print-table">
                            <thead>
                                <tr><th>Vị trí</th><th>Tổn thương</th><th>Mức độ</th></tr>
                            </thead>
                            <tbody>
                                {ha.ctTonThuong.map((t) => (
                                    <tr key={t.id}>
                                        <td>{[t.thuy, t.ben].filter(Boolean).join(', ')}</td>
                                        <td>{t.hinhThai}</td>
                                        <td>{t.dien}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <span> Không có tổn thương</span>}
                </div>
            </div>

            {/* ══════ 5. VI KHUẨN + KHÁNG SINH ĐỒ ══════ */}
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

            {/* ══════ D. PSI ══════ */}
            <div className="print-section">
                <h2>D. PHÂN ĐỘ MỨC ĐỘ NẶNG THEO THANG ĐIỂM PSI</h2>
                <div>- Tổng điểm: {dotFill(psi.tongDiem)}</div>
                {settings.showPsiLevel && (
                    <div>- Mức độ: {dotFill(getPhanTang(psi.tongDiem))}</div>
                )}
            </div>

            {/* ══════ E. KẾT CỤC ĐIỀU TRỊ ══════ */}
            <div className="print-section">
                <h2>E. KẾT CỤC ĐIỀU TRỊ</h2>
                <div>1. Diễn biến điều trị:</div>
                <div className="print-flex-row" style={{ marginLeft: 16 }}>
                    {dienBienList.map((label) => (
                        <span key={label} className="print-checkbox-item">
                            {CB(selectedDienBien.includes(label))} {label}
                            {label === 'Lọc máu' && kc.soNgayLocMau != null && ` (${kc.soNgayLocMau} ngày)`}
                        </span>
                    ))}
                </div>
                <div style={{ marginTop: 6 }}>2. Tình trạng ra viện:</div>
                <div className="print-flex-row" style={{ marginLeft: 16 }}>
                    {tinhTrangList.map((label) => (
                        <span key={label} className="print-checkbox-item">
                            {CB(kc.tinhTrangRaVien === label)} {label}
                        </span>
                    ))}
                </div>
                <div style={{ marginTop: 6 }}>
                    Sử dụng kháng sinh: từ ngày {dotFill(formatDate(kc.ngayBatDauKhangSinh))} đến ngày: {dotFill(formatDate(kc.ngayKetThucKhangSinh))} ({dotFill(soNgayKS)} ngày)
                </div>
                <div>Tổng số ngày điều trị: {dotFill(soNgayDieuTri)}</div>
            </div>

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
