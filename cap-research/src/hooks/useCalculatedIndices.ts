import { useMemo } from 'react';

interface CalculatedIndicesInput {
    neutrophil?: number | null;
    lymphocyte?: number | null;
    plt?: number | null;
    crp?: number | null;
    albumin?: number | null;
}

interface CalculatedIndicesOutput {
    nlr: number | null;
    plr: number | null;
    car: number | null;
}

export function useCalculatedIndices(input: CalculatedIndicesInput): CalculatedIndicesOutput {
    return useMemo(() => {
        const { neutrophil, lymphocyte, plt, crp, albumin } = input;

        const nlr =
            neutrophil != null && lymphocyte != null && lymphocyte !== 0
                ? Math.round((neutrophil / lymphocyte) * 100) / 100
                : null;

        const plr =
            plt != null && lymphocyte != null && lymphocyte !== 0
                ? Math.round((plt / lymphocyte) * 100) / 100
                : null;

        const car =
            crp != null && albumin != null && albumin !== 0
                ? Math.round((crp / albumin) * 100) / 100
                : null;

        return { nlr, plr, car };
    }, [input.neutrophil, input.lymphocyte, input.plt, input.crp, input.albumin]);
}
