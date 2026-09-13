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

    // প্রমিত হেডার তালিকা
    var standardHeaders = [
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
      "হাফেজে কুরআন (হিফয)",
      "ফারেগ প্রতিষ্ঠান (দাওরা মাদ্রাসা)",
      "দাওরা পাশের সন",
      "দাওরার ফলাফল (বিভাগ)",
      "তাখাসসুসাত (উচ্চতর ডিগ্রি)",
      "সাবমিশন আইডি"
    ];

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    // নতুন শিট হলে হেডার কলাম তৈরি করা
    if (lastRow === 0 || lastCol === 0) {
      sheet.appendRow(standardHeaders);
      var headerRange = sheet.getRange(1, 1, 1, standardHeaders.length);
      headerRange.setBackground("#064e3b");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      headerRange.setVerticalAlignment("middle");
      sheet.setRowHeight(1, 38);
      sheet.setFrozenRows(1);
      lastCol = standardHeaders.length;
    } else {
      // যদি শিট আগে থেকেই থাকে কিন্তু 'হাফেজে কুরআন' কলাম না থাকে, তবে স্বয়ংক্রিয়ভাবে হেডার যোগ করা
      var curHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var hasHafiz = false;
      for (var h = 0; h < curHeaders.length; h++) {
        var hTitle = curHeaders[h].toString();
        if (hTitle.indexOf("হাফেজ") !== -1 || hTitle.indexOf("হিফয") !== -1) {
          hasHafiz = true;
          break;
        }
      }
      if (!hasHafiz) {
        lastCol++;
        var newColCell = sheet.getRange(1, lastCol);
        newColCell.setValue("হাফেজে কুরআন (হিফয)");
        newColCell.setBackground("#064e3b");
        newColCell.setFontColor("#ffffff");
        newColCell.setFontWeight("bold");
        newColCell.setHorizontalAlignment("center");
        newColCell.setVerticalAlignment("middle");
      }
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
    var isHafiz = data.isHafiz || "না";
    var dawrahMadrasa = data.dawrahMadrasa || "";
    var dawrahYear = data.dawrahYear || "";
    var dawrahResult = data.dawrahResult || "";
    var takhassus = data.takhassus || "";
    var submissionId = data.submissionId || ("USTAD-" + Date.now());

    // ডুপ্লিকেট এন্ট্রি প্রতিরোধ (যদি শেষ সারির নাম ও মোবাইল একই হয়)
    lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var lastValues = sheet.getRange(lastRow, 2, 1, 3).getValues()[0];
      var lastFullName = lastValues[0];
      var lastPhone = (lastValues[2] || "").toString().replace(/'/g, "");
      var currentPhone = (data.personalPhone || "").toString().replace(/'/g, "");

      if (lastFullName === fullName && lastPhone === currentPhone) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: 'ইতিমধ্যে সংরক্ষিত হয়েছে (ডুপ্লিকেট প্রতিরোধ)',
          row: lastRow
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // কলাম হেডারের সাথে মান ডায়নামিকালি মেলানো
    var activeHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var fieldMap = {
      "টাইমস্ট্যাম্প": timestamp,
      "পূর্ণ নাম": fullName,
      "পিতার নাম": fatherName,
      "ব্যক্তিগত মোবাইল নম্বর": personalPhone,
      "অভিভাবক / ২য় নম্বর": guardianPhone,
      "জেলা": district,
      "উপজেলা / থানা": thana,
      "গ্রাম ও ডাকঘর": addressDetails,
      "জন্ম তারিখ": birthDate,
      "মাদ্রাসায় নিয়োগের তারিখ": joiningDate,
      "হাফেজে কুরআন (হিফয)": isHafiz,
      "হাফেজে কুরআন": isHafiz,
      "হিফয": isHafiz,
      "ফারেগ প্রতিষ্ঠান (দাওরা মাদ্রাসা)": dawrahMadrasa,
      "ফারেগ প্রতিষ্ঠান": dawrahMadrasa,
      "দাওরা পাশের সন": dawrahYear,
      "দাওরার ফলাফল (বিভাগ)": dawrahResult,
      "তাখাসসুসাত (উচ্চতর ডিগ্রি)": takhassus,
      "তাখাসসুসাত": takhassus,
      "সাবমিশন আইডি": submissionId
    };

    var newRow = [];
    for (var c = 0; c < activeHeaders.length; c++) {
      var headName = activeHeaders[c].toString().trim();
      var val = fieldMap[headName];
      if (val === undefined) {
        for (var k in fieldMap) {
          if (headName.indexOf(k) !== -1 || k.indexOf(headName) !== -1) {
            val = fieldMap[k];
            break;
          }
        }
      }
      newRow.push(val !== undefined ? val : "");
    }

    sheet.appendRow(newRow);

    var finalRow = sheet.getLastRow();
    var rowRange = sheet.getRange(finalRow, 1, 1, newRow.length);
    rowRange.setVerticalAlignment("middle");

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'তথ্য সফলভাবে গুগল শিটে সংরক্ষিত হয়েছে!',
      row: finalRow
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
