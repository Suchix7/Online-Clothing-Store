import express from "express";
import Category from "../models/category.model.js";
import Subcategory from "../models/subcategory.model.js";
import Product from "../models/product.model.js";
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
    const subcategories = await Subcategory.find({});
    const message = [{ subcategoryName: "" }];

    if (subcategories.length == 0) return res.status(200).json(message);

    return res.status(200).json(subcategories);
  } catch (error) {
    console.log("Erro while fetching subcategories: ", error.message);
  }
});

router.post(
  "/",
  upload.fields([
    { name: "subcategoryImage", maxCount: 1 },
    { name: "subcategoryLogo", maxCount: 1 },
  ]),
  async (req, res) => {
    const { subcategoryName, parentCategory } = req.body;

    try {
      if (!subcategoryName || !parentCategory) {
        return res.status(400).json({ message: "All fields are required." });
      }

      if (
        !req.files ||
        !req.files.subcategoryImage ||
        !req.files.subcategoryLogo
      ) {
        return res.status(400).json({ message: "Both images are required." });
      }

      const check = await Subcategory.findOne({ subcategoryName });
      if (check) {
        // Clean up local files
        Object.values(req.files)
          .flat()
          .forEach((file) => {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          });
        return res.status(400).json({ message: "Subcategory already exists." });
      }

      // Compress and upload both images
      const compressAndUpload = async (file, folder) => {
        const compressedPath = `uploads/compressed-${file.filename}`;
        await sharp(file.path)
          .resize(800)
          .png({ quality: 70 })
          .toFile(compressedPath);

        const result = await cloudinaryV2.uploader.upload(compressedPath, {
          folder,
        });

        await safeUnlink(file.path);
        await safeUnlink(compressedPath);

        return result.secure_url;
      };

      const subcategoryImageUrl = await compressAndUpload(
        req.files.subcategoryImage[0],
        "subcategory-images"
      );

      const subcategoryLogoUrl = await compressAndUpload(
        req.files.subcategoryLogo[0],
        "subcategory-logos"
      );

      const newSubcategory = new Subcategory({
        subcategoryName,
        parentCategory,
        image: subcategoryImageUrl,
        logo: subcategoryLogoUrl,
      });

      await newSubcategory.save();

      return res.send(`
        <script>
          alert('Subcategory added successfully!');
          window.location.href='/admin';
        </script>
      `);
    } catch (error) {
      console.error("Error while inserting the subcategory ", error);

      // Clean up in case of error
      Object.values(req.files || {})
        .flat()
        .forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });

      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  async (req, res) => {
    console.log(req.files);
    const { id, subcategoryName, parentCategory } = req.body;

    try {
      if (!subcategoryName || !parentCategory) {
        return res.status(400).json({ message: "All fields are required." });
      }

      const updateData = {
        subcategoryName,
        parentCategory,
      };

      const compressAndUpload = async (file, folder) => {
        const compressedPath = `uploads/compressed-${file.filename}`;
        await sharp(file.path)
          .resize(800)
          .png({ quality: 70 })
          .toFile(compressedPath);

        const result = await cloudinaryV2.uploader.upload(compressedPath, {
          folder,
        });

        await safeUnlink(file.path);
        await safeUnlink(compressedPath);

        return result.secure_url;
      };

      const subcategoryImageFile = req.files?.image?.[0];
      const subcategoryLogoFile = req.files?.logo?.[0];

      if (subcategoryImageFile) {
        updateData.image = await compressAndUpload(
          subcategoryImageFile,
          "subcategory-images"
        );
      }

      if (subcategoryLogoFile) {
        updateData.logo = await compressAndUpload(
          subcategoryLogoFile,
          "subcategory-logos"
        );
      }

      const result = await Subcategory.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!result) {
        return res
          .status(400)
          .json({ message: "Unable to update subcategory" });
      }

      return res.status(200).json({ message: "Subcategory update successful" });
    } catch (error) {
      console.error("Error while updating subcategories: ", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const check = await Subcategory.findById(id);
    if (!check) {
      return res.status(400).json({ message: "Sub-category not found" });
    }

    const products = await Product.find({
      parentSubcategory: check.subcategoryName,
    });
    if (products.length > 0) {
      return res.status(400).json({
        message: "Sub-category is linked to products. Cannot delete.",
      });
    }

    const result = await Subcategory.findByIdAndDelete(id);

    if (!result) {
      return res
        .status(400)
        .json({ message: "Error while deleting sub-category" });
    }

    console.log("Deleted Record: ", result);
    return res.status(200).json({ message: "Sub-category deleted" });
  } catch (error) {
    console.log("Error while deleting sub-category: ", error);
  }
});

router.get("/phonemodels", async (req, res) => {
  try {
    const subcategories = await Subcategory.find({
      $or: [
        { parentCategory: "Cover" },
        { parentCategory: "Screen Protector" },
      ],
    });
    if (!subcategories) {
      res.status(400).json({ message: "Subcategories not found." });
    }
    return res.status(200).json(subcategories);
  } catch (error) {
    console.log("Error while fetching subcategories: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
