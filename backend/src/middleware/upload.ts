import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Directory paths
const baseUploadDir = path.join(__dirname, '../../uploads');
const verificationsDir = path.join(baseUploadDir, 'verifications');
const postsDir = path.join(baseUploadDir, 'posts');

// Ensure directories exist
if (!fs.existsSync(baseUploadDir)) fs.mkdirSync(baseUploadDir, { recursive: true });
if (!fs.existsSync(verificationsDir)) fs.mkdirSync(verificationsDir, { recursive: true });
if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

// Allowed image MIME types
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Storage for private identity verification screenshots
const verificationStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, verificationsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `verify-${uniqueSuffix}${ext}`);
  }
});

// Storage for promotional post images
const postStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, postsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `post-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.'));
  }
};

export const uploadVerification = multer({
  storage: verificationStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

export const uploadPostImage = multer({
  storage: postStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

export { verificationsDir, postsDir };
