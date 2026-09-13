/**
 * ==============================================================================
 * মাদ্রাসার শিক্ষক তথ্য সংগ্রহ - গুগল অ্যাপস স্ক্রিপ্ট (Google Apps Script)
 * স্প্রেডশীট: 1JUN30Z52QB0oOlhzeZE-CFfqOnUPInH9_2ZIaASDM8g
 * একাউন্ট: ashikpushpo07@gmail.com
 * ==============================================================================
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    // সরাসরি অ্যাক্টিভ শিট নেওয়ার চেষ্টা (সবচেয়ে নিরাপদ ও সরাসরি কার্যকর)
    var doc = null;
    try {
      doc = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e1) {}

    if (!doc) {
      try {
        doc = SpreadsheetApp.openById("1JUN30Z52QB0oOlhzeZE-CFfqOnUPInH9_2ZIaASDM8g");
      } catch (e2) {}
    }

    if (!doc) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Google Sheet could not be opened'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = doc.getActiveSheet();

    // হেডার কলাম না থাকলে স্বয়ংক্রিয়ভাবে তৈরি করা
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

    // ডাটা সংগ্রহ (URL-encoded প্যারামিটার অথবা JSON বডি)
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // যদি কোনো প্যারামিটার না থাকে তবে শুধুমাত্র স্ট্যাটাস চেক
    if (!data.fullName && !data.personalPhone) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        sheet: doc.getName(),
        message: 'গুগল শিট স্ক্রিপ্ট সক্রিয় ও প্রস্তুত আছে!'
      })).setMimeType(ContentService.MimeType.JSON);
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
      message: 'তথ্য সফলভাবে গুগল শিটে সংরক্ষিত হয়েছে!',
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
