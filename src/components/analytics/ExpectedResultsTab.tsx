import { useMemo } from 'react';
import type { Patient } from '../../types/patient';
import { mean, sd, median, q1, q3, meanSd, frac, pct, psiClass } from '../../utils/statsHelpers';
import { AlertTriangle, Info, BookOpen } from 'lucide-react';

// ─── VK classification mapping ──────────────────────────────
const VK_DIEN_HINH = new Set([
    'Streptococcus pneumoniae',
    'Haemophilus influenzae',
    'Moraxella catarrhalis',
    'Staphylococcus aureus',
    'Klebsiella pneumoniae',
    'Pseudomonas aeruginosa',
    'Acinetobacter baumannii',
    'Escherichia coli',
    'Enterobacter cloacae',
    'Klebsiella oxytoca',
    'Serratia marcescens',
    'Proteus mirabilis',
    'Burkholderia cepacia',
    'Stenotrophomonas maltophila',
    'Aeromonas hydrophila',
]);

const VK_KHONG_DIEN_HINH = new Set([
    'Mycoplasma pneumoniae',
    'Chlamydophila pneumoniae',
    'Chlamydia pneumoniae',
    'Legionella pneumophila',
    'Legionella spp',
]);

function classifyVK(name: string): 'dien_hinh' | 'khong_dien_hinh' | 'khac' {
    if (VK_DIEN_HINH.has(name)) return 'dien_hinh';
    if (VK_KHONG_DIEN_HINH.has(name)) return 'khong_dien_hinh';
    // fuzzy matching
    const lower = name.toLowerCase();
    if (lower.includes('mycoplasma') || lower.includes('chlamyd') || lower.includes('legionella')) return 'khong_dien_hinh';
    return 'dien_hinh'; // default to typical
}

// ─── Spearman rank correlation ──────────────────────────────
function spearmanCorrelation(x: number[], y: number[]): number | null {
    if (x.length < 3 || x.length !== y.length) return null;
    const n = x.length;
    const rankArr = (arr: number[]) => {
        const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
        const ranks = new Array(n);
        for (let i = 0; i < n; i++) {
            let j = i;
            while (j < n - 1 && sorted[j + 1].v === sorted[i].v) j++;
            const avgRank = (i + j) / 2 + 1;
            for (let k = i; k <= j; k++) ranks[sorted[k].i] = avgRank;
            i = j;
        }
        return ranks;
    };
    const rx = rankArr(x);
    const ry = rankArr(y);
    const dSq = rx.reduce((s, r, i) => s + (r - ry[i]) ** 2, 0);
    return 1 - (6 * dSq) / (n * (n * n - 1));
}

// ─── Helpers ────────────────────────────────────────────────
const num = (v: number | null): boolean => v !== null && v !== undefined;
const minMax = (vals: number[]) => vals.length > 0 ? `${Math.min(...vals)} – ${Math.max(...vals)}` : '—';

interface StatRow {
    label: string;
    n: number;
    value: string;
    subValue?: string;
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function ExpectedResultsTab({ patients }: { patients: Patient[] }) {
    const N = patients.length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200 p-5">
                <div className="flex items-start gap-3">
                    <BookOpen className="w-6 h-6 text-primary-600 mt-0.5 shrink-0" />
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Dự kiến kết quả nghiên cứu — Chương 3</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Trình bày kết quả theo dàn ý chương 3: Đặc điểm căn nguyên vi sinh và một số dấu ấn sinh học
                            ở bệnh nhân viêm phổi mắc phải cộng đồng (CAP). Dữ liệu tự động tính từ {N} bệnh nhân trong hệ thống.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── 3.1.1: Đặc điểm chung ── */}
            <Table311 patients={patients} />

            {/* ── 3.1.2: Lâm sàng ── */}
            <Table312 patients={patients} />

            {/* ── 3.1.3: Cận lâm sàng ── */}
            <Table313 patients={patients} />

            {/* ── 3.1.4: Phân loại PSI ── */}
            <Table314 patients={patients} />

            {/* ── 3.1.5: Hình ảnh học ── */}
            <Table315 patients={patients} />

            {/* ── 3.1.6: Căn nguyên vi sinh ── */}
            <Table316 patients={patients} />

            {/* ── 3.1.7: Biomarker tổng hợp ── */}
            <Table317 patients={patients} />

            {/* ── 3.2.1: Biomarker theo nhóm căn nguyên ── */}
            <Table321 patients={patients} />

            {/* ── 3.2.2: Biomarker theo PSI ── */}
            <Table322 patients={patients} />

            {/* ── 3.2.3: Biomarker theo kết cục ── */}
            <Table323 patients={patients} />

            {/* ── 3.2.4: Tương quan ── */}
            <Table324 patients={patients} />

            {/* ── Ghi chú ── */}
            <NotesSection />
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// SECTION: Shared table wrapper
// ════════════════════════════════════════════════════════════
function SectionCard({ id, title, subtitle, children, note }: {
    id: string;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    note?: string;
}) {
    return (
        <div id={id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <div className="p-5">
                {children}
                {note && (
                    <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-3">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{note}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function DataTable({ headers, rows, className }: {
    headers: string[];
    rows: (string | React.ReactNode)[][];
    className?: string;
}) {
    return (
        <div className={`overflow-x-auto ${className || ''}`}>
            <table className="min-w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-50">
                        {headers.map((h, i) => (
                            <th key={i} className={`p-2.5 border border-gray-200 font-semibold text-gray-700 ${i === 0 ? 'text-left' : 'text-center'} whitespace-nowrap`}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, ri) => (
                        <tr key={ri} className="hover:bg-gray-50/80">
                            {row.map((cell, ci) => (
                                <td key={ci} className={`p-2.5 border border-gray-200 ${ci === 0 ? 'font-medium text-gray-800' : 'text-center text-gray-600'}`}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// 3.1.1: ĐẶC ĐIỂM CHUNG
// ════════════════════════════════════════════════════════════
function Table311({ patients }: { patients: Patient[] }) {
    const N = patients.length;
    const data = useMemo(() => {
        const ages = patients.map(p => p.hanhChinh.tuoi).filter(num);
        const males = patients.filter(p => p.hanhChinh.gioiTinh === 'nam').length;
        const females = patients.filter(p => p.hanhChinh.gioiTinh === 'nu').length;
        const bmis = patients.map(p => p.lamSang.bmi).filter(num);

        // Nghề nghiệp
        const ngheNghiep: Record<string, number> = {};
        patients.forEach(p => {
            const nn = p.hanhChinh.ngheNghiep || 'Không rõ';
            ngheNghiep[nn] = (ngheNghiep[nn] || 0) + 1;
        });

        // Nơi ở
        const noiO: Record<string, number> = {};
        patients.forEach(p => {
            const v = p.hanhChinh.noiO;
            const label = v === 'nong_thon' ? 'Nông thôn' : v === 'thanh_thi' ? 'Thành thị' : v === 'hai_dao' ? 'Hải đảo' : 'Không rõ';
            noiO[label] = (noiO[label] || 0) + 1;
        });

        // Tiền sử
        const tienSuItems = [
            { label: 'Đái tháo đường', count: patients.filter(p => p.tienSu.daiThaoDuong).length },
            { label: 'Tăng huyết áp', count: patients.filter(p => p.tienSu.tangHuyetAp).length },
            { label: 'Bệnh thận mạn', count: patients.filter(p => p.tienSu.benhThanMan).length },
            { label: 'Suy tim ứ huyết', count: patients.filter(p => p.tienSu.suyTimUHuyet).length },
            { label: 'Bệnh mạch máu não', count: patients.filter(p => p.tienSu.benhMachMauNao).length },
            { label: 'Ung thư', count: patients.filter(p => p.tienSu.ungThu).length },
            { label: 'Viêm dạ dày', count: patients.filter(p => p.tienSu.viemDaDay).length },
            { label: 'Viêm gan mạn', count: patients.filter(p => p.tienSu.viemGanMan).length },
            { label: 'Gút', count: patients.filter(p => p.tienSu.gut).length },
        ].filter(t => t.count > 0);

        const hutThuoc = patients.filter(p => p.tienSu.hutThuocLa).length;
        const soBaoNam = patients.map(p => p.tienSu.soBaoNam).filter(num);
        const ngayDT = patients.map(p => p.ketCuc?.tongSoNgayDieuTri).filter(num);
        const tuVong = patients.filter(p => p.ketCuc?.tuVong).length;
        const xuatVien = patients.filter(p => p.ketCuc?.tienTrienTotXuatVien).length;
        const xinVe = patients.filter(p => p.ketCuc?.xinVe).length;

        return { ages, males, females, bmis, ngheNghiep, noiO, tienSuItems, hutThuoc, soBaoNam, ngayDT, tuVong, xuatVien, xinVe };
    }, [patients]);

    const rows: (string | React.ReactNode)[][] = [
        ['Tổng số bệnh nhân', String(N), '100%'],
        ['Tuổi (Mean ± SD)', data.ages.length > 0 ? meanSd(data.ages) : '—', data.ages.length > 0 ? minMax(data.ages) : '—'],
        ['  Nam', String(data.males), pct(data.males, N)],
        ['  Nữ', String(data.females), pct(data.females, N)],
        ['BMI (Mean ± SD)', data.bmis.length > 0 ? meanSd(data.bmis) : '—', data.bmis.length > 0 ? `n = ${data.bmis.length}` : '—'],
    ];

    // Nghề nghiệp
    Object.entries(data.ngheNghiep).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        rows.push([`  ${k}`, String(v), pct(v, N)]);
    });

    // Nơi ở
    rows.push(['Nơi ở', '', '']);
    Object.entries(data.noiO).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        rows.push([`  ${k}`, String(v), pct(v, N)]);
    });

    // Tiền sử
    rows.push(['Bệnh đồng mắc', '', '']);
    data.tienSuItems.forEach(t => {
        rows.push([`  ${t.label}`, String(t.count), pct(t.count, N)]);
    });

    rows.push(['Hút thuốc lá', String(data.hutThuoc), pct(data.hutThuoc, N)]);
    if (data.soBaoNam.length > 0) {
        rows.push(['  Số bao-năm (Mean ± SD)', meanSd(data.soBaoNam), `n = ${data.soBaoNam.length}`]);
    }

    rows.push(['Số ngày điều trị (Mean ± SD)', data.ngayDT.length > 0 ? meanSd(data.ngayDT) : '—', data.ngayDT.length > 0 ? minMax(data.ngayDT) : '—']);
    rows.push(['Kết cục', '', '']);
    rows.push(['  Xuất viện', String(data.xuatVien), pct(data.xuatVien, N)]);
    rows.push(['  Tử vong', String(data.tuVong), pct(data.tuVong, N)]);
    rows.push(['  Xin về', String(data.xinVe), pct(data.xinVe, N)]);

    return (
        <SectionCard
            id="table-311"
            title="Bảng 3.1 — Đặc điểm chung của đối tượng nghiên cứu"
            subtitle="Mục 3.1.1: Phân bố tuổi, giới, nghề nghiệp, nơi cư trú, yếu tố nguy cơ"
            note="Thiếu biến: Tiền sử dùng kháng sinh trước nhập viện (chưa có trong hệ thống). Thời gian khởi bệnh đến nhập viện chỉ tính được khi có ngày khởi bệnh rõ ràng."
        >
            <DataTable
                headers={['Đặc điểm', 'n / Giá trị', '% / Ghi chú']}
                rows={rows}
            />
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.1.2: ĐẶC ĐIỂM LÂM SÀNG
// ════════════════════════════════════════════════════════════
function Table312({ patients }: { patients: Patient[] }) {
    const N = patients.length;
    const data = useMemo(() => {
        const sot = patients.filter(p => num(p.lamSang.nhietDo) && p.lamSang.nhietDo! >= 38).length;
        const hoKhan = patients.filter(p => p.lamSang.hoKhan).length;
        const hoMau = patients.filter(p => p.lamSang.hoMau).length;
        const hoKhacDom = patients.filter(p => p.lamSang.hoKhacDom).length;
        const khoTho = patients.filter(p => p.lamSang.khoTho).length;
        const dauNguc = patients.filter(p => p.lamSang.dauNguc).length;
        const ranAm = patients.filter(p => p.lamSang.ranAm).length;
        const ranNo = patients.filter(p => p.lamSang.ranNo).length;
        const ranRit = patients.filter(p => p.lamSang.ranRit).length;
        const ranNgay = patients.filter(p => p.lamSang.ranNgay).length;
        const hcTDMP = patients.filter(p => p.lamSang.hoiChungTDMP.co).length;
        const hcDongDac = patients.filter(p => p.lamSang.hoiChungDongDac.co).length;
        const hcTKMP = patients.filter(p => p.lamSang.hoiChungTKMP.co).length;

        const mach = patients.map(p => p.lamSang.mach).filter(num);
        const nhietDo = patients.map(p => p.lamSang.nhietDo).filter(num);
        const nhipTho = patients.map(p => p.lamSang.nhipTho).filter(num);
        const spO2 = patients.map(p => p.lamSang.spO2).filter(num);
        const glasgow = patients.map(p => p.lamSang.diemGlasgow).filter(num);

        return { sot, hoKhan, hoMau, hoKhacDom, khoTho, dauNguc, ranAm, ranNo, ranRit, ranNgay, hcTDMP, hcDongDac, hcTKMP, mach, nhietDo, nhipTho, spO2, glasgow };
    }, [patients]);

    const rows: (string | React.ReactNode)[][] = [
        ['Sinh hiệu lúc nhập viện', '', ''],
        ['  Mạch (lần/phút)', data.mach.length > 0 ? meanSd(data.mach) : '—', `n = ${data.mach.length}`],
        ['  Nhiệt độ (°C)', data.nhietDo.length > 0 ? meanSd(data.nhietDo) : '—', `n = ${data.nhietDo.length}`],
        ['  Nhịp thở (lần/phút)', data.nhipTho.length > 0 ? meanSd(data.nhipTho) : '—', `n = ${data.nhipTho.length}`],
        ['  SpO₂ (%)', data.spO2.length > 0 ? meanSd(data.spO2) : '—', `n = ${data.spO2.length}`],
        ['  Glasgow', data.glasgow.length > 0 ? meanSd(data.glasgow) : '—', `n = ${data.glasgow.length}`],
        ['Triệu chứng cơ năng', '', ''],
        ['  Sốt (≥ 38°C)', String(data.sot), pct(data.sot, N)],
        ['  Ho khan', String(data.hoKhan), pct(data.hoKhan, N)],
        ['  Ho khạc đờm', String(data.hoKhacDom), pct(data.hoKhacDom, N)],
        ['  Ho máu', String(data.hoMau), pct(data.hoMau, N)],
        ['  Khó thở', String(data.khoTho), pct(data.khoTho, N)],
        ['  Đau ngực', String(data.dauNguc), pct(data.dauNguc, N)],
        ['Triệu chứng thực thể', '', ''],
        ['  Ran ẩm', String(data.ranAm), pct(data.ranAm, N)],
        ['  Ran nổ', String(data.ranNo), pct(data.ranNo, N)],
        ['  Ran rít', String(data.ranRit), pct(data.ranRit, N)],
        ['  Ran ngáy', String(data.ranNgay), pct(data.ranNgay, N)],
        ['Hội chứng', '', ''],
        ['  Hội chứng TDMP', String(data.hcTDMP), pct(data.hcTDMP, N)],
        ['  Hội chứng đông đặc', String(data.hcDongDac), pct(data.hcDongDac, N)],
        ['  Hội chứng TKMP', String(data.hcTKMP), pct(data.hcTKMP, N)],
    ];

    return (
        <SectionCard
            id="table-312"
            title="Bảng 3.2 — Đặc điểm lâm sàng"
            subtitle="Mục 3.1.2: Triệu chứng lâm sàng thường gặp, sinh hiệu lúc nhập viện"
        >
            <DataTable
                headers={['Đặc điểm lâm sàng', 'n / Mean ± SD', '% / n']}
                rows={rows}
            />
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.1.3: CẬN LÂM SÀNG
// ════════════════════════════════════════════════════════════
function Table313({ patients }: { patients: Patient[] }) {
    const data = useMemo(() => {
        const extract = (fn: (p: Patient) => number | null) =>
            patients.map(fn).filter(num) as number[];

        return {
            wbc: extract(p => p.xetNghiem.wbc),
            neutrophil: extract(p => p.xetNghiem.neutrophil),
            lymphocyte: extract(p => p.xetNghiem.lymphocyte),
            rbc: extract(p => p.xetNghiem.rbc),
            hemoglobin: extract(p => p.xetNghiem.hemoglobin),
            hct: extract(p => p.xetNghiem.hct),
            plt: extract(p => p.xetNghiem.plt),
            ure: extract(p => p.xetNghiem.ure),
            creatinin: extract(p => p.xetNghiem.creatinin),
            ast: extract(p => p.xetNghiem.ast),
            alt: extract(p => p.xetNghiem.alt),
            glucose: extract(p => p.xetNghiem.glucose),
            protein: extract(p => p.xetNghiem.protein),
            albumin: extract(p => p.xetNghiem.albumin),
            crp: extract(p => p.xetNghiem.crp),
            procalcitonin: extract(p => p.xetNghiem.procalcitonin),
            na: extract(p => p.xetNghiem.na),
            k: extract(p => p.xetNghiem.k),
            cl: extract(p => p.xetNghiem.cl),
            ph: extract(p => p.xetNghiem.ph),
            saO2: extract(p => p.xetNghiem.saO2),
            paCO2: extract(p => p.xetNghiem.paCO2),
            hcO3: extract(p => p.xetNghiem.hcO3),
            be: extract(p => p.xetNghiem.be),
            nlr: extract(p => p.chiSoTinhToan?.nlr),
            plr: extract(p => p.chiSoTinhToan?.plr),
            car: extract(p => p.chiSoTinhToan?.car),
        };
    }, [patients]);

    const makeRow = (label: string, vals: number[], unit: string): (string | React.ReactNode)[] => {
        if (vals.length === 0) return [label, '—', '—', '—', unit];
        return [
            label,
            String(vals.length),
            meanSd(vals),
            `${median(vals).toFixed(1)} (${q1(vals).toFixed(1)}–${q3(vals).toFixed(1)})`,
            unit,
        ];
    };

    const rows = [
        ['Công thức máu', '', '', '', ''],
        makeRow('  WBC', data.wbc, '×10⁹/L'),
        makeRow('  Neutrophil', data.neutrophil, '%'),
        makeRow('  Lymphocyte', data.lymphocyte, '%'),
        makeRow('  RBC', data.rbc, 'T/L'),
        makeRow('  Hemoglobin', data.hemoglobin, 'g/L'),
        makeRow('  Hematocrit', data.hct, '%'),
        makeRow('  PLT', data.plt, '×10⁹/L'),
        ['Sinh hóa máu', '', '', '', ''],
        makeRow('  Ure', data.ure, 'mmol/L'),
        makeRow('  Creatinin', data.creatinin, 'µmol/L'),
        makeRow('  AST', data.ast, 'U/L'),
        makeRow('  ALT', data.alt, 'U/L'),
        makeRow('  Glucose', data.glucose, 'mmol/L'),
        makeRow('  Protein', data.protein, 'g/L'),
        makeRow('  Albumin', data.albumin, 'g/L'),
        makeRow('  CRP', data.crp, 'mg/L'),
        makeRow('  Procalcitonin', data.procalcitonin, 'ng/mL'),
        ['Điện giải đồ', '', '', '', ''],
        makeRow('  Na⁺', data.na, 'mmol/L'),
        makeRow('  K⁺', data.k, 'mmol/L'),
        makeRow('  Cl⁻', data.cl, 'mmol/L'),
        ['Khí máu động mạch', '', '', '', ''],
        makeRow('  pH', data.ph, ''),
        makeRow('  SaO₂', data.saO2, '%'),
        makeRow('  PaCO₂', data.paCO2, 'mmHg'),
        makeRow('  HCO₃⁻', data.hcO3, 'mmol/L'),
        makeRow('  BE', data.be, 'mmol/L'),
        ['Chỉ số tính toán', '', '', '', ''],
        makeRow('  NLR', data.nlr, ''),
        makeRow('  PLR', data.plr, ''),
        makeRow('  CAR', data.car, ''),
    ];

    return (
        <SectionCard
            id="table-313"
            title="Bảng 3.3 — Đặc điểm cận lâm sàng"
            subtitle="Mục 3.1.2: Kết quả xét nghiệm máu, sinh hóa, điện giải, khí máu"
        >
            <DataTable
                headers={['Xét nghiệm', 'n', 'Mean ± SD', 'Median (Q1–Q3)', 'Đơn vị']}
                rows={rows}
            />
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.1.4: PHÂN LOẠI PSI
// ════════════════════════════════════════════════════════════
function Table314({ patients }: { patients: Patient[] }) {
    const N = patients.length;
    const data = useMemo(() => {
        const cls: Record<string, number> = { I: 0, II: 0, III: 0, IV: 0, V: 0 };
        let hasPSI = 0;
        patients.forEach(p => {
            if (p.psi.tongDiem > 0) {
                cls[psiClass(p.psi.tongDiem)]++;
                hasPSI++;
            }
        });
        const scores = patients.map(p => p.psi.tongDiem).filter(v => v > 0);
        return { cls, hasPSI, scores };
    }, [patients]);

    const rows: (string | React.ReactNode)[][] = [
        ['PSI Score (Mean ± SD)', data.scores.length > 0 ? meanSd(data.scores) : '—', data.scores.length > 0 ? minMax(data.scores) : '—', `n = ${data.scores.length}`],
        ['PSI Class I (≤ 50 điểm)', String(data.cls.I), pct(data.cls.I, N), 'Nguy cơ thấp'],
        ['PSI Class II (51–70 điểm)', String(data.cls.II), pct(data.cls.II, N), 'Nguy cơ thấp'],
        ['PSI Class III (71–90 điểm)', String(data.cls.III), pct(data.cls.III, N), 'Nguy cơ trung bình'],
        ['PSI Class IV (91–130 điểm)', String(data.cls.IV), pct(data.cls.IV, N), 'Nguy cơ cao'],
        ['PSI Class V (> 130 điểm)', String(data.cls.V), pct(data.cls.V, N), 'Nguy cơ rất cao'],
        ['Nhóm nặng (PSI III–V)', String(data.cls.III + data.cls.IV + data.cls.V), pct(data.cls.III + data.cls.IV + data.cls.V, N), ''],
        ['Nhóm nhẹ (PSI I–II)', String(data.cls.I + data.cls.II), pct(data.cls.I + data.cls.II, N), ''],
    ];

    return (
        <SectionCard
            id="table-314"
            title="Bảng 3.4 — Phân loại mức độ nặng theo PSI"
            subtitle="Mục 3.1.2: Phân tầng nguy cơ theo Pneumonia Severity Index"
        >
            <DataTable
                headers={['Phân loại PSI', 'n', '%', 'Ghi chú']}
                rows={rows}
            />
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.1.5: HÌNH ẢNH HỌC
// ════════════════════════════════════════════════════════════
function Table315({ patients }: { patients: Patient[] }) {
    const N = patients.length;
    const data = useMemo(() => {
        // X-quang
        const hasXQ = patients.filter(p => p.hinhAnh.xquangTonThuong?.length > 0).length;
        const xqViTri: Record<string, number> = {};
        const xqBen: Record<string, number> = {};
        const xqHinhThai: Record<string, number> = {};
        patients.forEach(p => {
            p.hinhAnh.xquangTonThuong?.forEach(t => {
                if (t.viTri) xqViTri[t.viTri] = (xqViTri[t.viTri] || 0) + 1;
                if (t.ben) xqBen[t.ben] = (xqBen[t.ben] || 0) + 1;
                if (t.hinhThai) xqHinhThai[t.hinhThai] = (xqHinhThai[t.hinhThai] || 0) + 1;
            });
        });
        const xqTDMP = patients.filter(p => p.hinhAnh.xquangTranDichMangPhoi).length;
        const xqTKMP = patients.filter(p => p.hinhAnh.xquangTranKhiMangPhoi).length;

        // CT
        const hasCT = patients.filter(p => p.hinhAnh.ctTonThuong?.length > 0).length;
        const ctThuy: Record<string, number> = {};
        const ctBen: Record<string, number> = {};
        const ctHinhThai: Record<string, number> = {};
        const ctDien: Record<string, number> = {};
        patients.forEach(p => {
            p.hinhAnh.ctTonThuong?.forEach(t => {
                if (t.thuy) ctThuy[t.thuy] = (ctThuy[t.thuy] || 0) + 1;
                if (t.ben) ctBen[t.ben] = (ctBen[t.ben] || 0) + 1;
                if (t.hinhThai) ctHinhThai[t.hinhThai] = (ctHinhThai[t.hinhThai] || 0) + 1;
                if (t.dien) ctDien[t.dien] = (ctDien[t.dien] || 0) + 1;
            });
        });
        const ctTDMP = patients.filter(p => p.hinhAnh.ctTranDichMangPhoi).length;
        const ctTKMP = patients.filter(p => p.hinhAnh.ctTranKhiMangPhoi).length;

        return { hasXQ, xqViTri, xqBen, xqHinhThai, xqTDMP, xqTKMP, hasCT, ctThuy, ctBen, ctHinhThai, ctDien, ctTDMP, ctTKMP };
    }, [patients]);

    const rows: (string | React.ReactNode)[][] = [
        ['X-QUANG NGỰC', '', ''],
        ['  Có tổn thương trên Xquang', String(data.hasXQ), pct(data.hasXQ, N)],
    ];
    Object.entries(data.xqViTri).forEach(([k, v]) => rows.push([`  Vị trí: ${k}`, String(v), pct(v, N)]));
    Object.entries(data.xqBen).forEach(([k, v]) => rows.push([`  Bên: ${k}`, String(v), pct(v, N)]));
    Object.entries(data.xqHinhThai).forEach(([k, v]) => rows.push([`  Hình thái: ${k}`, String(v), pct(v, N)]));
    rows.push(['  TDMP', String(data.xqTDMP), pct(data.xqTDMP, N)]);
    rows.push(['  TKMP', String(data.xqTKMP), pct(data.xqTKMP, N)]);

    rows.push(['CT SCANNER NGỰC', '', '']);
    rows.push(['  Có tổn thương trên CT', String(data.hasCT), pct(data.hasCT, N)]);
    Object.entries(data.ctThuy).forEach(([k, v]) => rows.push([`  Thuỳ: ${k}`, String(v), pct(v, N)]));
    Object.entries(data.ctBen).forEach(([k, v]) => rows.push([`  Bên: ${k}`, String(v), pct(v, N)]));
    Object.entries(data.ctHinhThai).forEach(([k, v]) => rows.push([`  Hình thái: ${k}`, String(v), pct(v, N)]));
    Object.entries(data.ctDien).forEach(([k, v]) => rows.push([`  Diện: ${k}`, String(v), pct(v, N)]));
    rows.push(['  TDMP', String(data.ctTDMP), pct(data.ctTDMP, N)]);
    rows.push(['  TKMP', String(data.ctTKMP), pct(data.ctTKMP, N)]);

    return (
        <SectionCard
            id="table-315"
            title="Bảng 3.5 — Đặc điểm hình ảnh học"
            subtitle="Mục 3.1.2: Kết quả X-quang/CT ngực — vị trí, hình thái, mức độ tổn thương"
        >
            <DataTable
                headers={['Đặc điểm hình ảnh', 'n', '%']}
                rows={rows}
            />
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.1.6: CĂN NGUYÊN VI SINH
// ════════════════════════════════════════════════════════════
function Table316({ patients }: { patients: Patient[] }) {
    const N = patients.length;
    const data = useMemo(() => {
        const vkDuong = patients.filter(p => p.viKhuan?.some(vk => vk.coKhong)).length;
        const dongNhiem = patients.filter(p => (p.viKhuan?.filter(vk => vk.coKhong) || []).length >= 2).length;

        // Phân bố VK
        const vkCounts: Record<string, number> = {};
        let totalDienHinh = 0;
        let totalKhongDienHinh = 0;
        patients.forEach(p => {
            p.viKhuan?.forEach(vk => {
                if (vk.coKhong && vk.tenViKhuan) {
                    vkCounts[vk.tenViKhuan] = (vkCounts[vk.tenViKhuan] || 0) + 1;
                    const cls = classifyVK(vk.tenViKhuan);
                    if (cls === 'dien_hinh') totalDienHinh++;
                    else if (cls === 'khong_dien_hinh') totalKhongDienHinh++;
                }
            });
        });

        const vkList = Object.entries(vkCounts)
            .map(([name, count]) => ({ name, count, type: classifyVK(name) }))
            .sort((a, b) => b.count - a.count);

        return { vkDuong, dongNhiem, vkList, totalDienHinh, totalKhongDienHinh };
    }, [patients]);

    const totalVK = data.vkList.reduce((s, v) => s + v.count, 0);

    const rows: (string | React.ReactNode)[][] = [
        ['Tỷ lệ phát hiện vi khuẩn', String(data.vkDuong), frac(data.vkDuong, N)],
        ['Nhiễm phối hợp (≥ 2 tác nhân)', String(data.dongNhiem), frac(data.dongNhiem, N)],
        ['Tổng chủng VK phân lập', String(totalVK), ''],
        ['VK ĐIỂN HÌNH', '', ''],
    ];

    data.vkList.filter(v => v.type === 'dien_hinh').forEach(v => {
        rows.push([`  ${v.name}`, String(v.count), pct(v.count, N)]);
    });

    const dienHinhItems = data.vkList.filter(v => v.type === 'dien_hinh');
    if (dienHinhItems.length > 0) {
        rows.push([
            <span className="font-semibold text-primary-700">Tổng VK điển hình</span>,
            String(data.totalDienHinh),
            pct(data.totalDienHinh, totalVK || 1) + ' tổng VK',
        ]);
    }

    const khongDienHinh = data.vkList.filter(v => v.type === 'khong_dien_hinh');
    if (khongDienHinh.length > 0) {
        rows.push(['VK KHÔNG ĐIỂN HÌNH', '', '']);
        khongDienHinh.forEach(v => {
            rows.push([`  ${v.name}`, String(v.count), pct(v.count, N)]);
        });
        rows.push([
            <span className="font-semibold text-primary-700">Tổng VK không điển hình</span>,
            String(data.totalKhongDienHinh),
            pct(data.totalKhongDienHinh, totalVK || 1) + ' tổng VK',
        ]);
    }

    return (
        <SectionCard
            id="table-316"
            title="Bảng 3.6 — Căn nguyên vi sinh gây viêm phổi cộng đồng"
            subtitle="Mục 3.1.3: Tỷ lệ phát hiện, phân bố tác nhân (điển hình / không điển hình), nhiễm phối hợp"
            note="Phân loại VK điển hình/không điển hình dựa trên mapping thủ công. Dữ liệu từ cấy (không phải PCR đa mồi — biến PCR chưa có trong hệ thống)."
        >
            <DataTable
                headers={['Căn nguyên vi sinh', 'n', '%']}
                rows={rows}
            />
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.1.7: NỒNG ĐỘ BIOMARKER
// ════════════════════════════════════════════════════════════
function Table317({ patients }: { patients: Patient[] }) {
    const data = useMemo(() => {
        const extract = (key: 'sTREM1' | 'tIMP1' | 'il6' | 'il10' | 'il17') => {
            const vals = patients.map(p => p.xetNghiem[key]).filter(num) as number[];
            return {
                n: vals.length,
                mean: vals.length > 0 ? mean(vals).toFixed(2) : '—',
                sd: vals.length > 0 ? sd(vals).toFixed(2) : '—',
                median: vals.length > 0 ? median(vals).toFixed(2) : '—',
                q1: vals.length > 0 ? q1(vals).toFixed(2) : '—',
                q3: vals.length > 0 ? q3(vals).toFixed(2) : '—',
                min: vals.length > 0 ? Math.min(...vals).toFixed(2) : '—',
                max: vals.length > 0 ? Math.max(...vals).toFixed(2) : '—',
            };
        };
        return {
            sTREM1: extract('sTREM1'),
            tIMP1: extract('tIMP1'),
            il6: extract('il6'),
            il10: extract('il10'),
            il17: extract('il17'),
        };
    }, [patients]);

    const makeRow = (label: string, unit: string, d: typeof data.sTREM1) => [
        label,
        unit,
        String(d.n),
        d.mean !== '—' ? `${d.mean} ± ${d.sd}` : '—',
        d.median !== '—' ? `${d.median} (${d.q1}–${d.q3})` : '—',
        d.min !== '—' ? `${d.min} – ${d.max}` : '—',
    ];

    return (
        <SectionCard
            id="table-317"
            title="Bảng 3.7 — Nồng độ các dấu ấn sinh học trong huyết thanh"
            subtitle="Mục 3.1.4: Nồng độ trung bình và khoảng biến thiên của sTREM-1, TIMP-1, IL-6, IL-10, IL-17"
        >
            <DataTable
                headers={['Biomarker', 'Đơn vị', 'n', 'Mean ± SD', 'Median (Q1–Q3)', 'Min – Max']}
                rows={[
                    makeRow('sTREM-1', 'pg/mL', data.sTREM1),
                    makeRow('TIMP-1', 'ng/mL', data.tIMP1),
                    makeRow('IL-6', 'pg/mL', data.il6),
                    makeRow('IL-10', 'pg/mL', data.il10),
                    makeRow('IL-17', 'pg/mL', data.il17),
                ]}
            />
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.2.1: BIOMARKER THEO NHÓM CĂN NGUYÊN
// ════════════════════════════════════════════════════════════
function Table321({ patients }: { patients: Patient[] }) {
    const data = useMemo(() => {
        const hasVK = patients.filter(p => p.viKhuan?.some(vk => vk.coKhong));
        const noVK = patients.filter(p => !p.viKhuan?.some(vk => vk.coKhong));

        const extract = (group: Patient[], key: 'sTREM1' | 'tIMP1' | 'il6' | 'il10' | 'il17') => {
            const vals = group.map(p => p.xetNghiem[key]).filter(num) as number[];
            return {
                n: vals.length,
                median: vals.length > 0 ? median(vals).toFixed(2) : '—',
                q1q3: vals.length > 0 ? `${q1(vals).toFixed(2)}–${q3(vals).toFixed(2)}` : '—',
                meanSd: vals.length > 0 ? `${mean(vals).toFixed(2)} ± ${sd(vals).toFixed(2)}` : '—',
            };
        };

        const markers: ('sTREM1' | 'tIMP1' | 'il6' | 'il10' | 'il17')[] = ['sTREM1', 'tIMP1', 'il6', 'il10', 'il17'];
        const labels: Record<string, string> = { sTREM1: 'sTREM-1', tIMP1: 'TIMP-1', il6: 'IL-6', il10: 'IL-10', il17: 'IL-17' };

        return markers.map(key => ({
            label: labels[key],
            hasVK: extract(hasVK, key),
            noVK: extract(noVK, key),
        }));
    }, [patients]);

    const rows = data.map(d => [
        d.label,
        `${d.hasVK.median} (${d.hasVK.q1q3})`,
        String(d.hasVK.n),
        `${d.noVK.median} (${d.noVK.q1q3})`,
        String(d.noVK.n),
        <span className="text-gray-400 italic text-xs">Cần phần mềm TK</span>,
    ]);

    return (
        <SectionCard
            id="table-321"
            title="Bảng 3.8 — Biomarker theo nhóm căn nguyên vi sinh"
            subtitle="Mục 3.1.4: So sánh nồng độ biomarker giữa nhóm có VK và không phát hiện VK"
            note="Giá trị p cần kiểm định Mann-Whitney U (phần mềm thống kê chuyên dụng). Nên phân nhóm thêm: VK điển hình, VK không điển hình, nhiễm phối hợp nếu đủ cỡ mẫu."
        >
            <DataTable
                headers={['Biomarker', 'Có VK — Median (Q1–Q3)', 'n₁', 'Không VK — Median (Q1–Q3)', 'n₂', 'p']}
                rows={rows}
            />
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.2.2: BIOMARKER THEO PSI CLASS
// ════════════════════════════════════════════════════════════
function Table322({ patients }: { patients: Patient[] }) {
    const data = useMemo(() => {
        const nhe = patients.filter(p => p.psi.tongDiem > 0 && ['I', 'II'].includes(psiClass(p.psi.tongDiem)));
        const nang = patients.filter(p => p.psi.tongDiem > 0 && ['III', 'IV', 'V'].includes(psiClass(p.psi.tongDiem)));

        const extract = (group: Patient[], key: 'sTREM1' | 'tIMP1' | 'il6' | 'il10' | 'il17') => {
            const vals = group.map(p => p.xetNghiem[key]).filter(num) as number[];
            return {
                n: vals.length,
                median: vals.length > 0 ? median(vals).toFixed(2) : '—',
                q1q3: vals.length > 0 ? `${q1(vals).toFixed(2)}–${q3(vals).toFixed(2)}` : '—',
            };
        };

        const markers: ('sTREM1' | 'tIMP1' | 'il6' | 'il10' | 'il17')[] = ['sTREM1', 'tIMP1', 'il6', 'il10', 'il17'];
        const labels: Record<string, string> = { sTREM1: 'sTREM-1', tIMP1: 'TIMP-1', il6: 'IL-6', il10: 'IL-10', il17: 'IL-17' };

        // Also include CRP and PCT
        const crpNhe = nhe.map(p => p.xetNghiem.crp).filter(num) as number[];
        const crpNang = nang.map(p => p.xetNghiem.crp).filter(num) as number[];
        const pctNhe = nhe.map(p => p.xetNghiem.procalcitonin).filter(num) as number[];
        const pctNang = nang.map(p => p.xetNghiem.procalcitonin).filter(num) as number[];

        return {
            markers: markers.map(key => ({
                label: labels[key],
                nhe: extract(nhe, key),
                nang: extract(nang, key),
            })),
            crp: {
                nhe: { n: crpNhe.length, median: crpNhe.length > 0 ? median(crpNhe).toFixed(2) : '—', q1q3: crpNhe.length > 0 ? `${q1(crpNhe).toFixed(2)}–${q3(crpNhe).toFixed(2)}` : '—' },
                nang: { n: crpNang.length, median: crpNang.length > 0 ? median(crpNang).toFixed(2) : '—', q1q3: crpNang.length > 0 ? `${q1(crpNang).toFixed(2)}–${q3(crpNang).toFixed(2)}` : '—' },
            },
            pct: {
                nhe: { n: pctNhe.length, median: pctNhe.length > 0 ? median(pctNhe).toFixed(2) : '—', q1q3: pctNhe.length > 0 ? `${q1(pctNhe).toFixed(2)}–${q3(pctNhe).toFixed(2)}` : '—' },
                nang: { n: pctNang.length, median: pctNang.length > 0 ? median(pctNang).toFixed(2) : '—', q1q3: pctNang.length > 0 ? `${q1(pctNang).toFixed(2)}–${q3(pctNang).toFixed(2)}` : '—' },
            },
            nNhe: nhe.length,
            nNang: nang.length,
        };
    }, [patients]);

    const makeRow = (label: string, nhe: { n: number; median: string; q1q3: string }, nang: { n: number; median: string; q1q3: string }) => [
        label,
        `${nhe.median} (${nhe.q1q3})`,
        String(nhe.n),
        `${nang.median} (${nang.q1q3})`,
        String(nang.n),
        <span className="text-gray-400 italic text-xs">Cần TK</span>,
    ];

    const rows = [
        ...data.markers.map(d => makeRow(d.label, d.nhe, d.nang)),
        makeRow('CRP (mg/L)', data.crp.nhe, data.crp.nang),
        makeRow('PCT (ng/mL)', data.pct.nhe, data.pct.nang),
    ];

    return (
        <SectionCard
            id="table-322"
            title="Bảng 3.9 — Biomarker theo mức độ nặng (PSI)"
            subtitle={`Mục 3.2.1: So sánh nhóm nhẹ (PSI I–II, n=${data.nNhe}) vs nhóm nặng (PSI III–V, n=${data.nNang})`}
            note="Giá trị p cần kiểm định Mann-Whitney U test. Nên phân tích thêm theo từng class PSI (I-V) nếu đủ cỡ mẫu."
        >
            <DataTable
                headers={['Biomarker', 'PSI I–II — Median (Q1–Q3)', 'n₁', 'PSI III–V — Median (Q1–Q3)', 'n₂', 'p']}
                rows={rows}
            />
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.2.3: BIOMARKER THEO KẾT CỤC
// ════════════════════════════════════════════════════════════
function Table323({ patients }: { patients: Patient[] }) {
    const data = useMemo(() => {
        const tuVong = patients.filter(p => p.ketCuc?.tuVong);
        const song = patients.filter(p => !p.ketCuc?.tuVong && (p.ketCuc?.tienTrienTotXuatVien || p.ketCuc?.xinVe));
        const thoMay = patients.filter(p => p.ketCuc?.thoMay || p.ketCuc?.dienBienDieuTri?.includes('Thở máy'));
        const khongThoMay = patients.filter(p => !(p.ketCuc?.thoMay || p.ketCuc?.dienBienDieuTri?.includes('Thở máy')));
        const socNK = patients.filter(p => p.ketCuc?.socNhiemKhuan || p.ketCuc?.dienBienDieuTri?.includes('Sốc nhiễm khuẩn'));
        const khongSocNK = patients.filter(p => !(p.ketCuc?.socNhiemKhuan || p.ketCuc?.dienBienDieuTri?.includes('Sốc nhiễm khuẩn')));

        const extract = (group: Patient[], key: 'sTREM1' | 'tIMP1' | 'il6' | 'il10' | 'il17' | 'crp' | 'procalcitonin') => {
            const vals = group.map(p => p.xetNghiem[key as keyof typeof p.xetNghiem] as number | null).filter(num) as number[];
            return {
                n: vals.length,
                median: vals.length > 0 ? median(vals).toFixed(2) : '—',
                q1q3: vals.length > 0 ? `${q1(vals).toFixed(2)}–${q3(vals).toFixed(2)}` : '—',
            };
        };

        return { tuVong, song, thoMay, khongThoMay, socNK, khongSocNK, extract };
    }, [patients]);

    const markers: { key: 'sTREM1' | 'tIMP1' | 'il6' | 'il10' | 'il17' | 'crp' | 'procalcitonin'; label: string }[] = [
        { key: 'sTREM1', label: 'sTREM-1' },
        { key: 'tIMP1', label: 'TIMP-1' },
        { key: 'il6', label: 'IL-6' },
        { key: 'il10', label: 'IL-10' },
        { key: 'il17', label: 'IL-17' },
        { key: 'crp', label: 'CRP' },
        { key: 'procalcitonin', label: 'PCT' },
    ];

    // Tử vong vs Sống
    const rows1 = markers.map(m => {
        const tv = data.extract(data.tuVong, m.key);
        const s = data.extract(data.song, m.key);
        return [
            m.label,
            `${tv.median} (${tv.q1q3})`,
            String(tv.n),
            `${s.median} (${s.q1q3})`,
            String(s.n),
            <span className="text-gray-400 italic text-xs">Cần TK</span>,
        ];
    });

    // Thở máy
    const rows2 = markers.map(m => {
        const co = data.extract(data.thoMay, m.key);
        const khong = data.extract(data.khongThoMay, m.key);
        return [
            m.label,
            `${co.median} (${co.q1q3})`,
            String(co.n),
            `${khong.median} (${khong.q1q3})`,
            String(khong.n),
            <span className="text-gray-400 italic text-xs">Cần TK</span>,
        ];
    });

    // Sốc NK
    const rows3 = markers.map(m => {
        const co = data.extract(data.socNK, m.key);
        const khong = data.extract(data.khongSocNK, m.key);
        return [
            m.label,
            `${co.median} (${co.q1q3})`,
            String(co.n),
            `${khong.median} (${khong.q1q3})`,
            String(khong.n),
            <span className="text-gray-400 italic text-xs">Cần TK</span>,
        ];
    });

    return (
        <SectionCard
            id="table-323"
            title="Bảng 3.10 — Biomarker theo kết cục lâm sàng"
            subtitle="Mục 3.2.1: So sánh nồng độ biomarker giữa các nhóm kết cục (tử vong, thở máy, sốc NK)"
            note="Giá trị p cần kiểm định Mann-Whitney U test hoặc Kruskal-Wallis test (phần mềm thống kê chuyên dụng)."
        >
            <div className="space-y-6">
                <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                        A. Tử vong (n={data.tuVong.length}) vs Sống (n={data.song.length})
                    </h4>
                    <DataTable
                        headers={['Biomarker', 'Tử vong — Median (Q1–Q3)', 'n', 'Sống — Median (Q1–Q3)', 'n', 'p']}
                        rows={rows1}
                    />
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                        B. Thở máy (n={data.thoMay.length}) vs Không thở máy (n={data.khongThoMay.length})
                    </h4>
                    <DataTable
                        headers={['Biomarker', 'Thở máy — Median (Q1–Q3)', 'n', 'Không — Median (Q1–Q3)', 'n', 'p']}
                        rows={rows2}
                    />
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                        C. Sốc NK (n={data.socNK.length}) vs Không sốc NK (n={data.khongSocNK.length})
                    </h4>
                    <DataTable
                        headers={['Biomarker', 'Sốc NK — Median (Q1–Q3)', 'n', 'Không — Median (Q1–Q3)', 'n', 'p']}
                        rows={rows3}
                    />
                </div>
            </div>
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.2.4: TƯƠNG QUAN BIOMARKER vs PSI / NGÀY ĐT
// ════════════════════════════════════════════════════════════
function Table324({ patients }: { patients: Patient[] }) {
    const data = useMemo(() => {
        const withPSI = patients.filter(p => p.psi.tongDiem > 0);
        const withNgayDT = patients.filter(p => num(p.ketCuc?.tongSoNgayDieuTri));

        const correlate = (group: Patient[], getX: (p: Patient) => number | null, getY: (p: Patient) => number | null) => {
            const pairs = group
                .map(p => ({ x: getX(p), y: getY(p) }))
                .filter(d => d.x !== null && d.y !== null) as { x: number; y: number }[];

            if (pairs.length < 5) return { n: pairs.length, r: null };
            const r = spearmanCorrelation(pairs.map(d => d.x), pairs.map(d => d.y));
            return { n: pairs.length, r };
        };

        const markers: { key: 'sTREM1' | 'tIMP1' | 'il6' | 'il10' | 'il17'; label: string }[] = [
            { key: 'sTREM1', label: 'sTREM-1' },
            { key: 'tIMP1', label: 'TIMP-1' },
            { key: 'il6', label: 'IL-6' },
            { key: 'il10', label: 'IL-10' },
            { key: 'il17', label: 'IL-17' },
        ];

        return markers.map(m => ({
            label: m.label,
            vsPSI: correlate(withPSI, p => p.psi.tongDiem, p => p.xetNghiem[m.key]),
            vsNgayDT: correlate(withNgayDT, p => p.ketCuc?.tongSoNgayDieuTri ?? null, p => p.xetNghiem[m.key]),
        }));
    }, [patients]);

    const formatR = (r: number | null) => {
        if (r === null) return '—';
        const abs = Math.abs(r);
        let strength = '';
        if (abs < 0.2) strength = ' (rất yếu)';
        else if (abs < 0.4) strength = ' (yếu)';
        else if (abs < 0.6) strength = ' (TB)';
        else if (abs < 0.8) strength = ' (mạnh)';
        else strength = ' (rất mạnh)';
        return `${r.toFixed(3)}${strength}`;
    };

    const rows = data.map(d => [
        d.label,
        formatR(d.vsPSI.r),
        String(d.vsPSI.n),
        <span className="text-gray-400 italic text-xs">Cần TK</span>,
        formatR(d.vsNgayDT.r),
        String(d.vsNgayDT.n),
        <span className="text-gray-400 italic text-xs">Cần TK</span>,
    ]);

    // Also add CRP and PCT
    const withPSI = patients.filter(p => p.psi.tongDiem > 0);
    const withNgayDT = patients.filter(p => num(p.ketCuc?.tongSoNgayDieuTri));

    const extraCorrelate = (group: Patient[], getX: (p: Patient) => number | null, getY: (p: Patient) => number | null) => {
        const pairs = group
            .map(p => ({ x: getX(p), y: getY(p) }))
            .filter(d => d.x !== null && d.y !== null) as { x: number; y: number }[];
        if (pairs.length < 5) return { n: pairs.length, r: null };
        return { n: pairs.length, r: spearmanCorrelation(pairs.map(d => d.x), pairs.map(d => d.y)) };
    };

    const crpPSI = extraCorrelate(withPSI, p => p.psi.tongDiem, p => p.xetNghiem.crp);
    const crpDT = extraCorrelate(withNgayDT, p => p.ketCuc?.tongSoNgayDieuTri ?? null, p => p.xetNghiem.crp);
    const pctPSI = extraCorrelate(withPSI, p => p.psi.tongDiem, p => p.xetNghiem.procalcitonin);
    const pctDT = extraCorrelate(withNgayDT, p => p.ketCuc?.tongSoNgayDieuTri ?? null, p => p.xetNghiem.procalcitonin);

    rows.push(['CRP', formatR(crpPSI.r), String(crpPSI.n), <span className="text-gray-400 italic text-xs">Cần TK</span>, formatR(crpDT.r), String(crpDT.n), <span className="text-gray-400 italic text-xs">Cần TK</span>]);
    rows.push(['PCT', formatR(pctPSI.r), String(pctPSI.n), <span className="text-gray-400 italic text-xs">Cần TK</span>, formatR(pctDT.r), String(pctDT.n), <span className="text-gray-400 italic text-xs">Cần TK</span>]);

    return (
        <SectionCard
            id="table-324"
            title="Bảng 3.11 — Tương quan Spearman giữa biomarker với PSI Score và thời gian điều trị"
            subtitle="Mục 3.2.1: Phân tích tương quan (r: hệ số tương quan Spearman rank)"
            note="Hệ số r tính tự động bằng Spearman rank correlation. Giá trị p cần kiểm định thống kê chuyên dụng (SPSS/R). Tương quan không chứng minh nhân quả."
        >
            <DataTable
                headers={['Biomarker', 'r vs PSI', 'n', 'p', 'r vs Ngày ĐT', 'n', 'p']}
                rows={rows}
            />
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// GHI CHÚ — PHẦN KHÔNG THỂ THỰC HIỆN
// ════════════════════════════════════════════════════════════
function NotesSection() {
    return (
        <div className="space-y-4">
            {/* Missing variables */}
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-amber-900">Biến số chưa có trong hệ thống</h3>
                        <ul className="mt-2 space-y-1.5 text-sm text-amber-800">
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                <span><strong>Tiền sử dùng kháng sinh trước nhập viện</strong> — Cần thêm biến boolean + tên KS vào phần TienSu</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                <span><strong>Kết quả PCR đa mồi</strong> — Hệ thống chỉ có dữ liệu từ cấy vi khuẩn, chưa có biến riêng cho PCR multiplex</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                <span><strong>Tình trạng dinh dưỡng chi tiết</strong> — Chỉ có BMI, chưa có albumin huyết thanh trước điều trị hoặc SGA score</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Cannot do in JS */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-blue-900">Phân tích cần phần mềm thống kê chuyên dụng (SPSS / R / Python)</h3>
                        <ul className="mt-2 space-y-1.5 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                <span><strong>Hồi quy logistic đa biến</strong> — Xác định yếu tố tiên lượng độc lập liên quan mức độ nặng / tử vong</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                <span><strong>Đường cong ROC & AUC</strong> — Đánh giá giá trị dự báo (độ nhạy, độ đặc hiệu) của từng biomarker</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                <span><strong>Ngưỡng cắt (cut-off) tối ưu</strong> — Youden index cho biomarker tiên lượng nặng</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                <span><strong>Mô hình dự báo tiên lượng</strong> — Mô hình đa biến bao gồm lâm sàng + cận lâm sàng + biomarker</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                <span><strong>Kiểm định thống kê (p-value)</strong> — Mann-Whitney U, Chi-square, Fisher exact test, Kruskal-Wallis</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                <span><strong>Đề xuất bổ sung biomarker vào PSI</strong> — Cần phân tích hồi quy và so sánh AUC mô hình cũ vs mới</span>
                            </li>
                        </ul>
                        <p className="mt-3 text-xs text-blue-600">
                            💡 Gợi ý: Xuất dữ liệu ra Excel (nút "Xuất Excel" ở trang Danh sách), sau đó import vào SPSS hoặc R để thực hiện các phân tích trên.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
