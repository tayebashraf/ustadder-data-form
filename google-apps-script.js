/**
 * ==============================================================================
 * মাদ্রাসার শিক্ষক তথ্য সংগ্রহ - গুগল অ্যাপস স্ক্রিপ্ট (Google Apps Script)
 * স্প্রেডশীট: 1JUN30Z52QB0oOlhzeZE-CFfqOnUPInH9_2ZIaASDM8g
 * একাউন্ট: ashikpushpo07@gmail.com
 * 
 * ট্যাব ১: "মাদ্রাসার ওস্তাদগণ" (দাওরায়ে হাদিস ও তাখাসসুসাত বিবরণ)
 * ট্যাব ২: "সাধারণ শিক্ষক (স্যারগণ)" (ডিগ্রি, বিষয়, কলেজ/বিশ্ববিদ্যালয় বিবরণ)
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

    // ==========================================================================
    // ট্যাব ১ ও ট্যাব ২-এর কলাম হেডার
    // ==========================================================================

    // ১. মাদ্রাসার ওস্তাদগণ ট্যাবের হেডার (কওমি মাদ্রাসা)
    var ustadHeaders = [
      "টাইমস্ট্যাম্প",
      "পূর্ণ নাম",
      "পিতার নাম",
      "ব্যক্তিগত মোবাইল নম্বর",
      "অভিভাবক / ২য় নম্বর",
      "জেলা",
      "উপজেলা / থানা",
      "গ্রাম ও ডাকঘর",
      "জন্ম তারিখ",
      "নিয়োগ / যোগদানের তারিখ",
      "হাফেজে কুরআন (হিফয)",
      "ফারেগ প্রতিষ্ঠান (দাওরা মাদ্রাসা)",
      "দাওরা পাশের সন",
      "দাওরার ফলাফল (বিভাগ)",
      "তাখাসসুসাত (উচ্চতর ডিগ্রি)",
      "সাবমিশন আইডি"
    ];

    // ২. সাধারণ শিক্ষক (স্যারগণ) ট্যাবের হেডার (স্কুল / কলেজ ব্যাকগ্রাউন্ড)
    var sirHeaders = [
      "টাইমস্ট্যাম্প",
      "পূর্ণ নাম",
      "পিতার নাম",
      "ব্যক্তিগত মোবাইল নম্বর",
      "অভিভাবক / ২য় নম্বর",
      "জেলা",
      "উপজেলা / থানা",
      "গ্রাম ও ডাকঘর",
      "জন্ম তারিখ",
      "নিয়োগ / যোগদানের তারিখ",
      "হাফেজে কুরআন",
      "সর্বোচ্চ ডিগ্রি / শিক্ষাগত যোগ্যতা",
      "পঠিত মূল বিষয় / বিভাগ",
      "শিক্ষা প্রতিষ্ঠান (কলেজ / বিশ্ববিদ্যালয়)",
      "পাশের সন",
      "ফলাফল / গ্রেড / সিজিপিএ",
      "পেশাগত প্রশিক্ষণ / অন্যান্য যোগ্যতা",
      "সাবমিশন আইডি"
    ];

    // ট্যাব খুঁজে নেওয়া বা তৈরি করার স্বয়ংক্রিয় হেল্পার
    function getOrCreateTab(tabName, headers, headerBg) {
      var targetSheet = doc.getSheetByName(tabName);
      
      // যদি 'মাদ্রাসার ওস্তাদগণ' খোঁজা হয় এবং Sheet1 থাকে, তবে Sheet1-কে রিনেম করা (যাতে আগের ডাটা না হারায়)
      if (!targetSheet && tabName === "মাদ্রাসার ওস্তাদগণ") {
        var sheets = doc.getSheets();
        for (var s = 0; s < sheets.length; s++) {
          var sName = sheets[s].getName();
          if (sName === "Sheet1" || sName === "Sheet 1") {
            sheets[s].setName("মাদ্রাসার ওস্তাদগণ");
            targetSheet = sheets[s];
            break;
          }
        }
      }

      // যদি এখনও না পাওয়া যায়, নতুন শিট তৈরি করা
      if (!targetSheet) {
        targetSheet = doc.insertSheet(tabName);
      }

      // হেডার সেটআপ
      var lastRow = targetSheet.getLastRow();
      var lastCol = targetSheet.getLastColumn();
      if (lastRow === 0 || lastCol === 0) {
        targetSheet.appendRow(headers);
        var headerRange = targetSheet.getRange(1, 1, 1, headers.length);
        headerRange.setBackground(headerBg);
        headerRange.setFontColor("#ffffff");
        headerRange.setFontWeight("bold");
        headerRange.setHorizontalAlignment("center");
        headerRange.setVerticalAlignment("middle");
        targetSheet.setRowHeight(1, 38);
        targetSheet.setFrozenRows(1);
      }
      return targetSheet;
    }

    // দুটি পৃথক ট্যাব নিশ্চিত করা
    var ustadSheet = getOrCreateTab("মাদ্রাসার ওস্তাদগণ", ustadHeaders, "#064e3b");
    var sirSheet = getOrCreateTab("সাধারণ শিক্ষক (স্যারগণ)", sirHeaders, "#1e3a8a");

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
    var submissionId = data.submissionId || ("USTAD-" + Date.now());

    var eduType = (data.eduType || "").toString();
    var eduTypeValue = (data.eduTypeValue || "").toString().toLowerCase();

    // শিক্ষাগত ধরন শনাক্তকরণ
    var isGeneral = (eduTypeValue === "general" || eduType.indexOf("সাধারণ") !== -1 || eduType.indexOf("স্যার") !== -1);
    var isBoth = (eduTypeValue === "both" || eduType.indexOf("উভয়") !== -1);
    var isMadrasa = (!isGeneral && !isBoth) || (eduTypeValue === "madrasa" || eduType.indexOf("কওমি") !== -1);

    // ডুপ্লিকেট এন্ট্রি প্রতিরোধ হেল্পার
    function checkDuplicate(targetSheet) {
      var lRow = targetSheet.getLastRow();
      if (lRow > 1) {
        var lVals = targetSheet.getRange(lRow, 2, 1, 3).getValues()[0];
        var lName = lVals[0];
        var lPhone = (lVals[2] || "").toString().replace(/'/g, "");
        var cPhone = (data.personalPhone || "").toString().replace(/'/g, "");
        if (lName === fullName && lPhone === cPhone) {
          return true;
        }
      }
      return false;
    }

    // কলাম হেডারের সাথে মান ডায়নামিকালি মিলিয়ে ইনসার্ট করা
    function appendDataToSheet(targetSheet, fieldMap) {
      var activeHeaders = targetSheet.getRange(1, 1, 1, targetSheet.getLastColumn()).getValues()[0];
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
      targetSheet.appendRow(newRow);
      var fRow = targetSheet.getLastRow();
      targetSheet.getRange(fRow, 1, 1, newRow.length).setVerticalAlignment("middle");
      return fRow;
    }

    var savedInfo = [];

    // ১. সাধারণ শিক্ষক (স্যার) হলে শুধুমাত্র "সাধারণ শিক্ষক (স্যারগণ)" ট্যাবে সেভ হবে
    if (isGeneral || isBoth) {
      if (!checkDuplicate(sirSheet)) {
        var sirFieldMap = {
          "টাইমস্ট্যাম্প": timestamp,
          "পূর্ণ নাম": fullName,
          "পিতার নাম": fatherName,
          "ব্যক্তিগত মোবাইল নম্বর": personalPhone,
          "অভিভাবক / ২য় নম্বর": guardianPhone,
          "জেলা": district,
          "উপজেলা / থানা": thana,
          "গ্রাম ও ডাকঘর": addressDetails,
          "জন্ম তারিখ": birthDate,
          "নিয়োগ / যোগদানের তারিখ": joiningDate,
          "যোগদানের তারিখ": joiningDate,
          "হাফেজে কুরআন": isHafiz,
          "হিফয": isHafiz,
          "সর্বোচ্চ ডিগ্রি / শিক্ষাগত যোগ্যতা": data.generalDegree || "",
          "সর্বোচ্চ ডিগ্রি": data.generalDegree || "",
          "পঠিত মূল বিষয় / বিভাগ": data.generalSubject || "",
          "পঠিত বিষয়": data.generalSubject || "",
          "শিক্ষা প্রতিষ্ঠান (কলেজ / বিশ্ববিদ্যালয়)": data.generalInstitute || "",
          "শিক্ষা প্রতিষ্ঠান": data.generalInstitute || "",
          "পাশের সন": data.generalYear || "",
          "ফলাফল / গ্রেড / সিজিপিএ": data.generalResult || "",
          "ফলাফল": data.generalResult || "",
          "পেশাগত প্রশিক্ষণ / অন্যান্য যোগ্যতা": data.extraQualifications || "",
          "অতিরিক্ত যোগ্যতা": data.extraQualifications || "",
          "সাবমিশন আইডি": submissionId
        };
        var sRow = appendDataToSheet(sirSheet, sirFieldMap);
        savedInfo.push("সাধারণ শিক্ষক (স্যারগণ) ট্যাবে সংরক্ষিত (সারি: " + sRow + ")");
      } else {
        savedInfo.push("সাধারণ শিক্ষক ট্যাবে ইতিমধ্যে সংরক্ষিত ছিল");
      }
    }

    // ২. কওমি মাদ্রাসার ওস্তাদ হলে শুধুমাত্র "মাদ্রাসার ওস্তাদগণ" ট্যাবে সেভ হবে
    if (isMadrasa || isBoth) {
      if (!checkDuplicate(ustadSheet)) {
        var takhassusVal = data.takhassus || "";
        if (isBoth && data.generalDegree && data.generalDegree !== "প্রযোজ্য নয়") {
          takhassusVal = (takhassusVal ? takhassusVal + " | " : "") + "জেনারেল: " + data.generalDegree + " (" + (data.generalSubject || "") + ")";
        }

        var ustadFieldMap = {
          "টাইমস্ট্যাম্প": timestamp,
          "পূর্ণ নাম": fullName,
          "পিতার নাম": fatherName,
          "ব্যক্তিগত মোবাইল নম্বর": personalPhone,
          "অভিভাবক / ২য় নম্বর": guardianPhone,
          "জেলা": district,
          "উপজেলা / থানা": thana,
          "গ্রাম ও ডাকঘর": addressDetails,
          "জন্ম তারিখ": birthDate,
          "নিয়োগ / যোগদানের তারিখ": joiningDate,
          "যোগদানের তারিখ": joiningDate,
          "হাফেজে কুরআন (হিফয)": isHafiz,
          "হাফেজে কুরআন": isHafiz,
          "হিফয": isHafiz,
          "ফারেগ প্রতিষ্ঠান (দাওরা মাদ্রাসা)": data.dawrahMadrasa || "",
          "ফারেগ প্রতিষ্ঠান": data.dawrahMadrasa || "",
          "দাওরা পাশের সন": data.dawrahYear || "",
          "দাওরার ফলাফল (বিভাগ)": data.dawrahResult || "",
          "তাখাসসুসাত (উচ্চতর ডিগ্রি)": takhassusVal,
          "তাখাসসুসাত": takhassusVal,
          "সাবমিশন আইডি": submissionId
        };
        var uRow = appendDataToSheet(ustadSheet, ustadFieldMap);
        savedInfo.push("মাদ্রাসার ওস্তাদগণ ট্যাবে সংরক্ষিত (সারি: " + uRow + ")");
      } else {
        savedInfo.push("মাদ্রাসার ওস্তাদগণ ট্যাবে ইতিমধ্যে সংরক্ষিত ছিল");
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: savedInfo.join(', '),
      submissionId: submissionId
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
