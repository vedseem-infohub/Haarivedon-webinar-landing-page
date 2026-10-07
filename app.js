(function () {
  var C = window.HAARIVEDON_CONFIG || {};

  /* ============================================================
     0) Cross-Browser Safe Date Parser (Safari & iOS compatible)
     ============================================================ */
  function parseSafeDate(str, fallbackOffsetDays) {
    if (!str) return Date.now() + (fallbackOffsetDays || 3) * 864e5;
    if (typeof str === "number") return str;
    // Safari rejects "YYYY-MM-DD HH:MM:SS" -> replace space with 'T'
    var s = String(str).trim().replace(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:)/, "$1T$2");
    var t = new Date(s).getTime();
    if (isNaN(t)) {
      // Fallback for older WebKit engines
      var clean = s.replace(/([+-]\d{2}):(\d{2})$/, "$1$2");
      t = new Date(clean).getTime();
    }
    return isNaN(t) ? (Date.now() + (fallbackOffsetDays || 3) * 864e5) : t;
  }

  var start = parseSafeDate(C.webinarStart || "2026-10-10T18:00:00+05:30", 3);
  var regCloseTime = C.registrationCloses ? parseSafeDate(C.registrationCloses, 3) : 0;
  var regClosed = regCloseTime > 0 && Date.now() > regCloseTime;

  /* ============================================================
     1) Countdown Timer
     ============================================================ */
  function pad(n) { return String(Math.max(0, n)).padStart(2, "0"); }
  function tick() {
    var d = Math.max(0, start - Date.now());
    var v = {
      d: Math.floor(d / 864e5),
      h: Math.floor(d / 36e5) % 24,
      m: Math.floor(d / 6e4) % 60,
      s: Math.floor(d / 1e3) % 60
    };
    document.querySelectorAll("[data-cd]").forEach(function (el) {
      el.textContent = pad(v[el.getAttribute("data-cd")]);
    });
  }
  tick();
  setInterval(tick, 1000);

  /* ============================================================
     2) Price Injection
     ============================================================ */
  document.querySelectorAll("[data-price]").forEach(function (el) { el.textContent = C.price; });
  document.querySelectorAll("[data-regular]").forEach(function (el) { el.textContent = C.regularPrice; });

  var modal = document.getElementById("pay-modal");
  var co = document.getElementById("checkout-modal");
  var coForm = document.getElementById("co-form");
  var coPay = document.getElementById("co-pay");
  var coPayText = document.getElementById("co-pay-text");

  var inputName = document.getElementById("co-name");
  var inputPhone = document.getElementById("co-phone");
  var inputEmail = document.getElementById("co-email");

  var wrapName = document.getElementById("wrap-name");
  var wrapPhone = document.getElementById("wrap-phone");
  var wrapEmail = document.getElementById("wrap-email");

  var errName = document.getElementById("err-name");
  var errPhone = document.getElementById("err-phone");
  var errEmail = document.getElementById("err-email");

  var currentLead = null;

  /* ============================================================
     3) Open Checkout Modal on [data-pay]
     ============================================================ */
  document.querySelectorAll("[data-pay]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (regClosed) {
        showModal("Registrations are closed", "Registrations for this masterclass have closed. Please contact support for the next batch.");
        return;
      }
      if (!C.razorpayKeyId && !C.paymentLink) {
        showModal("Payment not set up yet", "Add your Razorpay Key ID (razorpayKeyId) in config.js to enable registrations.");
        return;
      }
      if (co) {
        co.classList.add("show");
        // Focus name field smoothly on iOS & desktop
        setTimeout(function () {
          if (inputName) {
            try { inputName.focus(); } catch (err) {}
          }
        }, 120);
      } else {
        startPayment({ name: "", phone: "", email: "" });
      }
    });
  });

  /* ============================================================
     4) Form Validation Helpers
     ============================================================ */
  function clearErrors() {
    [wrapName, wrapPhone, wrapEmail].forEach(function (w) { if (w) w.classList.remove("has-error"); });
    [errName, errPhone, errEmail].forEach(function (e) { if (e) e.classList.remove("show"); });
  }

  [inputName, inputPhone, inputEmail].forEach(function (input) {
    if (!input) return;
    input.addEventListener("input", function () {
      var wrap = input.closest(".co-input-wrap");
      var field = input.closest(".co-field");
      if (wrap) wrap.classList.remove("has-error");
      if (field) {
        var err = field.querySelector(".co-err");
        if (err) err.classList.remove("show");
      }
    });
  });

  function validateForm() {
    clearErrors();
    var isValid = true;
    var firstInvalid = null;

    var nameVal = (inputName ? inputName.value : "").trim();
    if (nameVal.length < 2) {
      if (wrapName) wrapName.classList.add("has-error");
      if (errName) { errName.textContent = "Please enter your full name (at least 2 letters)"; errName.classList.add("show"); }
      isValid = false;
      if (!firstInvalid) firstInvalid = inputName;
    }

    var phoneRaw = (inputPhone ? inputPhone.value : "").trim();
    var cleanDigits = phoneRaw.replace(/\D/g, "");
    if (cleanDigits.length === 12 && cleanDigits.startsWith("91")) cleanDigits = cleanDigits.slice(2);
    else if (cleanDigits.length === 11 && cleanDigits.startsWith("0")) cleanDigits = cleanDigits.slice(1);

    if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
      if (wrapPhone) wrapPhone.classList.add("has-error");
      if (errPhone) { errPhone.textContent = "Please enter a valid 10-digit Indian mobile number"; errPhone.classList.add("show"); }
      isValid = false;
      if (!firstInvalid) firstInvalid = inputPhone;
    }

    var emailVal = (inputEmail ? inputEmail.value : "").trim().toLowerCase();
    if (emailVal.length > 0) {
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(emailVal)) {
        if (wrapEmail) wrapEmail.classList.add("has-error");
        if (errEmail) { errEmail.textContent = "Please enter a valid email address or leave it blank"; errEmail.classList.add("show"); }
        isValid = false;
        if (!firstInvalid) firstInvalid = inputEmail;
      }
    }

    if (firstInvalid) {
      try { firstInvalid.focus(); } catch (err) {}
    }

    return isValid ? { name: nameVal, phone: cleanDigits, email: emailVal } : null;
  }

  /* ============================================================
     5) Lead Management & Local Storage Backup
     ============================================================ */
  function saveLeadLocally(lead) {
    try {
      var leads = JSON.parse(localStorage.getItem("haarivedon_leads") || "[]");
      var existingIndex = -1;
      for (var i = 0; i < leads.length; i++) {
        if (leads[i].phone === lead.phone) {
          existingIndex = i;
          break;
        }
      }
      if (existingIndex >= 0) {
        leads[existingIndex] = Object.assign({}, leads[existingIndex], lead);
      } else {
        leads.push(lead);
      }
      localStorage.setItem("haarivedon_leads", JSON.stringify(leads));
      sessionStorage.setItem("haarivedon_current_lead", JSON.stringify(lead));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  function updateLocalLeadStatus(phone, status, paymentId) {
    try {
      var leads = JSON.parse(localStorage.getItem("haarivedon_leads") || "[]");
      leads.forEach(function (l) {
        if (l.phone === phone) {
          l.status = status;
          if (paymentId) l.payment_id = paymentId;
        }
      });
      localStorage.setItem("haarivedon_leads", JSON.stringify(leads));
    } catch (e) {
      console.warn("Could not update lead status in localStorage:", e);
    }
  }

  /* ============================================================
     6) Send Lead Data to Google Sheets (Non-blocking on iOS)
     ============================================================ */
  function sendToGoogleSheets(leadData) {
    if (!C.googleSheetScriptUrl) {
      console.info("HAARIVEDON: Google Sheet URL not yet configured in config.js (googleSheetScriptUrl). Lead saved locally.");
      return Promise.resolve({ status: "local_only" });
    }

    var payload = JSON.stringify(leadData);

    // 1. Try navigator.sendBeacon (native background transport on iOS Safari)
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      try {
        var blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
        var sent = navigator.sendBeacon(C.googleSheetScriptUrl, blob);
        if (sent) return Promise.resolve({ status: "beacon_sent" });
      } catch (e) {}
    }

    // 2. Fallback to fetch with keepalive: true (supported in Safari & modern browsers)
    return fetch(C.googleSheetScriptUrl, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload
    }).catch(function (err) {
      console.warn("Google Sheet sync error (saved locally):", err);
    });
  }

  /* ============================================================
     7) Form Submission (Before Payment)
     ============================================================ */
  function setPayButtonLoading(loading) {
    if (!coPay) return;
    if (loading) {
      coPay.disabled = true;
      if (coPayText) coPayText.innerHTML = '<span class="co-spinner"></span> Opening Payment...';
    } else {
      coPay.disabled = false;
      if (coPayText) coPayText.innerHTML = 'Proceed to Pay &#8377;<span data-price>' + (C.price || 199) + '</span> Securely';
    }
  }

  if (coForm) {
    coForm.addEventListener("submit", function (e) {
      e.preventDefault();
      handleFormSubmit();
    });
  } else if (coPay) {
    coPay.addEventListener("click", function (e) {
      e.preventDefault();
      handleFormSubmit();
    });
  }

  function handleFormSubmit() {
    var validData = validateForm();
    if (!validData) return;

    var lead = {
      name: validData.name,
      phone: validData.phone,
      email: validData.email,
      amount: String(C.price || 199),
      status: "Initiated (Pre-Payment)",
      source: "Navratri Masterclass Landing Page",
      timestamp: new Date().toISOString()
    };
    currentLead = lead;

    // 1. Store lead in local storage immediately
    saveLeadLocally(lead);

    // 2. Dispatch data to Google Sheets in background (non-blocking)
    sendToGoogleSheets(lead);

    // 3. Set button loading state
    setPayButtonLoading(true);

    // 4. CRITICAL FIX FOR APPLE / iOS SAFARI:
    // startPayment() must be executed SYNCHRONOUSLY within this user tap context.
    // Calling it inside an asynchronous Promise/setTimeout triggers Safari's popup blocker
    // and causes Razorpay to fail silently on iOS devices.
    startPayment(lead);
  }

  function goThankYou(params) {
    window.location.href = "thank-you.html?" + new URLSearchParams(params).toString();
  }

  /* ============================================================
     8) Razorpay Checkout Flow (iOS & Android Optimized)
     ============================================================ */
  function startPayment(lead) {
    lead = lead || currentLead || { name: "", phone: "", email: "" };

    // Fallback if no Razorpay Key ID
    if (!C.razorpayKeyId) {
      if (C.paymentLink) {
        window.location.href = C.paymentLink;
      } else {
        setPayButtonLoading(false);
        showModal("Payment not configured", "Please configure razorpayKeyId or paymentLink in config.js.");
      }
      return;
    }

    if (typeof window.Razorpay !== "function") {
      setPayButtonLoading(false);
      showModal("Payment could not load", "Payment gateway is loading. Please check your internet connection and try again.");
      return;
    }

    var rzpConfig = {
      key: C.razorpayKeyId,
      amount: Math.round(Number(C.price || 199) * 100),
      currency: "INR",
      name: C.businessName || "HAARIVEDON",
      description: "Navratri Astrology Masterclass – 10 Oct 2026, 6 PM IST",
      prefill: {
        name: lead.name,
        email: lead.email || undefined,
        contact: lead.phone
      },
      notes: {
        webinar: "Navratri Masterclass 10-Oct-2026",
        mentor: "Neelam Ajay singh",
        customer_name: lead.name,
        customer_phone: lead.phone,
        customer_email: lead.email || "Not provided"
      },
      theme: { color: "#047857" },
      modal: {
        backdropclose: false,
        escape: true,
        handleback: true, // Native back-button handling on mobile
        ondismiss: function () {
          setPayButtonLoading(false);
        }
      },
      handler: function (res) {
        // Payment successful!
        updateLocalLeadStatus(lead.phone, "Paid (Success)", res.razorpay_payment_id);

        // Send update to Google Sheet
        sendToGoogleSheets({
          action: "update",
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          amount: String(C.price || 199),
          status: "Paid",
          payment_id: res.razorpay_payment_id
        });

        // Redirect to thank-you page with user info
        goThankYou({
          razorpay_payment_id: res.razorpay_payment_id,
          status: "success",
          name: lead.name,
          phone: lead.phone,
          email: lead.email
        });
      }
    };

    // Safely add logo URL only if valid
    if (C.logo) {
      try {
        rzpConfig.image = new URL(C.logo, location.href).href;
      } catch (e) {}
    }

    try {
      var rzp = new window.Razorpay(rzpConfig);

      rzp.on("payment.failed", function (r) {
        setPayButtonLoading(false);
        var reason = (r && r.error && r.error.description) || "Payment failed. Please try again.";
        if (co) co.classList.remove("show");
        showModal("Payment failed", reason + " If money was deducted, it will be refunded automatically by your bank.");
      });

      rzp.open();
    } catch (err) {
      setPayButtonLoading(false);
      console.error("Razorpay open error:", err);
      showModal("Payment Error", "Unable to open payment. Please try again or disable your pop-up blocker.");
    }
  }

  /* ============================================================
     9) Export Leads to Excel / CSV (Direct Admin Download)
     ============================================================ */
  function exportLeadsToExcel() {
    var leads = [];
    try {
      leads = JSON.parse(localStorage.getItem("haarivedon_leads") || "[]");
    } catch (e) {
      leads = [];
    }

    if (!leads || leads.length === 0) {
      showModal(
        "No Leads Saved Locally",
        "No registrations have been captured in this browser session yet.\n\nOnce visitors fill in their name, mobile and email, they will be saved here and sent directly to your Google Sheet (if configured)."
      );
      return;
    }

    var csvRows = [
      ["Timestamp (IST)", "Full Name", "Mobile / WhatsApp", "Email Address", "Amount (INR)", "Payment Status", "Payment ID"]
    ];

    leads.forEach(function (l) {
      var dateStr = l.timestamp ? new Date(l.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "";
      csvRows.push([
        '"' + dateStr.replace(/"/g, '""') + '"',
        '"' + (l.name || "").replace(/"/g, '""') + '"',
        l.phone ? '="' + l.phone + '"' : '""', // Formatted for Excel to preserve 10 digits
        '"' + (l.email || "-").replace(/"/g, '""') + '"',
        '"' + (l.amount || "199") + '"',
        '"' + (l.status || "Initiated") + '"',
        '"' + (l.payment_id || "-") + '"'
      ]);
    });

    var csvString = csvRows.map(function (row) { return row.join(","); }).join("\r\n");
    // UTF-8 BOM so Excel opens Hindi / special characters correctly
    var blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = "haarivedon_webinar_leads_" + today + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  window.exportLeadsToExcel = exportLeadsToExcel;
  var adminBtn = document.getElementById("admin-export-btn");
  if (adminBtn) adminBtn.addEventListener("click", exportLeadsToExcel);

  /* ============================================================
     10) Modals & UI Utilities
     ============================================================ */
  function showModal(t, m) {
    if (!modal) { alert(m); return; }
    modal.querySelector("h3").textContent = t;
    modal.querySelector("p").textContent = m;
    modal.classList.add("show");
  }

  [modal, co].forEach(function (m) {
    if (m) m.addEventListener("click", function (e) {
      if (e.target === m || e.target.hasAttribute("data-close")) {
        m.classList.remove("show");
        setPayButtonLoading(false);
      }
    });
  });

  if (C.mentorPhoto) {
    document.querySelectorAll("[data-mentor-photo]").forEach(function (el) {
      el.innerHTML = '<img src="' + C.mentorPhoto + '" alt="Neelam Ajay singh">';
    });
  }

  document.querySelectorAll(".qa button").forEach(function (b) {
    b.addEventListener("click", function () {
      var qa = b.parentElement, ans = qa.querySelector(".ans"), open = qa.classList.toggle("open");
      b.setAttribute("aria-expanded", open);
      ans.style.maxHeight = open ? ans.scrollHeight + "px" : 0;
    });
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }
})();
