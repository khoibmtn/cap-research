import { useState } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import type { ConflictPair } from '../../services/importService';

interface ConflictDialogProps {
    conflicts: ConflictPair[];
    newCount?: number;
    identicalCount?: number;
    onConfirm: (selectedIds: Set<string>) => void;
    onCancel: () => void;
}

export default function ConflictDialog({
    conflicts,
    newCount = 0,
    identicalCount = 0,
    onConfirm,
    onCancel,
}: ConflictDialogProps) {
    const [selected, setSelected] = useState<Set<string>>(
        () => new Set(conflicts.map((c) => c.existing.maBenhAnNoiTru)),
    );

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelected(new Set(conflicts.map((c) => c.existing.maBenhAnNoiTru)));
    const deselectAll = () => setSelected(new Set());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-heading font-semibold text-gray-900">
                                Kết quả phân tích khôi phục
                            </h2>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Summary */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 space-y-1">
                    {newCount > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                                <Check className="w-3 h-3" />
                            </span>
                            <span className="text-gray-700">
                                <strong>{newCount}</strong> BN mới — thêm tự động (mã BNNC được gán tự động)
                            </span>
                        </div>
                    )}
                    {conflicts.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">
                                <AlertTriangle className="w-3 h-3" />
                            </span>
                            <span className="text-gray-700">
                                <strong>{conflicts.length}</strong> BN trùng — chọn bên dưới để ghi đè
                            </span>
                        </div>
                    )}
                    {identicalCount > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs">—</span>
                            <span className="text-gray-500">
                                <strong>{identicalCount}</strong> BN giống hệt — bỏ qua
                            </span>
                        </div>
                    )}
                </div>

                {/* Conflict list */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {conflicts.map((c) => {
                        const id = c.existing.maBenhAnNoiTru;
                        const isSelected = selected.has(id);
                        return (
                            <div
                                key={id}
                                className={`rounded-xl border-2 p-4 transition-colors cursor-pointer ${isSelected
                                    ? 'border-primary-300 bg-primary-50/50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                onClick={() => toggle(id)}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggle(id)}
                                        className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium text-gray-900">
                                                {c.existing.hanhChinh.hoTen || '(Không tên)'}
                                            </span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                BA: {id}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                ({c.diffs.length} khác biệt)
                                            </span>
                                        </div>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {c.diffs.map((diff, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                    <span className="text-gray-500 w-32 shrink-0 truncate">{diff.label}:</span>
                                                    <span className="text-red-500 line-through truncate">{diff.oldValue}</span>
                                                    <span className="text-gray-400">→</span>
                                                    <span className="text-green-600 font-medium truncate">{diff.newValue}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                    <div className="flex gap-2">
                        <button
                            onClick={selectAll}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Chọn tất cả
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={deselectAll}
                            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Bỏ chọn tất cả
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={() => onConfirm(selected)}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
                        >
                            {newCount > 0 && selected.size === 0
                                ? `Thêm ${newCount} BN mới`
                                : selected.size > 0
                                    ? `Ghi đè ${selected.size} + thêm ${newCount} mới`
                                    : 'Xác nhận'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
