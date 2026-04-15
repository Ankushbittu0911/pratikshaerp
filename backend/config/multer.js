const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /pdf|jpg|jpeg|png|gif|xlsx|xls|doc|docx|dwg|dxf|zip/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  if (ext) cb(null, true);
  else cb(new Error('File type not allowed'), false);
};

const createUpload = (folder, maxFiles = 10) => multer({
  storage: createStorage(folder),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
}).array('files', maxFiles);

const createSingleUpload = (folder, fieldName = 'file') => multer({
  storage: createStorage(folder),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
}).single(fieldName);

module.exports = { createUpload, createSingleUpload };
