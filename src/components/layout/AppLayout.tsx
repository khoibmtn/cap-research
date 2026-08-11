import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEditGuardCheck } from '@/contexts/EditGuardContext';
import {
    Users, BarChart3, Settings, LogOut, Menu, X, FileSpreadsheet, KeyRound, Loader2,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
    { to: '/', icon: Users, label: 'Danh sách nghiên cứu' },
    { to: '/analytics', icon: BarChart3, label: 'Thống kê' },
    { to: '/settings', icon: Settings, label: 'Cài đặt' },
];

// ─── Password Change Modal ──────────────────────────────────
function PasswordChangeModal({
    onClose,
    onSubmit,
    isAdmin,
}: {
    onClose: () => void;
    onSubmit: (currentPw: string, newPw: string) => Promise<void>;
    isAdmin: boolean;
}) {
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPw.length < 6) { toast.error('Mật khẩu mới tối thiểu 6 ký tự'); return; }
        if (newPw !== confirmPw) { toast.error('Xác nhận mật khẩu không khớp'); return; }
        setLoading(true);
        try {
            await onSubmit(currentPw, newPw);
            toast.success('Đã đổi mật khẩu thành công!');
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
            if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
                toast.error('Mật khẩu hiện tại không đúng');
            } else {
                toast.error(`Lỗi: ${msg}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">Đổi mật khẩu</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            value={currentPw}
                            onChange={e => setCurrentPw(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                        <input
                            type="password"
                            value={newPw}
                            onChange={e => setNewPw(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            value={confirmPw}
                            onChange={e => setConfirmPw(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đổi mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Layout ─────────────────────────────────────────────
export default function AppLayout() {
    const { user, role, logout, changePassword } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const checkGuard = useEditGuardCheck();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showPwModal, setShowPwModal] = useState(false);

    // All nav items visible for all roles (Settings is read-only for advisor)
    const navItems = NAV_ITEMS;

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleNavClick = async (to: string) => {
        const ok = await checkGuard();
        if (!ok) return;
        setSidebarOpen(false);
        navigate(to);
    };

    const isActive = (to: string) => {
        if (to === '/') return location.pathname === '/';
        return location.pathname.startsWith(to);
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                <div className="border-b border-gray-100">
                    <div className="flex items-center justify-between h-16 px-6">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-6 h-6 text-primary-600" />
                            <h1 className="font-heading font-bold text-lg text-gray-900">CAP Research</h1>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 rounded hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="px-6 pb-2 text-[10px] text-gray-400 leading-tight truncate">
                        Cập nhật 12/08/2026 03:10 — Regression tab
                    </p>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <button
                            key={to}
                            onClick={() => handleNavClick(to)}
                            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive(to)
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
              `}
                        >
                            <Icon className="w-5 h-5" />
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-medium text-xs">
                                {user?.email?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                            <p className={`text-[10px] font-medium ${role === 'admin' ? 'text-primary-600' : 'text-amber-600'}`}>
                                {role === 'admin' ? '👑 Admin' : '🔒 Advisor'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowPwModal(true)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Đổi mật khẩu"
                        >
                            <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Đăng xuất"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile header */}
                <header className="lg:hidden flex items-center h-14 px-4 bg-white border-b border-gray-200">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                    >
                        <Menu className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex items-center gap-2 ml-3">
                        <FileSpreadsheet className="w-5 h-5 text-primary-600" />
                        <span className="font-heading font-bold text-gray-900">CAP Research</span>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>

            {/* Password change modal */}
            {showPwModal && (
                <PasswordChangeModal
                    onClose={() => setShowPwModal(false)}
                    onSubmit={changePassword}
                    isAdmin={role === 'admin'}
                />
            )}
        </div>
    );
}
