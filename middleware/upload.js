import multer from 'multer';
import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';

// Multer: almacenamiento en memoria
const uploadSinglePhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
}).single('foto');

// Convierte un Buffer en stream y lo sube a Cloudinary
// Sin dependencias externas — usa Readable de Node.js core
function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null); // señal de fin de stream
    readable.pipe(uploadStream);
  });
}

// Middleware que sube el archivo a Cloudinary tras pasar por Multer
const handleUpload = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const folder    = 'gym-management/students';
    const studentId = req.params.id || req.user?.studentProfile || 'unknown';
    const publicId  = `student-${studentId}-${Date.now()}`;

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder,
      public_id: publicId,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    req.file.path         = result.secure_url;
    req.file.cloudinaryId = result.public_id;
    next();
  } catch (err) {
    console.error('❌ Error subiendo a Cloudinary:', err.message);
    next(err);
  }
};

// Eliminar foto antigua de Cloudinary
const deleteOldPhoto = async (photoUrl) => {
  if (!photoUrl || !photoUrl.includes('cloudinary.com')) return;

  try {
    const urlParts    = photoUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) return;

    const afterUpload = urlParts.slice(uploadIndex + 1);
    const startIndex  = /^v\d+$/.test(afterUpload[0]) ? 1 : 0;
    const publicId    = afterUpload.slice(startIndex).join('/').replace(/\.[^/.]+$/, '');

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`✅ Foto eliminada de Cloudinary: ${publicId}`);
    }
  } catch (error) {
    console.error('⚠️ No se pudo eliminar la foto antigua:', error.message);
  }
};

export { uploadSinglePhoto, handleUpload, deleteOldPhoto };