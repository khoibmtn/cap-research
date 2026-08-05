/**
 * savWriter.ts — SPSS System File (.sav) binary writer
 *
 * Implements SPSS System File Format Level 2 (uncompressed).
 * Reference: GNU PSPP System File Format documentation.
 *
 * File structure:
 *   1. File Header Record (rec_type=2, 176 bytes)
 *   2. Variable Records (rec_type=2, 32 bytes each + label + value_label_set)
 *   3. Value Label Records (rec_type=3) + Variable Index Records (rec_type=4)
 *   4. Machine Integer Info (rec_type=7 subtype=3)
 *   5. Machine Float Info (rec_type=7 subtype=4)
 *   6. Variable Display Param (rec_type=7 subtype=11)
 *   7. Long Variable Names (rec_type=7 subtype=13)
 *   8. Character Encoding (rec_type=7 subtype=20) — UTF-8
 *   9. End of Dictionary (rec_type=999)
 *   10. Data Records (row-major)
 */

import type { SpssVarDef } from '../types/spssTypes';

// ─── Constants ───────────────────────────────────────────────────────────────

/** SPSS SYSMIS = -1.7976931348623157e+308 (0xFF_EF_FF_FF_FF_FF_FF_FF in LE) */
const SYSMIS_HEX = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xef, 0xff]);

// ─── Buffer helper ───────────────────────────────────────────────────────────

class SavBuffer {
    private chunks: Uint8Array[] = [];
    private _length = 0;

    /** Write a raw Uint8Array */
    writeBytes(b: Uint8Array) {
        this.chunks.push(b);
        this._length += b.length;
    }

    /** Write a 4-byte little-endian int32 */
    writeI32(n: number) {
        const b = new Uint8Array(4);
        new DataView(b.buffer).setInt32(0, n, true);
        this.writeBytes(b);
    }

    /** Write a 8-byte little-endian float64 */
    writeF64(n: number) {
        const b = new Uint8Array(8);
        new DataView(b.buffer).setFloat64(0, n, true);
        this.writeBytes(b);
    }

    /** Write SPSS system-missing (8 bytes) */
    writeSysmis() {
        this.writeBytes(SYSMIS_HEX.slice());
    }

    /**
     * Write a padded ASCII/latin string of exactly `len` bytes.
     * Truncates if too long, pads with spaces if too short.
     */
    writeStr(s: string, len: number) {
        const encoder = new TextEncoder();
        const raw = encoder.encode(s);
        const b = new Uint8Array(len).fill(0x20); // pad with spaces
        b.set(raw.subarray(0, len));
        this.writeBytes(b);
    }

    /** Write a string padded to the nearest multiple of 4 bytes */
    writeStrPad4(s: string) {
        const encoder = new TextEncoder();
        const raw = encoder.encode(s);
        const padded = Math.ceil(raw.length / 4) * 4 || 4;
        const b = new Uint8Array(padded).fill(0x20);
        b.set(raw.subarray(0, padded));
        this.writeBytes(b);
    }

    /** Finalize: concatenate all chunks into a single Uint8Array */
    toUint8Array(): Uint8Array {
        const result = new Uint8Array(this._length);
        let offset = 0;
        for (const chunk of this.chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        return result;
    }

    get length() { return this._length; }
}

// ─── Variable expansion from templates ──────────────────────────────────────

/**
 * Represents a fully-expanded SPSS variable (ready to write).
 * For string vars, `octWidth` is the padded byte width (multiple of 8).
 */
interface ExpandedVar {
    name: string;            // Short SPSS name (max 8 chars), used for data dict
    longName: string;        // Long name (max 64 chars) written in extension 13
    label: string;           // Variable label (256 chars max)
    type: 'numeric' | 'string';
    octWidth: number;        // Byte width — 0 for numeric, multiple of 8 for string
    decimals: number;        // Decimal places (0 for integer/nominal)
    measureLevel: number;    // 1=nominal, 2=ordinal, 3=scale
    valueLabelGroupId?: number; // Reference into valueLabelGroups array
}

interface ValueLabelGroup {
    labels: Record<number, string>; // numeric code -> display label
    varIndices: number[];           // 1-based variable indices (after expansion)
}

/** Convert measure level string to SPSS integer code */
function measureCode(level?: string): number {
    if (level === 'ordinal') return 2;
    if (level === 'scale') return 3;
    return 1; // nominal (default)
}

/**
 * Expand slot template vars into concrete vars.
 * Templates contain `{n}` (slot 1..N) and `{k}` (antibiotic 1..K) placeholders.
 */
function expandVars(
    templateVars: SpssVarDef[],
    slots: { xquang: number; ct: number; viKhuan: number; khangSinhPerVK: number; thuoc: number }
): SpssVarDef[] {
    const result: SpssVarDef[] = [];

    for (const v of templateVars) {
        if (!v.isSlotTemplate) {
            result.push(v);
            continue;
        }

        const nameHasK = v.name.includes('{k}');
        const nameHasN = v.name.includes('{n}');

        if (!nameHasN) {
            // Not a slot template despite flag — include as-is
            result.push(v);
            continue;
        }

        // Determine slot count
        let slotCount = 1;
        const namePfx = v.name.split('{n}')[0];
        if (namePfx.startsWith('xq')) slotCount = slots.xquang;
        else if (namePfx.startsWith('ct')) slotCount = slots.ct;
        else if (namePfx.startsWith('vk') && !nameHasK) slotCount = slots.viKhuan;
        else if (namePfx.startsWith('vk') && nameHasK) slotCount = slots.viKhuan; // outer loop
        else if (namePfx.startsWith('thuoc')) slotCount = slots.thuoc;

        for (let n = 1; n <= slotCount; n++) {
            if (nameHasK) {
                // Inner loop for kháng sinh
                for (let k = 1; k <= slots.khangSinhPerVK; k++) {
                    result.push({
                        ...v,
                        name: v.name.replace('{n}', String(n)).replace('{k}', String(k)),
                        label: v.label.replace('[{n}]', `[${n}]`).replace('[{k}]', `[${k}]`),
                        isSlotTemplate: false,
                    });
                }
            } else {
                result.push({
                    ...v,
                    name: v.name.replace('{n}', String(n)),
                    label: v.label.replace('[{n}]', `[${n}]`).replace('{n}', String(n)),
                    isSlotTemplate: false,
                });
            }
        }
    }

    return result;
}

/**
 * Make a short SPSS name (max 8 chars) from a long name.
 * Truncates and deduplicates with a counter suffix if needed.
 */
function makeShortName(longName: string, usedNames: Set<string>): string {
    const upper = longName.toUpperCase().replace(/[^A-Z0-9_@#$]/g, '_');
    let candidate = upper.substring(0, 8);
    if (!usedNames.has(candidate)) {
        usedNames.add(candidate);
        return candidate;
    }
    // Try with suffix
    for (let i = 1; i <= 999; i++) {
        const suffix = String(i);
        const trimmed = upper.substring(0, 8 - suffix.length) + suffix;
        if (!usedNames.has(trimmed)) {
            usedNames.add(trimmed);
            return trimmed;
        }
    }
    throw new Error(`Cannot create unique short name for: ${longName}`);
}

// ─── Record writers ──────────────────────────────────────────────────────────

function writeFileHeader(buf: SavBuffer, varCount: number, caseCount: number, fileLabel: string) {
    // rec_type = '$FL2' — old-style, uncompressed
    buf.writeStr('$FL2', 4);
    // prod_name (60 bytes) — software identifier
    buf.writeStr('@(#) SPSS DATA FILE CAP Research v1.0', 60);
    // layout_code = 2 (little-endian)
    buf.writeI32(2);
    // nominal_case_size = number of 8-byte "slots" per case (= varCount for numeric-only approx)
    buf.writeI32(varCount); // will be updated properly after expansion
    // compression = 0 (uncompressed)
    buf.writeI32(0);
    // weight_index = 0 (no weighting)
    buf.writeI32(0);
    // ncases = number of cases (rows); use actual count
    buf.writeI32(caseCount);
    // bias = 100.0 (not used in uncompressed, but required)
    buf.writeF64(100.0);
    // creation_date (9 bytes) "DD MMM YY"
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${String(now.getFullYear()).slice(-2)}`;
    buf.writeStr(dateStr, 9);
    // creation_time (8 bytes) "HH:MM:SS"
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    buf.writeStr(timeStr, 8);
    // file_label (64 bytes)
    buf.writeStr(fileLabel.substring(0, 64), 64);
    // padding (3 bytes)
    buf.writeStr('\x00\x00\x00', 3);
}

function writeVariableRecord(buf: SavBuffer, ev: ExpandedVar) {
    // rec_type = 2
    buf.writeI32(2);
    // type: 0 = numeric, positive = string byte width
    buf.writeI32(ev.type === 'numeric' ? 0 : ev.octWidth);
    // has_var_label: 1 if label present
    const hasLabel = ev.label.length > 0 ? 1 : 0;
    buf.writeI32(hasLabel);
    // n_missing_values = 0 (no user-defined missing)
    buf.writeI32(0);
    // print & write format descriptors (4 bytes each):
    // format = (type << 16) | (width << 8) | decimals
    // Type codes: 5=F (numeric), 1=A (string)
    let printFormat: number;
    let writeFormat: number;
    if (ev.type === 'numeric') {
        const w = Math.min(ev.decimals > 0 ? 12 : 8, 40);
        printFormat = (5 << 16) | (w << 8) | ev.decimals;
        writeFormat = printFormat;
    } else {
        const w = Math.min(ev.octWidth, 255);
        printFormat = (1 << 16) | (w << 8) | 0;
        writeFormat = printFormat;
    }
    buf.writeI32(printFormat);
    buf.writeI32(writeFormat);
    // short name (8 bytes, space-padded, uppercase)
    buf.writeStr(ev.name.padEnd(8, ' ').toUpperCase().substring(0, 8), 8);
    // var_label (if hasLabel): 4-byte length + padded content
    if (hasLabel) {
        const encoder = new TextEncoder();
        const labelBytes = encoder.encode(ev.label.substring(0, 255));
        buf.writeI32(labelBytes.length);
        // Pad label to multiple of 4 bytes
        const padded = Math.ceil(labelBytes.length / 4) * 4;
        const b = new Uint8Array(padded).fill(0x20);
        b.set(labelBytes);
        buf.writeBytes(b);
    }
    // missing values: none written (n_missing_values = 0)
    // For string vars wider than 8 bytes, write continuation records:
    if (ev.type === 'string' && ev.octWidth > 8) {
        const continuations = Math.floor(ev.octWidth / 8) - 1;
        for (let i = 0; i < continuations; i++) {
            buf.writeI32(2);      // rec_type = 2
            buf.writeI32(-1);     // type = -1 signals continuation
            buf.writeI32(0);      // has_var_label
            buf.writeI32(0);      // n_missing_values
            buf.writeI32(printFormat);
            buf.writeI32(writeFormat);
            buf.writeStr('        ', 8); // 8 spaces for name
        }
    }
}

/** Write value label record (rec_type=3) + variable index record (rec_type=4) */
function writeValueLabelRecord(buf: SavBuffer, group: ValueLabelGroup) {
    // rec_type = 3
    buf.writeI32(3);
    // n_labels
    const entries = Object.entries(group.labels);
    buf.writeI32(entries.length);

    for (const [codeStr, labelStr] of entries) {
        const code = parseFloat(codeStr);
        // value (8 bytes, double)
        buf.writeF64(code);
        // label_len (1 byte) + label string padded to next multiple of 8 (after the 1-byte len byte)
        const encoder = new TextEncoder();
        const labelBytes = encoder.encode(labelStr.substring(0, 60));
        const labelLen = labelBytes.length;
        // total = 1 (len byte) + labelLen, padded to multiple of 8
        const totalPad = Math.ceil((1 + labelLen) / 8) * 8;
        const b = new Uint8Array(totalPad).fill(0x20);
        b[0] = labelLen;
        b.set(labelBytes, 1);
        buf.writeBytes(b);
    }

    // rec_type = 4 (variable indices)
    buf.writeI32(4);
    buf.writeI32(group.varIndices.length);
    for (const idx of group.varIndices) {
        buf.writeI32(idx);
    }
}

/** Write Machine Integer Info Record (rec_type=7 subtype=3) */
function writeMachineIntegerInfo(buf: SavBuffer) {
    buf.writeI32(7);
    buf.writeI32(3); // subtype
    buf.writeI32(4); // size (4 bytes per element)
    buf.writeI32(8); // count (8 elements)
    buf.writeI32(1); // version_major
    buf.writeI32(0); // version_minor
    buf.writeI32(0); // version_revision
    buf.writeI32(-1); // machine_code
    buf.writeI32(1); // floating_point_rep (1=IEEE 754)
    buf.writeI32(0); // compression_code
    buf.writeI32(1); // endianness (1=little)
    buf.writeI32(65001); // character_code (65001 = UTF-8 for Vietnamese support)
}

/** Write Machine Float Info Record (rec_type=7 subtype=4) */
function writeMachineFloatInfo(buf: SavBuffer) {
    buf.writeI32(7);
    buf.writeI32(4);
    buf.writeI32(8); // size (8 bytes per element)
    buf.writeI32(3); // count
    // SYSMIS, HIGHEST, LOWEST
    buf.writeBytes(SYSMIS_HEX.slice());
    buf.writeF64(Number.MAX_VALUE);
    buf.writeF64(-Number.MAX_VALUE);
}

/** Write Variable Display Attribute Record (rec_type=7 subtype=11) */
function writeVarDisplayParams(buf: SavBuffer, vars: ExpandedVar[]) {
    buf.writeI32(7);
    buf.writeI32(11);
    buf.writeI32(4); // element size
    buf.writeI32(vars.length * 3); // 3 ints per var: measure, width, alignment
    for (const v of vars) {
        buf.writeI32(v.measureLevel); // 1=nominal, 2=ordinal, 3=scale
        buf.writeI32(v.type === 'numeric' ? 8 : Math.max(v.octWidth, 8)); // column width
        buf.writeI32(v.type === 'numeric' ? 1 : 0); // alignment: 0=left, 1=right
    }
}

/** Write Long Variable Names Record (rec_type=7 subtype=13) */
function writeLongVarNames(buf: SavBuffer, vars: ExpandedVar[]) {
    // Format: pairs of "shortName=longName" joined by '\t' (0x09)
    const encoder = new TextEncoder();
    const pairs = vars
        .filter(v => v.longName !== v.name)
        .map(v => `${v.name.toUpperCase()}=${v.longName}`)
        .join('\t');

    if (pairs.length === 0) return;

    const data = encoder.encode(pairs);
    buf.writeI32(7);
    buf.writeI32(13);
    buf.writeI32(1); // element size (1 byte each)
    buf.writeI32(data.length);
    buf.writeBytes(data);
}

/** Write Character Encoding Record (rec_type=7 subtype=20) — declares file encoding as UTF-8 */
function writeCharacterEncoding(buf: SavBuffer) {
    const encoder = new TextEncoder();
    const encoding = encoder.encode('UTF-8');
    buf.writeI32(7);
    buf.writeI32(20); // subtype 20 = character encoding
    buf.writeI32(1);  // element size (1 byte)
    buf.writeI32(encoding.length);
    buf.writeBytes(encoding);
}

/** Write End of Dictionary Record (rec_type=999) */
function writeEndOfDictionary(buf: SavBuffer) {
    buf.writeI32(999);
    buf.writeI32(0);
}

/** Write data rows (uncompressed) */
function writeData(
    buf: SavBuffer,
    vars: ExpandedVar[],
    rows: Record<string, number | string | null>[]
) {
    const encoder = new TextEncoder();

    for (const row of rows) {
        for (const v of vars) {
            const rawVal = row[v.longName] ?? null;

            if (v.type === 'numeric') {
                if (rawVal === null || rawVal === undefined || rawVal === '') {
                    buf.writeBytes(SYSMIS_HEX.slice());
                } else {
                    const n = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal));
                    if (isNaN(n)) {
                        buf.writeBytes(SYSMIS_HEX.slice());
                    } else {
                        buf.writeF64(n);
                    }
                }
            } else {
                // String: write exactly octWidth bytes
                const str = rawVal !== null && rawVal !== undefined ? String(rawVal) : '';
                const strBytes = encoder.encode(str);
                const b = new Uint8Array(v.octWidth).fill(0x20);
                b.set(strBytes.subarray(0, v.octWidth));
                buf.writeBytes(b);
            }
        }
    }
}

// ─── Main entry point ────────────────────────────────────────────────────────

export interface WriteSavOptions {
    fileLabel?: string;
    slots: { xquang: number; ct: number; viKhuan: number; khangSinhPerVK: number; thuoc: number };
}

/**
 * Generate a SPSS .sav file as a Uint8Array.
 *
 * @param templateVars  Ordered variable definitions (may include slot templates)
 * @param rows          Data rows — keys are the long variable names
 * @param options       File label, slot counts
 */
export function writeSAV(
    templateVars: SpssVarDef[],
    rows: Record<string, number | string | null>[],
    options: WriteSavOptions
): Uint8Array {
    const { fileLabel = 'CAP Research Export', slots } = options;

    // 1. Expand slot templates
    const expandedDefs = expandVars(templateVars, slots);

    // 2. Build ExpandedVar list with short names
    const usedShortNames = new Set<string>();
    const expandedVars: ExpandedVar[] = [];

    for (const def of expandedDefs) {
        const octWidth = def.type === 'string'
            ? Math.ceil((def.width ?? 64) / 8) * 8
            : 0;

        const ev: ExpandedVar = {
            name: makeShortName(def.name, usedShortNames),
            longName: def.name,
            label: (def.label ?? '').substring(0, 255),
            type: def.type,
            octWidth,
            decimals: def.decimals ?? (def.type === 'numeric' ? 2 : 0),
            measureLevel: measureCode(def.measureLevel),
        };
        expandedVars.push(ev);
    }

    // 3. Build value label groups — group by templateKey or by identity (longName)
    const labelGroupMap = new Map<string, ValueLabelGroup>();

    expandedDefs.forEach((def, i) => {
        if (!def.valueLabels || Object.keys(def.valueLabels).length === 0) return;

        const key = def.templateKey ?? def.name;
        const existing = labelGroupMap.get(key);

        // 1-based index in SPSS dict (string vars with octWidth > 8 have continuation records)
        // We need the actual 1-based position in the dictionary considering continuations
        // For simplicity, compute separately below
        if (existing) {
            existing.varIndices.push(i + 1); // placeholder, fixed below
        } else {
            labelGroupMap.set(key, {
                labels: def.valueLabels,
                varIndices: [i + 1],
            });
        }
    });

    // Fix 1-based dict indices accounting for continuation records
    // Each numeric var = 1 slot; string var = ceil(octWidth/8) slots
    const dictIndices: number[] = [];
    let dictPos = 1;
    for (const ev of expandedVars) {
        dictIndices.push(dictPos);
        const slots_used = ev.type === 'string' ? Math.ceil(ev.octWidth / 8) : 1;
        dictPos += slots_used;
    }
    const totalDictSlots = dictPos - 1;

    // Rebuild label groups with correct dict indices
    const correctedGroups: ValueLabelGroup[] = [];
    const seenGroupKeys = new Set<string>();

    expandedDefs.forEach((def, i) => {
        if (!def.valueLabels || Object.keys(def.valueLabels).length === 0) return;
        if (expandedVars[i].type !== 'numeric') return; // SPSS value labels only on numeric in rec_type=3

        const key = def.templateKey ?? def.name;
        if (seenGroupKeys.has(key)) {
            // Add this var's index to the existing group
            const group = correctedGroups.find(g => g === labelGroupMap.get(key));
            if (group) group.varIndices.push(dictIndices[i]);
            return;
        }
        seenGroupKeys.add(key);
        const group: ValueLabelGroup = {
            labels: def.valueLabels,
            varIndices: [dictIndices[i]],
        };
        labelGroupMap.set(key, group);
        correctedGroups.push(group);
    });

    // 4. Assemble the file
    const buf = new SavBuffer();

    // File header — use totalDictSlots as nominal_case_size
    writeFileHeader(buf, totalDictSlots, rows.length, fileLabel);

    // Variable records
    for (const ev of expandedVars) {
        writeVariableRecord(buf, ev);
    }

    // Value label records
    for (const group of correctedGroups) {
        if (group.varIndices.length > 0) {
            writeValueLabelRecord(buf, group);
        }
    }

    // Info records
    writeMachineIntegerInfo(buf);
    writeMachineFloatInfo(buf);
    writeVarDisplayParams(buf, expandedVars);
    writeLongVarNames(buf, expandedVars);
    writeCharacterEncoding(buf);
    writeEndOfDictionary(buf);

    // Data
    // Build a lookup from longName to ExpandedVar for fast access
    writeData(buf, expandedVars, rows);

    return buf.toUint8Array();
}

/** Trigger browser download of a Uint8Array as a .sav file */
export function downloadSAV(data: Uint8Array, filename: string) {
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/x-spss-sav' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
