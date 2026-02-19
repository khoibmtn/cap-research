import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEditGuardCheck } from '@/contexts/EditGuardContext';
import {
    Users, BarChart3, Settings, LogOut, Menu, X, FileSpreadsheet,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
    { to: '/', icon: Users, label: 'Bệnh nhân' },
    { to: '/analytics', icon: BarChart3, label: 'Thống kê' },
    { to: '/settings', icon: Settings, label: 'Cài đặt' },
];

export default function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const checkGuard = useEditGuardCheck();
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
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

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
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
                        </div>
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
        </div>
    );
}
