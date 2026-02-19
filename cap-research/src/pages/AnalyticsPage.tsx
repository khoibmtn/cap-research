import { useEffect, useState, useMemo } from 'react';
import { patientService } from '../services/patientService';
import type { Patient } from '../types/patient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Users, Skull, Activity, Stethoscope } from 'lucide-react';

const COLORS = ['#0d9488', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981', '#f97316'];

export default function AnalyticsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = patientService.subscribeAll((data) => {
            setPatients(data);
            setLoading(false);
        });
        return unsub;
    }, []);

    const stats = useMemo(() => {
        const total = patients.length;
        const tuVong = patients.filter((p) => p.ketCuc.tuVong).length;
        const psiValues = patients.map((p) => p.psi.tongDiem).filter((v) => v > 0);
        const avgPSI = psiValues.length > 0 ? Math.round(psiValues.reduce((a, b) => a + b, 0) / psiValues.length) : 0;
        const thoMay = patients.filter((p) => p.ketCuc.thoMay).length;

        return { total, tuVong, tyLeTuVong: total > 0 ? ((tuVong / total) * 100).toFixed(1) : '0', avgPSI, thoMay };
    }, [patients]);

    const bacteriaData = useMemo(() => {
        const counts: Record<string, number> = {};
        patients.forEach((p) => {
            p.viKhuan?.forEach((vk) => {
                if (vk.coKhong) {
                    counts[vk.tenViKhuan] = (counts[vk.tenViKhuan] || 0) + 1;
                }
            });
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, fullName: name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [patients]);

    const psiDistribution = useMemo(() => {
        const classes: Record<string, number> = {
            'Class I': 0, 'Class II': 0, 'Class III': 0, 'Class IV': 0, 'Class V': 0,
        };
        patients.forEach((p) => {
            const d = p.psi.tongDiem;
            if (d <= 50) classes['Class I']++;
            else if (d <= 70) classes['Class II']++;
            else if (d <= 90) classes['Class III']++;
            else if (d <= 130) classes['Class IV']++;
            else if (d > 130) classes['Class V']++;
        });
        return Object.entries(classes)
            .map(([name, value]) => ({ name, value }))
            .filter((d) => d.value > 0);
    }, [patients]);

    if (loading) {
        return <div className="text-center py-12 text-gray-400">Đang tải dữ liệu...</div>;
    }

    return (
        <div>
            <h1 className="font-heading text-2xl font-bold text-gray-900 mb-6">Thống kê nghiên cứu</h1>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Users} label="Tổng bệnh nhân" value={stats.total} color="primary" />
                <StatCard icon={Skull} label="Tỷ lệ tử vong" value={`${stats.tyLeTuVong}%`} color="danger" />
                <StatCard icon={Activity} label="PSI trung bình" value={stats.avgPSI} color="warning" />
                <StatCard icon={Stethoscope} label="Thở máy" value={stats.thoMay} color="primary" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bacteria distribution */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-heading font-semibold text-gray-900 mb-4">Phân bố vi khuẩn</h3>
                    {bacteriaData.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={bacteriaData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis type="number" tick={{ fontSize: 12 }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                                <Tooltip
                                    formatter={(value) => [value, 'Số ca']}
                                    labelFormatter={(label) => {
                                        const item = bacteriaData.find(d => d.name === label);
                                        return item?.fullName || String(label);
                                    }}
                                />
                                <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* PSI distribution */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-heading font-semibold text-gray-900 mb-4">Phân bố PSI</h3>
                    {psiDistribution.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={psiDistribution}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {psiDistribution.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: 'primary' | 'danger' | 'warning';
}) {
    const colorMap = {
        primary: 'bg-primary-50 text-primary-600',
        danger: 'bg-red-50 text-red-600',
        warning: 'bg-amber-50 text-amber-600',
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
    );
}
