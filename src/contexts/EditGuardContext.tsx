import { createContext, useContext, useRef, useCallback, useState } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface EditGuardContextType {
    guardRef: React.MutableRefObject<(() => Promise<boolean>) | null>;
    showConfirm: (msg: string, confirmLabel?: string, cancelLabel?: string) => Promise<boolean>;
}

const EditGuardContext = createContext<EditGuardContextType>({
    guardRef: { current: null },
    showConfirm: async () => true,
});

export function EditGuardProvider({ children }: { children: React.ReactNode }) {
    const guardRef = useRef<(() => Promise<boolean>) | null>(null);

    // State for the confirm modal
    const [dialogState, setDialogState] = useState<{
        open: boolean;
        message: string;
        confirmLabel: string;
        cancelLabel: string;
        resolve: ((value: boolean) => void) | null;
    }>({
        open: false,
        message: '',
        confirmLabel: 'OK',
        cancelLabel: 'Hủy bỏ',
        resolve: null,
    });

    const showConfirm = useCallback(
        (msg: string, confirmLabel = 'Lưu', cancelLabel = 'Bỏ thay đổi'): Promise<boolean> => {
            return new Promise<boolean>((resolve) => {
                setDialogState({
                    open: true,
                    message: msg,
                    confirmLabel,
                    cancelLabel,
                    resolve,
                });
            });
        },
        []
    );

    const handleConfirm = () => {
        dialogState.resolve?.(true);
        setDialogState((s) => ({ ...s, open: false, resolve: null }));
    };

    const handleCancel = () => {
        dialogState.resolve?.(false);
        setDialogState((s) => ({ ...s, open: false, resolve: null }));
    };

    return (
        <EditGuardContext.Provider value={{ guardRef, showConfirm }}>
            {children}
            <ConfirmDialog
                open={dialogState.open}
                title="Thay đổi chưa lưu"
                message={dialogState.message}
                confirmLabel={dialogState.confirmLabel}
                cancelLabel={dialogState.cancelLabel}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </EditGuardContext.Provider>
    );
}

/**
 * Hook for PatientFormPage to register its guard function.
 * The guard should return true if navigation is allowed, false to stay.
 */
export function useEditGuardRegister() {
    const { guardRef } = useContext(EditGuardContext);
    const register = useCallback((fn: (() => Promise<boolean>) | null) => {
        guardRef.current = fn;
    }, [guardRef]);
    return register;
}

/**
 * Hook to access the custom confirm dialog from anywhere.
 */
export function useEditGuardConfirm() {
    const { showConfirm } = useContext(EditGuardContext);
    return showConfirm;
}

/**
 * Hook for AppLayout sidebar to check before navigating.
 * Returns an async function that resolves to true if navigation is OK.
 */
export function useEditGuardCheck() {
    const { guardRef } = useContext(EditGuardContext);
    const check = useCallback(async (): Promise<boolean> => {
        if (!guardRef.current) return true;
        return guardRef.current();
    }, [guardRef]);
    return check;
}
