# CAP Research — Đặc tả dự án nghiên cứu

> **Tên đề tài:** Đặc điểm căn nguyên vi sinh và một số dấu ấn sinh học ở bệnh nhân Viêm phổi mắc phải cộng đồng (Community-Acquired Pneumonia — CAP)
>
> **Ứng dụng:** Web app quản lý thu thập dữ liệu + phân tích thống kê tự động
>
> **Tech stack:** React + TypeScript + Vite + Firebase (Firestore + Auth + Hosting) + TailwindCSS

---

## 1. Kiến trúc dự án

```
src/
├── pages/                  # 5 trang chính
│   ├── LoginPage.tsx       # Đăng nhập Firebase Auth
│   ├── DashboardPage.tsx   # Danh sách bệnh nhân + export Excel
│   ├── PatientFormPage.tsx # Form nhập liệu multi-step
│   ├── AnalyticsPage.tsx   # Thống kê tổng hợp + biểu đồ
│   └── SettingsPage.tsx    # Cài đặt danh mục (VK, KS, thuốc...)
├── components/
│   ├── analytics/
│   │   └── ExpectedResultsTab.tsx  # Bảng thống kê Chương 3 (~1700 dòng)
│   ├── form/               # Các step nhập liệu
│   ├── layout/             # Sidebar, header
│   ├── print/              # In bệnh án
│   └── ui/                 # Shared UI components
├── types/
│   └── patient.ts          # Data model (source of truth)
├── data/
│   └── formOptions.ts      # Dropdown options, default values
├── utils/
│   ├── statsHelpers.ts     # mean, sd, median, Q1, Q3, pct, PSI class
│   └── statisticalTests.ts # Mann-Whitney U, Spearman p-value
├── services/
│   └── exportService.ts    # Xuất Excel
└── config/
    └── firebase.ts         # Firebase config
```

### Database: Firebase Firestore
- Collection `patients`: mỗi document là 1 bệnh nhân (interface `Patient`)
- Collection `settings`: cấu hình danh mục (vi khuẩn, kháng sinh, thuốc nhóm 1/2...)
- Auth: Firebase Authentication (email/password)

---

## 2. Cấu trúc dữ liệu bệnh nhân (`Patient`)

### 2.1 Root

| Field | Type | Mô tả |
|---|---|---|
| `id` | string | Firestore document ID |
| `maBenhNhanNghienCuu` | string | Mã nghiên cứu (VD: "CAP001") |
| `maBenhAnNoiTru` | string | Mã bệnh án nội trú |
| `hanhChinh` | HanhChinh | Thông tin hành chính |
| `tienSu` | TienSu | Tiền sử bệnh + thuốc đã dùng |
| `lamSang` | LamSang | Triệu chứng lâm sàng |
| `xetNghiem` | XetNghiem | 30 chỉ số xét nghiệm + 5 biomarker |
| `chiSoTinhToan` | ChiSoTinhToan | NLR, PLR, CAR (tự tính) |
| `hinhAnh` | HinhAnh | Tổn thương XQ + CT theo thời điểm |
| `viKhuan` | ViKhuan[] | Kết quả cấy VK + kháng sinh đồ |
| `psi` | PSIData | Điểm PSI (Pneumonia Severity Index) |
| `ketCuc` | KetCuc | Kết cục điều trị |
| `createdAt` | Timestamp | Thời điểm tạo |
| `updatedAt` | Timestamp | Thời điểm cập nhật |

---

### 2.2 HanhChinh — Thông tin hành chính

| Field | Type | Mô tả |
|---|---|---|
| `hoTen` | string | Họ tên bệnh nhân |
| `tuoi` | number \| null | Tuổi |
| `gioiTinh` | `'nam'` \| `'nu'` \| `''` | Giới tính |
| `ngheNghiep` | string | Nghề nghiệp (dropdown: Lao động tự do, Công nhân, Nông dân, Viên chức, HSSV, Hưu trí, Khác) |
| `diaChiXaPhuong` | string | Địa chỉ xã/phường |
| `diaChiTinhThanh` | string | Địa chỉ tỉnh/thành |
| `noiO` | `'nong_thon'` \| `'thanh_thi'` \| `'hai_dao'` \| `''` | Nơi ở (Nông thôn / Thành thị / Hải đảo) |
| `ngayVaoVien` | string | Ngày vào viện (dd/mm/yyyy) |
| `ngayRaVien` | string | Ngày ra viện (dd/mm/yyyy) |
| `ghiChu` | string | Ghi chú tự do |

---

### 2.3 TienSu — Tiền sử bệnh

| Field | Type | Mô tả |
|---|---|---|
| `daiThaoDuong` | boolean | Đái tháo đường |
| `tangHuyetAp` | boolean | Tăng huyết áp |
| `viemDaDay` | boolean | Viêm dạ dày |
| `viemGanMan` | boolean | Viêm gan mạn |
| `benhThanMan` | boolean | Bệnh thận mạn |
| `gut` | boolean | Gout |
| `ungThu` | boolean | Ung thư |
| `suyTimUHuyet` | boolean | Suy tim ứ huyết |
| `benhMachMauNao` | boolean | Bệnh mạch máu não |
| `khac` | string | Tiền sử khác (text tự do) |
| `hutThuocLa` | boolean | Hút thuốc lá |
| `soBaoNam` | number \| null | Số bao-năm (nếu hút thuốc) |
| `thuocDaDung` | ThuocDaDung[] | Danh sách thuốc đã dùng trước nhập viện |

#### ThuocDaDung — Chi tiết thuốc đã dùng

| Field | Type | Mô tả |
|---|---|---|
| `id` | string | UUID |
| `tenGoc` | string | Tên gốc (generic name) — **bắt buộc chọn từ danh sách** (Nhóm 2 trong Settings) |
| `tenThuoc` | string | Tên biệt dược — nhập tự do |
| `lieuLuong` | string | Liều lượng |
| `tongLieu` | string | Tổng liều |
| `duongDung` | string | Đường dùng (Uống, Tiêm TM, Tiêm bắp, Tiêm dưới da, Truyền TM, Khí dung, Khác) |
| `thoiGianDung` | number \| null | Số ngày sử dụng |

#### DrugGenericName — Thuốc Nhóm 2 (Settings)

| Field | Type | Mô tả |
|---|---|---|
| `ten` | string | Tên gốc (VD: "Amoxicillin") |
| `nhom1` | string | Thuộc nhóm 1 (VD: "Kháng sinh", "Corticoid") |

> **Quy tắc:** Tên gốc bắt buộc chọn từ danh sách. Thống kê theo tên gốc, phân nhóm theo nhóm 1.

---

### 2.4 LamSang — Triệu chứng lâm sàng

| Field | Type | Đơn vị | Mô tả |
|---|---|---|---|
| `thoiDiemTrieuChung` | string | dd/mm/yyyy | Thời điểm xuất hiện triệu chứng (tính ngày khởi bệnh → nhập viện) |
| `mach` | number \| null | lần/phút | Mạch |
| `huyetAp` | string | mmHg | Huyết áp (format: "120/80") → parse tâm thu/tâm trương |
| `nhietDo` | number \| null | °C | Nhiệt độ |
| `nhipTho` | number \| null | lần/phút | Nhịp thở |
| `spO2` | number \| null | % | SpO₂ |
| `bmi` | number \| null | kg/m² | BMI |
| `diemGlasgow` | number \| null | — | Điểm Glasgow |
| `hoKhan` | boolean | — | Ho khan |
| `hoMau` | boolean | — | Ho máu |
| `hoKhacDom` | boolean | — | Ho khạc đờm |
| `domTinh` | string[] | — | Tính chất đờm: Trong, Nhầy, Đục (multi-select) |
| `domMauSac` | string | — | Màu sắc đờm |
| `dauNguc` | boolean | — | Đau ngực |
| `khoTho` | boolean | — | Khó thở |
| `ranAm` | boolean | — | Ran ẩm |
| `ranNo` | boolean | — | Ran nổ |
| `ranRit` | boolean | — | Ran rít |
| `ranNgay` | boolean | — | Ran ngáy |
| `hoiChungTDMP` | { co: boolean; ben: string } | — | Hội chứng tràn dịch màng phổi (có/không + bên) |
| `hoiChungDongDac` | { co: boolean; ben: string } | — | Hội chứng đông đặc |
| `hoiChungTKMP` | { co: boolean; ben: string } | — | Hội chứng tràn khí màng phổi |

---

### 2.5 XetNghiem — Xét nghiệm máu

#### Công thức máu
| Field | Type | Đơn vị |
|---|---|---|
| `wbc` | number \| null | ×10⁹/L |
| `neutrophil` | number \| null | % |
| `lymphocyte` | number \| null | % |
| `rbc` | number \| null | T/L |
| `hemoglobin` | number \| null | g/L |
| `hct` | number \| null | % |
| `plt` | number \| null | ×10⁹/L |

#### Sinh hoá máu
| Field | Type | Đơn vị |
|---|---|---|
| `ure` | number \| null | mmol/L |
| `creatinin` | number \| null | µmol/L |
| `ast` | number \| null | U/L |
| `alt` | number \| null | U/L |
| `ggt` | number \| null | U/L |
| `glucose` | number \| null | mmol/L |
| `protein` | number \| null | g/L |
| `albumin` | number \| null | g/L |
| `crp` | number \| null | mg/L |
| `procalcitonin` | number \| null | ng/mL |

#### Điện giải đồ
| Field | Type | Đơn vị |
|---|---|---|
| `na` | number \| null | mmol/L |
| `k` | number \| null | mmol/L |
| `cl` | number \| null | mmol/L |

#### Khí máu động mạch
| Field | Type | Đơn vị |
|---|---|---|
| `ph` | number \| null | — |
| `saO2` | number \| null | % |
| `paCO2` | number \| null | mmHg |
| `hcO3` | number \| null | mmol/L |
| `be` | number \| null | mmol/L |

#### Dấu ấn sinh học (Biomarkers)
| Field | Type | Đơn vị | Mô tả |
|---|---|---|---|
| `biomarkerBarcode` | string | — | Mã barcode mẫu (metadata, không thống kê) |
| `sTREM1` | number \| null | pg/mL | Soluble Triggering Receptor Expressed on Myeloid Cells 1 |
| `tIMP1` | number \| null | ng/mL | Tissue Inhibitor of Metalloproteinases 1 |
| `il6` | number \| null | pg/mL | Interleukin-6 |
| `il10` | number \| null | pg/mL | Interleukin-10 |
| `il17` | number \| null | pg/mL | Interleukin-17 |

---

### 2.6 ChiSoTinhToan — Chỉ số tính toán (auto-calculated)

| Field | Công thức | Ý nghĩa |
|---|---|---|
| `nlr` | Neutrophil / Lymphocyte | Neutrophil-to-Lymphocyte Ratio |
| `plr` | PLT / Lymphocyte | Platelet-to-Lymphocyte Ratio |
| `car` | CRP / Albumin | C-Reactive Protein to Albumin Ratio |

---

### 2.7 HinhAnh — Hình ảnh X-quang và CT

#### XquangTonThuong — Tổn thương trên X-quang

| Field | Type | Options |
|---|---|---|
| `id` | string | UUID |
| `viTri` | string | '1/2 trên', '1/2 dưới', 'cả 1/2 trên-dưới' |
| `ben` | string | 'Phải', 'Trái', 'Hai bên' |
| `hinhThai` | string | 'Nốt', 'Đám mờ', 'Dải mờ', 'Hang', '**Tràn dịch màng phổi**', '**Tràn khí màng phổi**' |
| `dien` | string | Diện tổn thương |
| `thoiDiem` | ThoiDiemDieuTri | 'Trước điều trị', 'Trong điều trị', 'Kết thúc điều trị' |

#### CTTonThuong — Tổn thương trên CT

| Field | Type | Options |
|---|---|---|
| `id` | string | UUID |
| `thuy` | string | 'Thuỳ trên', 'Thuỳ giữa', 'Thuỳ dưới' |
| `ben` | string | 'Phải', 'Trái', 'Hai bên' |
| `hinhThai` | string | 'Kính mờ', 'Đông đặc', 'Nốt mờ', 'Hang', '**Tràn dịch màng phổi**', '**Tràn khí màng phổi**' |
| `dien` | string | 'Hẹp', 'Vừa', 'Rộng' |
| `thoiDiem` | ThoiDiemDieuTri | 'Trước điều trị', 'Trong điều trị', 'Kết thúc điều trị' |

> **Lưu ý quan trọng:** TDMP (Tràn dịch MP) và TKMP (Tràn khí MP) là **hình thái tổn thương** (`hinhThai`), nên được thống kê **theo thời điểm** (Trước/Trong/Kết thúc ĐT), không phải boolean đơn thuần.

#### HinhAnh root (legacy booleans)

| Field | Type | Mô tả |
|---|---|---|
| `xquangTranDichMangPhoi` | boolean | Legacy — nên scan từ `xquangTonThuong[].hinhThai` |
| `xquangTranKhiMangPhoi` | boolean | Legacy |
| `ctTranDichMangPhoi` | boolean | Legacy |
| `ctTranKhiMangPhoi` | boolean | Legacy |

---

### 2.8 ViKhuan — Vi khuẩn & Kháng sinh đồ

| Field | Type | Mô tả |
|---|---|---|
| `id` | string | UUID |
| `tenViKhuan` | string | Tên vi khuẩn (chọn từ danh sách hoặc nhập mới) |
| `coKhong` | boolean | Có phân lập được VK không |
| `khangSinhDo` | KhangSinhResult[] | Kết quả kháng sinh đồ |

#### KhangSinhResult

| Field | Type | Options |
|---|---|---|
| `tenKhangSinh` | string | Tên kháng sinh |
| `mucDo` | string | 'S' (Nhạy), 'I' (Trung gian), 'R' (Kháng) |

#### Phân loại VK (hardcoded trong analytics)

- **VK điển hình:** S. pneumoniae, H. influenzae, K. pneumoniae, P. aeruginosa, A. baumannii, E. coli, S. aureus... (15 loài)
- **VK không điển hình:** M. pneumoniae, C. pneumoniae, Legionella spp... (5 loài)
- **Mặc định:** VK không match → phân loại "điển hình"

---

### 2.9 PSIData — Pneumonia Severity Index

| Field | Type | Mô tả |
|---|---|---|
| `criteria` | PSICriteria | 18 tiêu chí (boolean) + tuoiDiem |
| `tongDiem` | number | Tổng điểm PSI |
| `phanTang` | string | Class I–V |

#### Bảng điểm PSI

| Tiêu chí | Điểm |
|---|---|
| Tuổi (nam) | = tuổi |
| Tuổi (nữ) | = tuổi − 10 |
| Nhà dưỡng lão | +10 |
| Ung thư | +30 |
| Bệnh gan | +20 |
| Suy tim ứ huyết | +10 |
| Bệnh mạch máu não | +10 |
| Bệnh thận | +10 |
| Thay đổi tri giác | +20 |
| Tần số thở ≥ 30 | +20 |
| HA tâm thu < 90 | +20 |
| Thân nhiệt < 35°C hoặc ≥ 40°C | +15 |
| Mạch ≥ 125 | +10 |
| pH < 7.35 | +30 |
| BUN ≥ 30 mg/dl | +20 |
| Hematocrit < 30% | +10 |
| Na⁺ < 130 | +20 |
| Glucose ≥ 250 mg/dl | +10 |
| PaO₂ < 60 | +10 |
| Tràn dịch MP | +10 |

#### Phân tầng

| Class | Điểm | Mức độ |
|---|---|---|
| I | ≤ 50 | Nhẹ |
| II | 51–70 | Nhẹ |
| III | 71–90 | Trung bình |
| IV | 91–130 | Nặng |
| V | > 130 | Rất nặng |

---

### 2.10 KetCuc — Kết cục điều trị

| Field | Type | Mô tả |
|---|---|---|
| `thoMay` | boolean | Thở máy |
| `socNhiemKhuan` | boolean | Sốc nhiễm khuẩn |
| `locMau` | boolean | Lọc máu |
| `soNgayLocMau` | number \| null | Số ngày lọc máu |
| `dienBienDieuTri` | string[] | Diễn biến ĐT (dynamic, multi-select) |
| `tinhTrangRaVien` | string | Tình trạng ra viện (single choice) |
| `tuVong` | boolean | Tử vong (legacy, derived from tinhTrangRaVien) |
| `xinVe` | boolean | Xin về (legacy) |
| `tienTrienTotXuatVien` | boolean | Xuất viện (legacy) |
| `tongSoNgayDieuTri` | number \| null | Tổng số ngày điều trị |
| `ngayBatDauKhangSinh` | string | Ngày bắt đầu KS nội viện |
| `ngayKetThucKhangSinh` | string | Ngày kết thúc KS nội viện |

---

## 3. Hệ thống thống kê & phân tích

Toàn bộ logic thống kê nằm trong `ExpectedResultsTab.tsx`. Gồm các bảng sau:

### 3.1 Mục tiêu 1 — Đặc điểm lâm sàng & cận lâm sàng

#### Bảng 3.1 — Đặc điểm chung (`Table311`)
- **Biến:** tuổi (Mean ± SD, median, min-max), giới tính (n, %), nghề nghiệp (n, %), nơi ở (n, %)
- **Tiền sử:** 9 bệnh đồng mắc (n, %), hút thuốc lá (n, %, số bao-năm Mean ± SD)
- **Thuốc trước NV:** n BN dùng thuốc, %
- **Thời gian:** khởi bệnh → nhập viện (Mean ± SD, Median), số ngày điều trị (Mean ± SD, Min–Max)
- **Kết cục:** Xuất viện / Tử vong / Xin về (n, %)

#### Bảng 3.2 — Đặc điểm lâm sàng (`Table312`)
- **Sinh hiệu:** Mạch, HA tâm thu, HA tâm trương, Nhiệt độ, Nhịp thở, SpO₂, Glasgow (Mean ± SD)
- **Triệu chứng cơ năng:** Sốt ≥38°C, Ho khan, Ho khạc đờm, Ho máu, Khó thở, Đau ngực (n, %)
- **Đờm:** Tính chất (Trong/Nhầy/Đục) + Màu sắc (n, %)
- **Triệu chứng thực thể:** 4 loại ran (n, %)
- **Hội chứng:** TDMP, Đông đặc, TKMP (n, %)

#### Bảng 3.3 — Cận lâm sàng (`Table313`)
- **26 chỉ số xét nghiệm:** n, Mean ± SD, Median (Q1–Q3), đơn vị
- **Nhóm:** Công thức máu (7), Sinh hoá (11 bao gồm GGT), Điện giải (3), Khí máu (5)
- **Chỉ số tính toán:** NLR, PLR, CAR

#### Bảng 3.4 — Phân tầng PSI (`Table314`)
- Phân bố theo Class I–V (n, %)
- Tổng điểm PSI (Mean ± SD, Median, Min–Max)

#### Bảng 3.5 — Hình ảnh học (`Table315`)
- **X-quang & CT:** Phân bố theo vị trí, bên, hình thái (n, %)
- **Theo thời điểm:** Trước ĐT / Trong ĐT / Kết thúc ĐT
- **TDMP/TKMP:** Thống kê theo thời điểm (không phải boolean tổng)

#### Bảng 3.6 — Căn nguyên vi sinh (`Table316`)
- Tỷ lệ phát hiện VK (n, %)
- Nhiễm phối hợp ≥ 2 tác nhân (n, %)
- Phân bố VK: Điển hình / Không điển hình (n, % tổng VK)
- Chi tiết từng chủng VK

#### Bảng 3.7 — Nồng độ biomarker (`Table317`)
- 5 biomarker: sTREM-1, TIMP-1, IL-6, IL-10, IL-17
- n, Mean ± SD, Median (Q1–Q3), Min–Max

### 3.2 Mục tiêu 2 — So sánh & Tương quan

#### Bảng 3.8 — Biomarker theo căn nguyên (`Table321`)
- So sánh: Nhóm có VK vs Không phát hiện VK
- 5 biomarker: Median (Q1–Q3), n
- **p-value:** Mann-Whitney U test (tính on-demand)

#### Bảng 3.9 — Biomarker theo PSI (`Table322`)
- So sánh: PSI I–II (nhẹ) vs PSI III–V (nặng)
- 7 chỉ số: 5 biomarker + CRP + PCT
- **p-value:** Mann-Whitney U test (tính on-demand)

#### Bảng 3.10 — Biomarker theo kết cục (`Table323`)
- 3 bảng con:
  - A. Tử vong vs Sống
  - B. Thở máy vs Không thở máy
  - C. Sốc NK vs Không sốc NK
- 7 chỉ số mỗi bảng
- **p-value:** Mann-Whitney U test (tính on-demand)

#### Bảng 3.11 — Tương quan Spearman (`Table324`)
- Biomarker vs PSI Score
- Biomarker vs Số ngày điều trị
- 7 chỉ số: 5 biomarker + CRP + PCT
- r (hệ số tương quan) + phân loại mức độ (rất yếu → rất mạnh)
- **p-value:** Xấp xỉ t-distribution (tính on-demand)

### 3.3 Mục tiêu 3 — Thuốc trước nhập viện

#### Bảng 3.3 Drug — Thuốc đã dùng (`Table33Drug`)
- Phân nhóm theo **Nhóm 1** (Kháng sinh, Corticoid...)
- Trong mỗi nhóm 1: chi tiết **Tên gốc** (n BN, %, Thời gian dùng Mean ± SD)
- Nhóm "Chưa phân loại" cho dữ liệu legacy thiếu tenGoc

### 3.4 Bảng bổ sung

#### Bảng Diễn biến & Kết cục (`Table34Outcome`)
- Thở máy, Sốc NK, Lọc máu (n, %)
- Số ngày lọc máu (Mean ± SD)
- Diễn biến điều trị (dynamic, n, %)
- Tình trạng ra viện (n, %)

#### Bảng Thời gian KS (`Table35KS`)
- BN có dùng KS nội viện (n, %)
- Thời gian nhập viện → bắt đầu KS (Mean ± SD, Median)
- Tổng thời gian dùng KS (Mean ± SD, Median)

#### Biểu đồ Kaplan-Meier (`KaplanMeierChart`)
- **Time:** tongSoNgayDieuTri
- **Event:** tuVong (death = 1, censored = 0)
- SVG step curve + censored marks (tick marks)
- Bảng at-risk (số BN có nguy cơ tại mỗi thời điểm)
- Đường median survival (nếu survival ≤ 50%)

---

## 4. Kiểm định thống kê

### 4.1 Các test đã implement (`statisticalTests.ts`)

| Test | Dùng cho | Chi tiết |
|---|---|---|
| **Mann-Whitney U** | So sánh 2 nhóm (Bảng 3.8, 3.9, 3.10) | Tie correction + normal approximation. Two-tailed. |
| **Spearman p-value** | Tương quan (Bảng 3.11) | t-distribution approximation. Two-tailed. |

### 4.2 Cách hoạt động
1. Mặc định: cột p hiển thị "—"
2. User bấm nút **"Tính p-value"** → tính toán → hiển thị kết quả
3. Bấm **"Tính lại p-value"** → recalculate (cho case dữ liệu thay đổi)
4. Kết quả kèm **cảnh báo:** "Kết quả tham khảo. Cần xử lý trên SPSS/R/Stata."
5. Highlight: p < 0.05 → **đỏ đậm + dấu `*`**, p < 0.1 → vàng (trend)

### 4.3 Test chưa implement (cần phần mềm chuyên dụng)
- Hồi quy logistic đa biến
- Đường cong ROC & AUC
- Ngưỡng cắt (cut-off) tối ưu (Youden index)
- Mô hình dự báo tiên lượng
- Chi-square / Fisher exact test
- Kruskal-Wallis (> 2 nhóm)

---

## 5. Utility functions (`statsHelpers.ts`)

| Function | Mô tả |
|---|---|
| `mean(values)` | Trung bình cộng |
| `sd(values)` | Độ lệch chuẩn (sample SD, n-1) |
| `median(values)` | Trung vị |
| `q1(values)` | Tứ phân vị thứ nhất (Q1) |
| `q3(values)` | Tứ phân vị thứ ba (Q3) |
| `meanSd(values)` | Format: "mean ± sd" |
| `pct(count, total)` | Phần trăm: "x.x%" |
| `frac(count, total)` | Phân số: "n/N (x.x%)" |
| `psiClass(score)` | Phân tầng PSI: I–V |
| `boxPlotData(values)` | [min, Q1, median, Q3, max] |

---

## 6. Biến số chưa có trong hệ thống

| Biến | Mô tả |
|---|---|
| PCR đa mồi (multiplex) | Hệ thống chỉ có cấy VK, chưa có biến PCR |
| SGA score | Đánh giá dinh dưỡng (Subjective Global Assessment) |

---

## 7. Settings (cấu hình)

Lưu trong Firestore collection `settings`:

| Setting | Mô tả |
|---|---|
| **Vi khuẩn** | Danh sách VK mặc định (có thể thêm/sửa/xóa) |
| **Kháng sinh** | Danh sách KS cho kháng sinh đồ |
| **Thuốc Nhóm 1** | Các nhóm thuốc (VD: Kháng sinh, Corticoid) |
| **Thuốc Nhóm 2** | Tên gốc (generic name), mỗi tên thuộc 1 nhóm 1 |

---

## 8. Export

- **Excel:** Xuất toàn bộ dữ liệu bệnh nhân ra file `.xlsx` (service `exportService.ts`)
- **In bệnh án:** Components trong `components/print/`
