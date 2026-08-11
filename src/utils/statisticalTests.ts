/**
 * Statistical hypothesis tests for clinical research
 * NOTE: These are approximations. For publication, verify with SPSS/R.
 */

// ─── Normal distribution CDF (Abramowitz & Stegun approximation) ───
function normalCDF(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * y);
}

// ─── Chi-square CDF (regularized incomplete gamma) ───
function gammaCDF(x: number, k: number): number {
    if (x <= 0) return 0;
    // Lower regularized incomplete gamma via series expansion
    const a = k / 2;
    const z = x / 2;
    let sum = 0, term = 1 / a;
    sum = term;
    for (let n = 1; n < 200; n++) {
        term *= z / (a + n);
        sum += term;
        if (Math.abs(term) < 1e-12) break;
    }
    return sum * Math.exp(-z + a * Math.log(z) - logGamma(a));
}

function logGamma(x: number): number {
    // Stirling's series via Lanczos approximation
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
        -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
}

export function chiSquarePValue(chiSq: number, df: number): number {
    if (df <= 0 || chiSq <= 0) return 1;
    return 1 - gammaCDF(chiSq, df);
}

// ─── T-distribution CDF (for Spearman p-value) ───
function tCDF(t: number, df: number): number {
    // Using regularized incomplete beta function
    const x = df / (df + t * t);
    const p = 0.5 * betaRegularized(x, df / 2, 0.5);
    return t > 0 ? 1 - p : p;
}

function betaRegularized(x: number, a: number, b: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Continued fraction (Lentz's method)
    const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;
    // Use continued fraction
    let f = 1, c = 1, d = 1 - (a + b) * x / (a + 1);
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    f = d;
    for (let m = 1; m <= 200; m++) {
        // Even step
        let numerator = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
        d = 1 + numerator * d;
        if (Math.abs(d) < 1e-30) d = 1e-30;
        c = 1 + numerator / c;
        if (Math.abs(c) < 1e-30) c = 1e-30;
        d = 1 / d;
        f *= c * d;
        // Odd step
        numerator = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
        d = 1 + numerator * d;
        if (Math.abs(d) < 1e-30) d = 1e-30;
        c = 1 + numerator / c;
        if (Math.abs(c) < 1e-30) c = 1e-30;
        d = 1 / d;
        const delta = c * d;
        f *= delta;
        if (Math.abs(delta - 1) < 1e-10) break;
    }
    return front * f;
}

// ═══════════════════════════════════════════════════════
// MANN-WHITNEY U TEST (two-tailed)
// ═══════════════════════════════════════════════════════
export function mannWhitneyU(sample1: number[], sample2: number[]): { U: number; z: number; p: number } | null {
    const n1 = sample1.length, n2 = sample2.length;
    if (n1 < 2 || n2 < 2) return null;

    // Combine and rank
    const combined = [
        ...sample1.map(v => ({ v, group: 1 })),
        ...sample2.map(v => ({ v, group: 2 })),
    ].sort((a, b) => a.v - b.v);

    const n = combined.length;
    const ranks = new Array(n);

    // Handle ties: assign average rank
    for (let i = 0; i < n;) {
        let j = i;
        while (j < n - 1 && combined[j + 1].v === combined[i].v) j++;
        const avgRank = (i + j) / 2 + 1;
        for (let k = i; k <= j; k++) ranks[k] = avgRank;
        i = j + 1;
    }

    // Sum ranks for group 1
    let R1 = 0;
    for (let i = 0; i < n; i++) {
        if (combined[i].group === 1) R1 += ranks[i];
    }

    const U1 = R1 - (n1 * (n1 + 1)) / 2;
    const U2 = n1 * n2 - U1;
    const U = Math.min(U1, U2);

    // Normal approximation (with tie correction)
    const meanU = (n1 * n2) / 2;

    // Tie correction
    const tieGroups: number[] = [];
    for (let i = 0; i < n;) {
        let j = i;
        while (j < n - 1 && combined[j + 1].v === combined[i].v) j++;
        const tieSize = j - i + 1;
        if (tieSize > 1) tieGroups.push(tieSize);
        i = j + 1;
    }

    let tieCorrection = 0;
    tieGroups.forEach(t => { tieCorrection += (t * t * t - t); });

    const sigmaU = Math.sqrt(
        (n1 * n2 / 12) * ((n + 1) - tieCorrection / (n * (n - 1)))
    );

    if (sigmaU === 0) return null;

    const z = (U - meanU) / sigmaU;
    const p = 2 * (1 - normalCDF(Math.abs(z))); // Two-tailed

    return { U, z, p: Math.min(1, Math.max(0, p)) };
}

// ═══════════════════════════════════════════════════════
// SPEARMAN CORRELATION P-VALUE
// ═══════════════════════════════════════════════════════
export function spearmanPValue(r: number, n: number): number | null {
    if (n < 5 || r === null) return null;
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    const df = n - 2;
    // Two-tailed p-value
    const p = 2 * (1 - tCDF(Math.abs(t), df));
    return Math.min(1, Math.max(0, p));
}

// ═══════════════════════════════════════════════════════
// FORMAT P-VALUE
// ═══════════════════════════════════════════════════════
export function formatPValue(p: number | null | undefined): string {
    if (p === null || p === undefined) return '—';
    if (p < 0.001) return '< 0.001';
    return p.toFixed(3);
}

export function pSignificance(p: number | null | undefined): 'significant' | 'trend' | 'ns' | 'unknown' {
    if (p === null || p === undefined) return 'unknown';
    if (p < 0.05) return 'significant';
    if (p < 0.1) return 'trend';
    return 'ns';
}

// ═══════════════════════════════════════════════════════
// COHEN'S KAPPA (agreement between 2 binary classifiers)
// ═══════════════════════════════════════════════════════
export function cohensKappa(a: boolean[], b: boolean[]): { kappa: number; interpretation: string } | null {
    const n = a.length;
    if (n !== b.length || n < 2) return null;

    // 2×2 contingency table
    let a11 = 0, a10 = 0, a01 = 0, a00 = 0;
    for (let i = 0; i < n; i++) {
        if (a[i] && b[i]) a11++;
        else if (a[i] && !b[i]) a10++;
        else if (!a[i] && b[i]) a01++;
        else a00++;
    }

    const po = (a11 + a00) / n; // observed agreement
    const pYesA = (a11 + a10) / n;
    const pYesB = (a11 + a01) / n;
    const pNoA = (a00 + a01) / n;
    const pNoB = (a00 + a10) / n;
    const pe = pYesA * pYesB + pNoA * pNoB; // expected agreement by chance

    if (pe >= 1) return { kappa: 1, interpretation: 'Hoàn hảo' };

    const kappa = (po - pe) / (1 - pe);

    let interpretation: string;
    if (kappa < 0) interpretation = 'Kém (Poor)';
    else if (kappa <= 0.20) interpretation = 'Yếu (Slight)';
    else if (kappa <= 0.40) interpretation = 'Tạm (Fair)';
    else if (kappa <= 0.60) interpretation = 'Trung bình (Moderate)';
    else if (kappa <= 0.80) interpretation = 'Tốt (Substantial)';
    else interpretation = 'Rất tốt (Almost Perfect)';

    return { kappa: Math.max(-1, Math.min(1, kappa)), interpretation };
}

// ═══════════════════════════════════════════════════════
// CROSSTAB / CONTINGENCY TABLE ANALYSIS
// ═══════════════════════════════════════════════════════

/** Chi-square test for independence on m×n table */
export function chiSquareTest(observed: number[][]): {
    chiSq: number; df: number; p: number;
    expected: number[][]; valid: boolean; warning: string | null;
} {
    const m = observed.length;
    const n = observed[0]?.length ?? 0;
    const rowTotals = observed.map(r => r.reduce((a, b) => a + b, 0));
    const colTotals = Array.from({ length: n }, (_, j) => observed.reduce((a, r) => a + r[j], 0));
    const total = rowTotals.reduce((a, b) => a + b, 0);

    if (total === 0) return { chiSq: 0, df: 0, p: 1, expected: [], valid: false, warning: 'Không có dữ liệu' };

    const expected = observed.map((row, i) =>
        row.map((_, j) => (rowTotals[i] * colTotals[j]) / total)
    );

    let chiSq = 0;
    let lowExpected = 0;
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            const e = expected[i][j];
            if (e > 0) {
                chiSq += ((observed[i][j] - e) ** 2) / e;
            }
            if (e < 5) lowExpected++;
        }
    }

    const df = (m - 1) * (n - 1);
    const p = chiSquarePValue(chiSq, df);

    const totalCells = m * n;
    let warning: string | null = null;
    if (lowExpected > 0) {
        const pct = ((lowExpected / totalCells) * 100).toFixed(0);
        warning = `${lowExpected}/${totalCells} ô (${pct}%) có tần suất kỳ vọng < 5. Kết quả Chi-square có thể không chính xác.`;
    }

    return { chiSq, df, p, expected, valid: df > 0, warning };
}

/** Likelihood Ratio test (G²) */
export function likelihoodRatioTest(observed: number[][]): { g2: number; df: number; p: number } {
    const m = observed.length;
    const n = observed[0]?.length ?? 0;
    const rowTotals = observed.map(r => r.reduce((a, b) => a + b, 0));
    const colTotals = Array.from({ length: n }, (_, j) => observed.reduce((a, r) => a + r[j], 0));
    const total = rowTotals.reduce((a, b) => a + b, 0);
    if (total === 0) return { g2: 0, df: 0, p: 1 };

    let g2 = 0;
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            const o = observed[i][j];
            const e = (rowTotals[i] * colTotals[j]) / total;
            if (o > 0 && e > 0) {
                g2 += 2 * o * Math.log(o / e);
            }
        }
    }

    const df = (m - 1) * (n - 1);
    return { g2, df, p: chiSquarePValue(g2, df) };
}

/** Yates' corrected Chi-square (2×2 only) */
export function yatesCorrectedChiSquare(table: number[][]): { chiSq: number; p: number } | null {
    if (table.length !== 2 || table[0].length !== 2) return null;
    const a = table[0][0], b = table[0][1], c = table[1][0], d = table[1][1];
    const n = a + b + c + d;
    if (n === 0) return null;

    const num = Math.max(0, Math.abs(a * d - b * c) - n / 2) ** 2 * n;
    const denom = (a + b) * (c + d) * (a + c) * (b + d);
    if (denom === 0) return null;

    const chiSq = num / denom;
    return { chiSq, p: chiSquarePValue(chiSq, 1) };
}

/** Fisher's exact test (2×2 only, using hypergeometric) */
export function fisherExactTest(table: number[][]): { p: number } | null {
    if (table.length !== 2 || table[0].length !== 2) return null;
    const a = table[0][0], b = table[0][1], c = table[1][0], d = table[1][1];
    const n = a + b + c + d;
    if (n === 0) return null;
    const r1 = a + b, c1 = a + c;
    const r2 = c + d;

    const logHyp = (x: number) => {
        return lnFact(r1) + lnFact(r2) + lnFact(c1) + lnFact(n - c1)
            - lnFact(n) - lnFact(x) - lnFact(r1 - x)
            - lnFact(c1 - x) - lnFact(r2 - c1 + x);
    };

    const pObs = Math.exp(logHyp(a));
    let pValue = 0;
    const minA = Math.max(0, c1 - r2);
    const maxA = Math.min(r1, c1);
    for (let x = minA; x <= maxA; x++) {
        const px = Math.exp(logHyp(x));
        if (px <= pObs + 1e-10) pValue += px;
    }

    return { p: Math.min(1, Math.max(0, pValue)) };
}

function lnFact(n: number): number {
    if (n <= 1) return 0;
    return logGamma(n + 1);
}

/** Effect sizes */
export function phiCoefficient(chiSq: number, n: number): number {
    return n > 0 ? Math.sqrt(chiSq / n) : 0;
}

export function cramersV(chiSq: number, n: number, minDim: number): number {
    if (n <= 0 || minDim <= 1) return 0;
    return Math.sqrt(chiSq / (n * (minDim - 1)));
}

export function contingencyCoefficient(chiSq: number, n: number): number {
    return n > 0 ? Math.sqrt(chiSq / (chiSq + n)) : 0;
}

/** Odds Ratio with 95% CI (2×2 only) */
export function oddsRatio(table: number[][]): { or: number; ci: [number, number]; p: number } | null {
    if (table.length !== 2 || table[0].length !== 2) return null;
    const a = table[0][0], b = table[0][1], c = table[1][0], d = table[1][1];
    // Haldane-Anscombe correction if zero cell
    const hasZero = a === 0 || b === 0 || c === 0 || d === 0;
    const a2 = hasZero ? a + 0.5 : a;
    const b2 = hasZero ? b + 0.5 : b;
    const c2 = hasZero ? c + 0.5 : c;
    const d2 = hasZero ? d + 0.5 : d;
    const or = (a2 * d2) / (b2 * c2);
    const se = Math.sqrt(1 / a2 + 1 / b2 + 1 / c2 + 1 / d2);
    const lnOR = Math.log(or);
    return {
        or,
        ci: [Math.exp(lnOR - 1.96 * se), Math.exp(lnOR + 1.96 * se)],
        p: 2 * (1 - normalCDF(Math.abs(lnOR / se))),
    };
}

/** Relative Risk with 95% CI (2×2 only) */
export function relativeRisk(table: number[][]): { rr: number; ci: [number, number]; p: number } | null {
    if (table.length !== 2 || table[0].length !== 2) return null;
    const a = table[0][0], b = table[0][1], c = table[1][0], d = table[1][1];
    const r1 = a + b, r2 = c + d;
    if (r1 === 0 || r2 === 0) return null;
    const p1 = a / r1, p2 = c / r2;
    if (p2 === 0) return null;
    const rr = p1 / p2;
    const se = Math.sqrt((1 - p1) / (a || 0.5) + (1 - p2) / (c || 0.5));
    const lnRR = Math.log(rr);
    return {
        rr,
        ci: [Math.exp(lnRR - 1.96 * se), Math.exp(lnRR + 1.96 * se)],
        p: 2 * (1 - normalCDF(Math.abs(lnRR / se))),
    };
}

/** Diagnostic metrics for 2×2 (Se, Sp, PPV, NPV) with Wilson CI */
export function diagnosticMetrics(table: number[][]): {
    sensitivity: { value: number; ci: [number, number] };
    specificity: { value: number; ci: [number, number] };
    ppv: { value: number; ci: [number, number] };
    npv: { value: number; ci: [number, number] };
} | null {
    if (table.length !== 2 || table[0].length !== 2) return null;
    const a = table[0][0], b = table[0][1], c = table[1][0], d = table[1][1];

    const wilsonCI = (x: number, n: number): [number, number] => {
        if (n === 0) return [0, 1];
        const z = 1.96;
        const p = x / n;
        const denom = 1 + z * z / n;
        const center = (p + z * z / (2 * n)) / denom;
        const margin = (z / denom) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
        return [Math.max(0, center - margin), Math.min(1, center + margin)];
    };

    return {
        sensitivity: { value: (a + c) > 0 ? a / (a + c) : 0, ci: wilsonCI(a, a + c) },
        specificity: { value: (b + d) > 0 ? d / (b + d) : 0, ci: wilsonCI(d, b + d) },
        ppv: { value: (a + b) > 0 ? a / (a + b) : 0, ci: wilsonCI(a, a + b) },
        npv: { value: (c + d) > 0 ? d / (c + d) : 0, ci: wilsonCI(d, c + d) },
    };
}

/** Standardized residuals */
export function standardizedResiduals(observed: number[][], expected: number[][]): number[][] {
    return observed.map((row, i) =>
        row.map((o, j) => {
            const e = expected[i][j];
            return e > 0 ? (o - e) / Math.sqrt(e) : 0;
        })
    );
}

/** Adjusted standardized residuals */
export function adjustedStdResiduals(observed: number[][], expected: number[][]): number[][] {
    const n = observed[0]?.length ?? 0;
    const rowTotals = observed.map(r => r.reduce((a, b) => a + b, 0));
    const colTotals = Array.from({ length: n }, (_, j) => observed.reduce((a, r) => a + r[j], 0));
    const total = rowTotals.reduce((a, b) => a + b, 0);
    if (total === 0) return observed.map(r => r.map(() => 0));

    return observed.map((row, i) =>
        row.map((o, j) => {
            const e = expected[i][j];
            if (e <= 0) return 0;
            const pi = rowTotals[i] / total;
            const pj = colTotals[j] / total;
            const v = e * (1 - pi) * (1 - pj);
            return v > 0 ? (o - e) / Math.sqrt(v) : 0;
        })
    );
}

/** Linear-by-Linear association (for ordinal variables) */
export function linearByLinear(observed: number[][]): { chiSq: number; p: number } | null {
    const m = observed.length;
    const n = observed[0]?.length ?? 0;
    const total = observed.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0);
    if (total <= 1) return null;

    let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            const f = observed[i][j];
            sumXY += f * i * j;
            sumX += f * i;
            sumY += f * j;
            sumX2 += f * i * i;
            sumY2 += f * j * j;
        }
    }

    const denom = (total * sumX2 - sumX * sumX) * (total * sumY2 - sumY * sumY);
    if (denom <= 0) return null;
    const r = (total * sumXY - sumX * sumY) / Math.sqrt(denom);

    if (isNaN(r) || !isFinite(r)) return null;
    const chiSq = (total - 1) * r * r;
    return { chiSq, p: chiSquarePValue(chiSq, 1) };
}

// ═══════════════════════════════════════════════════════
// INTERPRETATION HELPERS
// ═══════════════════════════════════════════════════════

export function interpretCramersV(v: number): string {
    if (v < 0.1) return 'Rất yếu (negligible)';
    if (v < 0.3) return 'Yếu (weak)';
    if (v < 0.5) return 'Trung bình (moderate)';
    return 'Mạnh (strong)';
}

export function interpretOR(or: number, ci: [number, number]): string {
    if (ci[0] <= 1 && ci[1] >= 1) {
        return `OR = ${or.toFixed(2)} — KTC 95% chứa 1 → Không có ý nghĩa thống kê.`;
    }
    if (or > 1) {
        return `OR = ${or.toFixed(2)} > 1 — Nhóm phơi nhiễm có nguy cơ cao hơn ${or.toFixed(1)} lần.`;
    }
    return `OR = ${or.toFixed(2)} < 1 — Nhóm phơi nhiễm có nguy cơ thấp hơn (yếu tố bảo vệ).`;
}

export function interpretChiSquare(p: number, df: number): string {
    if (p < 0.001) return `p < 0.001 — Có sự khác biệt rất có ý nghĩa thống kê (df = ${df}).`;
    if (p < 0.01) return `p = ${p.toFixed(3)} — Có sự khác biệt có ý nghĩa thống kê cao (df = ${df}).`;
    if (p < 0.05) return `p = ${p.toFixed(3)} — Có sự khác biệt có ý nghĩa thống kê (df = ${df}).`;
    if (p < 0.1) return `p = ${p.toFixed(3)} — Xu hướng khác biệt, nhưng chưa đạt ý nghĩa thống kê (df = ${df}).`;
    return `p = ${p.toFixed(3)} — Không có sự khác biệt có ý nghĩa thống kê (df = ${df}).`;
}
