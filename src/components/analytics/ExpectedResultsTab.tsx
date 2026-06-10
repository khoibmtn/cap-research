import { useMemo, useState } from 'react';
import type { Patient, DrugGenericName } from '../../types/patient';
import { mean, sd, median, q1, q3, meanSd, frac, pct, psiClass } from '../../utils/statsHelpers';
import { mannWhitneyU, spearmanPValue, formatPValue, pSignificance } from '../../utils/statisticalTests';
import { AlertTriangle, Info, BookOpen, Calculator } from 'lucide-react';

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
const num = (v: number | null | undefined): v is number => v !== null && v !== undefined;
const minMax = (vals: number[]) => vals.length > 0 ? `${Math.min(...vals)} – ${Math.max(...vals)}` : '—';

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
interface ExpectedResultsProps {
    patients: Patient[];
    drugGroup1?: string[];
    drugGroup2?: DrugGenericName[];
}

export default function ExpectedResultsTab({ patients, drugGroup1 = [], drugGroup2 = [] }: ExpectedResultsProps) {
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

            {/* ── 3.3: Thuốc đã dùng trước nhập viện ── */}
            <Table33Drug patients={patients} drugGroup1={drugGroup1.length > 0 ? drugGroup1 : ['Kháng sinh', 'Corticoid']} drugGroup2={drugGroup2} />

            {/* ── 3.4: Diễn biến điều trị & kết cục ── */}
            <Table34Outcome patients={patients} />

            {/* ── 3.5: Thời gian sử dụng kháng sinh ── */}
            <Table35KS patients={patients} />

            {/* ── Kaplan-Meier Survival Curve ── */}
            <KaplanMeierChart patients={patients} />

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

    // Tiền sử dùng kháng sinh trước nhập viện
    const dungKS = patients.filter(p => (p.tienSu?.thuocDaDung || []).length > 0).length;

    // Thời gian khởi bệnh đến nhập viện (ngày)
    const parseDate = (s: string): Date | null => {
        if (!s) return null;
        if (s.includes('-')) { const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
        const parts = s.split('/');
        if (parts.length !== 3) return null;
        const [d, m, y] = parts.map(Number);
        if (!d || !m || !y) return null;
        return new Date(y, m - 1, d);
    };
    const thoiGianKhoiBenh = patients
        .map(p => {
            const ngayKhoi = parseDate(p.lamSang.thoiDiemTrieuChung);
            const ngayVao = parseDate(p.hanhChinh.ngayVaoVien);
            if (!ngayKhoi || !ngayVao) return null;
            const diff = Math.round((ngayVao.getTime() - ngayKhoi.getTime()) / (1000 * 60 * 60 * 24));
            return diff >= 0 ? diff : null;
        })
        .filter(num);

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

    // Tiền sử dùng thuốc
    rows.push(['Dùng thuốc trước nhập viện', String(dungKS), pct(dungKS, N)]);

    // Thời gian khởi bệnh đến nhập viện
    rows.push(['Thời gian khởi bệnh → nhập viện (ngày)', thoiGianKhoiBenh.length > 0 ? meanSd(thoiGianKhoiBenh) : '—', thoiGianKhoiBenh.length > 0 ? `Median: ${median(thoiGianKhoiBenh).toFixed(0)}, n = ${thoiGianKhoiBenh.length}` : '—']);

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

        // Parse huyết áp: "120/80" → systolic + diastolic
        const systolic: number[] = [];
        const diastolic: number[] = [];
        patients.forEach(p => {
            const ha = p.lamSang.huyetAp;
            if (ha && ha.includes('/')) {
                const [s, d] = ha.split('/').map(Number);
                if (s > 0) systolic.push(s);
                if (d > 0) diastolic.push(d);
            }
        });

        // Đờm
        const domTinhCounts: Record<string, number> = {};
        const domMauSacCounts: Record<string, number> = {};
        patients.forEach(p => {
            p.lamSang.domTinh?.forEach(dt => {
                if (dt) domTinhCounts[dt] = (domTinhCounts[dt] || 0) + 1;
            });
            if (p.lamSang.domMauSac) domMauSacCounts[p.lamSang.domMauSac] = (domMauSacCounts[p.lamSang.domMauSac] || 0) + 1;
        });

        return { sot, hoKhan, hoMau, hoKhacDom, khoTho, dauNguc, ranAm, ranNo, ranRit, ranNgay, hcTDMP, hcDongDac, hcTKMP, mach, nhietDo, nhipTho, spO2, glasgow, systolic, diastolic, domTinhCounts, domMauSacCounts };
    }, [patients]);

    const rows: (string | React.ReactNode)[][] = [
        ['Sinh hiệu lúc nhập viện', '', ''],
        ['  Mạch (lần/phút)', data.mach.length > 0 ? meanSd(data.mach) : '—', `n = ${data.mach.length}`],
        ['  HA tâm thu (mmHg)', data.systolic.length > 0 ? meanSd(data.systolic) : '—', `n = ${data.systolic.length}`],
        ['  HA tâm trương (mmHg)', data.diastolic.length > 0 ? meanSd(data.diastolic) : '—', `n = ${data.diastolic.length}`],
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
    ];
    // Đờm
    if (Object.keys(data.domTinhCounts).length > 0 || Object.keys(data.domMauSacCounts).length > 0) {
        rows.push(['Tính chất đờm', '', '']);
        Object.entries(data.domTinhCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
            rows.push([`  ${k}`, String(v), pct(v, N)]);
        });
        if (Object.keys(data.domMauSacCounts).length > 0) {
            rows.push(['Màu sắc đờm', '', '']);
            Object.entries(data.domMauSacCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
                rows.push([`  ${k}`, String(v), pct(v, N)]);
            });
        }
    }
    rows.push(
        ['Triệu chứng thực thể', '', ''],
        ['  Ran ẩm', String(data.ranAm), pct(data.ranAm, N)],
        ['  Ran nổ', String(data.ranNo), pct(data.ranNo, N)],
        ['  Ran rít', String(data.ranRit), pct(data.ranRit, N)],
        ['  Ran ngáy', String(data.ranNgay), pct(data.ranNgay, N)],
        ['Hội chứng', '', ''],
        ['  Hội chứng TDMP', String(data.hcTDMP), pct(data.hcTDMP, N)],
        ['  Hội chứng đông đặc', String(data.hcDongDac), pct(data.hcDongDac, N)],
        ['  Hội chứng TKMP', String(data.hcTKMP), pct(data.hcTKMP, N)],
    );

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
            ggt: extract(p => p.xetNghiem.ggt),
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
        makeRow('  GGT', data.ggt, 'U/L'),
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
const THOI_DIEM_COLS = ['Trước điều trị', 'Trong điều trị', 'Kết thúc điều trị'] as const;

function Table315({ patients }: { patients: Patient[] }) {
    const N = patients.length;

    const data = useMemo(() => {
        // Helper: count by thoiDiem for a set of lesion records
        type CountByTD = Record<string, number>;
        const countByTD = (): Record<string, CountByTD> => ({
            'Trước điều trị': {},
            'Trong điều trị': {},
            'Kết thúc điều trị': {},
        });

        // X-quang
        const hasXQ: Record<string, number> = { 'Trước điều trị': 0, 'Trong điều trị': 0, 'Kết thúc điều trị': 0 };
        const xqViTri = countByTD();
        const xqBen = countByTD();
        const xqHinhThai = countByTD();

        patients.forEach(p => {
            const byTD: Record<string, boolean> = {};
            p.hinhAnh.xquangTonThuong?.forEach(t => {
                const td = t.thoiDiem || '';
                if (!td) return;
                byTD[td] = true;
                if (t.viTri) xqViTri[td][t.viTri] = (xqViTri[td][t.viTri] || 0) + 1;
                if (t.ben) xqBen[td][t.ben] = (xqBen[td][t.ben] || 0) + 1;
                if (t.hinhThai) xqHinhThai[td][t.hinhThai] = (xqHinhThai[td][t.hinhThai] || 0) + 1;
            });
            THOI_DIEM_COLS.forEach(td => { if (byTD[td]) hasXQ[td]++; });
        });



        // CT
        const hasCT: Record<string, number> = { 'Trước điều trị': 0, 'Trong điều trị': 0, 'Kết thúc điều trị': 0 };
        const ctThuy = countByTD();
        const ctBen = countByTD();
        const ctHinhThai = countByTD();
        const ctDien = countByTD();

        patients.forEach(p => {
            const byTD: Record<string, boolean> = {};
            p.hinhAnh.ctTonThuong?.forEach(t => {
                const td = t.thoiDiem || '';
                if (!td) return;
                byTD[td] = true;
                if (t.thuy) ctThuy[td][t.thuy] = (ctThuy[td][t.thuy] || 0) + 1;
                if (t.ben) ctBen[td][t.ben] = (ctBen[td][t.ben] || 0) + 1;
                if (t.hinhThai) ctHinhThai[td][t.hinhThai] = (ctHinhThai[td][t.hinhThai] || 0) + 1;
                if (t.dien) ctDien[td][t.dien] = (ctDien[td][t.dien] || 0) + 1;
            });
            THOI_DIEM_COLS.forEach(td => { if (byTD[td]) hasCT[td]++; });
        });



        return { hasXQ, xqViTri, xqBen, xqHinhThai, hasCT, ctThuy, ctBen, ctHinhThai, ctDien };
    }, [patients]);

    // Helper: build row with 3 time-point columns [label, truoc_n, truoc_%, trong_n, trong_%, sau_n, sau_%]
    const tdRow = (label: string, byTD: Record<string, Record<string, number>>, key: string): (string | React.ReactNode)[] => {
        return [
            label,
            ...THOI_DIEM_COLS.flatMap(td => {
                const v = byTD[td]?.[key] || 0;
                return [String(v), v > 0 ? pct(v, N) : '—'];
            }),
        ];
    };

    const tdRowSimple = (label: string, vals: Record<string, number>): (string | React.ReactNode)[] => {
        return [
            label,
            ...THOI_DIEM_COLS.flatMap(td => {
                const v = vals[td] || 0;
                return [String(v), v > 0 ? pct(v, N) : '—'];
            }),
        ];
    };

    // Collect all unique keys across time points
    const allKeys = (byTD: Record<string, Record<string, number>>) => {
        const keys = new Set<string>();
        THOI_DIEM_COLS.forEach(td => Object.keys(byTD[td]).forEach(k => keys.add(k)));
        return Array.from(keys);
    };

    const emptyTDRow = (label: string): (string | React.ReactNode)[] => [label, '', '', '', '', '', ''];

    const rows: (string | React.ReactNode)[][] = [
        emptyTDRow('X-QUANG NGỰC'),
        tdRowSimple('  Có tổn thương trên Xquang', data.hasXQ),
    ];
    allKeys(data.xqViTri).forEach(k => rows.push(tdRow(`  Vị trí: ${k}`, data.xqViTri, k)));
    allKeys(data.xqBen).forEach(k => rows.push(tdRow(`  Bên: ${k}`, data.xqBen, k)));
    allKeys(data.xqHinhThai).forEach(k => rows.push(tdRow(`  Hình thái: ${k}`, data.xqHinhThai, k)));


    rows.push(emptyTDRow('CT SCANNER NGỰC'));
    rows.push(tdRowSimple('  Có tổn thương trên CT', data.hasCT));
    allKeys(data.ctThuy).forEach(k => rows.push(tdRow(`  Thuỳ: ${k}`, data.ctThuy, k)));
    allKeys(data.ctBen).forEach(k => rows.push(tdRow(`  Bên: ${k}`, data.ctBen, k)));
    allKeys(data.ctHinhThai).forEach(k => rows.push(tdRow(`  Hình thái: ${k}`, data.ctHinhThai, k)));
    allKeys(data.ctDien).forEach(k => rows.push(tdRow(`  Diện: ${k}`, data.ctDien, k)));


    return (
        <SectionCard
            id="table-315"
            title="Bảng 3.5 — Đặc điểm hình ảnh học"
            subtitle="Mục 3.1.2: Kết quả X-quang/CT ngực — vị trí, hình thái, mức độ tổn thương theo thời điểm điều trị"
        >
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50">
                            <th rowSpan={2} className="p-2.5 border border-gray-200 font-semibold text-gray-700 text-left whitespace-nowrap align-bottom">
                                Đặc điểm hình ảnh
                            </th>
                            <th colSpan={2} className="p-2 border border-gray-200 font-semibold text-gray-700 text-center bg-blue-50">
                                Trước ĐT
                            </th>
                            <th colSpan={2} className="p-2 border border-gray-200 font-semibold text-gray-700 text-center bg-amber-50">
                                Trong ĐT
                            </th>
                            <th colSpan={2} className="p-2 border border-gray-200 font-semibold text-gray-700 text-center bg-green-50">
                                Kết thúc ĐT
                            </th>
                        </tr>
                        <tr className="bg-gray-50">
                            <th className="p-2 border border-gray-200 font-medium text-gray-600 text-center text-xs bg-blue-50/60">n</th>
                            <th className="p-2 border border-gray-200 font-medium text-gray-600 text-center text-xs bg-blue-50/60">%</th>
                            <th className="p-2 border border-gray-200 font-medium text-gray-600 text-center text-xs bg-amber-50/60">n</th>
                            <th className="p-2 border border-gray-200 font-medium text-gray-600 text-center text-xs bg-amber-50/60">%</th>
                            <th className="p-2 border border-gray-200 font-medium text-gray-600 text-center text-xs bg-green-50/60">n</th>
                            <th className="p-2 border border-gray-200 font-medium text-gray-600 text-center text-xs bg-green-50/60">%</th>
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
// SHARED: P-value cell renderer
// ════════════════════════════════════════════════════════════
function PCell({ p }: { p: number | null | undefined }) {
    if (p === null || p === undefined) return <span className="text-gray-400 italic text-xs">n/a</span>;
    const sig = pSignificance(p);
    const cls = sig === 'significant' ? 'text-red-600 font-bold' : sig === 'trend' ? 'text-amber-600 font-medium' : 'text-gray-600';
    return <span className={`text-xs ${cls}`}>{formatPValue(p)}{sig === 'significant' ? ' *' : ''}</span>;
}

function PValueDisclaimer() {
    return (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
                <strong>Kết quả tham khảo:</strong> Giá trị p được tính bằng xấp xỉ (normal approximation). 
                Để có kết quả chính xác cho nghiên cứu, cần xử lý trên phần mềm chuyên dụng (SPSS, R, Stata).
                {' '}<em>* p {'<'} 0.05</em>
            </span>
        </div>
    );
}

function CalcButton({ onClick, computed }: { onClick: () => void; computed: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${computed ? 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200' : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200'}`}
        >
            <Calculator className="w-3.5 h-3.5" />
            {computed ? 'Tính lại p-value' : 'Tính p-value'}
        </button>
    );
}

/** Use a counter instead of boolean so re-clicking 'Tính lại' forces useMemo recalc */
function useComputeP(): [boolean, number, () => void] {
    const [ver, setVer] = useState(0);
    return [ver > 0, ver, () => setVer(v => v + 1)];
}

// ════════════════════════════════════════════════════════════
// 3.2.1: BIOMARKER THEO NHÓM CĂN NGUYÊN
// ════════════════════════════════════════════════════════════
function Table321({ patients }: { patients: Patient[] }) {
    const [computed, computeVer, triggerCompute] = useComputeP();

    const data = useMemo(() => {
        const hasVK = patients.filter(p => p.viKhuan?.some(vk => vk.coKhong));
        const noVK = patients.filter(p => !p.viKhuan?.some(vk => vk.coKhong));

        const extract = (group: Patient[], key: 'sTREM1' | 'tIMP1' | 'il6' | 'il10' | 'il17') => {
            const vals = group.map(p => p.xetNghiem[key]).filter(num) as number[];
            return {
                n: vals.length,
                vals,
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
            pValue: computed ? mannWhitneyU(extract(hasVK, key).vals, extract(noVK, key).vals)?.p ?? null : null,
        }));
    }, [patients, computeVer]);

    const rows = data.map(d => [
        d.label,
        `${d.hasVK.median} (${d.hasVK.q1q3})`,
        String(d.hasVK.n),
        `${d.noVK.median} (${d.noVK.q1q3})`,
        String(d.noVK.n),
        computed ? <PCell p={d.pValue} /> : <span className="text-gray-400 italic text-xs">—</span>,
    ]);

    return (
        <SectionCard
            id="table-321"
            title="Bảng 3.8 — Biomarker theo nhóm căn nguyên vi sinh"
            subtitle="Mục 3.1.4: So sánh nồng độ biomarker giữa nhóm có VK và không phát hiện VK"
        >
            <div className="flex items-center gap-3 mb-3">
                <CalcButton onClick={triggerCompute} computed={computed} />
                {computed && <span className="text-xs text-gray-500">Kiểm định: Mann-Whitney U (two-tailed)</span>}
            </div>
            <DataTable
                headers={['Biomarker', 'Có VK — Median (Q1–Q3)', 'n₁', 'Không VK — Median (Q1–Q3)', 'n₂', 'p']}
                rows={rows}
            />
            {computed && <PValueDisclaimer />}
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.2.2: BIOMARKER THEO PSI CLASS
// ════════════════════════════════════════════════════════════
function Table322({ patients }: { patients: Patient[] }) {
    const [computed, computeVer, triggerCompute] = useComputeP();

    const data = useMemo(() => {
        const nhe = patients.filter(p => p.psi.tongDiem > 0 && ['I', 'II'].includes(psiClass(p.psi.tongDiem)));
        const nang = patients.filter(p => p.psi.tongDiem > 0 && ['III', 'IV', 'V'].includes(psiClass(p.psi.tongDiem)));

        const extract = (group: Patient[], key: string) => {
            const vals = group.map(p => p.xetNghiem[key as keyof typeof p.xetNghiem] as number | null).filter(num) as number[];
            return {
                n: vals.length,
                vals,
                median: vals.length > 0 ? median(vals).toFixed(2) : '—',
                q1q3: vals.length > 0 ? `${q1(vals).toFixed(2)}–${q3(vals).toFixed(2)}` : '—',
            };
        };

        const allKeys = ['sTREM1', 'tIMP1', 'il6', 'il10', 'il17', 'crp', 'procalcitonin'];
        const labels: Record<string, string> = { sTREM1: 'sTREM-1', tIMP1: 'TIMP-1', il6: 'IL-6', il10: 'IL-10', il17: 'IL-17', crp: 'CRP (mg/L)', procalcitonin: 'PCT (ng/mL)' };

        return {
            markers: allKeys.map(key => ({
                label: labels[key],
                nhe: extract(nhe, key),
                nang: extract(nang, key),
                pValue: computed ? mannWhitneyU(extract(nhe, key).vals, extract(nang, key).vals)?.p ?? null : null,
            })),
            nNhe: nhe.length,
            nNang: nang.length,
        };
    }, [patients, computeVer]);

    const rows = data.markers.map(d => [
        d.label,
        `${d.nhe.median} (${d.nhe.q1q3})`,
        String(d.nhe.n),
        `${d.nang.median} (${d.nang.q1q3})`,
        String(d.nang.n),
        computed ? <PCell p={d.pValue} /> : <span className="text-gray-400 italic text-xs">—</span>,
    ]);

    return (
        <SectionCard
            id="table-322"
            title="Bảng 3.9 — Biomarker theo mức độ nặng (PSI)"
            subtitle={`Mục 3.2.1: So sánh nhóm nhẹ (PSI I–II, n=${data.nNhe}) vs nhóm nặng (PSI III–V, n=${data.nNang})`}
        >
            <div className="flex items-center gap-3 mb-3">
                <CalcButton onClick={triggerCompute} computed={computed} />
                {computed && <span className="text-xs text-gray-500">Kiểm định: Mann-Whitney U (two-tailed)</span>}
            </div>
            <DataTable
                headers={['Biomarker', 'PSI I–II — Median (Q1–Q3)', 'n₁', 'PSI III–V — Median (Q1–Q3)', 'n₂', 'p']}
                rows={rows}
            />
            {computed && <PValueDisclaimer />}
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.2.3: BIOMARKER THEO KẾT CỤC
// ════════════════════════════════════════════════════════════
function Table323({ patients }: { patients: Patient[] }) {
    const [computed, , triggerCompute] = useComputeP();

    const data = useMemo(() => {
        const tuVong = patients.filter(p => p.ketCuc?.tuVong);
        const song = patients.filter(p => !p.ketCuc?.tuVong && (p.ketCuc?.tienTrienTotXuatVien || p.ketCuc?.xinVe));
        const thoMay = patients.filter(p => p.ketCuc?.thoMay || p.ketCuc?.dienBienDieuTri?.includes('Thở máy'));
        const khongThoMay = patients.filter(p => !(p.ketCuc?.thoMay || p.ketCuc?.dienBienDieuTri?.includes('Thở máy')));
        const socNK = patients.filter(p => p.ketCuc?.socNhiemKhuan || p.ketCuc?.dienBienDieuTri?.includes('Sốc nhiễm khuẩn'));
        const khongSocNK = patients.filter(p => !(p.ketCuc?.socNhiemKhuan || p.ketCuc?.dienBienDieuTri?.includes('Sốc nhiễm khuẩn')));

        const extract = (group: Patient[], key: string) => {
            const vals = group.map(p => p.xetNghiem[key as keyof typeof p.xetNghiem] as number | null).filter(num) as number[];
            return {
                n: vals.length,
                vals,
                median: vals.length > 0 ? median(vals).toFixed(2) : '—',
                q1q3: vals.length > 0 ? `${q1(vals).toFixed(2)}–${q3(vals).toFixed(2)}` : '—',
            };
        };

        return { tuVong, song, thoMay, khongThoMay, socNK, khongSocNK, extract };
    }, [patients]);

    const markers: { key: string; label: string }[] = [
        { key: 'sTREM1', label: 'sTREM-1' },
        { key: 'tIMP1', label: 'TIMP-1' },
        { key: 'il6', label: 'IL-6' },
        { key: 'il10', label: 'IL-10' },
        { key: 'il17', label: 'IL-17' },
        { key: 'crp', label: 'CRP' },
        { key: 'procalcitonin', label: 'PCT' },
    ];

    const buildRows = (group1: Patient[], group2: Patient[]) =>
        markers.map(m => {
            const g1 = data.extract(group1, m.key);
            const g2 = data.extract(group2, m.key);
            const pVal = computed ? mannWhitneyU(g1.vals, g2.vals)?.p ?? null : null;
            return [
                m.label,
                `${g1.median} (${g1.q1q3})`,
                String(g1.n),
                `${g2.median} (${g2.q1q3})`,
                String(g2.n),
                computed ? <PCell p={pVal} /> : <span className="text-gray-400 italic text-xs">—</span>,
            ];
        });

    return (
        <SectionCard
            id="table-323"
            title="Bảng 3.10 — Biomarker theo kết cục lâm sàng"
            subtitle="Mục 3.2.1: So sánh nồng độ biomarker giữa các nhóm kết cục (tử vong, thở máy, sốc NK)"
        >
            <div className="flex items-center gap-3 mb-3">
                <CalcButton onClick={triggerCompute} computed={computed} />
                {computed && <span className="text-xs text-gray-500">Kiểm định: Mann-Whitney U (two-tailed)</span>}
            </div>
            <div className="space-y-6">
                <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                        A. Tử vong (n={data.tuVong.length}) vs Sống (n={data.song.length})
                    </h4>
                    <DataTable
                        headers={['Biomarker', 'Tử vong — Median (Q1–Q3)', 'n', 'Sống — Median (Q1–Q3)', 'n', 'p']}
                        rows={buildRows(data.tuVong, data.song)}
                    />
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                        B. Thở máy (n={data.thoMay.length}) vs Không thở máy (n={data.khongThoMay.length})
                    </h4>
                    <DataTable
                        headers={['Biomarker', 'Thở máy — Median (Q1–Q3)', 'n', 'Không — Median (Q1–Q3)', 'n', 'p']}
                        rows={buildRows(data.thoMay, data.khongThoMay)}
                    />
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                        C. Sốc NK (n={data.socNK.length}) vs Không sốc NK (n={data.khongSocNK.length})
                    </h4>
                    <DataTable
                        headers={['Biomarker', 'Sốc NK — Median (Q1–Q3)', 'n', 'Không — Median (Q1–Q3)', 'n', 'p']}
                        rows={buildRows(data.socNK, data.khongSocNK)}
                    />
                </div>
            </div>
            {computed && <PValueDisclaimer />}
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.2.4: TƯƠNG QUAN BIOMARKER vs PSI / NGÀY ĐT
// ════════════════════════════════════════════════════════════
function Table324({ patients }: { patients: Patient[] }) {
    const [computed, , triggerCompute] = useComputeP();

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

        const allKeys: { key: string; label: string }[] = [
            { key: 'sTREM1', label: 'sTREM-1' },
            { key: 'tIMP1', label: 'TIMP-1' },
            { key: 'il6', label: 'IL-6' },
            { key: 'il10', label: 'IL-10' },
            { key: 'il17', label: 'IL-17' },
            { key: 'crp', label: 'CRP' },
            { key: 'procalcitonin', label: 'PCT' },
        ];

        return allKeys.map(m => ({
            label: m.label,
            vsPSI: correlate(withPSI, p => p.psi.tongDiem, p => p.xetNghiem[m.key as keyof typeof p.xetNghiem] as number | null),
            vsNgayDT: correlate(withNgayDT, p => p.ketCuc?.tongSoNgayDieuTri ?? null, p => p.xetNghiem[m.key as keyof typeof p.xetNghiem] as number | null),
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
        computed ? <PCell p={d.vsPSI.r !== null ? spearmanPValue(d.vsPSI.r, d.vsPSI.n) : null} /> : <span className="text-gray-400 italic text-xs">—</span>,
        formatR(d.vsNgayDT.r),
        String(d.vsNgayDT.n),
        computed ? <PCell p={d.vsNgayDT.r !== null ? spearmanPValue(d.vsNgayDT.r, d.vsNgayDT.n) : null} /> : <span className="text-gray-400 italic text-xs">—</span>,
    ]);

    return (
        <SectionCard
            id="table-324"
            title="Bảng 3.11 — Tương quan Spearman giữa biomarker với PSI Score và thời gian điều trị"
            subtitle="Mục 3.2.1: Phân tích tương quan (r: hệ số tương quan Spearman rank)"
        >
            <div className="flex items-center gap-3 mb-3">
                <CalcButton onClick={triggerCompute} computed={computed} />
                {computed && <span className="text-xs text-gray-500">p-value: xấp xỉ t-distribution (two-tailed)</span>}
            </div>
            <DataTable
                headers={['Biomarker', 'r vs PSI', 'n', 'p', 'r vs Ngày ĐT', 'n', 'p']}
                rows={rows}
            />
            {computed && <PValueDisclaimer />}
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.3: THUỐC ĐÃ DÙNG TRƯỚC NHẬP VIỆN
// ════════════════════════════════════════════════════════════
function Table33Drug({ patients, drugGroup1, drugGroup2 }: { patients: Patient[]; drugGroup1: string[]; drugGroup2: DrugGenericName[] }) {
    const N = patients.length;

    const { rows, totalDrugUsers } = useMemo(() => {
        // Build tenGoc → nhom1 map from settings
        const gocToNhom1 = new Map<string, string>();
        drugGroup2.forEach(g => gocToNhom1.set(g.ten, g.nhom1));

        // Scan ALL patients to collect actual drug usage
        type DrugStat = { patientIds: Set<string>; days: number[] };
        const byGeneric = new Map<string, DrugStat>();
        const byGroup1 = new Map<string, Set<string>>();
        let totalUsers = 0;

        patients.forEach((p, idx) => {
            const pid = p.id || `patient_${idx}`;
            const drugs = p.tienSu?.thuocDaDung || [];
            if (drugs.length > 0) totalUsers++;

            const seenGroup1 = new Set<string>();
            drugs.forEach(t => {
                const goc = t.tenGoc?.trim() || '';
                if (!goc) return;

                if (!byGeneric.has(goc)) byGeneric.set(goc, { patientIds: new Set(), days: [] });
                const stat = byGeneric.get(goc)!;
                stat.patientIds.add(pid);
                if (t.thoiGianDung !== null && t.thoiGianDung !== undefined) {
                    stat.days.push(t.thoiGianDung);
                }

                const nhom1 = gocToNhom1.get(goc) || 'Chưa phân loại';
                seenGroup1.add(nhom1);
            });

            seenGroup1.forEach(g1 => {
                if (!byGroup1.has(g1)) byGroup1.set(g1, new Set());
                byGroup1.get(g1)!.add(pid);
            });
        });

        // Collect all known generics (from settings + from patient data)
        const allGenerics = new Set<string>();
        drugGroup2.forEach(g => allGenerics.add(g.ten));
        byGeneric.forEach((_, goc) => allGenerics.add(goc));

        // Build rows
        const result: { type: 'group' | 'item' | 'unclassified'; name: string; n: number; pctStr: string; daysMeanSd: string }[] = [];

        drugGroup1.forEach(g1 => {
            const g1Count = byGroup1.get(g1)?.size || 0;
            result.push({ type: 'group', name: g1, n: g1Count, pctStr: pct(g1Count, N), daysMeanSd: '' });

            // Get all generics in this group (from settings + patient data)
            const genericsInGroup = [...allGenerics].filter(goc => gocToNhom1.get(goc) === g1);
            genericsInGroup.forEach(goc => {
                const stat = byGeneric.get(goc);
                const count = stat?.patientIds.size || 0;
                const m = stat && stat.days.length > 0 ? mean(stat.days) : null;
                const s = stat && stat.days.length > 1 ? sd(stat.days) : null;
                const dayStr = m !== null ? `${m.toFixed(1)} ± ${(s ?? 0).toFixed(1)}` : '—';
                result.push({ type: 'item', name: goc, n: count, pctStr: pct(count, N), daysMeanSd: dayStr });
            });
        });

        // Unclassified generics (in patient data but not mapped to any group)
        const knownInGroups = new Set<string>();
        drugGroup1.forEach(g1 => {
            [...allGenerics].filter(goc => gocToNhom1.get(goc) === g1).forEach(goc => knownInGroups.add(goc));
        });
        const unclassified = [...allGenerics].filter(goc => !knownInGroups.has(goc));

        if (unclassified.length > 0) {
            const ucCount = byGroup1.get('Chưa phân loại')?.size || 0;
            result.push({ type: 'unclassified', name: 'Chưa phân loại', n: ucCount, pctStr: pct(ucCount, N), daysMeanSd: '' });
            unclassified.forEach(goc => {
                const stat = byGeneric.get(goc);
                const count = stat?.patientIds.size || 0;
                const m = stat && stat.days.length > 0 ? mean(stat.days) : null;
                const s = stat && stat.days.length > 1 ? sd(stat.days) : null;
                const dayStr = m !== null ? `${m.toFixed(1)} ± ${(s ?? 0).toFixed(1)}` : '—';
                result.push({ type: 'item', name: goc, n: count, pctStr: pct(count, N), daysMeanSd: dayStr });
            });
        }

        return { rows: result, totalDrugUsers: totalUsers };
    }, [patients, drugGroup1, drugGroup2, N]);

    return (
        <SectionCard
            id="table-33-drug"
            title="Bảng 3.x — Thuốc đã dùng trước nhập viện"
            subtitle={`Thống kê thuốc theo nhóm — ${totalDrugUsers}/${N} BN có dùng thuốc trước nhập viện`}
        >
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="p-2.5 border border-gray-200 font-semibold text-gray-700 text-left">Thuốc</th>
                            <th className="p-2.5 border border-gray-200 font-semibold text-gray-700 text-center w-20">n</th>
                            <th className="p-2.5 border border-gray-200 font-semibold text-gray-700 text-center w-20">%</th>
                            <th className="p-2.5 border border-gray-200 font-semibold text-gray-700 text-center w-40">Số ngày dùng (Mean ± SD)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr><td colSpan={4} className="p-4 text-center text-gray-400 italic">Chưa có dữ liệu thuốc. Hãy nhập thuốc (chọn tên gốc) trong form Tiền sử.</td></tr>
                        )}
                        {rows.map((r, i) => (
                            <tr key={i} className={r.type === 'group' || r.type === 'unclassified' ? 'bg-gray-50 font-semibold' : 'hover:bg-gray-50/80'}>
                                <td className={`p-2.5 border border-gray-200 ${r.type === 'item' ? 'pl-8 text-gray-700' : 'text-gray-900'}`}>
                                    {r.name}
                                </td>
                                <td className="p-2.5 border border-gray-200 text-center text-gray-600">{r.n > 0 ? r.n : '—'}</td>
                                <td className="p-2.5 border border-gray-200 text-center text-gray-600">{r.n > 0 ? r.pctStr : '—'}</td>
                                <td className="p-2.5 border border-gray-200 text-center text-gray-600">{r.daysMeanSd || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.4: DIỄN BIẾN ĐIỀU TRỊ & KẾT CỤC BỔ SUNG
// ════════════════════════════════════════════════════════════
function Table34Outcome({ patients }: { patients: Patient[] }) {
    const N = patients.length;
    const data = useMemo(() => {
        const thoMay = patients.filter(p => p.ketCuc?.thoMay).length;
        const socNK = patients.filter(p => p.ketCuc?.socNhiemKhuan).length;
        const locMau = patients.filter(p => p.ketCuc?.locMau).length;
        const ngayLocMau = patients.map(p => p.ketCuc?.soNgayLocMau).filter(num);

        // Diễn biến điều trị (dynamic)
        const dienBien: Record<string, number> = {};
        patients.forEach(p => {
            p.ketCuc?.dienBienDieuTri?.forEach(db => {
                if (db) dienBien[db] = (dienBien[db] || 0) + 1;
            });
        });

        // Tình trạng ra viện
        const raVien: Record<string, number> = {};
        patients.forEach(p => {
            const tt = p.ketCuc?.tinhTrangRaVien || '';
            if (tt) raVien[tt] = (raVien[tt] || 0) + 1;
        });

        return { thoMay, socNK, locMau, ngayLocMau, dienBien, raVien };
    }, [patients]);

    const rows: (string | React.ReactNode)[][] = [
        ['Diễn biến điều trị', '', ''],
        ['  Thở máy', String(data.thoMay), pct(data.thoMay, N)],
        ['  Sốc nhiễm khuẩn', String(data.socNK), pct(data.socNK, N)],
        ['  Lọc máu', String(data.locMau), pct(data.locMau, N)],
    ];
    if (data.ngayLocMau.length > 0) {
        rows.push(['    Số ngày lọc máu (Mean ± SD)', meanSd(data.ngayLocMau), `n = ${data.ngayLocMau.length}`]);
    }
    Object.entries(data.dienBien).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        rows.push([`  ${k}`, String(v), pct(v, N)]);
    });

    if (Object.keys(data.raVien).length > 0) {
        rows.push(['Tình trạng ra viện', '', '']);
        Object.entries(data.raVien).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
            rows.push([`  ${k}`, String(v), pct(v, N)]);
        });
    }

    return (
        <SectionCard
            id="table-34-outcome"
            title="Bảng 3.x — Diễn biến điều trị & Kết cục bổ sung"
            subtitle="Thở máy, sốc nhiễm khuẩn, lọc máu, diễn biến và tình trạng ra viện"
        >
            <DataTable
                headers={['Đặc điểm', 'n / Giá trị', '% / Ghi chú']}
                rows={rows}
            />
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// 3.5: THỜI GIAN SỬ DỤNG KHÁNG SINH
// ════════════════════════════════════════════════════════════
function Table35KS({ patients }: { patients: Patient[] }) {
    const N = patients.length;

    const parseDate = (s: string): Date | null => {
        if (!s) return null;
        if (s.includes('-')) { const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
        const parts = s.split('/');
        if (parts.length !== 3) return null;
        const [d, m, y] = parts.map(Number);
        if (!d || !m || !y) return null;
        return new Date(y, m - 1, d);
    };

    const data = useMemo(() => {
        const coKS = patients.filter(p => p.ketCuc?.ngayBatDauKhangSinh).length;
        const thoiGianKS: number[] = [];
        const thoiGianNVdenKS: number[] = [];

        patients.forEach(p => {
            const ngayBD = parseDate(p.ketCuc?.ngayBatDauKhangSinh || '');
            const ngayKT = parseDate(p.ketCuc?.ngayKetThucKhangSinh || '');
            const ngayVV = parseDate(p.hanhChinh.ngayVaoVien);

            if (ngayBD && ngayKT) {
                const days = Math.round((ngayKT.getTime() - ngayBD.getTime()) / (1000 * 60 * 60 * 24));
                if (days >= 0) thoiGianKS.push(days);
            }
            if (ngayVV && ngayBD) {
                const days = Math.round((ngayBD.getTime() - ngayVV.getTime()) / (1000 * 60 * 60 * 24));
                if (days >= 0) thoiGianNVdenKS.push(days);
            }
        });

        return { coKS, thoiGianKS, thoiGianNVdenKS };
    }, [patients]);

    const rows: (string | React.ReactNode)[][] = [
        ['BN có dùng KS nội viện', String(data.coKS), pct(data.coKS, N)],
        ['Thời gian nhập viện → bắt đầu KS (ngày)', data.thoiGianNVdenKS.length > 0 ? meanSd(data.thoiGianNVdenKS) : '—', data.thoiGianNVdenKS.length > 0 ? `Median: ${median(data.thoiGianNVdenKS).toFixed(0)}, n = ${data.thoiGianNVdenKS.length}` : '—'],
        ['Tổng thời gian dùng KS (ngày)', data.thoiGianKS.length > 0 ? meanSd(data.thoiGianKS) : '—', data.thoiGianKS.length > 0 ? `Median: ${median(data.thoiGianKS).toFixed(0)}, n = ${data.thoiGianKS.length}` : '—'],
    ];

    return (
        <SectionCard
            id="table-35-ks"
            title="Bảng 3.x — Thời gian sử dụng kháng sinh"
            subtitle="Thời điểm bắt đầu và tổng thời gian sử dụng kháng sinh trong viện"
        >
            <DataTable
                headers={['Đặc điểm', 'Mean ± SD', 'Median / n']}
                rows={rows}
            />
        </SectionCard>
    );
}

// ════════════════════════════════════════════════════════════
// KAPLAN-MEIER SURVIVAL CURVE
// ════════════════════════════════════════════════════════════
function computeKaplanMeier(patients: Patient[]): { time: number; survival: number; events: number; atRisk: number; censored: number }[] {
    // Build dataset: time = tongSoNgayDieuTri, event = tuVong (1 = death, 0 = censored)
    const dataset: { time: number; event: boolean }[] = [];
    patients.forEach(p => {
        const t = p.ketCuc?.tongSoNgayDieuTri;
        if (t !== null && t !== undefined && t > 0) {
            dataset.push({ time: t, event: !!p.ketCuc?.tuVong });
        }
    });

    if (dataset.length === 0) return [];

    // Sort by time
    dataset.sort((a, b) => a.time - b.time);

    // Unique event times
    const eventTimes = [...new Set(dataset.filter(d => d.event).map(d => d.time))].sort((a, b) => a - b);

    const results: { time: number; survival: number; events: number; atRisk: number; censored: number }[] = [];
    let survival = 1;
    let nAtRisk = dataset.length;
    let prevTime = 0;

    // Add initial point
    results.push({ time: 0, survival: 1, events: 0, atRisk: nAtRisk, censored: 0 });

    eventTimes.forEach(t => {
        // Count censored between prevTime and t
        const censoredBefore = dataset.filter(d => !d.event && d.time > prevTime && d.time < t).length;
        nAtRisk -= censoredBefore;

        // Count events at time t
        const events = dataset.filter(d => d.event && d.time === t).length;
        const censored = dataset.filter(d => !d.event && d.time === t).length;

        survival *= (nAtRisk - events) / nAtRisk;
        results.push({ time: t, survival, events, atRisk: nAtRisk, censored });

        nAtRisk -= (events + censored);
        prevTime = t;
    });

    // Add final point at max time
    const maxTime = Math.max(...dataset.map(d => d.time));
    if (results[results.length - 1].time < maxTime) {
        results.push({ time: maxTime, survival, events: 0, atRisk: nAtRisk, censored: 0 });
    }

    return results;
}

function KaplanMeierChart({ patients }: { patients: Patient[] }) {
    const kmData = useMemo(() => computeKaplanMeier(patients), [patients]);

    const totalEvents = patients.filter(p => p.ketCuc?.tuVong && num(p.ketCuc?.tongSoNgayDieuTri)).length;
    const totalCensored = patients.filter(p => !p.ketCuc?.tuVong && num(p.ketCuc?.tongSoNgayDieuTri)).length;

    if (kmData.length < 2) {
        return (
            <SectionCard
                id="km-chart"
                title="Biểu đồ Kaplan-Meier — Đường cong sống còn"
                subtitle="Cần ít nhất 2 bệnh nhân có ngày điều trị và sự kiện tử vong để vẽ biểu đồ"
            >
                <div className="p-8 text-center text-gray-400 italic">
                    Chưa đủ dữ liệu để vẽ biểu đồ Kaplan-Meier.
                    Cần: tongSoNgayDieuTri &gt; 0 và có ít nhất 1 sự kiện tử vong.
                </div>
            </SectionCard>
        );
    }

    // Chart dimensions
    const W = 700, H = 350;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const plotW = W - margin.left - margin.right;
    const plotH = H - margin.top - margin.bottom;

    const maxTime = Math.max(...kmData.map(d => d.time));
    const scaleX = (t: number) => margin.left + (t / maxTime) * plotW;
    const scaleY = (s: number) => margin.top + (1 - s) * plotH;

    // Build step path
    let pathD = `M ${scaleX(0)} ${scaleY(1)}`;
    for (let i = 1; i < kmData.length; i++) {
        const prev = kmData[i - 1];
        const curr = kmData[i];
        // Horizontal step to current time at previous survival
        pathD += ` L ${scaleX(curr.time)} ${scaleY(prev.survival)}`;
        // Vertical drop to current survival
        pathD += ` L ${scaleX(curr.time)} ${scaleY(curr.survival)}`;
    }

    // Censored marks (tick marks for non-event patients)
    const censoredMarks: { x: number; y: number }[] = [];
    patients.forEach(p => {
        if (!p.ketCuc?.tuVong && num(p.ketCuc?.tongSoNgayDieuTri) && p.ketCuc!.tongSoNgayDieuTri! > 0) {
            const t = p.ketCuc!.tongSoNgayDieuTri!;
            // Find survival at this time
            let survAtT = 1;
            for (let i = kmData.length - 1; i >= 0; i--) {
                if (kmData[i].time <= t) { survAtT = kmData[i].survival; break; }
            }
            censoredMarks.push({ x: scaleX(t), y: scaleY(survAtT) });
        }
    });

    // Y-axis ticks
    const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
    // X-axis ticks
    const xStep = Math.max(1, Math.ceil(maxTime / 6));
    const xTicks: number[] = [];
    for (let i = 0; i <= maxTime; i += xStep) xTicks.push(i);
    if (xTicks[xTicks.length - 1] < maxTime) xTicks.push(maxTime);

    return (
        <SectionCard
            id="km-chart"
            title="Biểu đồ Kaplan-Meier — Đường cong sống còn"
            subtitle={`Sự kiện: tử vong (n=${totalEvents}), censored (n=${totalCensored}). Thời gian: số ngày điều trị.`}
        >
            <div className="flex flex-col items-center">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[750px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {/* Grid */}
                    {yTicks.map(t => (
                        <line key={`y-${t}`} x1={margin.left} x2={W - margin.right} y1={scaleY(t)} y2={scaleY(t)}
                            stroke="#e5e7eb" strokeWidth={0.5} />
                    ))}
                    {xTicks.map(t => (
                        <line key={`x-${t}`} x1={scaleX(t)} x2={scaleX(t)} y1={margin.top} y2={H - margin.bottom}
                            stroke="#e5e7eb" strokeWidth={0.5} />
                    ))}

                    {/* Axes */}
                    <line x1={margin.left} x2={margin.left} y1={margin.top} y2={H - margin.bottom}
                        stroke="#374151" strokeWidth={1} />
                    <line x1={margin.left} x2={W - margin.right} y1={H - margin.bottom} y2={H - margin.bottom}
                        stroke="#374151" strokeWidth={1} />

                    {/* Y-axis labels */}
                    {yTicks.map(t => (
                        <text key={`yl-${t}`} x={margin.left - 8} y={scaleY(t) + 4}
                            textAnchor="end" fontSize={11} fill="#6b7280">{(t * 100).toFixed(0)}%</text>
                    ))}

                    {/* X-axis labels */}
                    {xTicks.map(t => (
                        <text key={`xl-${t}`} x={scaleX(t)} y={H - margin.bottom + 18}
                            textAnchor="middle" fontSize={11} fill="#6b7280">{t}</text>
                    ))}

                    {/* Axis titles */}
                    <text x={W / 2} y={H - 5} textAnchor="middle" fontSize={12} fill="#374151" fontWeight={500}>
                        Thời gian (ngày)
                    </text>
                    <text x={15} y={H / 2} textAnchor="middle" fontSize={12} fill="#374151" fontWeight={500}
                        transform={`rotate(-90, 15, ${H / 2})`}>
                        Tỷ lệ sống (%)
                    </text>

                    {/* KM step curve */}
                    <path d={pathD} fill="none" stroke="#0d9488" strokeWidth={2.5} />

                    {/* Censored marks */}
                    {censoredMarks.map((m, i) => (
                        <line key={`c-${i}`} x1={m.x} x2={m.x} y1={m.y - 5} y2={m.y + 5}
                            stroke="#0d9488" strokeWidth={1.5} />
                    ))}

                    {/* Median survival line if applicable */}
                    {kmData.some(d => d.survival <= 0.5) && (() => {
                        const medianPoint = kmData.find(d => d.survival <= 0.5)!;
                        return (
                            <>
                                <line x1={margin.left} x2={scaleX(medianPoint.time)} y1={scaleY(0.5)} y2={scaleY(0.5)}
                                    stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" />
                                <line x1={scaleX(medianPoint.time)} x2={scaleX(medianPoint.time)} y1={scaleY(0.5)} y2={H - margin.bottom}
                                    stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" />
                                <text x={scaleX(medianPoint.time) + 4} y={H - margin.bottom - 5}
                                    fontSize={10} fill="#ef4444">Median: {medianPoint.time}d</text>
                            </>
                        );
                    })()}
                </svg>

                {/* At-risk table */}
                <div className="mt-4 overflow-x-auto w-full max-w-[750px]">
                    <table className="text-xs border-collapse w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-1.5 border border-gray-200 text-left font-semibold text-gray-600 w-32">Ngày</th>
                                {kmData.map((d, i) => (
                                    <th key={i} className="p-1.5 border border-gray-200 text-center text-gray-600">{d.time}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-1.5 border border-gray-200 font-medium text-gray-700">Số BN có nguy cơ</td>
                                {kmData.map((d, i) => (
                                    <td key={i} className="p-1.5 border border-gray-200 text-center text-gray-600">{d.atRisk}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="p-1.5 border border-gray-200 font-medium text-gray-700">Tỷ lệ sống (%)</td>
                                {kmData.map((d, i) => (
                                    <td key={i} className="p-1.5 border border-gray-200 text-center text-gray-600">{(d.survival * 100).toFixed(1)}</td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </SectionCard>
    );
}

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
                                <span><strong>Kết quả PCR đa mồi</strong> — Hệ thống chỉ có dữ liệu từ cấy vi khuẩn, chưa có biến riêng cho PCR multiplex</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                <span><strong>Tình trạng dinh dưỡng chi tiết</strong> — Chưa có SGA score (Subjective Global Assessment). Albumin đã có trong xét nghiệm.</span>
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
