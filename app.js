(function () {
  var C = window.HAARIVEDON_CONFIG || {};
  var start = new Date(C.webinarStart || "2026-10-10T18:00:00+05:30").getTime();

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

  document.querySelectorAll("[data-price]").forEach(function (el) { el.textContent = C.price; });
  document.querySelectorAll("[data-regular]").forEach(function (el) { el.textContent = C.regularPrice; });

  var regClosed = C.registrationCloses && Date.now() > new Date(C.registrationCloses).getTime();
  var modal = document.getElementById("pay-modal");
  var co = document.getElementById("checkout-modal");
  var coPay = document.getElementById("co-pay");

  document.querySelectorAll("[data-pay]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (regClosed) { showModal("Registrations are closed", "Registrations for this masterclass have closed. Please contact support for the next batch."); return; }
      if (!C.razorpayKeyId && !C.paymentLink) { showModal("Payment not set up yet", "Add your Razorpay Key ID (razorpayKeyId) in config.js to enable registrations."); return; }
      if (co) co.classList.add("show"); else startPayment();
    });
  });

  if (coPay) coPay.addEventListener("click", startPayment);

  function goThankYou(params) {
    window.location.href = "thank-you.html?" + new URLSearchParams(params).toString();
  }

  function startPayment() {
    if (!C.razorpayKeyId) { window.location.href = C.paymentLink; return; }
    if (typeof window.Razorpay !== "function") {
      showModal("Payment could not load", "Please check your internet connection and try again.");
      return;
    }
    var rzp = new window.Razorpay({
      key: C.razorpayKeyId,
      amount: Math.round(Number(C.price) * 100),
      currency: "INR",
      name: C.businessName || "HAARIVEDON",
      description: "Navratri Astrology Masterclass – 10 Oct 2026, 6 PM IST",
      image: C.logo ? new URL(C.logo, location.href).href : undefined,
      notes: { webinar: "Navratri Masterclass 10-Oct-2026", mentor: "Neelam Ajay singh" },
      theme: { color: "#047857" },
      handler: function (res) {
        goThankYou({ razorpay_payment_id: res.razorpay_payment_id, status: "success" });
      },
      modal: { ondismiss: function () { if (coPay) coPay.disabled = false; } }
    });
    rzp.on("payment.failed", function (r) {
      if (coPay) coPay.disabled = false;
      var reason = (r && r.error && r.error.description) || "Payment failed. Please try again.";
      if (co) co.classList.remove("show");
      showModal("Payment failed", reason + " If money was deducted, it will be refunded automatically by your bank.");
    });
    if (coPay) coPay.disabled = true;
    rzp.open();
  }

  function showModal(t, m) {
    if (!modal) { alert(m); return; }
    modal.querySelector("h3").textContent = t;
    modal.querySelector("p").textContent = m;
    modal.classList.add("show");
  }
  [modal, co].forEach(function (m) {
    if (m) m.addEventListener("click", function (e) {
      if (e.target === m || e.target.hasAttribute("data-close")) m.classList.remove("show");
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
