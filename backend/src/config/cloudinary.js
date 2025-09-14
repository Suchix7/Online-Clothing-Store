// config/cloudinary.js
import cloudinary from "cloudinary";

/**
 * Initialize Cloudinary v2 with environment variables.
 * Make sure these are set in your .env:
 *  - CLOUDINARY_CLOUD_NAME
 *  - CLOUDINARY_API_KEY
 *  - CLOUDINARY_API_SECRET
 */
const cld = cloudinary.v2;

cld.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cld as cloudinaryV2 };
