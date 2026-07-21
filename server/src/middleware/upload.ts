import multer from 'multer';

// Files land in memory as a Buffer, then get streamed straight to Cloudinary
// (see lib/cloudinary.ts) — nothing is ever written to local disk.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB — Cloudinary's free-plan video/raw cap; images are shrunk client-side well under this
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    if (!ok) return cb(new Error('Зөвхөн зураг эсвэл бичлэг оруулна уу'));
    cb(null, true);
  },
});
