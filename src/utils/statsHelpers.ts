// ─── Statistical helper functions ─────────────────────────
export function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

export function sd(values: number[]): number {
    if (values.length < 2) return 0;
    const m = mean(values);
    return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1));
}

export function median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function q1(values: number[]): number {
    if (values.length < 2) return values[0] ?? 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const lower = sorted.slice(0, mid);
    return median(lower);
}

export function q3(values: number[]): number {
    if (values.length < 2) return values[0] ?? 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const upper = sorted.slice(sorted.length % 2 !== 0 ? mid + 1 : mid);
    return median(upper);
}

export function iqr(values: number[]): string {
    return `${median(values).toFixed(1)} (${q1(values).toFixed(1)}–${q3(values).toFixed(1)})`;
}

export function meanSd(values: number[]): string {
    if (values.length === 0) return '—';
    return `${mean(values).toFixed(1)} ± ${sd(values).toFixed(1)}`;
}

export function pct(count: number, total: number): string {
    if (total === 0) return '0%';
    return `${((count / total) * 100).toFixed(1)}%`;
}

export function frac(count: number, total: number): string {
    return `${count}/${total} (${pct(count, total)})`;
}

/** Get PSI class label from total score */
export function psiClass(score: number): string {
    if (score <= 50) return 'I';
    if (score <= 70) return 'II';
    if (score <= 90) return 'III';
    if (score <= 130) return 'IV';
    return 'V';
}

/** Box plot data for Recharts: [min, q1, median, q3, max] */
export function boxPlotData(values: number[]): [number, number, number, number, number] | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    return [sorted[0], q1(sorted), median(sorted), q3(sorted), sorted[sorted.length - 1]];
}
