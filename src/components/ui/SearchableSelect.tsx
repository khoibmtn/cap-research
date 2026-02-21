import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface SearchableSelectProps {
    value: string;
    options: string[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    label?: string;
}

export default function SearchableSelect({ value, options, onChange, placeholder = 'Chọn...', disabled = false, label }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter options based on search
    const filtered = useMemo(() => {
        if (!search) return options;
        const q = search.toLowerCase();
        return options.filter((o) => o.toLowerCase().includes(q));
    }, [options, search]);

    // Close dropdown when clicking/touching outside
    useEffect(() => {
        const handleOutside = (e: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('touchstart', handleOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
        };
    }, []);

    const handleSelect = (opt: string) => {
        onChange(opt);
        setIsOpen(false);
        setSearch('');
    };

    const handleClear = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onChange('');
        setSearch('');
    };

    const handleOpen = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        setSearch('');
        if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

            {/* Trigger button */}
            <button
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm text-left transition-colors
                    ${disabled ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer'}
                    ${isOpen ? 'ring-2 ring-primary-500 border-transparent' : ''}`}
            >
                <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                    {value || placeholder}
                </span>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {value && !disabled && (
                        <span
                            onClick={handleClear}
                            onTouchEnd={handleClear}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-100">
                        <input
                            ref={inputRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm..."
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            className="w-full px-2.5 py-1.5 text-sm rounded border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Options list */}
                    <div className="max-h-48 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-gray-400 text-center italic">Không tìm thấy kết quả</div>
                        ) : (
                            filtered.map((opt) => (
                                <button
                                    type="button"
                                    key={opt}
                                    onClick={() => handleSelect(opt)}
                                    className={`w-full text-left px-3 py-2.5 text-sm active:bg-primary-100 hover:bg-primary-50 transition-colors
                                        ${opt === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                                >
                                    {opt}
                                </button>
                            ))
                        )}
                    </div>

                    {options.length > 0 && (
                        <div className="px-3 py-1.5 border-t border-gray-100 text-xs text-gray-400">
                            {filtered.length} / {options.length} mục
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
