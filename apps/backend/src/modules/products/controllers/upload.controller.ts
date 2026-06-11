import {
  Controller, Post, Delete, Query, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { v2 as cloudinary } from 'cloudinary';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';
import { env } from '../../../config/env';
import { CloudinaryService } from '../services/cloudinary.service';

// Cloudinary is also configured in CloudinaryService; this call is idempotent
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

function detectImageType(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 12) return null;
  // JPEG: starts with FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
  // WebP: starts with RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return 'image/webp';
  return null;
}

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'staff')
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload image to Cloudinary, returns CDN URL' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Only JPG, PNG, WEBP images allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('No file uploaded');

    // Validate actual file content via magic bytes (not just client-declared MIME type)
    const actualType = detectImageType(file.buffer);
    if (!actualType) {
      throw new BadRequestException('Invalid file format. Only JPG, PNG, WEBP images are allowed.');
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'khaalis-harvest/products',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            reject(new BadRequestException('Upload failed: ' + (error?.message ?? 'Unknown error')));
          } else {
            resolve({ url: result.secure_url });
          }
        },
      );
      stream.end(file.buffer);
    });
  }

  @Delete('image')
  @ApiOperation({ summary: 'Delete image from Cloudinary by URL (cleanup orphans on upload failure)' })
  @ApiQuery({ name: 'url', required: true, description: 'Cloudinary URL to delete' })
  async deleteImage(@Query('url') url: string): Promise<void> {
    if (!url) throw new BadRequestException('url query parameter is required');
    await this.cloudinaryService.deleteImage(url);
  }
}
