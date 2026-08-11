import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    type User,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '../config/firebase';

// ─── Role system ─────────────────────────────────────────────
export type UserRole = 'admin' | 'advisor';

const ROLE_MAP: Record<string, UserRole> = {
    'admin@capresearch.com': 'admin',
};
// Any email NOT in ROLE_MAP defaults to 'advisor'

interface AuthContextType {
    user: User | null;
    role: UserRole;
    loading: boolean;
    login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
    logout: () => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const role: UserRole = user?.email ? (ROLE_MAP[user.email] ?? 'advisor') : 'advisor';

    const login = async (email: string, password: string, rememberMe: boolean) => {
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const changePassword = async (currentPassword: string, newPassword: string) => {
        if (!user?.email) throw new Error('Chưa đăng nhập');
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, login, logout, changePassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
