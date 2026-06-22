import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
  KYC_UPLOAD_SUBDIR,
  MAX_KYC_IMAGE_SIZE_BYTES,
  MAX_PROPERTY_IMAGE_SIZE_BYTES,
  MAX_PROPERTY_VIDEO_SIZE_BYTES,
  PROPERTY_UPLOAD_SUBDIR,
  SERVICE_LISTING_UPLOAD_SUBDIR,
} from './upload.constants';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadRoot = join(process.cwd(), 'uploads');
  private readonly useCloudinary: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudinaryUrl =
      process.env.CLOUDINARY_URL ??
      this.configService.get<string>('CLOUDINARY_URL');

    if (cloudinaryUrl && !process.env.CLOUDINARY_URL) {
      process.env.CLOUDINARY_URL = cloudinaryUrl;
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ??
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey =
      process.env.CLOUDINARY_API_KEY ??
      this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret =
      process.env.CLOUDINARY_API_SECRET ??
      this.configService.get<string>('CLOUDINARY_API_SECRET');

    this.useCloudinary = Boolean(
      cloudinaryUrl || (cloudName && apiKey && apiSecret),
    );

    if (this.useCloudinary) {
      if (cloudinaryUrl) {
        cloudinary.config({ secure: true });
      } else {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
          secure: true,
        });
      }
      this.logger.log('Upload storage: Cloudinary');
    } else if (this.configService.get<string>('NODE_ENV') === 'production') {
      this.logger.warn(
        'Upload storage: local disk — on Railway files are lost on redeploy. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.',
      );
    }
  }

  getStorageMode(): 'cloudinary' | 'local' {
    return this.useCloudinary ? 'cloudinary' : 'local';
  }

  async onModuleInit() {
    if (!this.useCloudinary) {
      await mkdir(this.uploadRoot, { recursive: true });
    }
  }

  async saveKycImage(
    file: Express.Multer.File,
    userId: string,
    fieldName: string,
  ): Promise<string> {
    this.validateImage(file, fieldName);

    if (this.useCloudinary) {
      return this.uploadImageToCloudinary(
        file,
        `aqar/kyc/${userId}`,
        `${fieldName}-${randomUUID()}`,
      );
    }

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

    if (this.useCloudinary) {
      return this.uploadImageToCloudinary(
        file,
        `aqar/properties/${propertyId}`,
        randomUUID(),
      );
    }

    const extension = this.resolveExtension(file);
    const directory = join(this.uploadRoot, PROPERTY_UPLOAD_SUBDIR, propertyId);
    const filename = `${randomUUID()}${extension}`;
    const absolutePath = join(directory, filename);

    await mkdir(directory, { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return `/uploads/${PROPERTY_UPLOAD_SUBDIR}/${propertyId}/${filename}`;
  }

  async saveServiceListingImage(
    file: Express.Multer.File,
    providerId: string,
  ): Promise<string> {
    this.validateImage(file, 'image', MAX_PROPERTY_IMAGE_SIZE_BYTES);

    if (this.useCloudinary) {
      return this.uploadImageToCloudinary(
        file,
        `aqar/service-listings/${providerId}`,
        randomUUID(),
      );
    }

    const extension = this.resolveExtension(file);
    const directory = join(
      this.uploadRoot,
      SERVICE_LISTING_UPLOAD_SUBDIR,
      providerId,
    );
    const filename = `${randomUUID()}${extension}`;
    const absolutePath = join(directory, filename);

    await mkdir(directory, { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return `/uploads/${SERVICE_LISTING_UPLOAD_SUBDIR}/${providerId}/${filename}`;
  }

  async savePropertyVideo(
    file: Express.Multer.File,
    propertyId: string,
  ): Promise<string> {
    this.validateVideo(file);

    if (this.useCloudinary) {
      return this.uploadVideoToCloudinary(
        file,
        `aqar/properties/${propertyId}`,
        `video-${randomUUID()}`,
      );
    }

    const extension = this.resolveVideoExtension(file);
    const directory = join(this.uploadRoot, PROPERTY_UPLOAD_SUBDIR, propertyId);
    const filename = `video-${randomUUID()}${extension}`;
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

  async deleteLocalFile(storedValue: string | null | undefined): Promise<void> {
    if (!storedValue) {
      return;
    }

    if (storedValue.startsWith('http://') || storedValue.startsWith('https://')) {
      if (this.useCloudinary && storedValue.includes('res.cloudinary.com')) {
        const publicId = this.extractCloudinaryPublicId(storedValue);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, {
            resource_type: 'auto',
          });
        }
      }
      return;
    }

    if (!storedValue.startsWith('/uploads/')) {
      return;
    }

    const absolutePath = join(process.cwd(), storedValue.replace(/^\//, ''));
    if (existsSync(absolutePath)) {
      await unlink(absolutePath);
    }
  }

  private uploadImageToCloudinary(
    file: Express.Multer.File,
    folder: string,
    publicId: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          overwrite: true,
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(
              error ?? new BadRequestException('Failed to upload image to Cloudinary'),
            );
            return;
          }
          resolve(result.secure_url);
        },
      );

      stream.end(file.buffer);
    });
  }

  private uploadVideoToCloudinary(
    file: Express.Multer.File,
    folder: string,
    publicId: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'video',
          overwrite: true,
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(
              error ?? new BadRequestException('Failed to upload video to Cloudinary'),
            );
            return;
          }
          resolve(result.secure_url);
        },
      );

      stream.end(file.buffer);
    });
  }

  private extractCloudinaryPublicId(url: string): string | null {
    const marker = '/upload/';
    const markerIndex = url.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    let path = url.slice(markerIndex + marker.length);
    path = path.replace(/^v\d+\//, '');
    return path.replace(/\.[^/.]+$/, '');
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

  private validateVideo(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('video file is required');
    }

    if (file.size > MAX_PROPERTY_VIDEO_SIZE_BYTES) {
      const maxMb = Math.round(MAX_PROPERTY_VIDEO_SIZE_BYTES / (1024 * 1024));
      throw new BadRequestException(`video must be ${maxMb} MB or smaller`);
    }

    if (
      !ALLOWED_VIDEO_MIMES.includes(
        file.mimetype as (typeof ALLOWED_VIDEO_MIMES)[number],
      )
    ) {
      throw new BadRequestException('video must be MP4, WebM, or MOV');
    }
  }

  private resolveVideoExtension(file: Express.Multer.File): string {
    const fromName = extname(file.originalname).toLowerCase();
    if (['.mp4', '.webm', '.mov'].includes(fromName)) {
      return fromName;
    }

    switch (file.mimetype) {
      case 'video/mp4':
        return '.mp4';
      case 'video/webm':
        return '.webm';
      case 'video/quicktime':
        return '.mov';
      default:
        return '.mp4';
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
