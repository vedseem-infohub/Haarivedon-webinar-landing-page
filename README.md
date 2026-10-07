# HAARIVEDON – Navratri Astrology Masterclass Landing Page

Static landing page (no build step) for the live webinar by Astrologer Neelam Ajay singh on 10 October 2026, 6:00 PM IST.

## Files
- `index.html` – landing page
- `thank-you.html` – post-payment page that reveals the WhatsApp community link
- `config.js` – **the only file you need to edit** (Razorpay Key ID, WhatsApp link, price, dates, photo)
- `styles.css`, `app.js` – design + countdown/FAQ/CTA logic
- `assets/` – logo (`logo.png`), poster and mentor photo

## Payment → WhatsApp flow (Razorpay Checkout)
1. `config.js` → `razorpayKeyId` holds your **public Key ID** (`rzp_live_...`). Every Register / Book button opens a confirmation box (with the seat/refund note) and then the Razorpay Checkout popup for Rs 199.
2. **Never put the Razorpay Key Secret in any website file.** Keep it only in the Razorpay dashboard / a server.
3. After a successful payment the visitor is sent to `thank-you.html?razorpay_payment_id=...`, which shows the green **Join WhatsApp Community** button (`whatsappCommunityLink`).
4. Razorpay Dashboard → Settings → Payment Capture: make sure payments are captured (payments made without a server-created order may stay "Authorized" and are auto-refunded if not captured).
5. Fallback: if `razorpayKeyId` is empty, buttons open `paymentLink` instead (set its success redirect to `https://YOUR-DOMAIN/thank-you.html`).

Note: the payment check on the thank-you page is client-side. For strict protection add a small server that creates orders and verifies the Razorpay signature with the Key Secret.

## Run locally
```
python3 -m http.server 8080
```
Then open http://localhost:8080. Deploy by uploading the folder to any static host (Netlify, Vercel, Hostinger, GitHub Pages, cPanel).
