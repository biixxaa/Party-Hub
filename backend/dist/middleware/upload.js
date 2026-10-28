"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsDir = exports.verificationsDir = exports.uploadPostImage = exports.uploadVerification = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Directory paths
const baseUploadDir = path_1.default.join(__dirname, '../../uploads');
const verificationsDir = path_1.default.join(baseUploadDir, 'verifications');
exports.verificationsDir = verificationsDir;
const postsDir = path_1.default.join(baseUploadDir, 'posts');
exports.postsDir = postsDir;
// Ensure directories exist
if (!fs_1.default.existsSync(baseUploadDir))
    fs_1.default.mkdirSync(baseUploadDir, { recursive: true });
if (!fs_1.default.existsSync(verificationsDir))
    fs_1.default.mkdirSync(verificationsDir, { recursive: true });
if (!fs_1.default.existsSync(postsDir))
    fs_1.default.mkdirSync(postsDir, { recursive: true });
// Allowed image MIME types
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// Storage for private identity verification screenshots
const verificationStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, verificationsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname).toLowerCase() || '.png';
        cb(null, `verify-${uniqueSuffix}${ext}`);
    }
});
// Storage for promotional post images
const postStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, postsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname).toLowerCase() || '.png';
        cb(null, `post-${uniqueSuffix}${ext}`);
    }
});
const fileFilter = (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.'));
    }
};
exports.uploadVerification = (0, multer_1.default)({
    storage: verificationStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter,
});
exports.uploadPostImage = (0, multer_1.default)({
    storage: postStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter,
});
