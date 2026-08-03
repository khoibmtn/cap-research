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

