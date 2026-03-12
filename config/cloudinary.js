import { v2 as cloudinary } from 'cloudinary'; // ✅ Sin { v2 as cloudinary }
import dotenv from 'dotenv';

dotenv.config();


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log('☁️  Cloudinary v1.x configurado correctamente');

export default cloudinary;