/**
 * ==============================================================================
 * মাদ্রাসার শিক্ষক তথ্য সংগ্রহ - গুগল অ্যাপস স্ক্রিপ্ট (Google Apps Script)
 * স্প্রেডশীট আইডি: 1JUN30Z52QB0oOlhzeZE-CFfqOnUPInH9_2ZIaASDM8g
 * জিমেইল: ashikpushpo07@gmail.com
 * ==============================================================================
 */

// আপনার নির্দিষ্ট গুগল শিটের আইডি
var SPREADSHEET_ID = "1JUN30Z52QB0oOlhzeZE-CFfqOnUPInH9_2ZIaASDM8g";

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    sheetId: SPREADSHEET_ID,
    account: 'ashikpushpo07@gmail.com',
    message: 'গুগল শিট স্ক্রিপ্ট সক্রিয় ও প্রস্তুত আছে!'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var doc;
    try {
      doc = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch(err) {
      doc = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    var sheet = doc.getActiveSheet();

    // হেডার কলাম যদি না থাকে, তৈরি করা
    if (sheet.getLastRow() === 0) {
      var headers = [
        "টাইমস্ট্যাম্প",
        "পূর্ণ নাম",
        "পিতার নাম",
        "ব্যক্তিগত মোবাইল নম্বর",
        "অভিভাবক / ২য় নম্বর",
        "জেলা",
        "উপজেলা / থানা",
        "গ্রাম ও ডাকঘর",
        "জন্ম তারিখ",
        "মাদ্রাসায় নিয়োগের তারিখ",
        "ফারেগ প্রতিষ্ঠান (দাওরা মাদ্রাসা)",
        "দাওরা পাশের সন",
        "দাওরার ফলাফল (বিভাগ)",
        "তাখাসসুসাত (উচ্চতর ডিগ্রি)",
        "সাবমিশন আইডি"
      ];
      sheet.appendRow(headers);
      
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#064e3b");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      headerRange.setVerticalAlignment("middle");
      sheet.setRowHeight(1, 38);
      sheet.setFrozenRows(1);
    }

    var data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    var timestamp = Utilities.formatDate(new Date(), "Asia/Dhaka", "dd/MM/yyyy hh:mm:ss a");
    var fullName = data.fullName || "";
    var fatherName = data.fatherName || "";
    var personalPhone = data.personalPhone ? "'" + data.personalPhone : "";
    var guardianPhone = data.guardianPhone ? "'" + data.guardianPhone : "";
    var district = data.district || "";
    var thana = data.thana || "";
    var addressDetails = data.addressDetails || "";
    var birthDate = data.birthDate || "";
    var joiningDate = data.joiningDate || "";
    var dawrahMadrasa = data.dawrahMadrasa || "";
    var dawrahYear = data.dawrahYear || "";
    var dawrahResult = data.dawrahResult || "";
    var takhassus = data.takhassus || "";
    var submissionId = data.submissionId || ("USTAD-" + Date.now());

    var newRow = [
      timestamp,
      fullName,
      fatherName,
      personalPhone,
      guardianPhone,
      district,
      thana,
      addressDetails,
      birthDate,
      joiningDate,
      dawrahMadrasa,
      dawrahYear,
      dawrahResult,
      takhassus,
      submissionId
    ];

    sheet.appendRow(newRow);

    var lastRow = sheet.getLastRow();
    var rowRange = sheet.getRange(lastRow, 1, 1, newRow.length);
    rowRange.setVerticalAlignment("middle");

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'তথ্য সরাসরি আপনার গুগল শিটে সংরক্ষিত হয়েছে!',
      row: lastRow
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}
