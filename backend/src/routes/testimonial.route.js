import express from "express";
import Testimonial from "../models/testimonial.model.js";
import multer from "multer";
import path from "path";
import { uploadSingleTestimonialImage } from "../utils/upload.utils.js";

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

router.post("/testimonial", upload.single("image"), async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.file);
    const { name, location, experience } = req.body;
    const file = req.file;

    // Validation
    if (!name || !location || !experience || !file) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Upload image
    const uploadedImage = await uploadSingleTestimonialImage(file);

    // Save to DB
    const testimonial = new Testimonial({
      name,
      location,
      experience,
      image: {
        url: uploadedImage.url,
        publicId: uploadedImage.publicId,
      },
    });

    await testimonial.save();

    res
      .status(201)
      .json({ message: "Testimonial submitted successfully.", testimonial });
  } catch (err) {
    console.error("Error submitting testimonial:", err);
    res.status(500).json({ error: "Failed to submit testimonial." });
  }
});

router.get("/testimonials", async (req, res) => {
  try {
    const testimonials = await Testimonial.find({}).sort({ createdAt: -1 });
    res.status(200).json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/testimonial/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    await Testimonial.findByIdAndDelete(id);

    res.status(200).json({ message: "Testimonial deleted successfully." });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/testimonial/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    testimonial.show = !testimonial.show;
    await testimonial.save();

    res.status(200).json({ message: "Testimonial updated successfully." });
  } catch (error) {
    console.error("Error updating testimonial:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/show-testimonials", async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ show: true }).sort({
      createdAt: -1,
    });
    res.status(200).json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
