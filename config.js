/* ============================================================
   HAARIVEDON – Webinar settings (edit only this file)
   ============================================================ */
window.HAARIVEDON_CONFIG = {
  // 1) Razorpay Checkout (preferred). Put ONLY the public Key ID here (starts with rzp_live_ / rzp_test_).
  //    NEVER put the Key Secret in this file - website files are public.
  razorpayKeyId: "rzp_test_TkiNlOSbGtGKTp",
  businessName: "HAARIVEDON",
  logo: "assets/logo.png",

  // 1b) Fallback only (used if razorpayKeyId is empty): a hosted payment link (Razorpay Payment Link / Payment Page, Instamojo, Cashfree, PayU...)
  //    In the gateway dashboard set the "redirect after successful payment" URL to:
  //    https://YOUR-DOMAIN/thank-you.html
  paymentLink: "",

  // 2) WhatsApp community / group invite link shown ONLY on thank-you.html after payment
  whatsappCommunityLink: "https://chat.whatsapp.com/DV3N9a458ULA4BeTHdxd5z",

  // 3) Support contact (WhatsApp number with country code, digits only) and email
  supportWhatsapp: "",
  supportEmail: "support@haarivedon.com",

  // 4) Webinar timing (IST). Countdown + calendar use these.
  webinarStart: "2026-10-10T18:00:00+05:30",
  webinarEnd: "2026-10-10T20:00:00+05:30",
  registrationCloses: "2026-10-10T16:00:00+05:30",

  // 5) Pricing
  price: 199,
  regularPrice: 1999,

  // 6) Mentor photo (put the image in /assets). Leave empty to show the illustrated placeholder.
  mentorPhoto: "assets/neelam-niranjan.jpg",

  // 7) If true, thank-you.html shows the WhatsApp link only when the gateway
  //    redirect includes a payment id (razorpay_payment_id / payment_id).
  requirePaymentConfirmation: true
};
