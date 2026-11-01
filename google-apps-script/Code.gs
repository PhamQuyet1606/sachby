/**
 * Nhận lead từ landing page Sạch By và ghi vào Google Sheet.
 * Cách cài: xem README.md, mục "Nối form với Google Sheets".
 *
 * @OnlyCurrentDoc  Chỉ xin quyền với đúng Google Sheet chứa script này.
 */
var SHEET_NAME = "Leads";
var HEADERS = [
  "Thời gian", "Số điện thoại", "Cân nặng", "Số bé", "Thông điệp",
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "Trang", "Referrer", "Trạng thái", "Ghi chú"
];

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Ô ẩn chống bot: nếu có giá trị thì bỏ qua.
  if (p.website) return reply_("ok");

  var phone = String(p.phone || "").replace(/\D/g, "");
  if (!/^0[35789]\d{8}$/.test(phone)) return reply_("invalid");

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      new Date(),
      "'" + phone, // giữ số 0 ở đầu
      safe_(p.weight), safe_(p.cats), safe_(p.variant),
      safe_(p.utm_source), safe_(p.utm_medium), safe_(p.utm_campaign),
      safe_(p.utm_content), safe_(p.utm_term), safe_(p.fbclid),
      safe_(p.page), safe_(p.referrer),
      "Mới", ""
    ]);
  } finally {
    lock.releaseLock();
  }
  return reply_("ok");
}

// Chặn công thức bị chèn vào ô (=, +, -, @) và giới hạn độ dài.
function safe_(v) {
  var s = String(v == null ? "" : v).slice(0, 300);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply_(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.TEXT);
}
