import crypto from "crypto";
import multer, { MulterError } from "multer";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Daftar mime types untuk berbagai tipe file
const mimeTypes = {
  image: /jpeg|jpg|png|webp/,
  document: /pdf|doc|docx|xls|xlsx|ppt|pptx|csv/,
  all: /.*/, // jika ingin mengizinkan semua
};

function generateRandomFilename(originalname) {
  const ext = path.extname(originalname);
  const randomStr = crypto.randomBytes(16).toString("hex");
  return `${randomStr}${ext}`;
}

function uploadFile(type = "image") {
  const fileFilter = (req, file, cb) => {
    try {
    } catch (e) {}
    const allowed = mimeTypes[type];
    if (!allowed) {
      return cb(new Error(`Unsupported type: ${type}`), false);
    }

    const extValid = allowed.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeValid = allowed.test(file.mimetype);

    if (extValid && mimeValid) {
      cb(null, true);
    } else {
      const error = new MulterError();
      error.message = `Only ${type} files are allowed.`;
      cb(error, false);
    }
  };

  return multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  });
}

export default uploadFile;
