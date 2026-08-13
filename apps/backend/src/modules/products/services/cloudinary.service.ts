import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../../config/env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  /** Extract Cloudinary public_id from a CDN URL. Returns null for non-Cloudinary URLs. */
  getPublicId(url: string): string | null {
    if (!url?.includes('cloudinary.com')) return null;
    // Handle URLs with transformation params before version: .../upload/q_auto,f_auto/v{n}/public_id.ext
    // or without transformation params: .../upload/v{n}/public_id.ext
    const withVersion = url.match(/\/v\d+\/(.+?)(?:\.[^./]+)?$/);
    if (withVersion) return withVersion[1];
    // Fallback: no version in URL — take path directly after /upload/
    const withoutVersion = url.match(/\/upload\/(.+?)(?:\.[^./]+)?$/);
    return withoutVersion ? withoutVersion[1] : null;
  }

  /** Delete a single image from Cloudinary. Silently skips non-Cloudinary URLs. */
  async deleteImage(url: string): Promise<void> {
    const publicId = this.getPublicId(url);
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err: any) {
      this.logger.warn(`Failed to delete Cloudinary image "${publicId}": ${err.message}`);
    }
  }

  /** Delete multiple images. Non-Cloudinary URLs are silently skipped. */
  async deleteImages(urls: string[]): Promise<void> {
    if (!urls?.length) return;
    await Promise.allSettled(urls.map(url => this.deleteImage(url)));
  }

  /** Return URLs that exist in oldUrls but not in newUrls — these were removed by the admin. */
  getRemovedUrls(oldUrls: string[], newUrls: string[]): string[] {
    const next = new Set(newUrls ?? []);
    return (oldUrls ?? []).filter(url => !next.has(url));
  }
}
