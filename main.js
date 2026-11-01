(function () {
  "use strict";

  var cfg = window.SACHBY_CONFIG || {};

  // ---------- Meta Pixel ----------
  if (cfg.META_PIXEL_ID) {
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq("init", cfg.META_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  function track(eventName, data) {
    if (typeof window.fbq === "function") window.fbq("track", eventName, data || {});
  }

  // ---------- Nguồn quảng cáo (UTM) ----------
  var TRACK_KEYS = ["v", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
  var params = new URLSearchParams(window.location.search);
  var attribution = {};
  try { attribution = JSON.parse(sessionStorage.getItem("sachby_attr") || "{}"); } catch (e) { attribution = {}; }
  var hasNew = TRACK_KEYS.some(function (k) { return params.has(k); });
  if (hasNew) {
    attribution = {};
    TRACK_KEYS.forEach(function (k) { if (params.has(k)) attribution[k] = params.get(k).slice(0, 200); });
    try { sessionStorage.setItem("sachby_attr", JSON.stringify(attribution)); } catch (e) { /* bỏ qua */ }
  }

  // ---------- Tiêu đề theo thông điệp quảng cáo ----------
  // Link quảng cáo thêm ?v=khongstress (hoặc minhbach, vesinh, tutam) để tiêu đề khớp với quảng cáo.
  var VARIANTS = {
    minhbach: {
      h: "Bé không phải rời nhà. Bạn được thấy từng bước.",
      s: "Groomer đến tận nơi tắm, sấy khô hoàn toàn, cắt móng và vệ sinh tai cho bé, rồi dọn sạch lông trước khi về."
    },
    khongstress: {
      h: "Tắm sấy cho mèo mà bé không phải rời khỏi nhà.",
      s: "Không lồng, không xe, không phòng chờ đông thú lạ. Groomer đến tận nơi, bé ở yên trong góc quen của mình."
    },
    vesinh: {
      h: "Dụng cụ tiệt trùng riêng cho từng bé, mở ngay trước mặt bạn.",
      s: "Không dùng chung với thú khác, không lo lây bệnh. Groomer tắm, sấy khô hoàn toàn và dọn sạch lông ngay tại nhà bạn."
    },
    tutam: {
      h: "Không còn tự tắm, tự sấy, tự dọn lông khắp nhà.",
      s: "Groomer đến tận nơi tắm, sấy khô hoàn toàn để tránh nấm da, cắt móng, vệ sinh tai và dọn sạch lông trước khi về."
    }
  };
  var variantKey = (attribution.v || attribution.utm_content || "").toLowerCase();
  var variant = VARIANTS[variantKey];
  if (variant) {
    document.querySelector(".js-headline").textContent = variant.h;
    document.querySelector(".js-subline").textContent = variant.s;
  }

  // ---------- Nút Zalo ----------
  if (cfg.ZALO_URL) {
    document.querySelectorAll(".js-zalo").forEach(function (a) {
      a.href = cfg.ZALO_URL;
      a.hidden = false;
      a.addEventListener("click", function () { track("Contact", { method: "zalo" }); });
    });
  }

  // ---------- Nút đặt lịch dính đáy (mobile) ----------
  var sticky = document.querySelector(".js-sticky");
  var hero = document.querySelector(".hero");
  var booking = document.getElementById("dat-lich");
  if (sticky && "IntersectionObserver" in window) {
    var heroVisible = true, bookingVisible = false;
    var update = function () {
      var show = !heroVisible && !bookingVisible;
      sticky.classList.toggle("is-visible", show);
      sticky.setAttribute("aria-hidden", show ? "false" : "true");
      sticky.tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (entries) { heroVisible = entries[0].isIntersecting; update(); }).observe(hero);
    new IntersectionObserver(function (entries) { bookingVisible = entries[0].isIntersecting; update(); }, { rootMargin: "0px 0px -20% 0px" }).observe(booking);
  }

  // ---------- Form ----------
  var form = document.querySelector(".js-form");
  var success = document.querySelector(".js-success");
  var submitBtn = document.querySelector(".js-submit");
  var formError = document.querySelector(".js-form-error");
  var phoneInput = form.elements.phone;

  function normalizePhone(raw) {
    var d = String(raw || "").replace(/[^\d+]/g, "");
    if (d.indexOf("+84") === 0) d = "0" + d.slice(3);
    else if (d.indexOf("84") === 0 && d.length === 11) d = "0" + d.slice(2);
    return d.replace(/\D/g, "");
  }
  function isValidPhone(p) { return /^0[35789]\d{8}$/.test(p); }

  function setError(name, msg) {
    var el = form.querySelector('[data-error-for="' + name + '"]');
    if (el) el.textContent = msg || "";
    if (name === "phone") phoneInput.setAttribute("aria-invalid", msg ? "true" : "false");
    if (name === "weight") form.querySelector('fieldset .chips').classList.toggle("is-invalid", !!msg);
  }

  phoneInput.addEventListener("input", function () { setError("phone", ""); formError.textContent = ""; });
  form.querySelectorAll('input[name="weight"]').forEach(function (r) {
    r.addEventListener("change", function () { setError("weight", ""); formError.textContent = ""; });
  });

  var started = false;
  form.addEventListener("focusin", function () {
    if (!started) { started = true; track("InitiateCheckout"); }
  });

  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(window.location.hostname);
  var sending = false;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;
    formError.textContent = "";

    var phone = normalizePhone(phoneInput.value);
    var weightEl = form.querySelector('input[name="weight"]:checked');
    var catsEl = form.querySelector('input[name="cats"]:checked');
    var ok = true;

    if (!phone) { setError("phone", "Nhập số điện thoại để bọn mình liên hệ nhé."); ok = false; }
    else if (!isValidPhone(phone)) { setError("phone", "Số điện thoại chưa đúng, kiểm tra lại giúp mình nhé."); ok = false; }
    if (!weightEl) { setError("weight", "Chọn cân nặng của bé nhé."); ok = false; }
    if (!ok) {
      (phone && isValidPhone(phone) ? form.querySelector('input[name="weight"]') : phoneInput).focus();
      return;
    }

    // Bot điền ô ẩn: giả vờ thành công, không gửi.
    if (form.elements.website.value) { showSuccess(); return; }

    var payload = {
      phone: phone,
      weight: weightEl.value,
      cats: catsEl ? catsEl.value : "1",
      variant: variant ? variantKey : "macdinh",
      page: window.location.origin + window.location.pathname,
      referrer: document.referrer.slice(0, 300)
    };
    TRACK_KEYS.forEach(function (k) { payload[k] = attribution[k] || ""; });

    if (!cfg.FORM_ENDPOINT) {
      if (isLocal) {
        console.warn("[Sạch By] Chưa cấu hình FORM_ENDPOINT, lead KHÔNG được lưu:", payload);
        afterSent(payload);
      } else {
        formError.textContent = "Form chưa sẵn sàng, bạn quay lại sau ít phút giúp mình nhé.";
      }
      return;
    }

    sending = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang gửi…";

    // Apps Script không trả header CORS nên gửi dạng no-cors (không đọc được phản hồi).
    fetch(cfg.FORM_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams(payload)
    }).then(function () {
      afterSent(payload);
    }).catch(function () {
      sending = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Gửi yêu cầu đặt lịch";
      formError.textContent = "Gửi chưa được, có thể do mạng. Bạn thử lại giúp mình nhé.";
    });
  });

  function afterSent(payload) {
    var price = payload.weight === "tu-5kg" ? cfg.PRICE_FROM_5KG : cfg.PRICE_UNDER_5KG;
    var count = payload.cats === "3+" ? 3 : Number(payload.cats) || 1;
    track("Lead", { value: (price || 0) * count, currency: "VND", content_name: payload.variant });
    showSuccess();
  }

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
    success.focus();
    success.scrollIntoView({ block: "center", behavior: "smooth" });
  }
})();
