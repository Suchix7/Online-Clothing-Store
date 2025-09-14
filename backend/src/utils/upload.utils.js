import sharp from "sharp";
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";

const cloudinaryV2 = cloudinary.v2;

// Helper function to safely delete files
export const safeUnlink = async (filePath) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.warn("Failed to delete file:", filePath, err.message);
  }
};

/**
 * Uploads and processes multiple image files
 * @param {Array} imageFiles - Array of image files from multer
 * @param {string} folder - Cloudinary folder to upload to
 * @param {Object} options - Additional options for image processing
 * @returns {Promise<Array>} Array of uploaded image data
 */
export const uploadImages = async (
  imageFiles,
  folder = "product-images",
  options = {}
) => {
  const { width = 1000, quality = 70, format = "png" } = options;

  try {
    const uploadedImages = await Promise.all(
      imageFiles.map(async (file, idx) => {
        const compressedPath = path.join(
          file.destination || "uploads",
          `compressed-${Date.now()}-${idx}.${format}`
        );

        // Compress and resize image
        await sharp(file.path)
          .resize({ width })
          [format]({ quality })
          .toFile(compressedPath);

        // Upload to Cloudinary
        const uploadResult = await cloudinaryV2.uploader.upload(
          compressedPath,
          {
            folder,
          }
        );

        // Clean up local files
        await safeUnlink(file.path);
        await safeUnlink(compressedPath);

        return {
          fieldname: file.fieldname,
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        };
      })
    );

    return uploadedImages;
  } catch (error) {
    // Clean up any remaining files in case of error
    if (imageFiles) {
      await Promise.all(imageFiles.map((file) => safeUnlink(file.path)));
    }
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

export const uploadSingleTestimonialImage = async (file, options = {}) => {
  const {
    width = 1000,
    quality = 70,
    format = "png",
    folder = "customer-testimonials",
  } = options;

  try {
    const compressedPath = path.join(
      file.destination || "uploads",
      `compressed-${Date.now()}.${format}`
    );

    // Compress and resize image
    await sharp(file.path)
      .resize({ width })
      [format]({ quality })
      .toFile(compressedPath);

    // Upload to Cloudinary
    const uploadResult = await cloudinaryV2.uploader.upload(compressedPath, {
      folder,
    });

    // Cleanup
    await safeUnlink(file.path);
    await safeUnlink(compressedPath);

    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  } catch (error) {
    await safeUnlink(file?.path);
    throw new Error(`Testimonial image upload failed: ${error.message}`);
  }
};

/**
 * Uploads a single video file
 * @param {Object} videoFile - Video file from multer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Uploaded video data
 */
export const uploadVideo = async (videoFile, options = {}) => {
  const {
    maxSize = 100 * 1024 * 1024, // 100MB default
    folder = "product-videos",
    allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ],
  } = options;

  try {
    // Validate video file
    if (!videoFile) {
      return null;
    }

    // Size validation
    if (videoFile.size > maxSize) {
      throw new Error(
        `Video file size must be less than ${maxSize / (1024 * 1024)}MB`
      );
    }

    // Type validation
    if (!allowedTypes.includes(videoFile.mimetype)) {
      throw new Error(
        "Invalid video format. Please upload MP4, WebM, MOV, or AVI files."
      );
    }

    // Check if file exists
    if (!fs.existsSync(videoFile.path)) {
      throw new Error("Video file not found at path: " + videoFile.path);
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinaryV2.uploader.upload_stream(
        {
          folder,
          resource_type: "video",
          allowed_formats: ["mp4", "webm", "mov", "avi"],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      fs.createReadStream(videoFile.path)
        .on("error", (err) => reject(err))
        .pipe(uploadStream);
    });

    // Clean up local file
    await safeUnlink(videoFile.path);

    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  } catch (error) {
    // Clean up local file in case of error
    if (videoFile) {
      await safeUnlink(videoFile.path);
    }
    throw new Error(`Video upload failed: ${error.message}`);
  }
};
