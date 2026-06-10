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
