# Irregular Verbs Challenge

Website tĩnh chạy trên GitHub Pages, dùng Firebase Authentication (anonymous) và Cloud Firestore. Các collection đều có tiền tố `verbQuiz_` để không trùng dữ liệu ứng dụng Chiên Con.

## 1. Chuẩn bị Firebase project Chiên Con

1. Mở [Firebase Console](https://console.firebase.google.com/) và chọn project Chiên Con.
2. Vào **Project settings → General → Your apps**.
3. Nếu chưa có Web App, bấm **Add app → Web** (biểu tượng `</>`), đặt tên ví dụ `Irregular Verbs Challenge`. Không cần bật Firebase Hosting.
4. Copy cấu hình `firebaseConfig` của Web App.
5. Vào **Authentication → Sign-in method** và bật **Anonymous**.
6. Vào **Firestore Database → Rules**, thêm các rule trong file `firestore.rules` vào rules hiện tại. Nếu project đã có rules cho ứng dụng Chiên Con, hãy GIỮ NGUYÊN các rule đó và chỉ ghép thêm các `match /verbQuiz_...` tương ứng bên trong `match /databases/{database}/documents`.
7. Publish rules.

## 2. Điền Firebase config

Mở `app.js`, thay nội dung object `firebaseConfig` bằng cấu hình Web App vừa copy. Ví dụ:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

Không dùng service account/private key trong website. Firebase Web config được thiết kế để dùng ở frontend; quyền truy cập dữ liệu phải được kiểm soát bằng Firestore Security Rules.

## 3. Đưa lên GitHub Pages

1. Tạo một repository GitHub, ví dụ `irregular-verbs-challenge`.
2. Upload `index.html`, `style.css`, `app.js`, `firestore.rules`, `README.md` lên thư mục gốc của repository.
3. Vào **Settings → Pages**.
4. Chọn **Deploy from a branch**, branch `main`, folder `/ (root)`, bấm Save.
5. Chờ GitHub build, website sẽ có địa chỉ dạng `https://TEN-GITHUB.github.io/irregular-verbs-challenge/`.

## 4. Định dạng dữ liệu từ vựng

Một dòng gồm `Tiếng Việt-Verb 1-Verb 2-Verb 3;`:

```text
thì, là, ở-be-was, were-been;
bắt đầu-begin-began-begun;
mua-buy-bought-bought;
```

Có thể dùng nút **Nhập danh sách** để import file `.txt` hoặc `.csv` có định dạng trên; hoặc file `.json` dạng mảng object `{ "vi": "...", "v1": "...", "v2": "...", "v3": "..." }`.

## 5. Cách dùng

- Chủ phòng nhập tên, số từ rồi chọn **Tạo mã phòng**.
- Học viên nhập tên và mã phòng để tham gia.
- Chủ phòng bấm **Bắt đầu kiểm tra**.
- Mỗi học viên nhận bộ từ ngẫu nhiên riêng, điền ba dạng động từ rồi nộp bài.
- Chủ phòng xem bảng xếp hạng và bấm **Xem bài** để xem chi tiết từng người.

## 6. Lưu ý quan trọng về bảo mật và chi phí

Bản đầu tiên này dùng Firebase client SDK, không có Cloud Functions/server riêng. Do yêu cầu không có mật khẩu quản trị, người dùng đã truy cập có thể thêm/xóa từ trong ngân hàng. Dữ liệu đáp án trong Firestore cũng có thể được người dùng am hiểu kỹ thuật đọc; đây là bản phù hợp cho lớp học/hoạt động thân thiện, chưa phải kỳ thi chống gian lận. Nếu cần chống xem đáp án, giới hạn quyền chủ phòng, khóa sửa bài sau nộp và kiểm tra điểm ở server, cần bổ sung Cloud Functions hoặc backend có xác thực quyền.

Anonymous Authentication tạo một Firebase user ẩn danh cho mỗi trình duyệt/thiết bị. Nếu người dùng xóa dữ liệu trình duyệt hoặc đổi thiết bị, Firebase cấp UID khác. Bản này chưa có cơ chế khôi phục tài khoản hoặc chống một người tham gia nhiều lần bằng nhiều trình duyệt.

Firestore có thể phát sinh chi phí theo lượt đọc/ghi và lưu trữ. Hãy kiểm tra usage và billing của Firebase project hiện tại trước khi chia sẻ rộng rãi. Không thay toàn bộ Firestore Rules hiện tại bằng file mẫu này nếu project đang có ứng dụng Chiên Con chạy production.

## Resume bài kiểm tra (bản cập nhật)
- Đáp án được tự động lưu vào `localStorage` trên trình duyệt mỗi khi người chơi nhập.
- Khi mở lại website bằng cùng trình duyệt/tài khoản ẩn danh Firebase, website hỏi có muốn tiếp tục bản nháp cũ không.
- Bản nháp lưu mã phòng, tên người chơi, bộ câu hỏi, câu trả lời và thời điểm lưu.
- Bản nháp tự hết hạn sau 30 ngày; khi nộp bài thành công sẽ xóa bản nháp.
- Khôi phục chỉ hoạt động trên cùng trình duyệt/thiết bị; dữ liệu local bị xóa hoặc đổi thiết bị thì không thể khôi phục bản nháp này.
