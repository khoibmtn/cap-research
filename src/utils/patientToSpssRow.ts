/**
 * patientToSpssRow.ts
 *
 * Converts a Patient record into a flat SPSS row:
 *   Record<longVarName, number | string | null>
 *
 * All keys correspond to SpssVarDef.name (the long SPSS variable name).
 * Slot templates are expanded with concrete indices (1-based).
 *
 * Conventions:
 *   - boolean fields  → 1 (Có) / 0 (Không), or null if undefined
 *   - null / undefined numeric fields → null (written as SYSMIS in SAV)
 *   - Date strings → kept as-is (string vars in SPSS)
 *   - "huyetAp" "120/80" → ls_ha_tam_thu=120, ls_ha_tam_truong=80
 */

import type { Patient } from '../types/patient';
import type { SpssSlotConfig } from '../types/spssTypes';

type SpssRow = Record<string, number | string | null>;

const b = (v: boolean | undefined | null): number | null =>
    v === true ? 1 : v === false ? 0 : null;

const n = (v: number | null | undefined): number | null =>
    v === null || v === undefined ? null : v;

const s = (v: string | null | undefined): string | null =>
    (v === null || v === undefined || v === '') ? null : v;

/** Parse "120/80" → { systolic: 120, diastolic: 80 } */
function parseBloodPressure(ha: string | null | undefined): { tt: number | null; tr: number | null } {
    if (!ha) return { tt: null, tr: null };
    const parts = ha.split('/').map(p => parseFloat(p.trim()));
    return {
        tt: !isNaN(parts[0]) ? parts[0] : null,
        tr: parts.length > 1 && !isNaN(parts[1]) ? parts[1] : null,
    };
}

/** Map string option to numeric SPSS code */
function mapNguoiO(v: string | undefined): number | null {
    const map: Record<string, number> = {
        'nong_thon': 0, 'Nông thôn': 0,
        'thanh_thi': 1, 'Thành thị': 1,
        'hai_dao': 2, 'Hải đảo': 2,
    };
    return v ? (map[v] ?? null) : null;
}

function mapGioiTinh(v: string | undefined): number | null {
    if (v === 'nam') return 0;
    if (v === 'nu') return 1;
    return null;
}

function mapThoiDiemDieuTri(v: string | undefined | null): number | null {
    const map: Record<string, number> = {
        'Trước điều trị': 0,
        'Trong điều trị': 1,
        'Kết thúc điều trị': 2,
    };
    return v ? (map[v] ?? null) : null;
}

function mapXquangViTri(v: string | undefined | null): number | null {
    const map: Record<string, number> = {
        '1/2 trên': 0,
        '1/2 dưới': 1,
        'cả 1/2 trên-dưới': 2,
    };
    return v ? (map[v] ?? null) : null;
}

function mapBen(v: string | undefined | null): number | null {
    const map: Record<string, number> = {
        'phải': 0, 'Phải': 0,
        'trái': 1, 'Trái': 1,
        'hai bên': 2, 'Hai bên': 2,
    };
    return v ? (map[v] ?? null) : null;
}

function mapCtThuy(v: string | undefined | null): number | null {
    const map: Record<string, number> = {
        'thuỳ trên': 0, 'Thuỳ trên': 0,
        'thuỳ giữa': 1, 'Thuỳ giữa': 1,
        'thuỳ dưới': 2, 'Thuỳ dưới': 2,
    };
    return v ? (map[v] ?? null) : null;
}

function mapCtDien(v: string | undefined | null): number | null {
    const map: Record<string, number> = {
        'hẹp': 0, 'Hẹp': 0,
        'vừa': 1, 'Vừa': 1,
        'rộng': 2, 'Rộng': 2,
    };
    return v ? (map[v] ?? null) : null;
}

function mapKsMucDo(v: string | undefined | null): number | null {
    if (v === 'S') return 0;
    if (v === 'I') return 1;
    if (v === 'R') return 2;
    return null;
}

function mapPsiPhanTang(v: string | undefined | null): number | null {
    const map: Record<string, number> = {
        'Class I': 1, 'I': 1,
        'Class II': 2, 'II': 2,
        'Class III': 3, 'III': 3,
        'Class IV': 4, 'IV': 4,
        'Class V': 5, 'V': 5,
    };
    return v ? (map[v] ?? null) : null;
}

function mapCurb65Nhom(v: string | undefined | null): number | null {
    if (!v) return null;
    if (v.includes('0') || v.includes('1') || v.toLowerCase().includes('nhẹ')) return 0;
    if (v.includes('2') || v.toLowerCase().includes('trung bình')) return 1;
    if (v.includes('3') || v.includes('4') || v.includes('5') || v.toLowerCase().includes('nặng')) return 2;
    return null;
}

// ─── Main converter ───────────────────────────────────────────────────────────

export function patientToSpssRow(patient: Patient, slots: SpssSlotConfig): SpssRow {
    const row: SpssRow = {};
    const p = patient;

    // ── Hành chính ──────────────────────────────────────────────────────────
    row['ma_bnnc'] = s(p.maBenhNhanNghienCuu);
    row['ma_ba'] = s(p.maBenhAnNoiTru);
    row['ho_ten'] = s(p.hanhChinh.hoTen);
    row['tuoi'] = n(p.hanhChinh.tuoi);
    row['gioi_tinh'] = mapGioiTinh(p.hanhChinh.gioiTinh);
    row['nghe_nghiep'] = s(p.hanhChinh.ngheNghiep);
    row['xa_phuong'] = s(p.hanhChinh.diaChiXaPhuong);
    row['tinh_thanh'] = s(p.hanhChinh.diaChiTinhThanh);
    row['noi_o'] = mapNguoiO(p.hanhChinh.noiO);
    row['ngay_vao_vien'] = s(p.hanhChinh.ngayVaoVien);
    row['ngay_ra_vien'] = s(p.hanhChinh.ngayRaVien);
    row['ghi_chu'] = s(p.hanhChinh.ghiChu);

    // ── Tiền sử ─────────────────────────────────────────────────────────────
    row['ts_dtd'] = b(p.tienSu.daiThaoDuong);
    row['ts_tha'] = b(p.tienSu.tangHuyetAp);
    row['ts_vdd'] = b(p.tienSu.viemDaDay);
    row['ts_vgm'] = b(p.tienSu.viemGanMan);
    row['ts_btnm'] = b(p.tienSu.benhThanMan);
    row['ts_gut'] = b(p.tienSu.gut);
    row['ts_ung_thu'] = b(p.tienSu.ungThu);
    row['ts_suy_tim'] = b(p.tienSu.suyTimUHuyet);
    row['ts_mach_nao'] = b(p.tienSu.benhMachMauNao);
    row['ts_khac'] = s(p.tienSu.khac);
    row['ts_hut_thuoc'] = b(p.tienSu.hutThuocLa);
    row['ts_bao_nam'] = n(p.tienSu.soBaoNam);

    // ── Lâm sàng ────────────────────────────────────────────────────────────
    row['ls_tg_tc'] = s(p.lamSang.thoiDiemTrieuChung);
    row['ls_mach'] = n(p.lamSang.mach);
    const bp = parseBloodPressure(p.lamSang.huyetAp);
    row['ls_ha_tam_thu'] = bp.tt;
    row['ls_ha_tam_truong'] = bp.tr;
    row['ls_nhiet_do'] = n(p.lamSang.nhietDo);
    row['ls_nhip_tho'] = n(p.lamSang.nhipTho);
    row['ls_spo2'] = n(p.lamSang.spO2);
    row['ls_bmi'] = n(p.lamSang.bmi);
    row['ls_glasgow'] = n(p.lamSang.diemGlasgow);
    row['ls_ho_khan'] = b(p.lamSang.hoKhan);
    row['ls_ho_mau'] = b(p.lamSang.hoMau);
    row['ls_ho_dom'] = b(p.lamSang.hoKhacDom);
    row['ls_dom_mau_sac'] = s(p.lamSang.domMauSac);
    row['ls_dau_nguc'] = b(p.lamSang.dauNguc);
    row['ls_kho_tho'] = b(p.lamSang.khoTho);
    row['ls_ran_am'] = b(p.lamSang.ranAm);
    row['ls_ran_no'] = b(p.lamSang.ranNo);
    row['ls_ran_rit'] = b(p.lamSang.ranRit);
    row['ls_ran_ngay'] = b(p.lamSang.ranNgay);
    row['ls_tdmp_co'] = b(p.lamSang.hoiChungTDMP?.co);
    row['ls_tdmp_ben'] = s(p.lamSang.hoiChungTDMP?.ben);
    row['ls_dongdac_co'] = b(p.lamSang.hoiChungDongDac?.co);
    row['ls_dongdac_ben'] = s(p.lamSang.hoiChungDongDac?.ben);
    row['ls_tkmp_co'] = b(p.lamSang.hoiChungTKMP?.co);
    row['ls_tkmp_ben'] = s(p.lamSang.hoiChungTKMP?.ben);

    // ── Xét nghiệm ──────────────────────────────────────────────────────────
    const xn = p.xetNghiem;
    row['xn_wbc'] = n(xn.wbc);
    row['xn_neutrophil'] = n(xn.neutrophil);
    row['xn_lymphocyte'] = n(xn.lymphocyte);
    row['xn_rbc'] = n(xn.rbc);
    row['xn_hemoglobin'] = n(xn.hemoglobin);
    row['xn_hct'] = n(xn.hct);
    row['xn_plt'] = n(xn.plt);
    row['xn_ure'] = n(xn.ure);
    row['xn_creatinin'] = n(xn.creatinin);
    row['xn_ast'] = n(xn.ast);
    row['xn_alt'] = n(xn.alt);
    row['xn_ggt'] = n(xn.ggt);
    row['xn_glucose'] = n(xn.glucose);
    row['xn_protein'] = n(xn.protein);
    row['xn_albumin'] = n(xn.albumin);
    row['xn_crp'] = n(xn.crp);
    row['xn_pct'] = n(xn.procalcitonin);
    row['xn_na'] = n(xn.na);
    row['xn_k'] = n(xn.k);
    row['xn_cl'] = n(xn.cl);
    row['xn_ph'] = n(xn.ph);
    row['xn_sao2'] = n(xn.saO2);
    row['xn_paco2'] = n(xn.paCO2);
    row['xn_hco3'] = n(xn.hcO3);
    row['xn_be'] = n(xn.be);
    row['xn_bm_barcode'] = s(xn.biomarkerBarcode);
    row['xn_strem1'] = n(xn.sTREM1);
    row['xn_timp1'] = n(xn.tIMP1);
    row['xn_il6'] = n(xn.il6);
    row['xn_il10'] = n(xn.il10);
    row['xn_il17'] = n(xn.il17);

    // ── Chỉ số tính toán ────────────────────────────────────────────────────
    const cs = p.chiSoTinhToan;
    row['cs_nlr'] = n(cs?.nlr);
    row['cs_plr'] = n(cs?.plr);
    row['cs_car'] = n(cs?.car);

    // ── Hình ảnh static ─────────────────────────────────────────────────────
    const ha = p.hinhAnh;
    row['ha_xq_tran_dich'] = b(ha?.xquangTranDichMangPhoi);
    row['ha_xq_tran_khi'] = b(ha?.xquangTranKhiMangPhoi);
    row['ha_ct_tran_dich'] = b(ha?.ctTranDichMangPhoi);
    row['ha_ct_tran_khi'] = b(ha?.ctTranKhiMangPhoi);

    // ── X-quang tổn thương (slots) ──────────────────────────────────────────
    for (let i = 1; i <= slots.xquang; i++) {
        const x = ha?.xquangTonThuong?.[i - 1];
        row[`xq${i}_vitri`] = x ? mapXquangViTri(x.viTri) : null;
        row[`xq${i}_ben`] = x ? mapBen(x.ben) : null;
        row[`xq${i}_hinhthai`] = x ? s(x.hinhThai) : null;
        row[`xq${i}_dien`] = x ? s((x as { dien?: string }).dien) : null;
        row[`xq${i}_thoiDiem`] = x ? mapThoiDiemDieuTri(x.thoiDiem) : null;
    }

    // ── CT tổn thương (slots) ───────────────────────────────────────────────
    for (let i = 1; i <= slots.ct; i++) {
        const c = ha?.ctTonThuong?.[i - 1];
        row[`ct${i}_thuy`] = c ? mapCtThuy(c.thuy) : null;
        row[`ct${i}_ben`] = c ? mapBen(c.ben) : null;
        row[`ct${i}_hinhthai`] = c ? s(c.hinhThai) : null;
        row[`ct${i}_dien`] = c ? mapCtDien(c.dien) : null;
        row[`ct${i}_thoiDiem`] = c ? mapThoiDiemDieuTri(c.thoiDiem) : null;
    }

    // ── Vi khuẩn (slots) ────────────────────────────────────────────────────
    row['vk_khong_moc'] = b(p.khongMocViKhuan);

    for (let i = 1; i <= slots.viKhuan; i++) {
        const vk = p.viKhuan?.[i - 1];
        row[`vk${i}_co`] = vk ? b(vk.coKhong) : null;
        row[`vk${i}_ten`] = vk ? s(vk.tenViKhuan) : null;

        for (let k = 1; k <= slots.khangSinhPerVK; k++) {
            const ks = vk?.khangSinhDo?.[k - 1];
            row[`vk${i}_ks${k}_ten`] = ks ? s(ks.tenKhangSinh) : null;
            row[`vk${i}_ks${k}_kq`] = ks ? mapKsMucDo(ks.mucDo) : null;
        }
    }

    // ── Thuốc đã dùng (slots) ───────────────────────────────────────────────
    for (let i = 1; i <= slots.thuoc; i++) {
        const t = p.tienSu?.thuocDaDung?.[i - 1];
        row[`thuoc${i}_ten_goc`] = t ? s(t.tenGoc) : null;
        row[`thuoc${i}_ten`] = t ? s(t.tenThuoc) : null;
        row[`thuoc${i}_lieu`] = t ? s(t.lieuLuong) : null;
        row[`thuoc${i}_tong_lieu`] = t ? s(t.tongLieu) : null;
        row[`thuoc${i}_duong_dung`] = t ? s(t.duongDung) : null;
        row[`thuoc${i}_thoi_gian`] = t ? n(t.thoiGianDung) : null;
    }

    // ── PSI ─────────────────────────────────────────────────────────────────
    const psi = p.psi;
    const pc = psi?.criteria;
    row['psi_nha_duong_lao'] = b(pc?.nhaDuongLao);
    row['psi_ung_thu'] = b(pc?.ungThu);
    row['psi_benh_gan'] = b(pc?.benhGan);
    row['psi_suy_tim'] = b(pc?.suyTimUHuyet);
    row['psi_mach_nao'] = b(pc?.benhMachMauNao);
    row['psi_benh_than'] = b(pc?.benhThan);
    row['psi_thay_doi_tri_giac'] = b(pc?.thayDoiTriGiac);
    row['psi_tan_so_tho30'] = b(pc?.tanSoTho30);
    row['psi_ha_tam_thu90'] = b(pc?.huyetApTamThu90);
    row['psi_than_nhiet_3540'] = b(pc?.thanNhiet3540);
    row['psi_mach125'] = b(pc?.mach125);
    row['psi_ph735'] = b(pc?.ph735);
    row['psi_bun30'] = b(pc?.bun30);
    row['psi_hematocrit30'] = b(pc?.hematocrit30);
    row['psi_na_mau130'] = b(pc?.naMau130);
    row['psi_glucose250'] = b(pc?.glucoseMau250);
    row['psi_pao2_60'] = b(pc?.paO2_60);
    row['psi_tran_dich_mp'] = b(pc?.tranDichMangPhoi);
    row['psi_tong_diem'] = n(psi?.tongDiem);
    row['psi_phan_tang'] = mapPsiPhanTang(psi?.phanTang);

    // ── CURB-65 ─────────────────────────────────────────────────────────────
    const curb = p.curb65;
    const cc = curb?.chiTiet;
    row['curb_c'] = cc?.c === null || cc?.c === undefined ? null : b(cc.c);
    row['curb_u'] = cc?.u === null || cc?.u === undefined ? null : b(cc.u);
    row['curb_r'] = cc?.r === null || cc?.r === undefined ? null : b(cc.r);
    row['curb_b'] = cc?.b === null || cc?.b === undefined ? null : b(cc.b);
    row['curb_age65'] = cc?.age65 === null || cc?.age65 === undefined ? null : b(cc.age65);
    row['curb_tong_diem'] = n(curb?.tongDiem);
    row['curb_phan_nhom'] = mapCurb65Nhom(curb?.phanNhom);
    row['curb_du_du_lieu'] = b(curb?.duDuLieu);

    // ── Kết cục ─────────────────────────────────────────────────────────────
    const kc = p.ketCuc;
    // Dynamic diễn biến → binary per known field
    row['kc_tho_may'] = b(kc.thoMay || kc.dienBienDieuTri?.includes('Thở máy'));
    row['kc_soc_nk'] = b(kc.socNhiemKhuan || kc.dienBienDieuTri?.includes('Sốc nhiễm khuẩn'));
    row['kc_loc_mau'] = b(kc.locMau || kc.dienBienDieuTri?.includes('Lọc máu'));
    row['kc_ngay_loc_mau'] = n(kc.soNgayLocMau);
    row['kc_tinh_trang_ra_vien'] = s(kc.tinhTrangRaVien);
    row['kc_tu_vong'] = b(kc.tuVong);
    row['kc_xin_ve'] = b(kc.xinVe);
    row['kc_tien_trien_tot'] = b(kc.tienTrienTotXuatVien);
    row['kc_ngay_dieu_tri'] = n(kc.tongSoNgayDieuTri);
    row['kc_ngay_bat_dau_ks'] = s(kc.ngayBatDauKhangSinh);
    row['kc_ngay_ket_thuc_ks'] = s(kc.ngayKetThucKhangSinh);

    return row;
}
