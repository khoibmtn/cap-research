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

### Bước 7 — PSI
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

Trang này cho bạn cái nhìn nhanh về tình trạng nghiên cứu:

- **Tổng số bệnh nhân** đã nhập
- **Tỷ lệ tử vong** (%)
- **Điểm PSI trung bình**
- **Số bệnh nhân thở máy**

Bên dưới có 2 biểu đồ:
- **Biểu đồ phân bố vi khuẩn**: cột ngang hiển thị top 10 vi khuẩn hay gặp nhất
- **Biểu đồ phân bố PSI**: hình tròn hiển thị tỷ lệ bệnh nhân ở mỗi mức PSI (Class I đến V)

Dữ liệu cập nhật tự động khi bạn thêm hoặc sửa bệnh nhân.

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
