import * as XLSX from 'xlsx';
import type { Patient } from '../types/patient';

export function exportPatientsToExcel(patients: Patient[]) {
    const rows = patients.map((p) => {
        const base: Record<string, unknown> = {
            'Mã BNNC': p.maBenhNhanNghienCuu,
            'Mã BA Nội trú': p.maBenhAnNoiTru,
            // Hành chính
            'Họ tên': p.hanhChinh.hoTen,
            'Tuổi': p.hanhChinh.tuoi,
            'Giới tính': p.hanhChinh.gioiTinh === 'nam' ? 'Nam' : p.hanhChinh.gioiTinh === 'nu' ? 'Nữ' : '',
            'Nghề nghiệp': p.hanhChinh.ngheNghiep,
            'Xã/Phường': p.hanhChinh.diaChiXaPhuong,
            'Tỉnh/Thành phố': p.hanhChinh.diaChiTinhThanh,
            'Nơi ở': p.hanhChinh.noiO,
            'Ngày vào viện': p.hanhChinh.ngayVaoVien,
            'Ngày ra viện': p.hanhChinh.ngayRaVien,
            // Tiền sử
            'Đái tháo đường': p.tienSu.daiThaoDuong ? 'Có' : 'Không',
            'Tăng huyết áp': p.tienSu.tangHuyetAp ? 'Có' : 'Không',
            'Viêm dạ dày': p.tienSu.viemDaDay ? 'Có' : 'Không',
            'Viêm gan mạn': p.tienSu.viemGanMan ? 'Có' : 'Không',
            'Bệnh thận mạn': p.tienSu.benhThanMan ? 'Có' : 'Không',
            'Gút': p.tienSu.gut ? 'Có' : 'Không',
            'Ung thư': p.tienSu.ungThu ? 'Có' : 'Không',
            'Suy tim ứ huyết': p.tienSu.suyTimUHuyet ? 'Có' : 'Không',
            'Bệnh mạch máu não': p.tienSu.benhMachMauNao ? 'Có' : 'Không',
            'Tiền sử khác': p.tienSu.khac,
            'Hút thuốc lá': p.tienSu.hutThuocLa ? 'Có' : 'Không',
            'Số bao-năm': p.tienSu.soBaoNam,
            // Lâm sàng
            'Mạch': p.lamSang.mach,
            'Huyết áp': p.lamSang.huyetAp,
            'Nhiệt độ': p.lamSang.nhietDo,
            'Nhịp thở': p.lamSang.nhipTho,
            'SpO2': p.lamSang.spO2,
            'BMI': p.lamSang.bmi,
            'Điểm Glasgow': p.lamSang.diemGlasgow,
            'Ho khan': p.lamSang.hoKhan ? 'Có' : 'Không',
            'Ho máu': p.lamSang.hoMau ? 'Có' : 'Không',
            'Ho khạc đờm': p.lamSang.hoKhacDom ? 'Có' : 'Không',
            'Đau ngực': p.lamSang.dauNguc ? 'Có' : 'Không',
            'Khó thở': p.lamSang.khoTho ? 'Có' : 'Không',
            'Ran ẩm': p.lamSang.ranAm ? 'Có' : 'Không',
            'Ran nổ': p.lamSang.ranNo ? 'Có' : 'Không',
            'Ran rít': p.lamSang.ranRit ? 'Có' : 'Không',
            'Ran ngáy': p.lamSang.ranNgay ? 'Có' : 'Không',
            // Xét nghiệm
            'WBC (G/l)': p.xetNghiem.wbc,
            'Neutrophil (%)': p.xetNghiem.neutrophil,
            'Lymphocyte (%)': p.xetNghiem.lymphocyte,
            'RBC (T/l)': p.xetNghiem.rbc,
            'Hemoglobin (g/l)': p.xetNghiem.hemoglobin,
            'Hct (%)': p.xetNghiem.hct,
            'PLT (G/l)': p.xetNghiem.plt,
            'Ure (mmol/l)': p.xetNghiem.ure,
            'Creatinin (µmol/l)': p.xetNghiem.creatinin,
            'AST (U/l)': p.xetNghiem.ast,
            'ALT (U/l)': p.xetNghiem.alt,
            'GGT (U/l)': p.xetNghiem.ggt,
            'Glucose (µmol/l)': p.xetNghiem.glucose,
            'Protein (g/l)': p.xetNghiem.protein,
            'Albumin (g/l)': p.xetNghiem.albumin,
            'CRP (mg/L)': p.xetNghiem.crp,
            'Procalcitonin (pg/ml)': p.xetNghiem.procalcitonin,
            'Na': p.xetNghiem.na,
            'K': p.xetNghiem.k,
            'Cl': p.xetNghiem.cl,
            'pH': p.xetNghiem.ph,
            'SaO2': p.xetNghiem.saO2,
            'PaCO2': p.xetNghiem.paCO2,
            'HCO3': p.xetNghiem.hcO3,
            'BE': p.xetNghiem.be,
            'sTREM-1': p.xetNghiem.sTREM1,
            'TIMP-1': p.xetNghiem.tIMP1,
            'IL6': p.xetNghiem.il6,
            'IL10': p.xetNghiem.il10,
            'IL17': p.xetNghiem.il17,
            // Chỉ số tính toán
            'NLR': p.chiSoTinhToan.nlr,
            'PLR': p.chiSoTinhToan.plr,
            'CAR': p.chiSoTinhToan.car,
            // PSI
            'PSI Tổng điểm': p.psi.tongDiem,
            'PSI Phân tầng': p.psi.phanTang,
            // Kết cục
            'Tử vong': p.ketCuc.tuVong ? 'Có' : 'Không',
            'Xin về': p.ketCuc.xinVe ? 'Có' : 'Không',
            'Thở máy': p.ketCuc.thoMay ? 'Có' : 'Không',
            'Tiến triển tốt xuất viện': p.ketCuc.tienTrienTotXuatVien ? 'Có' : 'Không',
            'Tổng số ngày điều trị': p.ketCuc.tongSoNgayDieuTri,
            'Ngày bắt đầu KS': p.ketCuc.ngayBatDauKhangSinh,
            'Ngày kết thúc KS': p.ketCuc.ngayKetThucKhangSinh,
        };

        // Flatten Xquang tổn thương (max 5)
        for (let i = 0; i < 5; i++) {
            const x = p.hinhAnh?.xquangTonThuong?.[i];
            base[`XQ_TonThuong_${i + 1}_ViTri`] = x?.viTri || '';
            base[`XQ_TonThuong_${i + 1}_Ben`] = x?.ben || '';
            base[`XQ_TonThuong_${i + 1}_HinhThai`] = x?.hinhThai || '';
        }

        // Flatten CT tổn thương (max 5)
        for (let i = 0; i < 5; i++) {
            const c = p.hinhAnh?.ctTonThuong?.[i];
            base[`CT_TonThuong_${i + 1}_Thuy`] = c?.thuy || '';
            base[`CT_TonThuong_${i + 1}_Ben`] = c?.ben || '';
            base[`CT_TonThuong_${i + 1}_HinhThai`] = c?.hinhThai || '';
            base[`CT_TonThuong_${i + 1}_Dien`] = c?.dien || '';
        }

        // Flatten vi khuẩn
        p.viKhuan?.forEach((vk) => {
            base[`VK_${vk.tenViKhuan}`] = vk.coKhong ? 'Có' : 'Không';
            if (vk.coKhong && vk.khangSinhDo) {
                vk.khangSinhDo.forEach((ks) => {
                    base[`VK_${vk.tenViKhuan}_KS_${ks.tenKhangSinh}`] = ks.mucDo;
                });
            }
        });

        return base;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bệnh nhân');

    // Auto-width columns
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
        wch: Math.max(key.length, 12),
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `CAP_Research_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function generateAddressTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
        ['Tỉnh/Thành phố', 'Xã/Phường'],
        ['Hải Phòng', 'An Lư'],
        ['Hải Phòng', 'Cao Nhân'],
    ]);
    ws['!cols'] = [{ wch: 20 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Địa chỉ');
    XLSX.writeFile(wb, 'dia_chi_template.xlsx');
}

export interface AddressEntry {
    tinhThanh: string;
    xaPhuong: string;
}

export function parseAddressExcel(file: File): Promise<AddressEntry[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
                const entries: AddressEntry[] = rows.map((r) => ({
                    tinhThanh: r['Tỉnh/Thành phố'] || '',
                    xaPhuong: r['Xã/Phường'] || '',
                }));
                resolve(entries);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
