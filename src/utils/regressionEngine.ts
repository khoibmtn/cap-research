/**
 * regressionEngine.ts
 * Core regression algorithms for clinical research analytics.
 * Outputs SPSS-equivalent statistics.
 */

import { chiSquarePValue } from './statisticalTests';

// ═══════════════════════════════════════════════════════════
// SHARED MATH UTILITIES
// ═══════════════════════════════════════════════════════════

/** Two-tailed p-value from t-distribution */
function tDistP(t: number, df: number): number {
    if (df <= 0) return 1;
    const x = df / (df + t * t);
    return betaReg(x, df / 2, 0.5);
}

/** Regularized incomplete beta via continued fraction (Lentz) */
function betaReg(x: number, a: number, b: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const lnB = lgamma(a) + lgamma(b) - lgamma(a + b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnB);
    if (x < (a + 1) / (a + b + 2)) return front * betaCF(x, a, b) / a;
    return 1 - front * betaCF(1 - x, b, a) / b;
}

function betaCF(x: number, a: number, b: number): number {
    const eps = 3e-12, fpmin = 1e-30;
    let qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < fpmin) d = fpmin;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 200; m++) {
        const m2 = 2 * m;
        let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        d = 1 + aa * d; if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c; if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d; h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1 + aa * d; if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c; if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        const del = d * c; h *= del;
        if (Math.abs(del - 1) < eps) break;
    }
    return h;
}

function lgamma(z: number): number {
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    z -= 1;
    let x = c[0];
    for (let i = 1; i < 9; i++) x += c[i] / (z + i);
    const t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Normal CDF */
function normalCDF(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x) / Math.SQRT2;
    const t = 1 / (1 + p * ax);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
    return 0.5 * (1 + sign * y);
}

/** z critical value for two-tailed alpha */
function zCritical(alpha: number): number {
    // Newton's method to find z such that P(Z > z) = alpha/2
    const target = 1 - alpha / 2;
    let z = 1.96; // initial guess
    for (let i = 0; i < 50; i++) {
        const cdf = normalCDF(z);
        const pdf = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
        if (pdf < 1e-15) break;
        z -= (cdf - target) / pdf;
    }
    return z;
}

// ═══════════════════════════════════════════════════════════
// MATRIX UTILITIES (for small matrices, no external deps)
// ═══════════════════════════════════════════════════════════

type Matrix = number[][];

function matMul(A: Matrix, B: Matrix): Matrix {
    const m = A.length, k = B.length, n = B[0].length;
    const C: Matrix = Array.from({ length: m }, () => new Array(n).fill(0));
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            for (let l = 0; l < k; l++)
                C[i][j] += A[i][l] * B[l][j];
    return C;
}

function matTranspose(A: Matrix): Matrix {
    const m = A.length, n = A[0].length;
    const T: Matrix = Array.from({ length: n }, () => new Array(m).fill(0));
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            T[j][i] = A[i][j];
    return T;
}

/** Invert matrix via Gauss-Jordan elimination */
function matInverse(A: Matrix): Matrix | null {
    const n = A.length;
    const aug: Matrix = A.map((row, i) => {
        const r = [...row];
        for (let j = 0; j < n; j++) r.push(i === j ? 1 : 0);
        return r;
    });
    for (let col = 0; col < n; col++) {
        let maxRow = col, maxVal = Math.abs(aug[col][col]);
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(aug[row][col]) > maxVal) {
                maxVal = Math.abs(aug[row][col]);
                maxRow = row;
            }
        }
        if (maxVal < 1e-12) return null; // singular
        [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
        const pivot = aug[col][col];
        for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
        for (let row = 0; row < n; row++) {
            if (row === col) continue;
            const factor = aug[row][col];
            for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
        }
    }
    return aug.map(row => row.slice(n));
}

function vecToColMat(v: number[]): Matrix { return v.map(x => [x]); }
function colMatToVec(M: Matrix): number[] { return M.map(r => r[0]); }

// ═══════════════════════════════════════════════════════════
// LINEAR REGRESSION (OLS)
// ═══════════════════════════════════════════════════════════

export interface LinearCoeff {
    name: string;
    B: number;
    SE: number;
    beta: number; // standardized
    t: number;
    pValue: number;
    ciLow: number;
    ciHigh: number;
    tolerance?: number;
    vif?: number;
}

export interface LinearRegressionResult {
    type: 'linear';
    n: number;
    R: number;
    R2: number;
    adjR2: number;
    stdError: number;
    // ANOVA
    anova: {
        ssReg: number; dfReg: number; msReg: number;
        ssRes: number; dfRes: number; msRes: number;
        ssTotal: number; dfTotal: number;
        F: number; pValue: number;
    };
    coefficients: LinearCoeff[];
    // For scatter plot CI band (univariate only)
    predictionBand?: { x: number; yHat: number; ciLow: number; ciHigh: number }[];
    durbinWatson: number;
}

export function runLinearRegression(
    xMatrix: number[][], // n × p (raw, no intercept col)
    yVec: number[],
    varNames: string[],
): LinearRegressionResult | { error: string } {
    const n = xMatrix.length;
    const p = xMatrix[0]?.length ?? 0;
    if (n < p + 2) return { error: `Cần ít nhất ${p + 2} quan sát (hiện có ${n})` };

    // Add intercept column
    const X: Matrix = xMatrix.map(row => [1, ...row]);
    const k = p + 1; // number of params including intercept
    const Y = vecToColMat(yVec);

    const Xt = matTranspose(X);
    const XtX = matMul(Xt, X);
    const XtXinv = matInverse(XtX);
    if (!XtXinv) return { error: 'Ma trận X\'X không khả nghịch — kiểm tra biến có bị cộng tuyến hoàn toàn?' };

    const XtY = matMul(Xt, Y);
    const betaVec = colMatToVec(matMul(XtXinv, XtY));

    // Predictions and residuals
    const yHat = X.map(row => row.reduce((s, x, j) => s + x * betaVec[j], 0));
    const residuals = yVec.map((y, i) => y - yHat[i]);
    const yMean = yVec.reduce((a, b) => a + b, 0) / n;

    const ssTotal = yVec.reduce((s, y) => s + (y - yMean) ** 2, 0);
    const ssRes = residuals.reduce((s, r) => s + r * r, 0);
    const ssReg = ssTotal - ssRes;

    const dfReg = p;
    const dfRes = n - k;
    const dfTotal = n - 1;

    if (dfRes <= 0) return { error: 'Không đủ bậc tự do (quá nhiều biến so với mẫu)' };

    const msReg = ssReg / dfReg;
    const msRes = ssRes / dfRes;
    const F = msRes === 0 ? Infinity : msReg / msRes;
    const fPValue = 1 - gammaCDFInternal(F * dfReg / (F * dfReg + dfRes) < 1 ? F : F, dfReg, dfRes);

    const R2 = ssTotal === 0 ? 0 : 1 - ssRes / ssTotal;
    const adjR2 = 1 - (1 - R2) * dfTotal / dfRes;
    const R = Math.sqrt(Math.max(0, R2));
    const stdError = Math.sqrt(msRes);

    // Durbin-Watson
    let dwNum = 0;
    for (let i = 1; i < n; i++) dwNum += (residuals[i] - residuals[i - 1]) ** 2;
    const durbinWatson = ssRes === 0 ? 2 : dwNum / ssRes;

    // Standard deviations of X columns (for standardized beta)
    const sdY = Math.sqrt(ssTotal / dfTotal);
    const sdX: number[] = [];
    for (let j = 0; j < p; j++) {
        const col = xMatrix.map(r => r[j]);
        const m = col.reduce((a, b) => a + b, 0) / n;
        sdX.push(Math.sqrt(col.reduce((s, v) => s + (v - m) ** 2, 0) / (n - 1)));
    }

    // VIF (for multivariate)
    const vifs: number[] = [];
    const tolerances: number[] = [];
    if (p > 1) {
        for (let j = 0; j < p; j++) {
            const yj = xMatrix.map(r => r[j]);
            const xj = xMatrix.map(r => r.filter((_, idx) => idx !== j));
            const subResult = runLinearRegressionRaw(xj, yj);
            if (subResult) {
                const tol = Math.max(1e-10, 1 - subResult.R2);
                tolerances.push(tol);
                vifs.push(1 / tol);
            } else {
                tolerances.push(0);
                vifs.push(Infinity);
            }
        }
    }

    const z = zCritical(0.05);

    const coefficients: LinearCoeff[] = [
        { name: '(Hằng số)', B: betaVec[0], SE: Math.sqrt(XtXinv[0][0] * msRes), beta: 0, t: 0, pValue: 0, ciLow: 0, ciHigh: 0 },
    ];
    // Fill intercept stats
    const c0 = coefficients[0];
    c0.t = c0.SE === 0 ? Infinity : c0.B / c0.SE;
    c0.pValue = tDistP(Math.abs(c0.t), dfRes);
    c0.ciLow = c0.B - z * c0.SE;
    c0.ciHigh = c0.B + z * c0.SE;

    for (let j = 0; j < p; j++) {
        const B = betaVec[j + 1];
        const SE = Math.sqrt(XtXinv[j + 1][j + 1] * msRes);
        const t = SE === 0 ? Infinity : B / SE;
        const pValue = tDistP(Math.abs(t), dfRes);
        const beta = sdY === 0 ? 0 : B * (sdX[j] / sdY);
        coefficients.push({
            name: varNames[j],
            B, SE, beta, t, pValue,
            ciLow: B - z * SE,
            ciHigh: B + z * SE,
            tolerance: p > 1 ? tolerances[j] : undefined,
            vif: p > 1 ? vifs[j] : undefined,
        });
    }

    // Prediction band for univariate scatter plot
    let predictionBand: LinearRegressionResult['predictionBand'];
    if (p === 1) {
        const xCol = xMatrix.map(r => r[0]);
        const xMin = Math.min(...xCol);
        const xMax = Math.max(...xCol);
        const xMeanVal = xCol.reduce((a, b) => a + b, 0) / n;
        const sxx = xCol.reduce((s, x) => s + (x - xMeanVal) ** 2, 0);
        const tCrit = zCritical(0.05); // approx for large n; exact would need t-table

        const steps = 50;
        predictionBand = [];
        for (let i = 0; i <= steps; i++) {
            const x = xMin + (xMax - xMin) * i / steps;
            const yH = betaVec[0] + betaVec[1] * x;
            const se = stdError * Math.sqrt(1 / n + (x - xMeanVal) ** 2 / sxx);
            predictionBand.push({
                x, yHat: yH,
                ciLow: yH - tCrit * se,
                ciHigh: yH + tCrit * se,
            });
        }
    }

    return {
        type: 'linear', n, R, R2, adjR2, stdError,
        anova: { ssReg, dfReg, msReg, ssRes, dfRes, msRes, ssTotal, dfTotal, F, pValue: fPValue },
        coefficients, predictionBand, durbinWatson,
    };
}

/** Lightweight OLS for VIF calculation only */
function runLinearRegressionRaw(xMatrix: number[][], yVec: number[]): { R2: number } | null {
    const n = xMatrix.length;
    const p = xMatrix[0]?.length ?? 0;
    if (n < p + 2) return null;
    const X: Matrix = xMatrix.map(row => [1, ...row]);
    const Xt = matTranspose(X);
    const XtXinv = matInverse(matMul(Xt, X));
    if (!XtXinv) return null;
    const XtY = matMul(Xt, vecToColMat(yVec));
    const beta = colMatToVec(matMul(XtXinv, XtY));
    const yMean = yVec.reduce((a, b) => a + b, 0) / n;
    const ssTotal = yVec.reduce((s, y) => s + (y - yMean) ** 2, 0);
    const ssRes = yVec.reduce((s, y, i) => {
        const pred = X[i].reduce((ss, x, j) => ss + x * beta[j], 0);
        return s + (y - pred) ** 2;
    }, 0);
    return { R2: ssTotal === 0 ? 0 : 1 - ssRes / ssTotal };
}

/** F-distribution p-value via incomplete beta */
function gammaCDFInternal(F: number, df1: number, df2: number): number {
    if (F <= 0) return 0;
    const x = df1 * F / (df1 * F + df2);
    return 1 - betaReg(x, df1 / 2, df2 / 2);
}

// ═══════════════════════════════════════════════════════════
// LOGISTIC REGRESSION (Newton-Raphson / IRLS)
// ═══════════════════════════════════════════════════════════

export interface LogisticCoeff {
    name: string;
    B: number;
    SE: number;
    wald: number;
    df: number;
    pValue: number;
    expB: number;   // OR = exp(B)
    ciLow: number;  // 95% CI lower for exp(B)
    ciHigh: number; // 95% CI upper for exp(B)
}

export interface LogisticRegressionResult {
    type: 'logistic';
    n: number;
    nEvents: number;
    converged: boolean;
    iterations: number;
    // Omnibus test (model χ²)
    omnibus: { chiSq: number; df: number; pValue: number };
    // Model summary
    neg2LL: number;
    coxSnellR2: number;
    nagelkerkeR2: number;
    // Hosmer-Lemeshow
    hosmerLemeshow: { chiSq: number; df: number; pValue: number };
    // Coefficients
    coefficients: LogisticCoeff[];
    // Classification table
    classification: {
        truePos: number; trueNeg: number;
        falsePos: number; falseNeg: number;
        overallPct: number;
        sensitivity: number;
        specificity: number;
    };
}

function sigmoid(z: number): number {
    if (z > 500) return 1;
    if (z < -500) return 0;
    return 1 / (1 + Math.exp(-z));
}

export function runLogisticRegression(
    xMatrix: number[][], // n × p (raw, no intercept)
    yVec: number[],       // 0/1
    varNames: string[],
): LogisticRegressionResult | { error: string } {
    const n = xMatrix.length;
    const p = xMatrix[0]?.length ?? 0;
    if (n < (p + 1) * 5) return { error: `Logistic regression cần ít nhất ${(p + 1) * 5} quan sát (hiện có ${n}). Quy tắc: ≥5-10 events per variable.` };

    const nEvents = yVec.filter(y => y === 1).length;
    if (nEvents === 0 || nEvents === n) return { error: 'Biến phụ thuộc phải có cả 2 giá trị (0 và 1)' };

    // Add intercept
    const X: Matrix = xMatrix.map(row => [1, ...row]);
    const k = p + 1;

    // Initial null model -2LL
    const p0 = nEvents / n;
    const null2LL = -2 * (nEvents * Math.log(p0) + (n - nEvents) * Math.log(1 - p0));

    // Newton-Raphson
    let beta = new Array(k).fill(0);
    beta[0] = Math.log(p0 / (1 - p0)); // intercept init
    let converged = false;
    let iter = 0;
    const maxIter = 25;

    for (iter = 0; iter < maxIter; iter++) {
        // Predicted probabilities
        const pHat = X.map(row => sigmoid(row.reduce((s, x, j) => s + x * beta[j], 0)));

        // Gradient: X' (y - pHat)
        const gradient = new Array(k).fill(0);
        for (let i = 0; i < n; i++) {
            const diff = yVec[i] - pHat[i];
            for (let j = 0; j < k; j++) gradient[j] += X[i][j] * diff;
        }

        // Hessian: -X' W X, where W = diag(pHat * (1-pHat))
        const H: Matrix = Array.from({ length: k }, () => new Array(k).fill(0));
        for (let i = 0; i < n; i++) {
            const w = pHat[i] * (1 - pHat[i]);
            for (let j = 0; j < k; j++)
                for (let l = j; l < k; l++) {
                    const v = -X[i][j] * X[i][l] * w;
                    H[j][l] += v;
                    if (l !== j) H[l][j] += v;
                }
        }

        // Negative Hessian inverse
        const negH = H.map(row => row.map(v => -v));
        const negHinv = matInverse(negH);
        if (!negHinv) return { error: 'Hessian không khả nghịch — mô hình không hội tụ' };

        // Update: beta += (-H)^(-1) * gradient
        const delta = colMatToVec(matMul(negHinv, vecToColMat(gradient)));
        let maxDelta = 0;
        for (let j = 0; j < k; j++) {
            beta[j] += delta[j];
            maxDelta = Math.max(maxDelta, Math.abs(delta[j]));
        }

        if (maxDelta < 1e-8) { converged = true; break; }
    }

    // Final predictions
    const pFinal = X.map(row => sigmoid(row.reduce((s, x, j) => s + x * beta[j], 0)));

    // -2 Log Likelihood (model)
    let logLik = 0;
    for (let i = 0; i < n; i++) {
        const pi = Math.max(1e-15, Math.min(1 - 1e-15, pFinal[i]));
        logLik += yVec[i] * Math.log(pi) + (1 - yVec[i]) * Math.log(1 - pi);
    }
    const neg2LL = -2 * logLik;

    // Omnibus test (model chi-square)
    const modelChiSq = null2LL - neg2LL;
    const omnibusP = chiSquarePValue(modelChiSq, p);

    // Cox & Snell R², Nagelkerke R²
    const coxSnellR2 = 1 - Math.exp(-(modelChiSq) / n);
    const maxCoxSnell = 1 - Math.exp(null2LL / n);
    const nagelkerkeR2 = maxCoxSnell === 0 ? 0 : coxSnellR2 / maxCoxSnell;

    // Standard errors from final Hessian
    const W: Matrix = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let i = 0; i < n; i++) {
        const w = pFinal[i] * (1 - pFinal[i]);
        for (let j = 0; j < k; j++)
            for (let l = j; l < k; l++) {
                const v = X[i][j] * X[i][l] * w;
                W[j][l] += v;
                if (l !== j) W[l][j] += v;
            }
    }
    const covMatrix = matInverse(W);
    if (!covMatrix) return { error: 'Không thể tính sai số chuẩn — ma trận thông tin Fisher suy biến' };

    const z95 = zCritical(0.05);
    const coefficients: LogisticCoeff[] = [];
    const names = ['(Hằng số)', ...varNames];
    for (let j = 0; j < k; j++) {
        const B = beta[j];
        const SE = Math.sqrt(Math.max(0, covMatrix[j][j]));
        const wald = SE === 0 ? Infinity : (B / SE) ** 2;
        const pValue = chiSquarePValue(wald, 1);
        const expB = Math.exp(B);
        coefficients.push({
            name: names[j], B, SE, wald, df: 1, pValue, expB,
            ciLow: Math.exp(B - z95 * SE),
            ciHigh: Math.exp(B + z95 * SE),
        });
    }

    // Classification table (cutoff = 0.5)
    let tp = 0, tn = 0, fp = 0, fn = 0;
    for (let i = 0; i < n; i++) {
        const pred = pFinal[i] >= 0.5 ? 1 : 0;
        if (yVec[i] === 1 && pred === 1) tp++;
        else if (yVec[i] === 0 && pred === 0) tn++;
        else if (yVec[i] === 0 && pred === 1) fp++;
        else fn++;
    }

    // Hosmer-Lemeshow test (10 groups)
    const hlGroups = 10;
    const indexed = pFinal.map((pi, i) => ({ pi, y: yVec[i] })).sort((a, b) => a.pi - b.pi);
    let hlChiSq = 0;
    const groupSize = Math.floor(n / hlGroups);
    for (let g = 0; g < hlGroups; g++) {
        const start = g * groupSize;
        const end = g === hlGroups - 1 ? n : start + groupSize;
        const group = indexed.slice(start, end);
        const ng = group.length;
        if (ng === 0) continue;
        const obs1 = group.filter(d => d.y === 1).length;
        const exp1 = group.reduce((s, d) => s + d.pi, 0);
        const obs0 = ng - obs1;
        const exp0 = ng - exp1;
        if (exp1 > 0) hlChiSq += (obs1 - exp1) ** 2 / exp1;
        if (exp0 > 0) hlChiSq += (obs0 - exp0) ** 2 / exp0;
    }
    const hlDf = hlGroups - 2;
    const hlP = chiSquarePValue(hlChiSq, hlDf);

    return {
        type: 'logistic', n, nEvents, converged, iterations: iter + 1,
        omnibus: { chiSq: modelChiSq, df: p, pValue: omnibusP },
        neg2LL, coxSnellR2, nagelkerkeR2,
        hosmerLemeshow: { chiSq: hlChiSq, df: hlDf, pValue: hlP },
        coefficients,
        classification: {
            truePos: tp, trueNeg: tn, falsePos: fp, falseNeg: fn,
            overallPct: n === 0 ? 0 : ((tp + tn) / n) * 100,
            sensitivity: (tp + fn) === 0 ? 0 : tp / (tp + fn) * 100,
            specificity: (tn + fp) === 0 ? 0 : tn / (tn + fp) * 100,
        },
    };
}

// ═══════════════════════════════════════════════════════════
// FORMAT HELPERS
// ═══════════════════════════════════════════════════════════

export function formatP(p: number): string {
    if (p < 0.001) return '<0.001';
    if (p < 0.01) return p.toFixed(3);
    return p.toFixed(3);
}

export function formatNum(v: number, dec = 3): string {
    if (!isFinite(v)) return '—';
    return v.toFixed(dec);
}
