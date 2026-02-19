import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileDown, Trash2, Eye, Edit, Printer } from 'lucide-react';
import { patientService } from '../services/patientService';
import { exportPatientsToExcel } from '../services/exportService';
import { usePrintRecord } from '../hooks/usePrintRecord';
import type { Patient } from '../types/patient';
import toast from 'react-hot-toast';

export default function DashboardPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const navigate = useNavigate();

    const formatMABNNC = (code: string) => {
        if (!code) return '—';
        if (/^CAP/i.test(code)) return code;
        const num = parseInt(code, 10);
        if (!isNaN(num)) return `CAP${String(num).padStart(3, '0')}`;
        return code;
    };
    const { printPatients } = usePrintRecord();

    useEffect(() => {
        const unsub = patientService.subscribeAll((data) => {
            setPatients(data);
            setLoading(false);
        });
        return unsub;
    }, []);

    const filtered = patients.filter((p) => {
        const q = search.toLowerCase();
        return (
            p.maBenhNhanNghienCuu.toLowerCase().includes(q) ||
            p.hanhChinh.hoTen.toLowerCase().includes(q) ||
            p.maBenhAnNoiTru.toLowerCase().includes(q)
        );
    });

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Xóa bệnh nhân "${name}"?`)) return;
        try {
            await patientService.delete(id);
            toast.success('Đã xóa bệnh nhân');
        } catch {
            toast.error('Lỗi khi xóa');
        }
    };

    const handleExport = () => {
        if (patients.length === 0) {
            toast.error('Không có dữ liệu để xuất');
            return;
        }
        exportPatientsToExcel(patients);
        toast.success('Đã xuất file Excel');
    };

    // ─── Selection ──────────────────────────────────────────
    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map((p) => p.id)));
        }
    };

    const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

    // ─── Print ──────────────────────────────────────────────
    const handlePrintSingle = (patient: Patient) => printPatients([patient]);

    const handlePrintBatch = () => {
        const selection = filtered.filter((p) => selectedIds.has(p.id));
        if (selection.length === 0) {
            toast.error('Chưa chọn bệnh nhân nào');
            return;
        }
        printPatients(selection);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-gray-900">Danh sách bệnh nhân</h1>
                    <p className="text-sm text-gray-500 mt-1">Tổng cộng {patients.length} bệnh nhân nghiên cứu</p>
                </div>
                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handlePrintBatch}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                                text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100
                                transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">In {selectedIds.size} BN</span>
                        </button>
                    )}
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
              text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50
              transition-colors"
                    >
                        <FileDown className="w-4 h-4" />
                        <span className="hidden sm:inline">Xuất Excel</span>
                    </button>
                    <Link
                        to="/patient/new"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
              text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors
              shadow-sm shadow-primary-200"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm BN
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo mã BNNC, họ tên, mã BA..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Đang tải...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-400 text-sm">Chưa có bệnh nhân nào</p>
                    <Link
                        to="/patient/new"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm text-primary-600
              hover:bg-primary-50 rounded-xl transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm bệnh nhân đầu tiên
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-3 text-left w-10">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Mã BNNC</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Họ tên</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Tuổi</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Giới</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">PSI</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Kết cục</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((p) => (
                                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(p.id) ? 'bg-primary-50/40' : ''}`}>
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(p.id)}
                                                onChange={() => toggleSelect(p.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-primary-700">{formatMABNNC(p.maBenhNhanNghienCuu)}</td>
                                        <td className="px-4 py-3 text-gray-900">{p.hanhChinh.hoTen || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.hanhChinh.tuoi ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                                            {p.hanhChinh.gioiTinh === 'nam' ? 'Nam' : p.hanhChinh.gioiTinh === 'nu' ? 'Nữ' : '—'}
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            {p.psi.tongDiem > 0 ? (
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${p.psi.tongDiem <= 70 ? 'bg-green-50 text-green-700' :
                                                        p.psi.tongDiem <= 90 ? 'bg-yellow-50 text-yellow-700' :
                                                            'bg-red-50 text-red-700'}`}>
                                                    {p.psi.tongDiem} điểm
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            {p.ketCuc.tuVong ? (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">Tử vong</span>
                                            ) : p.ketCuc.tienTrienTotXuatVien ? (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Xuất viện</span>
                                            ) : p.ketCuc.thoMay ? (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium">Thở máy</span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => navigate(`/patient/${p.id}`)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/patient/${p.id}/edit`)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handlePrintSingle(p)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                                                    title="In bệnh án"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id, p.hanhChinh.hoTen)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
