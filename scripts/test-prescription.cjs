// scripts/test-prescription.cjs
const assert = require('assert');

console.log('=== TESTING PRESCRIPTION VALIDATION & ATTACHMENT LOGIC ===');

const MAX_PRESCRIPTION_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validatePrescriptionFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }
  if (!file.type || !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Please upload an image file (PNG, JPG, WEBP, or JPEG).',
    };
  }
  if (file.size > MAX_PRESCRIPTION_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the 5MB maximum limit. Please upload a smaller image.`,
    };
  }
  return { valid: true };
}

// 1. Test formatFileSize
assert.strictEqual(formatFileSize(500), '500 B');
assert.strictEqual(formatFileSize(2048), '2.0 KB');
assert.strictEqual(formatFileSize(5 * 1024 * 1024), '5.00 MB');
console.log('✔ formatFileSize passed');

// 2. Test validatePrescriptionFile with valid 2MB JPEG
const validFile = { name: 'dr_prescription.jpg', type: 'image/jpeg', size: 2 * 1024 * 1024 };
const resValid = validatePrescriptionFile(validFile);
assert.strictEqual(resValid.valid, true);
console.log('✔ Valid 2MB image passed');

// 3. Test validatePrescriptionFile with oversized 5.1MB file
const bigFile = { name: 'huge_scan.png', type: 'image/png', size: 5.1 * 1024 * 1024 };
const resBig = validatePrescriptionFile(bigFile);
assert.strictEqual(resBig.valid, false);
assert.ok(resBig.error.includes('exceeds the 5MB maximum limit'));
console.log('✔ 5.1MB file correctly rejected with >5MB limit message');

// 4. Test non-image file
const pdfFile = { name: 'document.pdf', type: 'application/pdf', size: 1024 * 1024 };
const resPdf = validatePrescriptionFile(pdfFile);
assert.strictEqual(resPdf.valid, false);
assert.ok(resPdf.error.includes('Please upload an image file'));
console.log('✔ Non-image file correctly rejected');

// 5. Test exactly 5MB boundary
const boundaryFile = { name: 'boundary.webp', type: 'image/webp', size: 5 * 1024 * 1024 };
const resBoundary = validatePrescriptionFile(boundaryFile);
assert.strictEqual(resBoundary.valid, true);
console.log('✔ Exactly 5MB file accepted at boundary');

// 6. Test 5MB + 1 byte
const boundaryOverFile = { name: 'boundary_over.webp', type: 'image/webp', size: 5 * 1024 * 1024 + 1 };
const resBoundaryOver = validatePrescriptionFile(boundaryOverFile);
assert.strictEqual(resBoundaryOver.valid, false);
console.log('✔ 5MB + 1 byte file rejected');

console.log('\nALL 6 PRESCRIPTION TESTS PASSED SUCCESSFULLY!');
