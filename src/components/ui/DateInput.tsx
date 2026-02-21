import { useRef } from 'react';

interface DateInputProps {
    value: string; // stored as dd/mm/yyyy or yyyy-mm-dd
    onChange: (value: string) => void;
    onBlur?: (newValue: string) => void;
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

/**
 * DateInput — works on both desktop and mobile.
 *
 * ⚠️  RULE: This component MUST remain functional on both desktop (click opens
 *     native date picker) and mobile (tap opens native date picker).
 *     Do NOT use opacity-0 overlays or WebkitAppearance:none hacks.
 *     Always test on both device types after any change.
 */
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
        const displayValue = parts.length === 3
            ? `${parts[2]}/${parts[1]}/${parts[0]}`
            : v;
        onChange(displayValue);
        // Trigger validation with the NEW value (avoids stale closure)
        if (onBlur) {
            setTimeout(() => onBlur(displayValue), 0);
        }
    };

    return (
        <div>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <input
                ref={inputRef}
                type="date"
                value={isoValue}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white
                    focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    cursor-pointer ${className}`}
            />
        </div>
    );
}
