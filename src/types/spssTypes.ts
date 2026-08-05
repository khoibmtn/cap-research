// ==================== SPSS EXPORT TYPES ====================

/**
 * Definition of a single SPSS variable (column in the .sav file).
 * All boolean/checkbox fields become numeric binary vars (0=Không, 1=Có).
 */
export interface SpssVarDef {
    /** SPSS variable name — max 64 chars (short 8-char name generated for header) */
    name: string;
    /** Human-readable label shown in SPSS variable view (tiếng Việt) */
    label: string;
    /** 'numeric' for numbers and coded categoricals; 'string' for free-text */
    type: 'numeric' | 'string';
    /** String byte width (default 64, must be multiple of 8) */
    width?: number;
    /** Decimal places for numeric variables (default 2, 0 for integer) */
    decimals?: number;
    /**
     * Value labels for categorical/binary variables.
     * Key is the stored numeric code, value is the display label.
     * Example: { 0: 'Không', 1: 'Có' } for boolean vars.
     */
    valueLabels?: Record<number, string>;
    /** SPSS measure level */
    measureLevel?: 'nominal' | 'ordinal' | 'scale';
    /**
     * For template-driven dynamic slots (e.g. xq[n]_vitri, ct[n]_ben):
     * Variables sharing the same templateKey share value labels in the SPSS file.
     */
    templateKey?: string;
    /**
     * Grouping tag for display in the Settings UI.
     * Not written to the .sav file.
     */
    group?: SpssVarGroup;
    /**
     * If true, this variable is a dynamic slot placeholder and its actual
     * SPSS name will be generated at export time (e.g. xq1_vitri, xq2_vitri...).
     */
    isSlotTemplate?: boolean;
}

export type SpssVarGroup =
    | 'hanh_chinh'
    | 'tien_su'
    | 'lam_sang'
    | 'xet_nghiem'
    | 'chi_so'
    | 'hinh_anh'
    | 'vi_khuan'
    | 'thuoc'
    | 'psi'
    | 'curb65'
    | 'ket_cuc';

export const SPSS_VAR_GROUP_LABELS: Record<SpssVarGroup, string> = {
    hanh_chinh: 'Hành chính',
    tien_su: 'Tiền sử',
    lam_sang: 'Lâm sàng',
    xet_nghiem: 'Xét nghiệm',
    chi_so: 'Chỉ số tính toán',
    hinh_anh: 'Hình ảnh (X-quang / CT)',
    vi_khuan: 'Vi khuẩn & Kháng sinh đồ',
    thuoc: 'Thuốc đã dùng',
    psi: 'PSI Score',
    curb65: 'CURB-65',
    ket_cuc: 'Kết cục',
};

/**
 * Configurable maximum number of dynamic slots per entity type.
 * User can adjust in Settings → SPSS Variables tab.
 * Changing slots will regenerate the variable list on next export.
 */
export interface SpssSlotConfig {
    /** Max X-quang injury records per patient (default: 5) */
    xquang: number;
    /** Max CT injury records per patient (default: 5) */
    ct: number;
    /** Max bacteria records per patient (default: 5) */
    viKhuan: number;
    /** Max antibiotic results per bacteria (default: 15) */
    khangSinhPerVK: number;
    /** Max prior medication records per patient (default: 10) */
    thuoc: number;
}

export const DEFAULT_SLOT_CONFIG: SpssSlotConfig = {
    xquang: 5,
    ct: 5,
    viKhuan: 5,
    khangSinhPerVK: 15,
    thuoc: 10,
};

/**
 * Full SPSS configuration stored in Firestore and localStorage.
 * Contains the ordered variable list + slot configuration.
 */
export interface SpssVarConfig {
    /**
     * Ordered list of SPSS variable definitions.
     * This is the user-editable list — name, label, valueLabels can be modified.
     * Dynamic slot vars (xq/ct/vk/thuoc) are stored as templates here and
     * expanded at export time based on slotConfig.
     */
    vars: SpssVarDef[];
    slotConfig: SpssSlotConfig;
    /** ISO timestamp of last user edit */
    lastModified?: string;
}

export interface SpssProfile {
    id: string;
    name: string;
    isDefault: boolean;
    config: SpssVarConfig;
    createdAt: string;
}
