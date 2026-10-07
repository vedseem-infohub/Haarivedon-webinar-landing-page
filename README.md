# HAARIVEDON – Navratri Astrology Masterclass Landing Page

Static landing page (no build step) for the live webinar by Astrologer Neelam Ajay singh on 10 October 2026, 6:00 PM IST.

## Files
- `index.html` – landing page with pre-payment lead registration modal
- `thank-you.html` – post-payment page that reveals the WhatsApp community link
- `config.js` – **the settings file to edit** (Razorpay Key ID, Google Sheets Web App URL, WhatsApp link, price, dates, photo)
- `google-sheets-script.js` – ready-to-paste Google Apps Script code for automatic Google Sheets sync
- `GOOGLE_SHEETS_SETUP.md` – 2-minute step-by-step setup guide for Google Sheets
- `styles.css`, `app.js` – design, validation, lead capture, Razorpay & countdown logic
- `assets/` – logo (`logo.png`, `logo1.png`), poster and mentor photo

## Pre-Payment Lead Capture (Google Sheets & Excel)
1. When visitors click any **Register Now** or **Book Seat** button, a registration form asks for their **Full Name**, **WhatsApp / Mobile Number**, and **Email Address**.
2. Clicking **Proceed to Pay** instantly sends their details to your connected **Google Sheet** marked as `Initiated (Pre-Payment)` **before** Razorpay opens.
3. Even if visitors drop off, close the tab, or payment fails, you have their details in your Google Sheet to follow up on WhatsApp.
4. Once payment succeeds, the same row in Google Sheets automatically updates to `Paid (Success)` with the Razorpay Payment ID.
5. In Google Sheets, you can download all leads anytime as an Excel file via **File -> Download -> Microsoft Excel (.xlsx)**.
6. As a backup, leads are also saved locally, and you can export them to CSV/Excel anytime via the **Admin: Export Leads to Excel / CSV** button in the website footer.
7. To set up Google Sheets, see [`GOOGLE_SHEETS_SETUP.md`](GOOGLE_SHEETS_SETUP.md).

## Payment → WhatsApp flow (Razorpay Checkout)
1. `config.js` → `razorpayKeyId` holds your **public Key ID** (`rzp_live_...`).
2. **Never put the Razorpay Key Secret in any website file.** Keep it only in the Razorpay dashboard / a server.
3. After a successful payment the visitor is sent to `thank-you.html?razorpay_payment_id=...`, which shows the green **Join WhatsApp Community** button (`whatsappCommunityLink`).
4. Razorpay Dashboard → Settings → Payment Capture: make sure payments are captured (payments made without a server-created order may stay "Authorized" and are auto-refunded if not captured).
5. Fallback: if `razorpayKeyId` is empty, buttons open `paymentLink` instead (set its success redirect to `https://YOUR-DOMAIN/thank-you.html`).

## Run locally
```
python -m http.server 8080
```
Then open http://localhost:8080. Deploy by uploading the folder to any static host (Netlify, Vercel, Hostinger, GitHub Pages, cPanel).
