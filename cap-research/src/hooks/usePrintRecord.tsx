import { useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import PrintResearchRecord from '../components/print/PrintResearchRecord';
import type { Patient } from '../types/patient';

interface PrintSettings {
    paperSize: 'A4' | 'A5' | 'Letter';
    margins: { top: number; left: number; right: number; bottom: number };
    fontSize: number;
    titleLine1: string;
    titleLine2: string;
    signLeft: string;
    signRight: string;
    showPsiLevel: boolean;
}

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
    paperSize: 'A4',
    margins: { top: 1.5, left: 2, right: 1.5, bottom: 1.5 },
    fontSize: 13,
    titleLine1: '',
    titleLine2: '',
    signLeft: '',
    signRight: '',
    showPsiLevel: false,
};

function loadPrintSettings(): PrintSettings {
    try {
        const raw = localStorage.getItem('cap_print_settings');
        if (raw) return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return DEFAULT_PRINT_SETTINGS;
}

export function usePrintRecord() {
    const overlayRef = useRef<HTMLDivElement | null>(null);

    const printPatients = useCallback((patients: Patient[]) => {
        if (patients.length === 0) return;

        const settings = loadPrintSettings();

        // Clean up existing overlay
        if (overlayRef.current) {
            document.body.removeChild(overlayRef.current);
        }

        // Create overlay container
        const overlay = document.createElement('div');
        overlay.className = 'print-overlay';
        overlay.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;';
        overlayRef.current = overlay;

        // Create print content container
        const container = document.createElement('div');
        container.className = 'print-container';
        overlay.appendChild(container);

        // Inject @page CSS with dynamic margins and paper size
        const style = document.createElement('style');
        const m = settings.margins;
        const ps = settings.paperSize;
        const fs = settings.fontSize || 13;
        style.textContent = `
            @page { size: ${ps}; margin: ${m.top}cm ${m.right}cm ${m.bottom}cm ${m.left}cm; }
            .print-record { font-size: ${fs}px !important; }
        `;
        overlay.appendChild(style);

        document.body.appendChild(overlay);

        // Render component
        const root = createRoot(container);
        root.render(
            <PrintResearchRecord patients={patients} settings={settings} />
        );

        // Wait for render, then print
        requestAnimationFrame(() => {
            setTimeout(() => {
                window.print();
                // Cleanup after print dialog closes
                setTimeout(() => {
                    root.unmount();
                    if (overlayRef.current && document.body.contains(overlayRef.current)) {
                        document.body.removeChild(overlayRef.current);
                    }
                    overlayRef.current = null;
                }, 500);
            }, 100);
        });
    }, []);

    return { printPatients };
}
