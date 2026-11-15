import { PrescriptionAttachment } from '@/data/types';

export const MAX_PRESCRIPTION_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

/**
 * Formats byte size into human readable string (KB / MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Validates that the uploaded file is an image and does not exceed 5MB.
 */
export function validatePrescriptionFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Please upload an image file (PNG, JPG, WEBP, or JPEG).',
    };
  }

  // Check 5MB limit
  if (file.size > MAX_PRESCRIPTION_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the 5MB maximum limit. Please upload a smaller image.`,
    };
  }

  return { valid: true };
}

/**
 * Reads and optimizes an image file for storage in localStorage.
 * If image dimensions exceed 1600px or size is large, scales it down on a canvas
 * to prevent localStorage quota exhaustion while preserving high legibility of doctor's handwriting & rx details.
 */
export async function compressAndReadPrescription(file: File): Promise<PrescriptionAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file.'));

    reader.onload = () => {
      const originalDataUrl = reader.result as string;

      const img = new Image();
      img.onerror = () => {
        // Fallback to raw dataUrl if decoding fails
        resolve({
          id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          fileName: file.name,
          fileSize: file.size,
          dataUrl: originalDataUrl,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      };

      img.onload = () => {
        const MAX_DIMENSION = 1600;
        let width = img.width;
        let height = img.height;

        // Check if downscaling is needed
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            fileName: file.name,
            fileSize: file.size,
            dataUrl: originalDataUrl,
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG (quality 0.85 offers great clarity for text & signatures while ~85% smaller)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // Calculate approximate byte size of base64
        const head = 'data:image/jpeg;base64,';
        const base64Length = compressedDataUrl.length - head.length;
        const estimatedBytes = Math.round((base64Length * 3) / 4);

        resolve({
          id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          fileName: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
          fileSize: estimatedBytes > 0 ? estimatedBytes : file.size,
          dataUrl: compressedDataUrl,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      };

      img.src = originalDataUrl;
    };

    reader.readAsDataURL(file);
  });
}
