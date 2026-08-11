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

/** CURB-65 group label from total score */
export function curb65Group(score: number): string {
    if (score <= 1) return 'Nhẹ';
    if (score === 2) return 'Trung bình';
    return 'Nặng';
}

/** Min–Max format */
export function minMax(values: number[]): string {
    if (values.length === 0) return '—';
    return `${Math.min(...values)}–${Math.max(...values)}`;
}

/** Simple linear regression: y = slope * x + intercept
 *  Returns slope, intercept, R², and two-tailed p-value for H0: slope=0
 */
export function linearRegression(xs: number[], ys: number[]): {
    slope: number; intercept: number; r2: number; pValue: number;
} | null {
    const n = xs.length;
    if (n < 3 || n !== ys.length) return null;

    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sumX2 = xs.reduce((a, x) => a + x * x, 0);
    const sumY2 = ys.reduce((a, y) => a + y * y, 0);

    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    // R²
    const ssTot = sumY2 - (sumY * sumY) / n;
    const ssRes = ys.reduce((a, y, i) => {
        const pred = slope * xs[i] + intercept;
        return a + (y - pred) ** 2;
    }, 0);
    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    // t-statistic for H0: slope = 0
    const df = n - 2;
    if (df < 1) return { slope, intercept, r2, pValue: 1 };

    const sErr = Math.sqrt(ssRes / df);
    const sxx = sumX2 - (sumX * sumX) / n;
    if (sxx === 0) return { slope, intercept, r2, pValue: 1 };
    const se = sErr / Math.sqrt(sxx);
    const t = se === 0 ? Infinity : Math.abs(slope / se);

    // Approximate two-tailed p-value using regularized incomplete beta function
    const pValue = tDistPValue(t, df);

    return { slope, intercept, r2, pValue };
}

/** Two-tailed p-value from t-distribution using incomplete beta approximation */
function tDistPValue(t: number, df: number): number {
    const x = df / (df + t * t);
    return regularizedBeta(x, df / 2, 0.5);
}

/** Regularized incomplete beta function I_x(a,b) using continued fraction */
function regularizedBeta(x: number, a: number, b: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    const lnBeta = lgamma(a) + lgamma(b) - lgamma(a + b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta);

    // Use continued fraction (Lentz's method)
    if (x < (a + 1) / (a + b + 2)) {
        return front * betaCF(x, a, b) / a;
    }
    return 1 - front * betaCF(1 - x, b, a) / b;
}

/** Continued fraction for incomplete beta */
function betaCF(x: number, a: number, b: number): number {
    const maxIter = 200;
    const eps = 3e-12;
    const fpmin = 1e-30;

    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;
    let c = 1;
    let d = 1 - qab * x / qap;
    if (Math.abs(d) < fpmin) d = fpmin;
    d = 1 / d;
    let h = d;

    for (let m = 1; m <= maxIter; m++) {
        const m2 = 2 * m;
        let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        h *= d * c;

        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        const del = d * c;
        h *= del;

        if (Math.abs(del - 1) < eps) break;
    }

    return h;
}

/** Log-gamma (Lanczos approximation) */
function lgamma(z: number): number {
    const g = 7;
    const coef = [
        0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
    ];
    if (z < 0.5) {
        return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    }
    z -= 1;
    let x = coef[0];
    for (let i = 1; i < g + 2; i++) {
        x += coef[i] / (z + i);
    }
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
