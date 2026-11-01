// Cấu hình landing page. Chỉ cần sửa file này, không phải đụng vào code khác.
window.SACHBY_CONFIG = {
  // URL Web App của Google Apps Script (xem README, mục "Nối form với Google Sheets").
  // Để trống thì form chỉ chạy thử được trên máy (localhost), không lưu lead.
  FORM_ENDPOINT: "https://script.google.com/macros/s/AKfycbxcdGPsA92YATxsLrs-pq2Z16bg1SKglZyqFW_MGQ1OGA8i3wrzqnPHsGfU0SoULbuV/exec",

  // ID Meta Pixel (dãy số trong Events Manager). Để trống thì không tải Pixel.
  META_PIXEL_ID: "",

  // Link Zalo để khách nhắn trực tiếp, ví dụ "https://zalo.me/0912345678".
  // Để trống thì ẩn các nút Zalo.
  ZALO_URL: "",

  // Giá dùng làm giá trị chuyển đổi gửi cho Meta (VND).
  PRICE_UNDER_5KG: 190000,
  PRICE_FROM_5KG: 250000,
};
