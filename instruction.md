# Hướng dẫn sử dụng phần mềm CAP Research

## Phần mềm này dùng để làm gì?

**CAP Research** là phần mềm quản lý dữ liệu nghiên cứu bệnh nhân viêm phổi cộng đồng (Community-Acquired Pneumonia). Phần mềm giúp bạn:

- **Thu thập dữ liệu** bệnh nhân một cách có hệ thống theo 8 nhóm thông tin (từ hành chính đến kết cục điều trị)
- **Lưu trữ an toàn** trên đám mây (Firebase), truy cập được từ mọi thiết bị có trình duyệt web
- **Xuất dữ liệu** ra Excel hoặc file SPSS (.sav) để phân tích thống kê
- **In bệnh án nghiên cứu** (BANC) theo mẫu tùy chỉnh
- **Sao lưu và khôi phục** dữ liệu để tránh mất mát
- **Xem thống kê nhanh** về tình hình nghiên cứu (tổng BN, tỷ lệ tử vong, phân bố vi khuẩn, phân bố PSI)

---

## Cách đăng nhập

Mở trình duyệt web (Chrome, Safari, Edge đều được), truy cập vào địa chỉ phần mềm. Nhập email và mật khẩu để đăng nhập.

Có 2 loại tài khoản:
- **Admin** (`admin@capresearch.com`): Toàn quyền — thêm, sửa, xóa bệnh nhân và quản lý cài đặt.
- **Advisor** (`advisor@capresearch.com`): Chế độ chỉ xem — có thể xem tất cả dữ liệu, thống kê, phân tích và cài đặt. Khi xem hồ sơ bệnh nhân, giao diện hiển thị thanh thông báo chỉ đọc nhã nhặn; các trường thông tin được bảo vệ nhưng vẫn cho phép chọn văn bản, sao chép dữ liệu và cuộn trang thuận tiện.

> **Mẹo:** Khi nhập email, gõ "admin" hoặc "advisor" rồi nhấn Tab — phần mềm tự động điền đầy đủ email.

Sau khi vào, bạn sẽ thấy thanh menu bên trái với 4 mục chính: **Danh sách nghiên cứu**, **Thống kê**, và **Cài đặt**. Góc dưới trái hiển thị tài khoản đang đăng nhập và vai trò (Admin/Advisor).

Trên điện thoại, bấm vào biểu tượng ☰ ở góc trái để mở menu.

---

## Bệnh nhân — Quản lý danh sách

Đây là trang chủ của phần mềm. Khi vào, bạn sẽ thấy bảng danh sách tất cả bệnh nhân đã nhập.

### Bạn có thể làm gì ở trang này?

**Tìm bệnh nhân:** Gõ tên, mã bệnh nhân nghiên cứu (mã BNNC), hoặc mã bệnh án nội trú vào ô tìm kiếm phía trên bảng.

**Thêm bệnh nhân mới:** Bấm nút **"+ Thêm BN"** màu xanh ở góc phải trên → mở ra form nhập liệu (xem phần tiếp theo).

**Xem chi tiết 1 bệnh nhân:** Bấm biểu tượng con mắt (👁) ở cuối hàng.

**Sửa thông tin bệnh nhân:** Bấm biểu tượng bút chì (✏️) ở cuối hàng.

**Xóa bệnh nhân:** Bấm biểu tượng thùng rác (🗑) → phần mềm sẽ hỏi xác nhận trước khi xóa.

**In bệnh án nghiên cứu:** Bấm biểu tượng máy in (🖨) ở cuối hàng để in cho 1 BN. Nếu muốn in nhiều BN cùng lúc, tích chọn checkbox ở cột đầu tiên rồi bấm nút **"In N BN"** xuất hiện phía trên.

**Xuất Excel:** Bấm nút **"Xuất Excel"** → tải về file `.xlsx` chứa toàn bộ dữ liệu. File này có thể mở bằng Excel, Google Sheets để phân tích thống kê.

**Xuất SPSS (.sav):** Bấm nút **"Xuất SPSS"** (màu xanh dương) → tải về file `.sav` dùng được trực tiếp trong SPSS — không cần qua file trung gian Excel hay CSV. File xuất ra đã có đầy đủ:
- Tên biến (variable name) và nhãn biến (variable label) theo chuẩn SPSS
- Bảng mã giá trị (value labels) cho các biến phân loại
- Biến boolean (checkbox) được mã hóa nhị phân (0 = Không, 1 = Có)
- Các thông tin động (X-quang, CT, vi khuẩn, kháng sinh, thuốc) được trải phẳng thành các cột riêng

> Để tùy chỉnh tên biến và bảng mã, vào **Cài đặt → SPSS Variables**.

**Tạo bản sao lưu nhanh:** Bấm nút **"Backup"** → hệ thống tạo ngay 1 bản sao lưu lưu trên cloud.

---

## Form nhập liệu bệnh nhân

Khi bấm "Thêm BN" hoặc "Sửa", bạn sẽ vào form nhập liệu. Form được chia thành **8 bước**, mỗi bước là 1 nhóm thông tin. Bạn chuyển qua lại giữa các bước bằng nút mũi tên ◀ ▶ hoặc bấm trực tiếp vào tên bước.

### Bước 1 — Hành chính
Nhập thông tin cơ bản của bệnh nhân: họ tên, tuổi, giới tính, nghề nghiệp, địa chỉ (xã/phường, tỉnh/thành phố), nơi ở (nông thôn hay thành thị), ngày vào viện, ngày ra viện.

Mã bệnh nhân nghiên cứu (BNNC) như CAP001, CAP002... có thể được phần mềm tự gán hoặc bạn nhập tay.

### Bước 2 — Tiền sử bệnh
Tích chọn các bệnh nền mà bệnh nhân có: đái tháo đường, tăng huyết áp, viêm gan mạn, bệnh thận mạn, ung thư, suy tim, bệnh mạch máu não... Có thêm ô ghi chú tiền sử khác và số bao-năm hút thuốc lá.

### Bước 3 — Lâm sàng
Nhập các dấu hiệu sinh tồn (mạch, huyết áp, nhiệt độ, nhịp thở, SpO2, BMI, điểm Glasgow) và các triệu chứng hô hấp (ho, đau ngực, khó thở, các loại ran phổi, hội chứng tràn dịch/đông đặc/tràn khí màng phổi).

### Bước 4 — Xét nghiệm
Nhập kết quả xét nghiệm: huyết học (bạch cầu, hồng cầu, tiểu cầu...), sinh hóa (ure, creatinin, men gan, glucose, đạm máu...), marker viêm (CRP, procalcitonin), điện giải (Na, K, Cl), khí máu (pH, PaCO2, HCO3...) và các marker nghiên cứu (sTREM-1, TIMP-1, IL6, IL10, IL17).

Phần mềm sẽ tự tính các chỉ số NLR, PLR, CAR từ dữ liệu bạn nhập.

### Bước 5 — Hình ảnh
Chọn các tổn thương trên X-quang và CT (thâm nhiễm, đông đặc, tràn dịch, tràn khí...).

### Bước 6 — Vi khuẩn
Thêm từng vi khuẩn được phân lập. Mỗi vi khuẩn có thể ghi kèm kháng sinh đồ (nhạy S / trung gian I / kháng R cho từng kháng sinh). Danh sách vi khuẩn và kháng sinh được quản lý ở phần Cài đặt.

### Bước 7 — CURB-65 & PSI
Tab này hiển thị 2 thang điểm đánh giá mức độ nặng, tất cả đều được **tự động tính** từ dữ liệu bạn đã nhập ở các bước trước.

**CURB-65 (phía trên):**
- Gồm 5 cấu phần: **C** (Confusion — rối loạn ý thức), **U** (Ure > 7), **R** (Nhịp thở ≥ 30), **B** (Huyết áp thấp), **65** (Tuổi ≥ 65).
- Các cấu phần U, R, B, 65 tự động đánh giá từ dữ liệu lâm sàng và xét nghiệm.
- Riêng cấu phần **C** (Confusion): khi điểm Glasgow của BN ≤ 13, phần mềm sẽ **hỏi bạn** "Bệnh nhân có rối loạn ý thức mới xuất hiện không?". Bạn chọn Có hoặc Không. Nếu Glasgow > 13 thì C tự động = 0.
- Tổng điểm CURB-65 từ 0 đến 5. Phân nhóm: 0–1 = Nhẹ, 2 = Trung bình, 3–5 = Nặng.
- Khi bạn sửa bất kỳ dữ liệu nào (tuổi, ure, nhịp thở, huyết áp, Glasgow), điểm CURB-65 sẽ **tự động cập nhật** ngay lập tức. Nếu thiếu cấu phần, phần mềm sẽ báo "Chưa đủ dữ liệu".

**PSI (phía dưới):**
Phần mềm tự tính điểm PSI (PORT Score) dựa trên các thông tin đã nhập ở các bước trước. Hiển thị tổng điểm và phân tầng nguy cơ (Class I → V).

### Bước 8 — Kết cục
Nhập diễn biến điều trị (thở máy, sốc nhiễm khuẩn, lọc máu...), tình trạng ra viện, ngày bắt đầu và kết thúc kháng sinh, tổng số ngày điều trị.
- **Tình trạng ra viện gồm 4 tùy chọn:** **Tiến triển tốt, xuất viện**, **Tử vong**, **Xin về**, **Chuyển tuyến**.
- Khi chọn *Tử vong*, *Xin về* hoặc *Chuyển tuyến*, hệ thống tự động ghi nhận vào nhóm **Biến cố nặng** để đồng bộ vào các bảng thống kê và mô hình phân tích hồi quy.

### Lưu và các thao tác khác

- Bấm **💾 Lưu** để lưu dữ liệu. Phần mềm sẽ kiểm tra tính hợp lệ trước khi lưu (ví dụ: ngày ra viện phải sau ngày vào viện).
- Bấm **🖨 In** để in bệnh án nghiên cứu cho bệnh nhân đang mở.
- Bấm **← BN trước** hoặc **BN sau →** để chuyển nhanh sang bệnh nhân khác mà không cần quay về danh sách.
- Nếu bạn đang sửa dở mà chưa lưu, phần mềm sẽ cảnh báo khi bạn rời trang để tránh mất dữ liệu.

---

## Thống kê — Xem tổng quan nghiên cứu

Trang Thống kê được chia thành **6 tab**, dữ liệu cập nhật tự động khi bạn thêm hoặc sửa bệnh nhân. Mỗi biểu đồ cột đều hiển thị số lượng (n) và tỷ lệ phần trăm (%) trên đỉnh cột.

Phía trên cùng có banner cho biết đang thống kê trên bao nhiêu bệnh nhân (những BN bị loại khỏi thống kê sẽ được ghi chú riêng).

### Tab "Tổng quan"

Hiển thị **20 thẻ chỉ số (KPI)** chia thành 5 nhóm:

- **Tổng quan mẫu:** Tổng BN, tuổi trung bình ± SD, tỷ lệ nam/nữ, phân bố nơi ở, tỷ lệ tử vong, số ngày điều trị trung bình
- **Phân tầng & Kết cục:** Điểm PSI trung bình, tỷ lệ PSI III–V, thở máy, sốc nhiễm khuẩn
- **Dấu ấn sinh học (tóm tắt):** Giá trị median của sTREM-1, TIMP-1, IL-6, IL-10, IL-17
- **Chỉ số viêm & Vi sinh:** NLR trung bình, CRP median, PCT median, tỷ lệ cấy VK dương tính

Bên dưới có 3 biểu đồ:
- **Phân bổ PSI:** Biểu đồ tròn hiển thị số BN ở mỗi mức PSI (I → V)
- **Kết cục lâm sàng:** Biểu đồ donut hiển thị tỷ lệ Xuất viện / Tử vong / Xin về / Chuyển tuyến
- **Tiền sử bệnh:** Biểu đồ cột hiển thị các bệnh nền phổ biến (ĐTĐ, THA, thận mạn, suy tim, hút thuốc)

### Tab "Vi sinh (MT1)"

Dành cho **Mục tiêu 1** — đặc điểm căn nguyên vi sinh:

- **4 thẻ KPI:** Tỷ lệ cấy dương tính, tổng chủng VK, tỷ lệ đồng nhiễm (≥2 VK), tỷ lệ có kháng sinh đồ
- **Biểu đồ phân bổ vi khuẩn:** Cột ngang hiển thị Top 10 vi khuẩn hay gặp nhất
- **Bảng kháng sinh đồ (S/I/R):** Heatmap hiển thị mức độ nhạy cảm (S) / trung gian (I) / kháng thuốc (R) của từng vi khuẩn với từng kháng sinh. Ô xanh = nhạy, ô vàng = trung gian, ô đỏ = kháng

### Tab "Biomarker (MT2)"

Dành cho **Mục tiêu 2** — dấu ấn sinh học:

- **Bảng tổng hợp:** Thống kê Mean ± SD và Median (Q1–Q3) cho 5 biomarker: sTREM-1, TIMP-1, IL-6, IL-10, IL-17
- **Biểu đồ Biomarker theo phân tầng PSI:** 5 biểu đồ cột (1 cho mỗi biomarker), hiển thị giá trị median tăng dần theo PSI Class I → V, kèm đường Q1/Q3
- **Biểu đồ NLR/PLR/CAR vs PSI:** 3 biểu đồ phân tán (scatter) thể hiện mối liên quan giữa chỉ số viêm và điểm PSI
- **Biểu đồ tử vong theo PSI:** Biểu đồ cột xếp chồng (stacked) hiển thị số BN sống và tử vong ở mỗi nhóm PSI

### Tab "Dự kiến kết quả NC"

Hiển thị toàn bộ các bảng kết quả nghiên cứu chuẩn mực theo khung luận văn y khoa:
- **Bảng 3.1 (Đặc điểm chung đối tượng nghiên cứu):** Tổng hợp tuổi, giới, BMI, nơi cư trú, bệnh đồng mắc, thói quen hút thuốc, thời gian khởi bệnh, số ngày điều trị nội trú, và **kết cục điều trị** với đầy đủ 4 phân nhóm: *Tiến triển tốt xuất viện*, *Tử vong*, *Xin về*, và ***Chuyển viện / Chuyển tuyến***.
- **Bảng 3.2 – 3.5 (Lâm sàng, Cận lâm sàng, PSI, CURB-65, Hình ảnh học):** Thống kê chi tiết các triệu chứng, xét nghiệm sinh hóa/khí máu/công thức máu và tổn thương X-quang/CT.
- **Bảng 3.6 & 3.6b (Căn nguyên vi sinh & Nhóm không mọc vi khuẩn):** So sánh đặc điểm lâm sàng giữa nhóm không mọc vi khuẩn vs có vi khuẩn (bao gồm *Tử vong*, *Thở máy*, *Phân độ nặng PSI/CURB-65*, và ***Chuyển viện / Chuyển tuyến***).
- **Bảng 3.10 (Biomarker theo kết cục lâm sàng):** So sánh trung vị (Q1–Q3) và kiểm định Mann-Whitney U của 7 biomarkers giữa các cặp kết cục:
  - Mục A: Tử vong vs Sống
  - Mục B: Thở máy vs Không thở máy
  - Mục C: Sốc nhiễm khuẩn vs Không sốc NK
  - Mục D: ***Chuyển viện / Chuyển tuyến vs Không chuyển tuyến***
- **Bảng 3.x (Diễn biến điều trị & Kết cục bổ sung):** Thống kê chi tiết can thiệp hồi sức (Thở máy, Sốc NK, Lọc máu, số ngày lọc máu) và tình trạng ra viện chuẩn 4 nhóm (*Xuất viện*, *Tử vong tại viện*, *Tiên lượng nặng xin về*, ***Chuyển viện / Chuyển tuyến***).
- **Biểu đồ Kaplan-Meier:** Vẽ đường cong sống còn theo thời gian nằm viện.

### Tab "Bảng chéo (m×n)"

Phân tích bảng chéo (cross-tabulation) giữa 2 biến phân loại bất kỳ, được thiết kế khoa học thành **3 khối trực quan, phân màu nền nhẹ nhàng, dễ phân biệt**:

- **Khối 1: Quản lý & Lưu mẫu phân tích (Nền Xanh dương nhạt):**
  - Khung chọn mẫu rộng rãi hiển thị trọn vẹn tên mẫu dài.
  - Bấm **"Lưu thành mẫu..."** để đặt tên và lưu cấu hình cặp biến hiện tại lên Cloud Firestore (dùng chung mọi thiết bị).
  - Nút **"Đổi tên"** (✏️): Sửa tên mẫu đã lưu nhanh chóng.
  - Nút **"Cập nhật"**: Ghi đè cấu hình cặp biến hiện tại vào mẫu đang chọn.
  - Nút **"Mặc định"** (⭐): Đặt mẫu tự động nạp mỗi khi mở tab.
  - Nút **Xóa** (🗑): Xóa mẫu không còn sử dụng.
- **Khối 2: Thêm & Điều chỉnh biến phân tích (Nền Vàng nhạt):**
  - Chọn biến hàng (Row) và biến cột (Column) từ hơn 30+ biến phân loại (Hành chính, Tiền sử, Lâm sàng, PSI, CURB-65, Kết cục...).
  - Thêm/bớt biến linh hoạt vào bộ lọc phân tích thông qua menu "Quản lý biến".
- **Khối 3: Hiển thị kết quả & Diễn giải thống kê y khoa (Nền Trắng):**
  - **Thanh công cụ chuyên dụng:** Đảo thứ tự Hàng/Cột trực tiếp ngay tại bảng, cùng nút bật/tắt hiển thị bảng Tần số kỳ vọng (Expected) và Phần dư chuẩn hóa (Residuals).
  - Bảng chéo quan sát kèm tỷ lệ % hàng/cột/tổng, kiểm định Chi-bình phương ($\chi^2$), Fisher's Exact Test, Odds Ratio (OR), Relative Risk (RR) kèm 95% CI.
  - **Phân tích phần dư chuẩn hóa hiệu chỉnh:** Tự động làm nổi bật các ô có chênh lệch ý nghĩa ($|z| \ge 1.96$, $p < 0.05$).
  - **Diễn giải y khoa tổng hợp:** Tự động soạn thảo đoạn văn chuẩn y khoa có nút **"Sao chép diễn giải"** dán ngay vào luận văn/báo cáo.

### Tab "Hồi quy"

Phân tích hồi quy logistic nhị phân và hồi quy tuyến tính — kết quả tương đương SPSS, được cấu trúc đồng bộ thành **3 khối chuyên biệt**:

- **Khối 1: Quản lý & Lưu mẫu hồi quy (Nền Xanh dương nhạt):**
  - Quản lý các mẫu mô hình hồi quy (đơn biến, đa biến, biến Y, biến X).
  - Đầy đủ tính năng: Lưu thành mẫu, Đổi tên, Cập nhật cấu hình, Đặt làm mặc định khi mở tab, và Xóa mẫu.
- **Khối 2: Thiết lập mô hình & Điều chỉnh biến (Nền Vàng nhạt):**
  - Chọn loại hồi quy: **Logistic nhị phân** (Y nhị phân 0/1: Tử vong, Chuyển tuyến, Biến cố nặng...) hoặc **Tuyến tính** (Y liên tục: ngày điều trị, bạch cầu, điểm PSI...).
  - Chọn phương pháp: **Đơn biến** (chạy từng biến X riêng lẻ) hoặc **Đa biến** (nhiều biến X đồng thời để kiểm soát yếu tố gây nhiễu).
  - Chọn biến phụ thuộc (Y) và biến độc lập (X).
  - Bấm nút **"Chạy hồi quy"**.
- **Khối 3: Hiển thị kết quả & Diễn giải mô hình hồi quy (Nền Trắng):**
  - *Hồi quy Logistic:* Omnibus Test, Model Summary (-2LL, Cox & Snell R², Nagelkerke R²), Hosmer-Lemeshow Test, Bảng hệ số Variables in Equation (B, S.E., Wald, p, Exp(B)/OR, 95% CI), Ma trận phân loại đúng (Classification Table).
  - *Hồi quy Tuyến tính:* Model Summary (R, R², Adjusted R², Std. Error, Durbin-Watson), Bảng ANOVA (F, p), Bảng Coefficients (B, Beta, t, p, 95% CI, VIF/Tolerance).
  - Biểu đồ Forest Plot trực quan hóa Odds Ratio kèm khoảng tin cậy 95% CI.

---

## Cài đặt — Tùy chỉnh phần mềm

Trang Cài đặt có **6 tab**:

### Tab "Hành chính" — Quản lý danh mục nhập liệu

Ở đây bạn quản lý các danh sách lựa chọn sẽ xuất hiện khi nhập liệu bệnh nhân:

- **Dữ liệu địa chỉ:** Import file Excel danh sách xã/phường trong khu vực nghiên cứu. Phần mềm có sẵn nút "Tải template" để bạn lấy mẫu Excel, điền xong thì bấm "Import Excel" để nạp vào. Sau đó, khi nhập bệnh nhân, ô địa chỉ sẽ gợi ý tự động từ danh sách này.
- **Danh sách nghề nghiệp:** Thêm, sửa, xóa các mục nghề nghiệp. Nghề nghiệp nào đang có bệnh nhân sử dụng sẽ không xóa được.
- **Danh sách nơi ở:** Quản lý các phân loại nơi ở (Nông thôn, Thành thị...).

### Tab "Lâm sàng" — Quản lý danh mục kết cục

- **Diễn biến điều trị:** Danh sách các diễn biến như: Thở máy, Sốc nhiễm khuẩn, Lọc máu... Bệnh nhân có thể chọn nhiều mục cùng lúc.
- **Tình trạng ra viện:** Danh sách như: Khỏi, Đỡ, Không đỡ, Nặng hơn, Chuyển tuyến... Bệnh nhân chỉ chọn 1 mục.

### Tab "Vi khuẩn" — Quản lý danh mục vi sinh

- **Danh sách vi khuẩn:** Thêm, sửa, xóa tên các loại vi khuẩn. Vi khuẩn nào đã gắn với bệnh nhân thì không xóa được.
- **Danh sách kháng sinh:** Tương tự, quản lý các kháng sinh dùng trong kháng sinh đồ.

### Tab "Thuốc" — Quản lý danh mục thuốc

Quản lý danh sách thuốc dùng trong phần nhập tiền sử thuốc của bệnh nhân: thuốc nhóm 1 (tên biệt dược), thuốc nhóm 2 (tên gốc). Thuốc nào đang được bệnh nhân sử dụng sẽ không xóa được.

### Tab "BANC" — Tùy biến xuất & in bệnh án nghiên cứu

Tab BANC được chia làm **2 subtab** chuyên biệt:

#### 1. Subtab "Xuất BANC (Tùy chỉnh biến)"
Cho phép bạn linh hoạt bật hoặc tắt hiển thị từng biến trong toàn bộ các trường dữ liệu của bệnh nhân trên Bệnh án nghiên cứu:
- **Tắt biến:** Khi tắt một biến, biến đó sẽ **ẩn hoàn toàn** khỏi bản in và file PDF BANC (không để lại dòng trống hay gạch ngang).
- **Phân loại theo nhóm & Nút Mở rộng (Expand):**
  - Các biến được chia gọn gàng theo 8 nhóm mục lớn (Hành chính, Tiền sử, Lâm sàng, Cận lâm sàng, Hình ảnh, Vi khuẩn, Phân độ, Kết cục).
  - **Toggle cả nhóm mục:** Nút *"Bật cả nhóm"* / *"Tắt cả nhóm"* ngay trên thanh tiêu đề của mỗi phân mục giúp bật hoặc tắt nhanh toàn bộ biến trong nhóm mà không cần mở danh sách.
  - **Nút Mở rộng (Expand) nhóm mục:** Mỗi phân mục có nút *"Mở rộng"* / *"Thu gọn"* để xem danh sách các hộp biến bên trong.
- **Hộp nhóm biến đa thành phần & Nút "Chi tiết" bung biến con:**
  - Đối với các biến chứa nhiều chỉ số thành phần (như: *Diễn biến điều trị* gồm Thở máy, Sốc NK, Lọc máu; *Tình trạng ra viện* gồm Xuất viện, Tử vong, Xin về, Chuyển tuyến; *Kháng sinh*; *Dấu hiệu sinh tồn*; *Công thức máu*; *CURB-65*;...):
    - **Công tắc cả nhóm biến:** Cho phép bật hoặc tắt toàn bộ nhóm biến đó chỉ với một gạt công tắc (bật/tắt cả nhóm sẽ bật/tắt toàn bộ các biến con bên trong).
    - **Nút "Chi tiết" / "Thu gọn":** Bấm nút *"Chi tiết"* ngay trong hộp để mở rộng panel danh sách các biến con bên trong.
    - **Tùy chỉnh từng biến con:** Mỗi biến con có công tắc bật/tắt riêng biệt, giúp bạn tùy chỉnh chi tiết từng trường theo yêu cầu nghiên cứu (ví dụ: trong Diễn biến điều trị, bạn có thể tắt *Thở máy*, chỉ giữ lại *Sốc nhiễm khuẩn* và *Lọc máu*).
    - **Huy hiệu & Tự động đồng bộ thông minh:** Hộp hiển thị số biến con đang bật (ví dụ: `2/3 biến con`). Khi bạn bật bất kỳ biến con nào, nhóm cha sẽ tự động bật; khi tắt tất cả biến con, nhóm cha sẽ tự động chuyển sang trạng thái tắt.
- **Tùy chọn nâng cao:** Tùy chọn **"Hiển thị phân tầng PSI (mức độ nặng)"** nằm ngay dưới cùng của subtab Xuất BANC, cho phép bật/tắt in mức độ phân tầng (Class I → V) đi kèm tổng điểm PSI.
- **Nút "Xem trước" (Preview) BANC:**
  - Nút **"Xem trước"** (biểu tượng con mắt 👁️) nằm ngay trên thanh công cụ của Cấu hình biến BANC.
  - Khi bấm, màn hình xem trước toàn màn hình sẽ hiển thị chính xác hình dạng bản in BANC trên trang giấy thực tế với đầy đủ: cỡ giấy, căn lề (cm), cỡ chữ (px), tiêu đề in, phần ký tên, tùy chọn phân tầng PSI và các biến đã bật/tắt.
  - Tích hợp bộ điều khiển **Thu phóng (Zoom: 80% → 150%)** và cuộn xem mượt mà trọn vẹn toàn bộ các trang A4.
  - Cho phép chuyển đổi linh hoạt giữa **Mẫu chuẩn** (đầy đủ dữ liệu demo mọi trường) và **Bệnh nhân thực tế** có trong nghiên cứu.
  - Có sẵn nút **"In / Xuất PDF"** ngay trong khung xem trước để in hoặc xuất file PDF qua trình duyệt.
- **Công cụ thao tác nhanh:**
  - Ô **Tìm kiếm** theo tên hoặc mã biến (tự động mở rộng các nhóm có chứa biến phù hợp).
  - Nút **"Bật tất cả"** / **"Tắt tất cả"** cho toàn bộ bệnh án hoặc từng phân mục riêng.
  - Nút **"Mở rộng tất cả"** / **"Thu gọn tất cả"** để đóng/mở nhanh cả 8 nhóm biến chỉ bằng một cú nhấp chuột.
  - Nút **"Mặc định"** để khôi phục cấu hình chuẩn ban đầu.
- Cấu hình này được tự động đồng bộ lên máy chủ (Cloud Firestore) và lưu trong bộ nhớ máy tính để sử dụng nhất quán trên mọi thiết bị.

#### 2. Subtab "In BANC (Cấu hình trang & Ký)"
Chứa toàn bộ các thiết lập định dạng trang in:
- **Cỡ giấy:** Chọn A4, A5 hoặc Letter.
- **Căn lề:** Chỉnh lề trên, dưới, trái, phải (tính bằng cm).
- **Cỡ chữ:** Điều chỉnh kích thước chữ trên bản in (mặc định 13px).
- **Tiêu đề in:** Nhập 2 dòng tiêu đề đầu trang (ví dụ: dòng 1 "SỞ Y TẾ HẢI PHÒNG", dòng 2 "TTYT THỦY NGUYÊN").
- **Tiêu đề ký:** Nhập chức danh ký bên trái (VD: "TRƯỞNG KHOA") và bên phải (VD: "BÁC SĨ ĐIỀU TRỊ").

### Tab "SPSS Variables" — Cấu hình xuất file SPSS

Đây là nơi bạn quản lý cách dữ liệu được tổ chức khi xuất ra file SPSS (`.sav`).

**Cấu hình số slot (dữ liệu có thể thay đổi theo bệnh nhân):**

Vì SPSS yêu cầu số cột cố định, các trường thay đổi số lượng (ảnh X-quang, CT, vi khuẩn...) được trải thành nhiều cột. Bạn điều chỉnh số slot tối đa cho từng loại:

| Loại dữ liệu | Mặc định |
|---|---|
| X-quang tổn thương | 5 slot |
| CT tổn thương | 5 slot |
| Vi khuẩn | 5 slot |
| Kháng sinh / vi khuẩn | 15 slot |
| Thuốc đã dùng | 10 slot |

Sau khi thay đổi, bấm **"Áp dụng slot config"** để lưu. Phần mềm hiển thị tổng số biến ước tính.

**Bảng biến SPSS:**

Danh sách toàn bộ biến (200+ biến), chia theo nhóm:
- **Hành chính:** mã BN, tuổi, giới tính, địa chỉ...
- **Tiền sử:** đái tháo đường, tăng huyết áp... (mã 0/1)
- **Lâm sàng:** mạch, huyết áp, nhiệt độ, triệu chứng...
- **Xét nghiệm:** WBC, CRP, PCT, biomarker...
- **PSI / CURB-65:** các tiêu chí và tổng điểm
- **Kết cục:** diễn biến điều trị, tình trạng ra viện, đặc biệt đã tích hợp đầy đủ biến **"Chuyển tuyến" (`kc_chuyen_tuyen`)** và biến **"Biến cố nặng" (`kc_ket_cuc_nang`)**...

Bạn có thể:
- **Tìm kiếm** theo tên biến hoặc nhãn
- **Lọc** theo nhóm biến
- **Sửa** tên biến và nhãn bằng cách bấm biểu tượng bút chì ✏️
- **Sửa bảng mã** (value labels) bằng cách bấm vào số bên cột "Bảng mã"
- **Đồng bộ biến mới (🔄):** Tự động kiểm tra và bổ sung các biến chuẩn mới của hệ thống (như Chuyển tuyến, Biến cố nặng) vào profile hiện tại mà không làm mất các chỉnh sửa riêng của bạn.
- **Khôi phục chuẩn mặc định:** Đặt lại toàn bộ danh sách biến về cấu hình chuẩn ban đầu của hệ thống.

Biến có nhãn `[template]` là biến động — sẽ được nhân ra đủ slot khi xuất file.

Bấm **"Xuất SPSS (.sav)"** để xuất ngay file với cấu hình đã thiết lập.

### Tab "Backup" — Sao lưu và khôi phục dữ liệu

Đây là nơi bạn quản lý các bản sao lưu dữ liệu. Có 2 sub-tab: **Danh sách** và **Tìm kiếm**.

**Tạo bản sao lưu:**  
Bấm nút "Tạo backup" → phần mềm lưu toàn bộ dữ liệu lên cloud. Mỗi bản backup hiển thị: tên, ngày tạo, số bệnh nhân, dung lượng. Bạn có thể đổi tên hoặc xóa bản backup.

> Lưu ý: Phần mềm cũng tự động sao lưu mỗi khi bạn thêm mới hoặc cập nhật bệnh nhân (bản backup tự động sẽ ghi chú "Tự động").

**Nhập dữ liệu từ Excel:**  
Bấm "Import Excel" → chọn file `.xlsx` (cùng định dạng với file Xuất Excel) → dữ liệu sẽ nạp vào hệ thống. Phần mềm tự phát hiện bệnh nhân trùng và cho bạn xem xét trước khi ghi đè.

**Xem nội dung bản backup:**  
Bấm biểu tượng con mắt (👁) → bảng bên dưới hiện ra danh sách bệnh nhân trong bản backup đó.

**Khôi phục dữ liệu từ backup:**  
Bạn có thể khôi phục theo 2 cách:

*Cách 1 — Khôi phục 1 bệnh nhân:*  
Mở rộng bản backup → bấm nút khôi phục (🔄) trên hàng bệnh nhân muốn khôi phục → Phần mềm tự so sánh và đưa ra 1 trong 3 kết quả:
- BN chưa tồn tại → thêm mới ngay (tự gán mã nghiên cứu tiếp theo)
- BN đã có và giống hệt → thông báo không cần khôi phục
- BN đã có nhưng khác → hiện bảng so sánh chi tiết từng trường, bạn chọn có ghi đè hay không

*Cách 2 — Khôi phục nhiều bệnh nhân:*  
Bấm nút khôi phục trên bản backup → Bước 1: tích chọn BN muốn khôi phục → Bước 2: phần mềm phân tích tự động và thông báo:
- Bao nhiêu BN mới (sẽ thêm tự động)
- Bao nhiêu BN giống hệt (sẽ bỏ qua)
- Bao nhiêu BN trùng nhưng có khác biệt (cho bạn chọn ghi đè từng BN)

> Khi ghi đè, phần mềm giữ nguyên mã nghiên cứu cũ (không bị đổi mã). Khi thêm BN mới, phần mềm tự gán mã tiếp theo (ví dụ: đang có CAP008 thì BN mới sẽ là CAP009).

**Tìm kiếm trong backup:**  
Chuyển sang sub-tab "Tìm kiếm" → nhập tên hoặc mã BN → chọn tìm trong tất cả backup hoặc 1 backup cụ thể → kết quả hiện BN tìm thấy kèm tên backup chứa BN đó. Từ đây bạn có thể xem chi tiết hoặc khôi phục ngay.

---

## Một số lưu ý chung

- **Dữ liệu lưu trên cloud:** Bạn có thể truy cập từ máy tính, điện thoại, tablet — chỉ cần có trình duyệt và Internet.
- **Tự động sao lưu:** Mỗi lần thêm hoặc sửa bệnh nhân, hệ thống tự tạo 1 bản backup để đề phòng. Bạn không cần làm gì thêm.
- **Không mất dữ liệu khi sửa dở:** Nếu đang nhập liệu mà chưa lưu, phần mềm sẽ nhắc nhở khi bạn cố thoát ra.
- **Danh mục tùy chỉnh được:** Tất cả các danh sách lựa chọn (nghề nghiệp, nơi ở, vi khuẩn, kháng sinh, diễn biến điều trị...) đều do bạn quản lý ở phần Cài đặt. Thêm bớt thoải mái để phù hợp với nghiên cứu.
