import { Router } from "express";
import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const reviewRouter = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).array("medias", 10); // Changed from 'media' to 'medias' and specified max count

// Helper function to upload file to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    // Convert buffer to base64
    const b64 = Buffer.from(file.buffer).toString("base64");
    let dataURI = "data:" + file.mimetype + ";base64," + b64;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      resource_type: "auto", // Automatically detect if it's image or video
      folder: "product_reviews",
    });

    return {
      url: uploadResponse.secure_url,
      type: file.mimetype.startsWith("video") ? "video" : "image",
      public_id: uploadResponse.public_id,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Try uploading 10 images at a time");
  }
};

reviewRouter.post("/", (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: `Server error: ${err.message}` });
    }

    const { productId, rating, comment, date, user } = req.body;

    try {
      // Upload media files to Cloudinary if any
      const mediaUrls = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const uploadResult = await uploadToCloudinary(file);
          mediaUrls.push(uploadResult);
        }
      }

      const newReview = new Review({
        productId,
        rating,
        date,
        comment,
        user,
        medias: mediaUrls,
      });

      await newReview.save();

      return res
        .status(200)
        .json({ message: "Review posted", review: newReview });
    } catch (error) {
      console.error("Error while posting review:", error);
      // Delete uploaded files from Cloudinary if review save fails
      if (error && mediaUrls?.length > 0) {
        for (const media of mediaUrls) {
          try {
            await cloudinary.uploader.destroy(media.public_id);
          } catch (deleteError) {
            console.error("Error deleting from Cloudinary:", deleteError);
          }
        }
      }
      return res
        .status(500)
        .json({ error: "Couldn't post review due to internal server error." });
    }
  });
});

reviewRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await Review.find({ productId: id });

    return res.status(200).json({ response, responseCount: response.length });
  } catch (error) {
    console.log("Error while fetching review: ", error);
    res
      .status(500)
      .json({ error: "Couldn't fetch reviews due to internal server error." });
  }
});

// Add a cleanup route for deleting reviews with media
reviewRouter.delete("/:reviewId", async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Delete media files from Cloudinary
    if (review.medias && review.medias.length > 0) {
      for (const media of review.medias) {
        try {
          await cloudinary.uploader.destroy(media.public_id);
        } catch (error) {
          console.error("Error deleting from Cloudinary:", error);
        }
      }
    }

    // Get the product to update its rating and review count
    const product = await Product.findById(review.productId);
    if (product) {
      // Calculate new average rating
      const totalRating = product.rating * product.reviews - review.rating;
      const newReviewCount = product.reviews - 1;
      const newAverageRating =
        newReviewCount > 0 ? totalRating / newReviewCount : 0;

      // Update product with new rating and review count
      await Product.findByIdAndUpdate(review.productId, {
        rating: newAverageRating,
        reviews: newReviewCount,
      });
    }

    await Review.findByIdAndDelete(req.params.reviewId);
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

export default reviewRouter;
