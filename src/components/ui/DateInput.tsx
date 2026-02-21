import { useRef } from 'react';

interface DateInputProps {
    value: string; // stored as dd/mm/yyyy or yyyy-mm-dd
    onChange: (value: string) => void;
    onBlur?: () => void;
    label?: string;
    className?: string;
}

// dd/mm/yyyy → yyyy-mm-dd (for native input)
function toISO(display: string): string {
    if (!display) return '';
    const parts = display.split('/');
    if (parts.length === 3 && parts[0].length <= 2) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return display; // already yyyy-mm-dd
}

// yyyy-mm-dd → dd/mm/yyyy (for display)
function toDisplay(iso: string): string {
    if (!iso) return '';
    if (iso.includes('/')) return iso; // already dd/mm/yyyy
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function DateInput({ value, onChange, onBlur, label, className = '' }: DateInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const isoValue = toISO(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value; // yyyy-mm-dd from native picker
        if (!v) {
            onChange('');
            return;
        }
        // Convert to dd/mm/yyyy for storage
        const parts = v.split('-');
        if (parts.length === 3) {
            onChange(`${parts[2]}/${parts[1]}/${parts[0]}`);
        } else {
            onChange(v);
        }
    };

    const openPicker = () => {
        const el = inputRef.current;
        if (!el) return;
        try { el.showPicker(); } catch { el.focus(); }
    };

    return (
        <div>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <div className="relative cursor-pointer" onClick={openPicker}>
                {/* Visible text showing dd/mm/yyyy */}
                <div
                    className={`px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white
                        focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent ${className}`}
                >
                    <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                        {value ? toDisplay(value) : 'dd/mm/yyyy'}
                    </span>
                </div>
                {/* Native date picker — pointer-events:none so clicks pass through to the parent onClick */}
                <input
                    ref={inputRef}
                    type="date"
                    value={isoValue}
                    onChange={handleChange}
                    onBlur={onBlur}
                    className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                    style={{ WebkitAppearance: 'none' }}
                />
            </div>
        </div>
    );
}
