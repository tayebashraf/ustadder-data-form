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
const dawrahMadrasaInput = document.getElementById('dawrahMadrasa');
const dawrahYearSelect = document.getElementById('dawrahYear');
const dawrahResultSelect = document.getElementById('dawrahResult');
const takhassusSelect = document.getElementById('takhassusSelect');
const otherTakhassusBox = document.getElementById('otherTakhassusBox');
const otherTakhassusInput = document.getElementById('otherTakhassusInput');

// Submit Buttons
const submitBtn = document.getElementById('submitBtn');
const submitSpinner = document.getElementById('submitSpinner');
const submitText = document.getElementById('submitText');

// Success Dialog
const successModal = document.getElementById('successModal');
const newEntryBtn = document.getElementById('newEntryBtn');
const rName = document.getElementById('rName');
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

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Explicit field validations with precise Bengali toasts
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
    showToast('অনুগ্রহ করে মাদ্রাসায় নিয়োগের তারিখ নির্বাচন করুন', true);
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

  let finalTakhassus = takhassusSelect.value;
  if (finalTakhassus === 'অন্যান্য') {
    finalTakhassus = otherTakhassusInput.value.trim() ? `অন্যান্য: ${otherTakhassusInput.value.trim()}` : 'অন্যান্য';
  }

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
    dawrahMadrasa: dawrahMadrasaInput.value.trim(),
    dawrahYear: dawrahYearSelect.value,
    dawrahResult: dawrahResultSelect.value,
    takhassus: finalTakhassus,
    timestamp: new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })
  };

  // UI Loading
  submitBtn.disabled = true;
  submitSpinner.classList.remove('hidden');
  submitText.textContent = 'জমা হচ্ছে...';

  const sheetUrl = getSheetUrl();
  let sheetSaved = false;

  if (sheetUrl && sheetUrl.startsWith('http')) {
    try {
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      sheetSaved = true;
    } catch (err) {
      console.warn('Google Sheet send note:', err);
    }
  }

  // Backup in browser
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(payload);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(list));
  } catch (e) {}

  submitBtn.disabled = false;
  submitSpinner.classList.add('hidden');
  submitText.textContent = 'জমা দিন';

  // Show Success Modal safely
  if (rName) rName.textContent = payload.fullName;
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
});
