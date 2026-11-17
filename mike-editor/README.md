# Mike Editor

Trình chỉnh sửa video đa lớp nền web (Web-based Timeline Video Editor) tích hợp sẵn hệ thống LUT màu, hiệu ứng VFX, chuyển cảnh, style chữ, keyframes và kho âm thanh SFX/BGM tổng hợp tự động.

## Tính năng chính

- Giao diện timeline trực quan (`public/index.html`, `public/app.js`, `public/styles.css`).
- Hỗ trợ đa khung hình: `9:16` (Reels/TikTok), `16:9` (YouTube/Ngang), `1:1` (Instagram).
- Bộ preset phong phú trong `catalog-generator.js`: Color LUTs, VFX filters, graphic presets, text styles, font presets và transitions.
- Tự động sinh bộ SFX/BGM (`bgm`, `foley`, `impact`, `meme`, `musical`, `scifi`, `transition`, `ui`) qua `generate-sfx.js`.
- Backend Node.js (`server.js`) chạy tại `http://127.0.0.1:5230` hỗ trợ lưu `project.json`, `history.json`, quản lý upload và xuất render video.

## Cách chạy

1. Đảm bảo đã cài đặt **Node.js** và **FFmpeg** trong PATH.
2. Khởi động server:
   ```bash
   node server.js
   ```
3. Mở trình duyệt tại `http://127.0.0.1:5230`.
