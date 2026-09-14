/**
 * ==============================================================================
 * আপনার তথ্য দিন - ফর্ম লজিক ও গুগল শিট ইন্টিগ্রেশন
 * গুগল একাউন্ট: ashikpushpo07@gmail.com
 * ==============================================================================
 */

const STORAGE_KEYS = {
  SHEET_URL: 'ustad_google_sheet_url',
  RECORDS: 'ustad_saved_records'
};

// Elements
const form = document.getElementById('teacherForm');
const fullNameInput = document.getElementById('fullName');
const fatherNameInput = document.getElementById('fatherName');
const birthDateInput = document.getElementById('birthDate');
const joiningDateInput = document.getElementById('joiningDate');
const personalPhoneInput = document.getElementById('personalPhone');
const guardianPhoneInput = document.getElementById('guardianPhone');
const districtSelect = document.getElementById('districtSelect');
const thanaSelect = document.getElementById('thanaSelect');
const customThanaBox = document.getElementById('customThanaBox');
const customThanaInput = document.getElementById('customThanaInput');
const addressDetailsInput = document.getElementById('addressDetails');

// Education Stream Switcher & Blocks
const eduTypeRadios = document.querySelectorAll('input[name="eduType"]');
const madrasaBlock = document.getElementById('madrasaBlock');
const generalBlock = document.getElementById('generalBlock');

// Madrasa Fields
const isHafizSelect = document.getElementById('isHafizSelect');
const dawrahMadrasaInput = document.getElementById('dawrahMadrasa');
const dawrahYearSelect = document.getElementById('dawrahYear');
const dawrahResultSelect = document.getElementById('dawrahResult');
const takhassusSelect = document.getElementById('takhassusSelect');
const otherTakhassusBox = document.getElementById('otherTakhassusBox');
const otherTakhassusInput = document.getElementById('otherTakhassusInput');

// General Education Fields (For Sirs / General Teachers)
const generalDegreeSelect = document.getElementById('generalDegreeSelect');
const otherDegreeBox = document.getElementById('otherDegreeBox');
const otherDegreeInput = document.getElementById('otherDegreeInput');
const generalSubjectInput = document.getElementById('generalSubject');
const generalInstituteInput = document.getElementById('generalInstitute');
const generalYearSelect = document.getElementById('generalYear');
const generalResultSelect = document.getElementById('generalResult');
const otherResultBox = document.getElementById('otherResultBox');
const otherResultInput = document.getElementById('otherResultInput');
const extraQualificationsInput = document.getElementById('extraQualifications');

// Submit Buttons
const submitBtn = document.getElementById('submitBtn');
const submitSpinner = document.getElementById('submitSpinner');
const submitText = document.getElementById('submitText');

// Success Dialog
const successModal = document.getElementById('successModal');
const newEntryBtn = document.getElementById('newEntryBtn');
const rName = document.getElementById('rName');
const rEduType = document.getElementById('rEduType');
const rDegreeInfo = document.getElementById('rDegreeInfo');
const rHafiz = document.getElementById('rHafiz');
const rFather = document.getElementById('rFather');
const rPhone = document.getElementById('rPhone');
const rAddress = document.getElementById('rAddress');
const rMadrasa = document.getElementById('rMadrasa');
const rResult = document.getElementById('rResult');
const rTakhassus = document.getElementById('rTakhassus');

// Admin Settings Modal (for setting Google Sheet Web App URL)
const adminConfigBtn = document.getElementById('adminConfigBtn');
const adminModal = document.getElementById('adminModal');
const adminSheetUrlInput = document.getElementById('adminSheetUrlInput');
const saveAdminBtn = document.getElementById('saveAdminBtn');
const closeAdminBtn = document.getElementById('closeAdminBtn');
const toastContainer = document.getElementById('toastContainer');

// ==============================================================================
// Utility Functions
// ==============================================================================

function toEnglishDigits(str) {
  if (!str) return '';
  const bnToEnMap = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '⑧': '8', '৮': '8', '৯': '9'
  };
  return str.toString().replace(/[০-৯]/g, (char) => bnToEnMap[char] || char);
}

function toBengaliDigits(str) {
  if (!str) return '';
  const enToBnMap = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return str.toString().replace(/[0-9]/g, (char) => enToBnMap[char] || char);
}

function normalizePhoneNumber(phoneStr) {
  if (!phoneStr) return '';
  let cleaned = toEnglishDigits(phoneStr).replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('880')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

function isValidBdMobile(phoneStr) {
  const normalized = normalizePhoneNumber(phoneStr);
  return /^01[3-9]\d{8}$/.test(normalized);
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'toast-error' : ''}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==============================================================================
// জেলা ও থানা ড্রপডাউন লোডিং
// ==============================================================================

function populateDistricts() {
  if (typeof BD_GEO_DATA === 'undefined') return;
  districtSelect.innerHTML = '<option value="" disabled selected>জেলা নির্বাচন করুন</option>';
  
  const districts = Object.keys(BD_GEO_DATA).sort((a, b) => a.localeCompare(b, 'bn'));
  districts.forEach(dist => {
    const opt = document.createElement('option');
    opt.value = dist;
    opt.textContent = dist;
    districtSelect.appendChild(opt);
  });
}

districtSelect.addEventListener('change', () => {
  const selectedDist = districtSelect.value;
  thanaSelect.innerHTML = '<option value="" disabled selected>থানা / উপজেলা নির্বাচন করুন</option>';
  customThanaBox.classList.add('hidden');
  customThanaInput.value = '';

  if (selectedDist && BD_GEO_DATA[selectedDist]) {
    thanaSelect.disabled = false;
    const thanas = [...BD_GEO_DATA[selectedDist]].sort((a, b) => a.localeCompare(b, 'bn'));
    
    thanas.forEach(th => {
      const opt = document.createElement('option');
      opt.value = th;
      opt.textContent = th;
      thanaSelect.appendChild(opt);
    });

    const otherOpt = document.createElement('option');
    otherOpt.value = 'অন্যান্য';
    otherOpt.textContent = 'অন্যান্য / তালিকায় না থাকলে লিখুন';
    thanaSelect.appendChild(otherOpt);
  } else {
    thanaSelect.disabled = true;
  }
});

thanaSelect.addEventListener('change', () => {
  if (thanaSelect.value === 'অন্যান্য') {
    customThanaBox.classList.remove('hidden');
    customThanaInput.focus();
    customThanaInput.required = true;
  } else {
    customThanaBox.classList.add('hidden');
    customThanaInput.required = false;
  }
});

takhassusSelect.addEventListener('change', () => {
  if (takhassusSelect.value === 'অন্যান্য') {
    otherTakhassusBox.classList.remove('hidden');
    otherTakhassusInput.focus();
    otherTakhassusInput.required = true;
  } else {
    otherTakhassusBox.classList.add('hidden');
    otherTakhassusInput.required = false;
  }
});

// ==============================================================================
// শিক্ষাগত মাধ্যমের সুইচিং ও সাধারণ শিক্ষার হ্যান্ডলিং
// ==============================================================================

function updateEduTypeView() {
  const selected = document.querySelector('input[name="eduType"]:checked');
  const val = selected ? selected.value : 'madrasa';

  if (val === 'madrasa') {
    madrasaBlock.classList.remove('hidden');
    generalBlock.classList.add('hidden');
  } else if (val === 'general') {
    madrasaBlock.classList.add('hidden');
    generalBlock.classList.remove('hidden');
  } else if (val === 'both') {
    madrasaBlock.classList.remove('hidden');
    generalBlock.classList.remove('hidden');
  }
}

eduTypeRadios.forEach(radio => {
  radio.addEventListener('change', updateEduTypeView);
});

if (generalDegreeSelect) {
  generalDegreeSelect.addEventListener('change', () => {
    if (generalDegreeSelect.value === 'অন্যান্য') {
      otherDegreeBox.classList.remove('hidden');
      otherDegreeInput.focus();
    } else {
      otherDegreeBox.classList.add('hidden');
    }
  });
}

if (generalResultSelect) {
  generalResultSelect.addEventListener('change', () => {
    if (generalResultSelect.value === 'অন্যান্য') {
      otherResultBox.classList.remove('hidden');
      otherResultInput.focus();
    } else {
      otherResultBox.classList.add('hidden');
    }
  });
}

function populateDawrahYears() {
  dawrahYearSelect.innerHTML = '<option value="" disabled selected>সন নির্বাচন করুন</option>';
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1980; y--) {
    const hijri = y - 579;
    const opt = document.createElement('option');
    const label = `${toBengaliDigits(y)} ঈসায়ী / ${toBengaliDigits(hijri)} হিজরী`;
    opt.value = label;
    opt.textContent = label;
    dawrahYearSelect.appendChild(opt);
  }
}

function populateGeneralYears() {
  if (!generalYearSelect) return;
  generalYearSelect.innerHTML = '<option value="" disabled selected>সন নির্বাচন করুন</option>';
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1980; y--) {
    const opt = document.createElement('option');
    const label = `${toBengaliDigits(y)} ঈসায়ী`;
    opt.value = label;
    opt.textContent = label;
    generalYearSelect.appendChild(opt);
  }
}

// Google Apps Script Web App URL for ashikpushpo07@gmail.com
const DEFAULT_GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxA-yZaQHS_qKm5dMBUzJGtp6Tw16JvyKsyeoFuOyyMWN2oQOe14Z13WgQ13Mhk6Lmn9A/exec';

function getSheetUrl() {
  return localStorage.getItem(STORAGE_KEYS.SHEET_URL) || DEFAULT_GOOGLE_SHEET_URL;
}

// Support passing ?sheet=... in the URL to override if ever needed
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('sheet')) {
  const paramSheet = urlParams.get('sheet').trim();
  if (paramSheet) {
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, paramSheet);
  }
}

let isFormSubmitting = false;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isFormSubmitting) return;

  // ১. মৌলিক তথ্যের যাচাই (সকলের জন্য বাধ্যতামূলক)
  if (!fullNameInput.value.trim()) {
    fullNameInput.focus();
    showToast('অনুগ্রহ করে পূর্ণ নাম লিখুন', true);
    return;
  }

  if (!fatherNameInput.value.trim()) {
    fatherNameInput.focus();
    showToast('অনুগ্রহ করে পিতার নাম লিখুন', true);
    return;
  }

  if (!birthDateInput.value) {
    birthDateInput.focus();
    showToast('অনুগ্রহ করে জন্ম তারিখ নির্বাচন করুন', true);
    return;
  }

  if (!joiningDateInput.value) {
    joiningDateInput.focus();
    showToast('অনুগ্রহ করে নিয়োগ / যোগদানের তারিখ নির্বাচন করুন', true);
    return;
  }

  const personalRaw = personalPhoneInput.value;
  const personalNorm = normalizePhoneNumber(personalRaw);
  if (!isValidBdMobile(personalNorm)) {
    personalPhoneInput.focus();
    showToast('অনুগ্রহ করে সঠিক ১১ ডিজিটের ব্যক্তিগত মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)', true);
    return;
  }

  let guardianNorm = '';
  if (guardianPhoneInput.value.trim()) {
    guardianNorm = normalizePhoneNumber(guardianPhoneInput.value);
    if (!isValidBdMobile(guardianNorm)) {
      guardianPhoneInput.focus();
      showToast('অভিভাবকের নম্বরটি সঠিক ১১ ডিজিট হতে হবে', true);
      return;
    }
  }

  if (!districtSelect.value) {
    districtSelect.focus();
    showToast('অনুগ্রহ করে জেলা নির্বাচন করুন', true);
    return;
  }

  if (!thanaSelect.value) {
    thanaSelect.focus();
    showToast('অনুগ্রহ করে থানা / উপজেলা নির্বাচন করুন', true);
    return;
  }

  let finalThana = thanaSelect.value;
  if (finalThana === 'অন্যান্য') {
    finalThana = customThanaInput.value.trim();
    if (!finalThana) {
      customThanaInput.focus();
      showToast('অনুগ্রহ করে আপনার থানার নাম লিখুন', true);
      return;
    }
  }

  if (!addressDetailsInput.value.trim()) {
    addressDetailsInput.focus();
    showToast('অনুগ্রহ করে গ্রাম / মহল্লা ও ডাকঘর লিখুন', true);
    return;
  }

  if (!isHafizSelect.value) {
    isHafizSelect.focus();
    showToast('অনুগ্রহ করে আপনি হাফেজে কুরআন কি না নির্বাচন করুন', true);
    return;
  }

  // ২. শিক্ষাগত ব্যাকগ্রাউন্ড নির্ধারণ
  const selectedEduTypeRadio = document.querySelector('input[name="eduType"]:checked');
  const eduTypeValue = selectedEduTypeRadio ? selectedEduTypeRadio.value : 'madrasa';

  let eduTypeLabel = 'কওমি মাদ্রাসা';
  if (eduTypeValue === 'general') eduTypeLabel = 'সাধারণ শিক্ষা (স্যার)';
  else if (eduTypeValue === 'both') eduTypeLabel = 'উভয় মাধ্যম (মাদ্রাসা ও সাধারণ)';

  // ৩. কওমি মাদ্রাসা তথ্যের শর্তসাপেক্ষ ভ্যালিডেশন
  let finalDawrahMadrasa = 'প্রযোজ্য নয়';
  let finalDawrahYear = 'প্রযোজ্য নয়';
  let finalDawrahResult = 'প্রযোজ্য নয়';
  let finalTakhassus = 'প্রযোজ্য নয়';

  if (eduTypeValue === 'madrasa' || eduTypeValue === 'both') {
    if (!dawrahMadrasaInput.value.trim()) {
      dawrahMadrasaInput.focus();
      showToast('অনুগ্রহ করে ফারেগ মাদ্রাসার নাম লিখুন', true);
      return;
    }
    if (!dawrahYearSelect.value) {
      dawrahYearSelect.focus();
      showToast('অনুগ্রহ করে দাওরা পাশের সন নির্বাচন করুন', true);
      return;
    }
    if (!dawrahResultSelect.value) {
      dawrahResultSelect.focus();
      showToast('অনুগ্রহ করে দাওরায়ে হাদীসের ফলাফল নির্বাচন করুন', true);
      return;
    }

    finalDawrahMadrasa = dawrahMadrasaInput.value.trim();
    finalDawrahYear = dawrahYearSelect.value;
    finalDawrahResult = dawrahResultSelect.value;
    finalTakhassus = takhassusSelect.value;
    if (finalTakhassus === 'অন্যান্য') {
      finalTakhassus = otherTakhassusInput.value.trim() ? `অন্যান্য: ${otherTakhassusInput.value.trim()}` : 'অন্যান্য';
    }
  }

  // ৪. সাধারণ শিক্ষা তথ্যের শর্তসাপেক্ষ ভ্যালিডেশন (স্যারদের জন্য)
  let finalGeneralDegree = 'প্রযোজ্য নয়';
  let finalGeneralSubject = 'প্রযোজ্য নয়';
  let finalGeneralInstitute = 'প্রযোজ্য নয়';
  let finalGeneralYear = 'প্রযোজ্য নয়';
  let finalGeneralResult = 'প্রযোজ্য নয়';
  let finalExtraQualifications = 'প্রযোজ্য নয়';

  if (eduTypeValue === 'general' || eduTypeValue === 'both') {
    if (!generalDegreeSelect.value) {
      generalDegreeSelect.focus();
      showToast('অনুগ্রহ করে আপনার সর্বোচ্চ ডিগ্রি নির্বাচন করুন', true);
      return;
    }
    if (generalDegreeSelect.value === 'অন্যান্য' && !otherDegreeInput.value.trim()) {
      otherDegreeInput.focus();
      showToast('অনুগ্রহ করে আপনার ডিগ্রির নাম লিখুন', true);
      return;
    }
    if (!generalSubjectInput.value.trim()) {
      generalSubjectInput.focus();
      showToast('অনুগ্রহ করে পঠিত মূল বিষয় বা বিভাগ লিখুন', true);
      return;
    }
    if (!generalInstituteInput.value.trim()) {
      generalInstituteInput.focus();
      showToast('অনুগ্রহ করে আপনার শিক্ষাপ্রতিষ্ঠান বা কলেজের নাম লিখুন', true);
      return;
    }
    if (!generalYearSelect.value) {
      generalYearSelect.focus();
      showToast('অনুগ্রহ করে পাশের সন নির্বাচন করুন', true);
      return;
    }
    if (!generalResultSelect.value) {
      generalResultSelect.focus();
      showToast('অনুগ্রহ করে আপনার ফলাফল বা সিজিপিএ নির্বাচন করুন', true);
      return;
    }
    if (generalResultSelect.value === 'অন্যান্য' && !otherResultInput.value.trim()) {
      otherResultInput.focus();
      showToast('অনুগ্রহ করে ফলাফল বা গ্রেড লিখুন', true);
      return;
    }

    finalGeneralDegree = generalDegreeSelect.value;
    if (finalGeneralDegree === 'অন্যান্য') {
      finalGeneralDegree = otherDegreeInput.value.trim() ? `অন্যান্য: ${otherDegreeInput.value.trim()}` : 'অন্যান্য';
    }
    finalGeneralSubject = generalSubjectInput.value.trim();
    finalGeneralInstitute = generalInstituteInput.value.trim();
    finalGeneralYear = generalYearSelect.value;
    finalGeneralResult = generalResultSelect.value;
    if (finalGeneralResult === 'অন্যান্য') {
      finalGeneralResult = otherResultInput.value.trim() ? otherResultInput.value.trim() : 'অন্যান্য';
    }
    finalExtraQualifications = extraQualificationsInput.value.trim() || 'নেই / প্রযোজ্য নয়';
  }

  // ৫. সম্পূর্ণ পেলোড তৈরি
  const payload = {
    submissionId: 'USTAD-' + Date.now().toString().slice(-6),
    fullName: fullNameInput.value.trim(),
    fatherName: fatherNameInput.value.trim(),
    personalPhone: personalNorm,
    guardianPhone: guardianNorm || 'প্রযোজ্য নয়',
    district: districtSelect.value,
    thana: finalThana,
    addressDetails: addressDetailsInput.value.trim(),
    birthDate: birthDateInput.value,
    joiningDate: joiningDateInput.value,
    eduType: eduTypeLabel,
    eduTypeValue: eduTypeValue,
    isHafiz: isHafizSelect.value,
    dawrahMadrasa: finalDawrahMadrasa,
    dawrahYear: finalDawrahYear,
    dawrahResult: finalDawrahResult,
    takhassus: finalTakhassus,
    generalDegree: finalGeneralDegree,
    generalSubject: finalGeneralSubject,
    generalInstitute: finalGeneralInstitute,
    generalYear: finalGeneralYear,
    generalResult: finalGeneralResult,
    extraQualifications: finalExtraQualifications,
    timestamp: new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })
  };

  // UI Loading
  isFormSubmitting = true;
  submitBtn.disabled = true;
  submitSpinner.classList.remove('hidden');
  submitText.textContent = 'জমা হচ্ছে...';

  const sheetUrl = getSheetUrl();
  let sheetSaved = false;

  if (sheetUrl && sheetUrl.startsWith('http')) {
    const q = new URLSearchParams(payload).toString();
    const fullUrl = `${sheetUrl}?${q}`;

    try {
      // Single verified GET fetch
      await fetch(fullUrl, {
        method: 'GET',
        mode: 'no-cors'
      });
      sheetSaved = true;
    } catch (err1) {
      console.warn('Fetch note, attempting fallback:', err1);
      try {
        // Fallback only if fetch failed
        const beacon = new Image();
        beacon.src = fullUrl;
        sheetSaved = true;
      } catch (err2) {
        console.warn('Fallback note:', err2);
      }
    }
  }

  // Backup in browser
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(payload);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(list));
  } catch (e) {}

  isFormSubmitting = false;
  submitBtn.disabled = false;
  submitSpinner.classList.add('hidden');
  submitText.textContent = 'জমা দিন';

  // Show Success Modal safely
  if (rName) rName.textContent = payload.fullName;
  if (rEduType) {
    if (eduTypeValue === 'general') {
      rEduType.textContent = 'সাধারণ শিক্ষা (স্কুল/কলেজ)';
    } else if (eduTypeValue === 'both') {
      rEduType.textContent = 'উভয় মাধ্যম (মাদ্রাসা ও সাধারণ)';
    } else {
      rEduType.textContent = 'কওমি মাদ্রাসা';
    }
  }
  if (rDegreeInfo) {
    if (eduTypeValue === 'general') {
      const deg = payload.generalDegree ? payload.generalDegree.split('(')[0].trim() : 'স্নাতক';
      const subj = payload.generalSubject ? ` - ${payload.generalSubject}` : '';
      rDegreeInfo.textContent = `${deg}${subj}`;
    } else if (eduTypeValue === 'both') {
      const deg = payload.generalDegree ? payload.generalDegree.split('(')[0].trim() : 'জেনারেল ডিগ্রি';
      rDegreeInfo.textContent = `দাওরায়ে হাদীস + ${deg}`;
    } else {
      let deg = 'দাওরায়ে হাদীস';
      if (payload.dawrahYear) deg += ` (${toBengaliDigits(payload.dawrahYear)})`;
      if (payload.isHafiz && payload.isHafiz.includes('হ্যাঁ')) deg = `হাফেজে কুরআন, ${deg}`;
      rDegreeInfo.textContent = deg;
    }
  }
  if (rHafiz) rHafiz.textContent = payload.isHafiz;
  if (rFather) rFather.textContent = payload.fatherName;
  if (rPhone) rPhone.textContent = toBengaliDigits(payload.personalPhone);
  if (rAddress) rAddress.textContent = `${payload.addressDetails}, থানা: ${payload.thana}, জেলা: ${payload.district}`;
  if (rMadrasa) rMadrasa.textContent = payload.dawrahMadrasa;
  if (rResult) rResult.textContent = `${payload.dawrahResult} (${payload.dawrahYear})`;
  if (rTakhassus) rTakhassus.textContent = payload.takhassus;

  successModal.showModal();

  // Reset form
  form.reset();
  thanaSelect.disabled = true;
  customThanaBox.classList.add('hidden');
  otherTakhassusBox.classList.add('hidden');
  if (otherDegreeBox) otherDegreeBox.classList.add('hidden');
  if (otherResultBox) otherResultBox.classList.add('hidden');

  // Reset switcher back to default
  const defaultRadio = document.querySelector('input[name="eduType"][value="madrasa"]');
  if (defaultRadio) defaultRadio.checked = true;
  updateEduTypeView();
});

newEntryBtn.addEventListener('click', () => {
  successModal.close();
  fullNameInput.focus();
});

// Admin Modal for ashikpushpo07@gmail.com
adminConfigBtn.addEventListener('click', () => {
  adminSheetUrlInput.value = getSheetUrl();
  adminModal.showModal();
});

closeAdminBtn.addEventListener('click', () => adminModal.close());

saveAdminBtn.addEventListener('click', () => {
  const url = adminSheetUrlInput.value.trim();
  localStorage.setItem(STORAGE_KEYS.SHEET_URL, url);
  adminModal.close();
  showToast('গুগল শিট লিঙ্ক সংরক্ষিত হয়েছে!');
});

// Keyboard shortcut: Alt + S for settings
window.addEventListener('keydown', (e) => {
  if (e.altKey && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    adminConfigBtn.click();
  }
});

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  populateDistricts();
  populateDawrahYears();
  populateGeneralYears();
  updateEduTypeView();
});
