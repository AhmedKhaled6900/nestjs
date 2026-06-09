import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import {
  ALLOWED_IMAGE_MIMES,
  KYC_UPLOAD_SUBDIR,
  MAX_KYC_IMAGE_SIZE_BYTES,
  MAX_PROPERTY_IMAGE_SIZE_BYTES,
  PROPERTY_UPLOAD_SUBDIR,
} from './upload.constants';

@Injectable()
export class UploadService {
  private readonly uploadRoot = join(process.cwd(), 'uploads');

  async saveKycImage(
    file: Express.Multer.File,
    userId: string,
    fieldName: string,
  ): Promise<string> {
    this.validateImage(file, fieldName);

    const extension = this.resolveExtension(file);
    const directory = join(this.uploadRoot, KYC_UPLOAD_SUBDIR, userId);
    const filename = `${fieldName}-${randomUUID()}${extension}`;
    const absolutePath = join(directory, filename);

    await mkdir(directory, { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return `/uploads/${KYC_UPLOAD_SUBDIR}/${userId}/${filename}`;
  }

  async savePropertyImage(
    file: Express.Multer.File,
    propertyId: string,
  ): Promise<string> {
    this.validateImage(file, 'image', MAX_PROPERTY_IMAGE_SIZE_BYTES);

    const extension = this.resolveExtension(file);
    const directory = join(this.uploadRoot, PROPERTY_UPLOAD_SUBDIR, propertyId);
    const filename = `${randomUUID()}${extension}`;
    const absolutePath = join(directory, filename);

    await mkdir(directory, { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return `/uploads/${PROPERTY_UPLOAD_SUBDIR}/${propertyId}/${filename}`;
  }

  toPublicUrl(storedValue: string | null, appUrl: string): string | null {
    if (!storedValue) {
      return null;
    }

    if (
      storedValue.startsWith('http://') ||
      storedValue.startsWith('https://')
    ) {
      return storedValue;
    }

    if (storedValue.startsWith('/uploads/')) {
      const base = appUrl.replace(/\/$/, '');
      return `${base}${storedValue}`;
    }

    return null;
  }

  async deleteLocalFile(publicPath: string | null | undefined): Promise<void> {
    if (!publicPath?.startsWith('/uploads/')) {
      return;
    }

    const absolutePath = join(process.cwd(), publicPath.replace(/^\//, ''));
    if (existsSync(absolutePath)) {
      await unlink(absolutePath);
    }
  }

  private validateImage(
    file: Express.Multer.File,
    fieldName: string,
    maxSize = MAX_KYC_IMAGE_SIZE_BYTES,
  ): void {
    if (!file) {
      throw new BadRequestException(`${fieldName} image is required`);
    }

    if (file.size > maxSize) {
      const maxMb = Math.round(maxSize / (1024 * 1024));
      throw new BadRequestException(
        `${fieldName} image must be ${maxMb} MB or smaller`,
      );
    }

    if (
      !ALLOWED_IMAGE_MIMES.includes(
        file.mimetype as (typeof ALLOWED_IMAGE_MIMES)[number],
      )
    ) {
      throw new BadRequestException(
        `${fieldName} must be a JPEG, PNG, or WebP image`,
      );
    }
  }

  private resolveExtension(file: Express.Multer.File): string {
    const fromName = extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(fromName)) {
      return fromName === '.jpg' ? '.jpeg' : fromName;
    }

    switch (file.mimetype) {
      case 'image/jpeg':
        return '.jpeg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      default:
        return '.jpeg';
    }
  }
}
