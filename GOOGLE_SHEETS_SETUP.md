# How to Connect Google Sheets (2-Minute Setup)

This allows you to automatically save every user's **Name, Mobile Number, and Email** to your Google Sheet **before they proceed to payment**. Once payment completes, the status automatically updates to **Paid** with the Razorpay Payment ID.

---

### Step 1: Create a Google Sheet
1. Open [Google Sheets](https://sheets.google.com) and create a **Blank spreadsheet**.
2. Rename it at the top left to: **HAARIVEDON Webinar Registrations**.

---

### Step 2: Open Apps Script
1. In the top menu bar of your Google Sheet, click **Extensions** > **Apps Script**.
2. A new tab will open with code editor.
3. Delete any default code inside (like `function myFunction() {}`).

---

### Step 3: Paste the Code
1. Open the file `google-sheets-script.js` in your project folder (or copy the code below).
2. Paste it into the Google Apps Script code editor.
3. Click the **Save** icon (disk icon) or press `Ctrl + S`.

---

### Step 4: Deploy as a Web App (Important!)
1. In the top right corner of Apps Script, click the blue **Deploy** button.
2. Select **New deployment**.
3. Next to "Select type", click the gear icon (⚙️) and select **Web app**.
4. Set the following fields:
   - **Description**: `Webinar Lead Capture`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: **`Anyone`** *(⚠️ Must be set to Anyone so visitors on your website can send their details)*
5. Click **Deploy**.
6. Google will ask for authorization:
   - Click **Authorize access**.
   - Select your Google account.
   - Click **Advanced** (in small grey text).
   - Click **Go to Untitled project (unsafe)**.
   - Click **Allow**.
7. Copy the **Web app URL** (starts with `https://script.google.com/macros/s/.../exec`).

---

### Step 5: Paste the URL in `config.js`
Open `config.js` in this folder and paste your copied URL into:

```javascript
googleSheetScriptUrl: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
```

Save `config.js`. You are now completely live!

---

## What Happens When a Visitor Registers?

1. **Before Payment:**
   - Visitor clicks "Register Now" or "Book Your Seat".
   - A modal asks for **Full Name**, **WhatsApp / Mobile Number**, and **Email Address**.
   - When they click "Proceed to Pay", their details are instantly sent to your Google Sheet with status `Initiated (Pre-Payment)` and amber badge.
   - Even if they drop off, cancel, or their bank card fails, **you already have their name, phone number, and email** to follow up on WhatsApp!

2. **After Payment:**
   - Razorpay completes the payment.
   - The same lead row in Google Sheet automatically updates to `Paid (Success)` with green highlight and the Razorpay Payment ID.

3. **Backup & Excel Download:**
   - All leads are also saved in the visitor's local browser session as a backup.
   - In Google Sheets, you can download all leads as an Excel file anytime by clicking:  
     **File -> Download -> Microsoft Excel (.xlsx)**.
   - You can also export leads directly from the website via the admin export link in the website footer.
