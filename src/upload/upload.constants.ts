export const KYC_UPLOAD_SUBDIR = 'kyc';
export const PROPERTY_UPLOAD_SUBDIR = 'properties';
export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export const MAX_KYC_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_PROPERTY_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_PROPERTY_IMAGES = 20;
