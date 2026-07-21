import { NextResponse } from 'next/server';
import { uploadBufferToCloudinary } from '../../../lib/cloudinary';
import { requireAuth, jsonError, ApiError } from '../../../lib/auth-helpers';

// Cloudinary's SDK and Buffer aren't available in the Edge runtime.
export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // matches Cloudinary's free-plan video/raw cap

export async function POST(request: Request) {
  try {
    await requireAuth(request);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Файл сонгоогүй байна' }, { status: 400 });
    }
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Зөвхөн зураг эсвэл бичлэг оруулна уу' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ApiError(413, `Файл хэтэрхий том байна (дээд тал ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB)`);
    }
    const folderInput = form.get('folder');
    const folder = 'bigbang/' + (typeof folderInput === 'string' && folderInput.trim() ? folderInput.trim() : 'misc');
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBufferToCloudinary(buffer, folder);
    return NextResponse.json({ url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
