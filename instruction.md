# Hướng dẫn sử dụng phần mềm CAP Research

## Phần mềm này dùng để làm gì?

**CAP Research** là phần mềm quản lý dữ liệu nghiên cứu bệnh nhân viêm phổi cộng đồng (Community-Acquired Pneumonia). Phần mềm giúp bạn:

- **Thu thập dữ liệu** bệnh nhân một cách có hệ thống theo 8 nhóm thông tin (từ hành chính đến kết cục điều trị)
- **Lưu trữ an toàn** trên đám mây (Firebase), truy cập được từ mọi thiết bị có trình duyệt web
- **Xuất dữ liệu** ra Excel để phân tích thống kê
- **In bệnh án nghiên cứu** (BANC) theo mẫu tùy chỉnh
- **Sao lưu và khôi phục** dữ liệu để tránh mất mát
- **Xem thống kê nhanh** về tình hình nghiên cứu (tổng BN, tỷ lệ tử vong, phân bố vi khuẩn, phân bố PSI)

---

## Cách đăng nhập

Mở trình duyệt web (Chrome, Safari, Edge đều được), truy cập vào địa chỉ phần mềm. Nhập email và mật khẩu để đăng nhập.

Sau khi vào, bạn sẽ thấy thanh menu bên trái với 3 mục chính: **Bệnh nhân**, **Thống kê**, và **Cài đặt**.

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
Nhập diễn biến điều trị (thở máy, sốc nhiễm khuẩn, lọc máu...), tình trạng ra viện, tử vong hay không, ngày bắt đầu và kết thúc kháng sinh, tổng số ngày điều trị.

### Lưu và các thao tác khác

- Bấm **💾 Lưu** để lưu dữ liệu. Phần mềm sẽ kiểm tra tính hợp lệ trước khi lưu (ví dụ: ngày ra viện phải sau ngày vào viện).
- Bấm **🖨 In** để in bệnh án nghiên cứu cho bệnh nhân đang mở.
- Bấm **← BN trước** hoặc **BN sau →** để chuyển nhanh sang bệnh nhân khác mà không cần quay về danh sách.
- Nếu bạn đang sửa dở mà chưa lưu, phần mềm sẽ cảnh báo khi bạn rời trang để tránh mất dữ liệu.

---

## Thống kê — Xem tổng quan nghiên cứu

Trang Thống kê được chia thành **3 tab**, dữ liệu cập nhật tự động khi bạn thêm hoặc sửa bệnh nhân. Mỗi biểu đồ cột đều hiển thị số lượng (n) và tỷ lệ phần trăm (%) trên đỉnh cột.

### Tab "Tổng quan"

Hiển thị **20 thẻ chỉ số (KPI)** chia thành 5 nhóm:

- **Tổng quan mẫu:** Tổng BN, tuổi trung bình ± SD, tỷ lệ nam/nữ, phân bố nơi ở, tỷ lệ tử vong, số ngày điều trị trung bình
- **Phân tầng & Kết cục:** Điểm PSI trung bình, tỷ lệ PSI III–V, thở máy, sốc nhiễm khuẩn
- **Dấu ấn sinh học (tóm tắt):** Giá trị median của sTREM-1, TIMP-1, IL-6, IL-10, IL-17
- **Chỉ số viêm & Vi sinh:** NLR trung bình, CRP median, PCT median, tỷ lệ cấy VK dương tính

Bên dưới có 3 biểu đồ:
- **Phân bổ PSI:** Biểu đồ tròn hiển thị số BN ở mỗi mức PSI (I → V)
- **Kết cục lâm sàng:** Biểu đồ donut hiển thị tỷ lệ Xuất viện / Tử vong / Xin về
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

---

## Cài đặt — Tùy chỉnh phần mềm

Trang Cài đặt có 5 tab dọc ngang:

### Tab "Hành chính" — Quản lý danh mục nhập liệu

Ở đây bạn quản lý các danh sách lựa chọn sẽ xuất hiện khi nhập liệu bệnh nhân:

- **Dữ liệu địa chỉ:** Import file Excel danh sách xã/phường trong khu vực nghiên cứu. Phần mềm có sẵn nút "Tải template" để bạn lấy mẫu Excel, điền xong thì bấm "Import Excel" để nạp vào. Sau đó, khi nhập bệnh nhân, ô địa chỉ sẽ gợi ý tự động từ danh sách này.
- **Danh sách nghề nghiệp:** Thêm, sửa, xóa các mục nghề nghiệp. Nghề nghiệp nào đang có bệnh nhân sử dụng sẽ không xóa được.
- **Danh sách nơi ở:** Quản lý các phân loại nơi ở (Nông thôn, Thành thị...).

### Tab "Lâm sàng" — Quản lý danh mục kết cục

- **Diễn biến điều trị:** Danh sách các diễn biến như: Thở máy, Sốc nhiễm khuẩn, Lọc máu... Bệnh nhân có thể chọn nhiều mục cùng lúc.
- **Tình trạng ra viện:** Danh sách như: Khỏi, Đỡ, Không đỡ, Nặng hơn... Bệnh nhân chỉ chọn 1 mục.

### Tab "Vi khuẩn" — Quản lý danh mục vi sinh

- **Danh sách vi khuẩn:** Thêm, sửa, xóa tên các loại vi khuẩn. Vi khuẩn nào đã gắn với bệnh nhân thì không xóa được.
- **Danh sách kháng sinh:** Tương tự, quản lý các kháng sinh dùng trong kháng sinh đồ.

### Tab "In BANC" — Cài đặt trang in bệnh án nghiên cứu

Tùy chỉnh bản in bệnh án nghiên cứu theo ý bạn:
- **Cỡ giấy:** Chọn A4, A5 hoặc Letter
- **Căn lề:** Chỉnh lề trên, dưới, trái, phải (tính bằng cm)
- **Cỡ chữ:** Điều chỉnh kích thước chữ trên bản in
- **Tiêu đề in:** Nhập 2 dòng tiêu đề đầu trang (ví dụ: dòng 1 "SỞ Y TẾ HẢI PHÒNG", dòng 2 "TTYT THỦY NGUYÊN")
- **Tiêu đề ký:** Nhập chức danh ký bên trái (VD: "TRƯỞNG KHOA") và bên phải (VD: "BÁC SĨ ĐIỀU TRỊ")
- **Hiển thị PSI:** Bật/tắt việc in phân tầng PSI trên bệnh án

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
