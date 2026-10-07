/**
 * =======================================================================
 * HAARIVEDON WEBINAR - GOOGLE APPS SCRIPT FOR GOOGLE SHEETS
 * =======================================================================
 * 
 * This script receives lead data (Name, Mobile Number, Email) before payment
 * and updates payment status once the Razorpay payment succeeds.
 * 
 * SETUP INSTRUCTIONS (Takes only 2 minutes):
 * 1. Open Google Sheets (https://sheets.google.com) and create a New Blank Spreadsheet.
 * 2. Name your spreadsheet: "HAARIVEDON Webinar Registrations".
 * 3. In the top menu, click: Extensions -> Apps Script.
 * 4. Delete any existing code in the editor, and PASTE THIS ENTIRE FILE.
 * 5. Click the "Save" icon (or Ctrl+S).
 * 6. Click the blue "Deploy" button (top right) -> Select "New deployment".
 * 7. Click the gear icon (⚙️) next to "Select type" and select "Web app".
 * 8. Set the following settings:
 *      - Description: "Webinar Lead Collector"
 *      - Execute as: "Me" (your email)
 *      - Who has access: "Anyone"  <-- IMPORTANT! Must be "Anyone" so the website can submit leads
 * 9. Click "Deploy".
 * 10. Click "Authorize access", choose your Google account, click "Advanced" -> "Go to Untitled project (unsafe)" -> "Allow".
 * 11. Copy the "Web app URL" (starts with https://script.google.com/macros/s/...).
 * 12. Open `config.js` in your website folder and paste the URL into:
 *      googleSheetScriptUrl: "YOUR_COPIED_URL_HERE",
 * 
 * That's it! Every lead will be saved into your Google Sheet instantly before payment!
 */

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 10 seconds for concurrent requests to avoid row collisions
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // Setup headers if the sheet is completely empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Timestamp (IST)",
        "Full Name",
        "Mobile / WhatsApp",
        "Email Address",
        "Amount (INR)",
        "Payment Status",
        "Razorpay Payment ID",
        "Source"
      ];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#047857");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontSize(11);
      sheet.setFrozenRows(1);
      
      // Set reasonable column widths
      sheet.setColumnWidth(1, 160); // Timestamp
      sheet.setColumnWidth(2, 180); // Name
      sheet.setColumnWidth(3, 150); // Mobile
      sheet.setColumnWidth(4, 220); // Email
      sheet.setColumnWidth(5, 110); // Amount
      sheet.setColumnWidth(6, 170); // Status
      sheet.setColumnWidth(7, 210); // Payment ID
      sheet.setColumnWidth(8, 180); // Source
    }

    // Extract payload from POST body or GET query params
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        // Fallback if submitted as urlencoded
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MMM-yyyy hh:mm:ss a");
    var name = (data.name || "").toString().trim();
    var phone = (data.phone || data.mobile || "").toString().trim();
    var email = (data.email || "").toString().trim();
    var amount = (data.amount || "199").toString().trim();
    var status = (data.status || "Initiated (Pre-Payment)").toString().trim();
    var paymentId = (data.payment_id || data.razorpay_payment_id || "").toString().trim();
    var source = (data.source || "Navratri Masterclass Landing Page").toString().trim();
    var action = (data.action || "").toString().trim();

    // Format phone to prevent Google Sheets from truncating leading zeros or converting to scientific notation
    var cleanPhone = phone.replace(/[^\d+]/g, "");
    var formattedPhone = cleanPhone ? "'" + cleanPhone : "";

    // If this is an update request after payment completion
    if (action === "update" || (status === "Paid" && paymentId)) {
      var rows = sheet.getDataRange().getValues();
      var foundRowIndex = -1;

      // Search from bottom up for matching lead (by phone or email)
      var searchPhone = cleanPhone.replace(/\D/g, "");
      var searchEmail = email.toLowerCase();

      for (var i = rows.length - 1; i >= 1; i--) {
        var rowPhone = String(rows[i][2]).replace(/\D/g, "");
        var rowEmail = String(rows[i][3]).toLowerCase().trim();

        if ((searchPhone && rowPhone && (rowPhone.endsWith(searchPhone) || searchPhone.endsWith(rowPhone))) ||
            (searchEmail && rowEmail && rowEmail === searchEmail)) {
          foundRowIndex = i + 1; // 1-based index
          break;
        }
      }

      if (foundRowIndex > 0) {
        // Update existing row
        sheet.getRange(foundRowIndex, 6).setValue("Paid (Success)");
        sheet.getRange(foundRowIndex, 6).setBackground("#d1fae5").setFontColor("#065f46").setFontWeight("bold");
        if (paymentId) sheet.getRange(foundRowIndex, 7).setValue(paymentId);
      } else {
        // Not found, append as new row
        sheet.appendRow([
          timestamp,
          name,
          formattedPhone,
          email || "-",
          amount,
          "Paid (Success)",
          paymentId,
          source
        ]);
        var lastRow = sheet.getLastRow();
        sheet.getRange(lastRow, 6).setBackground("#d1fae5").setFontColor("#065f46").setFontWeight("bold");
      }
    } else {
      // New lead registered before payment
      sheet.appendRow([
        timestamp,
        name,
        formattedPhone,
        email || "-",
        amount,
        status,
        paymentId || "-",
        source
      ]);

      // Highlight pre-payment leads with a soft amber indicator
      var newRow = sheet.getLastRow();
      sheet.getRange(newRow, 6).setBackground("#fef3c7").setFontColor("#92400e");
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Lead recorded successfully" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
