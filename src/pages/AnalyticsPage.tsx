import { useEffect, useState, useMemo } from 'react';
import { patientService } from '../services/patientService';
import type { Patient } from '../types/patient';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer,
    ScatterChart, Scatter,
    ComposedChart, Line, LabelList,
} from 'recharts';
import {
    Users, Skull, Activity, Stethoscope, Heart, MapPin,
    Bug, FlaskConical, Droplets, ThermometerSun,
    Clock, Pill,
} from 'lucide-react';
import { mean, sd, median, q1, q3, meanSd, frac, psiClass } from '../utils/statsHelpers';

const COLORS = ['#0d9488', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981', '#f97316'];
const PSI_COLORS: Record<string, string> = {
    I: '#22c55e', II: '#84cc16', III: '#f59e0b', IV: '#f97316', V: '#ef4444',
};

type Tab = 'overview' | 'micro' | 'biomarker';

export default function AnalyticsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('overview');

    useEffect(() => {
        const unsub = patientService.subscribeAll((data) => {
            setPatients(data);
            setLoading(false);
        });
        return unsub;
    }, []);

    if (loading) {
        return <div className="text-center py-12 text-gray-400">Đang tải dữ liệu...</div>;
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'overview', label: 'Tổng quan' },
        { key: 'micro', label: 'Vi sinh (MT1)' },
        { key: 'biomarker', label: 'Biomarker (MT2)' },
    ];

    return (
        <div>
            <h1 className="font-heading text-2xl font-bold text-gray-900 mb-2">Thống kê nghiên cứu</h1>
            <p className="text-sm text-gray-500 mb-6">
                Nghiên cứu đặc điểm căn nguyên vi sinh và dấu ấn sinh học ở bệnh nhân VPMPCĐ
            </p>

            {/* Tab bar */}
            <div className="flex gap-1 mb-6 border-b border-gray-200">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key
                            ? 'border-primary-600 text-primary-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'overview' && <OverviewTab patients={patients} />}
            {tab === 'micro' && <MicroTab patients={patients} />}
            {tab === 'biomarker' && <BiomarkerTab patients={patients} />}
        </div>
    );
}

// ====================================================================
// TAB 1: TỔNG QUAN
// ====================================================================
function OverviewTab({ patients }: { patients: Patient[] }) {
    const n = patients.length;
    const ages = patients.map(p => p.hanhChinh.tuoi).filter((v): v is number => v !== null);
    const males = patients.filter(p => p.hanhChinh.gioiTinh === 'nam').length;
    const females = patients.filter(p => p.hanhChinh.gioiTinh === 'nu').length;
    const noiO = patients.reduce<Record<string, number>>((acc, p) => {
        const v = p.hanhChinh.noiO || 'Không rõ';
        const label = v === 'nong_thon' ? 'Nông thôn' : v === 'thanh_thi' ? 'Thành thị' : v === 'hai_dao' ? 'Hải đảo' : v;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});
    const tuVong = patients.filter(p => p.ketCuc?.tuVong).length;
    const xuatVien = patients.filter(p => p.ketCuc?.tienTrienTotXuatVien).length;
    const xinVe = patients.filter(p => p.ketCuc?.xinVe).length;
    const ngayDT = patients.map(p => p.ketCuc?.tongSoNgayDieuTri).filter((v): v is number => v !== null);
    const psiScores = patients.map(p => p.psi.tongDiem).filter(v => v > 0);
    const psiHigh = patients.filter(p => {
        const cls = p.psi.phanTang || '';
        return cls.startsWith('III') || cls.startsWith('IV') || cls.startsWith('V');
    }).length;
    const thoMay = patients.filter(p => p.ketCuc?.thoMay || p.ketCuc?.dienBienDieuTri?.includes('Thở máy')).length;
    const socNK = patients.filter(p => p.ketCuc?.socNhiemKhuan || p.ketCuc?.dienBienDieuTri?.includes('Sốc nhiễm khuẩn')).length;

    // Tiền sử
    const daiThaoDuong = patients.filter(p => p.tienSu.daiThaoDuong).length;
    const tangHuyetAp = patients.filter(p => p.tienSu.tangHuyetAp).length;
    const benhThanMan = patients.filter(p => p.tienSu.benhThanMan).length;
    const suyTim = patients.filter(p => p.tienSu.suyTimUHuyet).length;
    const hutThuoc = patients.filter(p => p.tienSu.hutThuocLa).length;

    // Biomarker summary
    const strem = patients.map(p => p.xetNghiem.sTREM1).filter((v): v is number => v !== null);
    const timp = patients.map(p => p.xetNghiem.tIMP1).filter((v): v is number => v !== null);
    const il6 = patients.map(p => p.xetNghiem.il6).filter((v): v is number => v !== null);
    const il10 = patients.map(p => p.xetNghiem.il10).filter((v): v is number => v !== null);
    const il17 = patients.map(p => p.xetNghiem.il17).filter((v): v is number => v !== null);

    // Chỉ số viêm
    const nlr = patients.map(p => p.chiSoTinhToan?.nlr).filter((v): v is number => v !== null);
    const crp = patients.map(p => p.xetNghiem.crp).filter((v): v is number => v !== null);
    const pctt = patients.map(p => p.xetNghiem.procalcitonin).filter((v): v is number => v !== null);
    const vkDuong = patients.filter(p => p.viKhuan?.some(vk => vk.coKhong)).length;

    // Charts
    const psiDistribution = useMemo(() => {
        const cls: Record<string, number> = { I: 0, II: 0, III: 0, IV: 0, V: 0 };
        patients.forEach(p => {
            const d = p.psi.tongDiem;
            if (d > 0) cls[psiClass(d)]++;
        });
        return Object.entries(cls).filter(([, v]) => v > 0).map(([name, value]) => ({ name: `PSI ${name}`, value, fill: PSI_COLORS[name] }));
    }, [patients]);

    const outcomeData = useMemo(() => [
        { name: 'Xuất viện', value: xuatVien, fill: '#22c55e' },
        { name: 'Tử vong', value: tuVong, fill: '#ef4444' },
        { name: 'Xin về', value: xinVe, fill: '#f59e0b' },
    ].filter(d => d.value > 0), [xuatVien, tuVong, xinVe]);

    const tienSuData = useMemo(() => [
        { name: 'ĐTĐ', value: daiThaoDuong },
        { name: 'THA', value: tangHuyetAp },
        { name: 'Thận mạn', value: benhThanMan },
        { name: 'Suy tim', value: suyTim },
        { name: 'Hút thuốc', value: hutThuoc },
    ].filter(d => d.value > 0), [daiThaoDuong, tangHuyetAp, benhThanMan, suyTim, hutThuoc]);

    return (
        <div className="space-y-6">
            {/* Row 1: Tổng quan */}
            <Section title="Tổng quan mẫu">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <KPI icon={Users} label="Tổng BN" value={n} color="primary" />
                    <KPI icon={Activity} label="Tuổi TB ± SD" value={ages.length > 0 ? meanSd(ages) : '—'} color="primary" />
                    <KPI icon={Heart} label="Nam / Nữ" value={`${males} / ${females}`} color="primary" />
                    <KPI icon={MapPin} label="Nơi ở" value={Object.entries(noiO).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'} color="primary" small />
                    <KPI icon={Skull} label="Tử vong" value={frac(tuVong, n)} color="danger" />
                    <KPI icon={Clock} label="Ngày ĐT TB" value={ngayDT.length > 0 ? meanSd(ngayDT) : '—'} color="warning" />
                </div>
            </Section>

            {/* Row 2: PSI + Kết cục */}
            <Section title="Phân tầng & Kết cục">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <KPI icon={Activity} label="PSI TB ± SD" value={psiScores.length > 0 ? meanSd(psiScores) : '—'} color="warning" />
                    <KPI icon={Stethoscope} label="PSI III–V" value={frac(psiHigh, n)} color="danger" />
                    <KPI icon={ThermometerSun} label="Thở máy" value={frac(thoMay, n)} color="danger" />
                    <KPI icon={Droplets} label="Sốc NK" value={frac(socNK, n)} color="danger" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <ChartCard title="Phân bổ PSI">
                        {psiDistribution.length === 0 ? <EmptyChart /> : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={psiDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`} labelLine={false} >
                                        {psiDistribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                    <ChartCard title="Kết cục lâm sàng">
                        {outcomeData.length === 0 ? <EmptyChart /> : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`} labelLine={false} >
                                        {outcomeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                    <ChartCard title="Tiền sử bệnh">
                        {tienSuData.length === 0 ? <EmptyChart /> : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={tienSuData} margin={{ left: 0, right: 10, top: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} name="Số ca">
                                        <LabelList dataKey="value" position="top" fontSize={10} formatter={(v: unknown) => { const n0 = Number(v); return `${n0} (${((n0 / n) * 100).toFixed(0)}%)`; }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </div>
            </Section>

            {/* Row 3: Biomarker summary */}
            <Section title="Dấu ấn sinh học (tóm tắt)">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <KPI icon={FlaskConical} label="sTREM-1 (median)" value={strem.length > 0 ? median(strem).toFixed(1) : '—'} color="primary" unit="pg/mL" />
                    <KPI icon={FlaskConical} label="TIMP-1 (median)" value={timp.length > 0 ? median(timp).toFixed(1) : '—'} color="primary" unit="ng/mL" />
                    <KPI icon={FlaskConical} label="IL-6 (median)" value={il6.length > 0 ? median(il6).toFixed(1) : '—'} color="warning" unit="pg/mL" />
                    <KPI icon={FlaskConical} label="IL-10 (median)" value={il10.length > 0 ? median(il10).toFixed(1) : '—'} color="warning" unit="pg/mL" />
                    <KPI icon={FlaskConical} label="IL-17 (median)" value={il17.length > 0 ? median(il17).toFixed(1) : '—'} color="warning" unit="pg/mL" />
                </div>
            </Section>

            {/* Row 4: Chỉ số viêm + Vi sinh */}
            <Section title="Chỉ số viêm & Vi sinh">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KPI icon={Activity} label="NLR TB" value={nlr.length > 0 ? meanSd(nlr) : '—'} color="primary" />
                    <KPI icon={Droplets} label="CRP median" value={crp.length > 0 ? `${median(crp).toFixed(1)} mg/L` : '—'} color="warning" />
                    <KPI icon={ThermometerSun} label="PCT median" value={pctt.length > 0 ? `${median(pctt).toFixed(2)} ng/mL` : '—'} color="warning" />
                    <KPI icon={Bug} label="VK dương tính" value={frac(vkDuong, n)} color="primary" />
                </div>
            </Section>
        </div>
    );
}

// ====================================================================
// TAB 2: VI SINH (MT1)
// ====================================================================
function MicroTab({ patients }: { patients: Patient[] }) {
    const bacteriaData = useMemo(() => {
        const counts: Record<string, number> = {};
        patients.forEach(p => {
            p.viKhuan?.forEach(vk => {
                if (vk.coKhong && vk.tenViKhuan) {
                    counts[vk.tenViKhuan] = (counts[vk.tenViKhuan] || 0) + 1;
                }
            });
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name: name.length > 25 ? name.substring(0, 22) + '...' : name, fullName: name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [patients]);

    const n = patients.length;
    const vkDuong = patients.filter(p => p.viKhuan?.some(vk => vk.coKhong)).length;
    const vkAll = patients.flatMap(p => p.viKhuan?.filter(vk => vk.coKhong) || []);
    const dongNhiem = patients.filter(p => (p.viKhuan?.filter(vk => vk.coKhong) || []).length >= 2).length;

    // Kháng sinh đồ heatmap data
    const abData = useMemo(() => {
        const map: Record<string, Record<string, { S: number; I: number; R: number }>> = {};
        patients.forEach(p => {
            p.viKhuan?.forEach(vk => {
                if (!vk.coKhong || !vk.tenViKhuan) return;
                const bName = vk.tenViKhuan;
                vk.khangSinhDo?.forEach(ks => {
                    if (!ks.tenKhangSinh || !ks.mucDo) return;
                    if (!map[bName]) map[bName] = {};
                    if (!map[bName][ks.tenKhangSinh]) map[bName][ks.tenKhangSinh] = { S: 0, I: 0, R: 0 };
                    if (ks.mucDo === 'S' || ks.mucDo === 'I' || ks.mucDo === 'R') {
                        map[bName][ks.tenKhangSinh][ks.mucDo]++;
                    }
                });
            });
        });
        return map;
    }, [patients]);

    const abBacteria = Object.keys(abData);
    const abNames = useMemo(() => {
        const set = new Set<string>();
        Object.values(abData).forEach(abs => Object.keys(abs).forEach(a => set.add(a)));
        return [...set].sort();
    }, [abData]);

    return (
        <div className="space-y-6">
            <Section title="Tổng quan vi sinh">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KPI icon={Bug} label="Cấy dương tính" value={frac(vkDuong, n)} color="primary" />
                    <KPI icon={Bug} label="Tổng chủng VK" value={vkAll.length} color="primary" />
                    <KPI icon={Bug} label="Đồng nhiễm (≥2 VK)" value={frac(dongNhiem, n)} color="warning" />
                    <KPI icon={Pill} label="Có KSĐ" value={frac(patients.filter(p => p.viKhuan?.some(vk => vk.khangSinhDo?.some(ks => ks.mucDo))).length, n)} color="primary" />
                </div>
            </Section>

            <Section title="Phân bố vi khuẩn phân lập (Top 10)">
                {bacteriaData.length === 0 ? <EmptyChart msg="Chưa có dữ liệu vi khuẩn" /> : (
                    <ResponsiveContainer width="100%" height={Math.max(250, bacteriaData.length * 40)}>
                        <BarChart data={bacteriaData} layout="vertical" margin={{ left: 10, right: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={180} />
                            <Tooltip
                                formatter={(value) => [value, 'Số ca']}
                                labelFormatter={(label) => {
                                    const item = bacteriaData.find(d => d.name === label);
                                    return item?.fullName || String(label);
                                }}
                            />
                            <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} name="Số ca">
                                {bacteriaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                <LabelList dataKey="value" position="right" fontSize={10} formatter={(v: unknown) => { const n0 = Number(v); return `${n0} (${((n0 / n) * 100).toFixed(0)}%)`; }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Section>

            <Section title="Kháng sinh đồ (S / I / R)">
                {abBacteria.length === 0 ? <EmptyChart msg="Chưa có dữ liệu kháng sinh đồ" /> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="text-left p-2 border border-gray-200 font-semibold sticky left-0 bg-gray-50 z-10">Vi khuẩn \\ Kháng sinh</th>
                                    {abNames.map(ab => (
                                        <th key={ab} className="p-2 border border-gray-200 font-medium text-center whitespace-nowrap">
                                            {ab.length > 12 ? ab.slice(0, 10) + '..' : ab}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {abBacteria.map(bac => (
                                    <tr key={bac} className="hover:bg-gray-50">
                                        <td className="p-2 border border-gray-200 font-medium sticky left-0 bg-white z-10 whitespace-nowrap">{bac}</td>
                                        {abNames.map(ab => {
                                            const d = abData[bac]?.[ab];
                                            if (!d) return <td key={ab} className="p-1.5 border border-gray-200 text-center text-gray-300">—</td>;
                                            return (
                                                <td key={ab} className="p-1.5 border border-gray-200 text-center">
                                                    {d.S > 0 && <span className="text-green-600 font-bold">S{d.S > 1 ? `(${d.S})` : ''}</span>}
                                                    {d.I > 0 && <span className="text-amber-500 font-bold ml-0.5">I{d.I > 1 ? `(${d.I})` : ''}</span>}
                                                    {d.R > 0 && <span className="text-red-600 font-bold ml-0.5">R{d.R > 1 ? `(${d.R})` : ''}</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>
        </div>
    );
}

// ====================================================================
// TAB 3: BIOMARKER (MT2)
// ====================================================================
function BiomarkerTab({ patients }: { patients: Patient[] }) {
    const markers = useMemo(() => {
        const classes = ['I', 'II', 'III', 'IV', 'V'];
        const extract = (key: 'sTREM1' | 'tIMP1' | 'il6' | 'il10' | 'il17') => {
            return classes.map(cls => {
                const vals = patients
                    .filter(p => p.psi.tongDiem > 0 && psiClass(p.psi.tongDiem) === cls)
                    .map(p => p.xetNghiem[key])
                    .filter((v): v is number => v !== null);
                return {
                    psi: `PSI ${cls}`,
                    n: vals.length,
                    median: vals.length > 0 ? median(vals) : null,
                    q1: vals.length > 0 ? q1(vals) : null,
                    q3: vals.length > 0 ? q3(vals) : null,
                    min: vals.length > 0 ? Math.min(...vals) : null,
                    max: vals.length > 0 ? Math.max(...vals) : null,
                    mean: vals.length > 0 ? mean(vals) : null,
                    sd: vals.length > 0 ? sd(vals) : null,
                };
            }).filter(d => d.n > 0);
        };
        return {
            sTREM1: extract('sTREM1'),
            tIMP1: extract('tIMP1'),
            il6: extract('il6'),
            il10: extract('il10'),
            il17: extract('il17'),
        };
    }, [patients]);

    // Scatter: NLR/PLR/CAR vs PSI
    const scatterData = useMemo(() => {
        return patients
            .filter(p => p.psi.tongDiem > 0)
            .map(p => ({
                psi: p.psi.tongDiem,
                nlr: p.chiSoTinhToan?.nlr ?? null,
                plr: p.chiSoTinhToan?.plr ?? null,
                car: p.chiSoTinhToan?.car ?? null,
                name: p.maBenhNhanNghienCuu || p.hanhChinh.hoTen,
            }));
    }, [patients]);

    // Tử vong theo PSI Class
    const mortalityByPSI = useMemo(() => {
        const classes = ['I', 'II', 'III', 'IV', 'V'];
        return classes.map(cls => {
            const group = patients.filter(p => p.psi.tongDiem > 0 && psiClass(p.psi.tongDiem) === cls);
            const dead = group.filter(p => p.ketCuc?.tuVong).length;
            return { psi: `PSI ${cls}`, total: group.length, tuVong: dead, sống: group.length - dead };
        }).filter(d => d.total > 0);
    }, [patients]);

    // Biomarker summary table
    const summaryRows = useMemo(() => {
        const row = (label: string, key: 'sTREM1' | 'tIMP1' | 'il6' | 'il10' | 'il17', unit: string) => {
            const vals = patients.map(p => p.xetNghiem[key]).filter((v): v is number => v !== null);
            return {
                label, unit, n: vals.length,
                mean: vals.length > 0 ? mean(vals).toFixed(1) : '—',
                sd: vals.length > 0 ? sd(vals).toFixed(1) : '—',
                median: vals.length > 0 ? median(vals).toFixed(1) : '—',
                q1: vals.length > 0 ? q1(vals).toFixed(1) : '—',
                q3: vals.length > 0 ? q3(vals).toFixed(1) : '—',
            };
        };
        return [
            row('sTREM-1', 'sTREM1', 'pg/mL'),
            row('TIMP-1', 'tIMP1', 'ng/mL'),
            row('IL-6', 'il6', 'pg/mL'),
            row('IL-10', 'il10', 'pg/mL'),
            row('IL-17', 'il17', 'pg/mL'),
        ];
    }, [patients]);

    return (
        <div className="space-y-6">
            {/* Summary table */}
            <Section title="Tổng hợp dấu ấn sinh học">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="text-left p-2.5 border border-gray-200 font-semibold">Biomarker</th>
                                <th className="text-center p-2.5 border border-gray-200 font-semibold">Đơn vị</th>
                                <th className="text-center p-2.5 border border-gray-200 font-semibold">n</th>
                                <th className="text-center p-2.5 border border-gray-200 font-semibold">Mean ± SD</th>
                                <th className="text-center p-2.5 border border-gray-200 font-semibold">Median (Q1–Q3)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summaryRows.map(r => (
                                <tr key={r.label} className="hover:bg-gray-50">
                                    <td className="p-2.5 border border-gray-200 font-medium">{r.label}</td>
                                    <td className="p-2.5 border border-gray-200 text-center text-gray-500">{r.unit}</td>
                                    <td className="p-2.5 border border-gray-200 text-center">{r.n}</td>
                                    <td className="p-2.5 border border-gray-200 text-center">{r.mean !== '—' ? `${r.mean} ± ${r.sd}` : '—'}</td>
                                    <td className="p-2.5 border border-gray-200 text-center">{r.median !== '—' ? `${r.median} (${r.q1}–${r.q3})` : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            {/* Box plot approximation using bar chart with error bars */}
            <Section title="Biomarker theo phân tầng PSI">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {([
                        { key: 'sTREM1' as const, label: 'sTREM-1 (pg/mL)', data: markers.sTREM1 },
                        { key: 'tIMP1' as const, label: 'TIMP-1 (ng/mL)', data: markers.tIMP1 },
                        { key: 'il6' as const, label: 'IL-6 (pg/mL)', data: markers.il6 },
                        { key: 'il10' as const, label: 'IL-10 (pg/mL)', data: markers.il10 },
                        { key: 'il17' as const, label: 'IL-17 (pg/mL)', data: markers.il17 },
                    ]).map(({ label, data }) => (
                        <ChartCard key={label} title={label}>
                            {data.length === 0 ? <EmptyChart msg="Chưa đủ dữ liệu" /> : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <ComposedChart data={data} margin={{ left: 10, right: 10, top: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="psi" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (!active || !payload?.[0]) return null;
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="bg-white border border-gray-200 rounded-lg p-2 shadow text-xs">
                                                        <p className="font-semibold">{d.psi} (n={d.n})</p>
                                                        <p>Median: {d.median?.toFixed(1)}</p>
                                                        <p>Q1–Q3: {d.q1?.toFixed(1)}–{d.q3?.toFixed(1)}</p>
                                                        <p>Min–Max: {d.min?.toFixed(1)}–{d.max?.toFixed(1)}</p>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Bar dataKey="median" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Median">
                                            {data.map((d, i) => <Cell key={i} fill={PSI_COLORS[d.psi.replace('PSI ', '')] || '#0ea5e9'} />)}
                                            <LabelList dataKey="n" position="top" fontSize={10} formatter={(v: unknown) => { const n0 = Number(v); return `n=${n0} (${((n0 / patients.length) * 100).toFixed(0)}%)`; }} />
                                        </Bar>
                                        <Line type="monotone" dataKey="q3" stroke="#94a3b8" strokeDasharray="4 2" dot={false} name="Q3" />
                                        <Line type="monotone" dataKey="q1" stroke="#94a3b8" strokeDasharray="4 2" dot={false} name="Q1" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    ))}
                </div>
            </Section>

            {/* Scatter: NLR vs PSI */}
            <Section title="Chỉ số viêm vs PSI Score">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {([
                        { key: 'nlr' as const, label: 'NLR', color: '#0d9488' },
                        { key: 'plr' as const, label: 'PLR', color: '#0ea5e9' },
                        { key: 'car' as const, label: 'CAR', color: '#f59e0b' },
                    ]).map(({ key, label, color }) => {
                        const filtered = scatterData.filter(d => d[key] !== null).map(d => ({ ...d, val: d[key] as number }));
                        return (
                            <ChartCard key={key} title={`${label} vs PSI Score`}>
                                {filtered.length === 0 ? <EmptyChart msg="Chưa đủ dữ liệu" /> : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <ScatterChart margin={{ left: 0, right: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                            <XAxis dataKey="psi" name="PSI Score" tick={{ fontSize: 11 }} label={{ value: 'PSI', position: 'bottom', fontSize: 10 }} />
                                            <YAxis dataKey="val" name={label} tick={{ fontSize: 11 }} label={{ value: label, angle: -90, position: 'insideLeft', fontSize: 10 }} />
                                            <Tooltip
                                                cursor={{ strokeDasharray: '3 3' }}
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.[0]) return null;
                                                    const d = payload[0].payload;
                                                    return (
                                                        <div className="bg-white border border-gray-200 rounded-lg p-2 shadow text-xs">
                                                            <p className="font-semibold">{d.name}</p>
                                                            <p>PSI: {d.psi}</p>
                                                            <p>{label}: {d.val?.toFixed(2)}</p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Scatter data={filtered} fill={color} />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                )}
                            </ChartCard>
                        );
                    })}
                </div>
            </Section>

            {/* Mortality by PSI */}
            <Section title="Tử vong theo phân tầng PSI">
                {mortalityByPSI.length === 0 ? <EmptyChart msg="Chưa đủ dữ liệu" /> : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={mortalityByPSI} margin={{ left: 0, right: 10, top: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="psi" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="sống" fill="#22c55e" radius={[0, 0, 0, 0]} name="Sống" stackId="a" />
                            <Bar dataKey="tuVong" fill="#ef4444" radius={[4, 4, 0, 0]} name="Tử vong" stackId="a">
                                <LabelList dataKey="total" position="top" fontSize={10} formatter={(v: unknown) => { const n0 = Number(v); return `n=${n0} (${((n0 / patients.length) * 100).toFixed(0)}%)`; }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Section>
        </div>
    );
}

// ====================================================================
// SHARED COMPONENTS
// ====================================================================
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary-500 rounded-full inline-block" />
                {title}
            </h2>
            {children}
        </div>
    );
}

function KPI({ icon: Icon, label, value, color, unit, small }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: 'primary' | 'danger' | 'warning';
    unit?: string;
    small?: boolean;
}) {
    const colorMap = {
        primary: 'bg-primary-50 text-primary-600',
        danger: 'bg-red-50 text-red-600',
        warning: 'bg-amber-50 text-amber-600',
    };
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colorMap[color]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <p className={`font-bold text-gray-900 ${small ? 'text-sm' : 'text-lg'}`}>{value}</p>
            {unit && <p className="text-[10px] text-gray-400">{unit}</p>}
            <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
            {children}
        </div>
    );
}

function EmptyChart({ msg }: { msg?: string }) {
    return <p className="text-gray-400 text-sm text-center py-8">{msg || 'Chưa có dữ liệu'}</p>;
}
