import express from "express";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import cloudinary from "cloudinary";
import { safeUnlink } from "../utils/upload.utils.js";
import Employee from "../models/employee.model.js";
import nodemailer from "nodemailer";

const router = express.Router();

const cloudinaryV2 = cloudinary.v2;
const uploadFile = multer({ dest: "uploads/" }); // saves file in "uploads/" temporarily

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

router.post(
  "/add-employee",
  upload.single("employeePhoto"),
  async (req, res) => {
    try {
      const {
        employeeName,
        employeeEmail,
        employeePhone,
        employeePosition,
        employeeDepartment,
        employeeJoinDate,
        employeeSalary,
        employeeStatus,
        employeeAddress,
      } = req.body;

      const compressedPath = `uploads/compressed-${req.file.filename}`;
      await sharp(req.file.path)
        .resize(800) // optional resize
        .png({ quality: 70 }) // optional compression
        .toFile(compressedPath);

      // Upload to Cloudinary
      const uploadResult = await cloudinaryV2.uploader.upload(compressedPath, {
        folder: "employee-images",
      });

      // Delete local images
      await safeUnlink(req.file.path);
      await safeUnlink(compressedPath);

      const newEmployee = new Employee({
        employeeName,
        employeeEmail,
        employeePhone,
        employeePosition,
        employeeDepartment,
        employeeJoinDate,
        employeeSalary,
        employeeStatus,
        employeePhoto: uploadResult.secure_url,
        employeeAddress,
      });

      await newEmployee.save();
      res.status(201).json({
        message: "Employee added successfully",
        employee: newEmployee,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error adding employee", error });
    }
  }
);

router.get("/employees", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error while fetching employees: ", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/apply", uploadFile.single("resume"), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      linkedin,
      coverLetter,
      hearAbout,
    } = req.body;

    const resumeFile = req.file;

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "testproject7828@gmail.com",
        pass: "mcgb qwhr vxqu etmf", // App Password from Gmail settings (not normal password)
      },
    });

    // Email options
    const mailOptions = {
      from: '"Career Form" <testproject7828@gmail.com>',
      to: "testproject7828@gmail.com", // Receiver (your mail)
      subject: `New Job Application for ${position}`,
      html: `
            <h2>New Application Received</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Position:</strong> ${position}</p>
            <p><strong>LinkedIn:</strong> ${linkedin || "Not Provided"}</p>
            <p><strong>Heard About:</strong> ${hearAbout || "Not Provided"}</p>
            <p><strong>Cover Letter:</strong></p>
            <p>${coverLetter}</p>
          `,
      attachments: resumeFile
        ? [
            {
              filename: resumeFile.originalname,
              path: resumeFile.path,
            },
          ]
        : [],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Delete file after sending
    if (resumeFile) {
      fs.unlinkSync(resumeFile.path);
    }

    res.status(200).json({ message: "Application submitted successfully!" });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ message: "Failed to submit application" });
  }
});

export default router;
