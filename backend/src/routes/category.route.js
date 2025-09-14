import express from "express";
import Category from "../models/category.model.js";
import Subcategory from "../models/subcategory.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { safeUnlink } from "../utils/upload.utils.js";
import { cloudinaryV2 } from "../config/cloudinary.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // temporary folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB size limit
  },
  fileFilter: fileFilter,
});

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({});
    const message = [{ categoryName: "" }];

    if (categories.length == 0) return res.status(200).json(message);

    return res.status(200).json(categories);
  } catch (error) {
    console.log("Error while fetching categories: ", error.message);
  }
});

router.post("/", upload.single("categoryImage"), async (req, res) => {
  const { categoryName } = req.body;

  try {
    if (!categoryName || !req.file) {
      return res
        .status(400)
        .json({ message: "Category name and image are required." });
    }

    // Check for duplicate category
    const existing = await Category.findOne({ categoryName });
    if (existing) {
      fs.unlinkSync(req.file.path); // Clean up uploaded image
      return res.status(400).json({ message: "Category already exists." });
    }

    // Compress image with sharp
    const compressedPath = `uploads/compressed-${req.file.filename}`;
    await sharp(req.file.path)
      .resize(800) // optional resize
      .png({ quality: 70 }) // optional compression
      .toFile(compressedPath);

    // Upload to Cloudinary
    const uploadResult = await cloudinaryV2.uploader.upload(compressedPath, {
      folder: "category-images",
    });

    // Delete local images
    await safeUnlink(req.file.path);
    await safeUnlink(compressedPath);

    // Save category
    const newCategory = new Category({
      categoryName,
      image: uploadResult.secure_url,
    });

    await newCategory.save();

    return res.send(`
      <script>
        alert('Category added successfully!');
        window.location.href='/anishshrestha';
      </script>
    `);
  } catch (error) {
    console.error("Error:", error);
    if (req.file?.path && fs.existsSync(req.file.path))
      fs.unlinkSync(req.file.path);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

router.put("/", upload.single("image"), async (req, res) => {
  const { id, categoryName } = req.body;

  try {
    if (!id || !categoryName) {
      return res
        .status(400)
        .json({ message: "Category ID and name are required" });
    }

    const updateData = { categoryName };

    // If a file was uploaded, process it; otherwise just update the name
    if (req.file) {
      // Extra safety: ensure it's an image before sending to sharp
      if (!req.file.mimetype?.startsWith("image/")) {
        // Clean up the uploaded non-image file
        await safeUnlink(req.file.path);
        return res.status(400).json({ message: "Only images are allowed." });
      }

      const compressedPath = `uploads/compressed-${req.file.filename}`;
      await sharp(req.file.path)
        .resize(800) // optional resize
        .png({ quality: 70 }) // optional compression
        .toFile(compressedPath);

      const uploadResult = await cloudinaryV2.uploader.upload(compressedPath, {
        folder: "category-images",
      });

      // Clean up temp files
      await safeUnlink(req.file.path);
      await safeUnlink(compressedPath);

      updateData.image = uploadResult.secure_url;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res
      .status(500)
      .json({ message: "Server error while updating category" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const check = await Category.findById(id);

    if (!check) {
      return res.status(400).json({ message: "No categories found." });
    }

    const categories = await Subcategory.find({
      parentCategory: check.categoryName,
    });

    if (categories.length > 0) {
      return res.status(400).json({
        message: "Category is linked with a sub-category. Cannot delete it.",
      });
    }

    const result = await Category.findByIdAndDelete(id);

    if (!result) {
      return res.status(400).json({ message: "Error while deleting category" });
    }

    console.log("Deleted Record: ", result);
    return res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    console.log("Error while deleting category: ", error);
  }
});

export default router;
