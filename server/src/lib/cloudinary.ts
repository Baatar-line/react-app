import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploads an in-memory file buffer (from multer) to Cloudinary and resolves
// with the secure (https) URL to store on the relevant Prisma record.
export function uploadBufferToCloudinary(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto' }, (err, result) => {
      if (err || !result) return reject(err || new Error('Cloudinary upload failed'));
      resolve(result);
    });
    stream.end(buffer);
  });
}

export { cloudinary };
