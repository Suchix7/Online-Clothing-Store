import express from "express";
import dotenv from "dotenv";
dotenv.config();
import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";
import Product from "./models/product.model.js";
import Category from "./models/category.model.js";
import Subcategory from "./models/subcategory.model.js";
import User from "./models/user.model.js";
import Order from "./models/order.model.js";
import ActiveUsers from "./models/activeusers.model.js";
import Inbox from "./models/inbox.model.js";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import cloudinary from "cloudinary";
import cookieParser from "cookie-parser";
import cartRouter from "./routes/cart.route.js";
import checkoutRouter from "./routes/checkout.route.js";
import orderRouter from "./routes/order.route.js";
import reviewRouter from "./routes/review.route.js";
import nodemailer from "nodemailer";
import cors from "cors";
import { mailCode } from "./lib/mailTemplate.js";
import fs from "fs";
import { Server } from "socket.io";
import http from "http";
import session from "express-session";
import locationRoute from "./routes/location.route.js";
import searchRouter from "./routes/search.route.js";
import recommendationRouter from "./routes/reco.route.js";
import phonemodelRouter from "./routes/phonemodel.route.js";
import testimonialRouter from "./routes/testimonial.route.js";
import forgotpasswordRouter from "./routes/forgotpassword.route.js";
import wishlistRouter from "./routes/wishlist.route.js";
import employeeRouter from "./routes/employee.route.js";
import productRouter from "./routes/product.route.js";
import categoryRouter from "./routes/category.route.js";
import subcategoryRouter from "./routes/subcategory.route.js";
import abishekRouter from "./routes/abishek.route.js";
import { addMessage } from "./lib/chatStore.js";
import chatRouter from "./routes/chat.route.js";

const app = express();
app.set("trust proxy", true); // Add at the top i need to push

const server = http.createServer(app);
const guestUsers = new Map(); // socket.id => timestamp i need to push
const registeredUsers = new Map(); // authUserId => socket.id (or multiple)
const origins =
  process.env.NODE_ENV === "production"
    ? [
        "https://yug-tech-rve5.vercel.app",
        "https://yugindustries.com.np",
        "https://www.yugindustries.com.np",
        "https://yugtech.onrender.com",
        "https://ab1shek.vercel.app/",
      ]
    : ["http://localhost:8080", "http://localhost:5173"];
// ✅ Create a new Socket.IO server instance
export const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

io.on("connection", (socket) => {
  socket.on("join-dashboard", () => {
    socket.join("dashboard");
  });

  socket.on("guest-ping", () => {
    guestUsers.set(socket.id, Date.now());
  });

  // Handle registered user ping
  socket.on("auth-ping", ({ userId, username }) => {
    if (!userId) return;

    // store both id and username if you need them
    registeredUsers.set(userId, {
      socketId: socket.id,
      username: username || userId,
    });

    // join their dedicated room
    socket.join(`user:${userId}`);
    io.to("admins").emit("admin:user-status", { userId, connected: true });
    // (optional) keep your existing event too
    io.to("admins").emit("user:subscribed", { userId });
  });

  socket.on("admin:subscribe", () => {
    socket.join("admins");
    for (const [userId, { socketId, username }] of registeredUsers.entries()) {
      socket.emit("admin:user-status", { userId, connected: true });
      // (optional) also emit subscribed for consistency
      socket.emit("user:subscribed", { userId, username });
    }
  });

  socket.on(
    "user-message",
    async ({ userId, message, attachments = [], clientId }) => {
      try {
        // Ignore empty payloads
        const safeText = typeof message === "string" ? message.trim() : "";
        const imgs = Array.isArray(attachments)
          ? attachments
              .filter(
                (a) =>
                  a &&
                  a.type === "image" &&
                  typeof a.url === "string" &&
                  a.url.trim()
              )
              .map((a) => ({
                type: "image",
                url: a.url.trim(),
                publicId: a.publicId || undefined,
              }))
          : [];

        if (!safeText && imgs.length === 0) return;

        const username = registeredUsers.get(userId)?.username;

        // Broadcast one payload that includes text (caption if any) + all images
        const payload = {
          from: userId,
          userId,
          username,
          message: safeText, // caption (may be empty)
          attachments: imgs, // [{ type:"image", url, publicId? }]
          clientId: clientId || undefined,
          ts: Date.now(),
        };

        io.to(`user:${userId}`).emit("new-message", payload);
        io.to("admins").emit("new-message", payload);

        // Persist only for registered users
        if (!String(userId).toLowerCase().startsWith("guest")) {
          await addMessage({
            userId,
            from: "user",
            text: safeText, // caption only (can be empty)
            userName: username || undefined,
            clientId: clientId || undefined,
            attachments: imgs, // save images on the message
          });
        }
      } catch (error) {
        console.error("Error in user-message:", error);
      }
    }
  );

  socket.on(
    "user-send-image",
    async ({ userId, imageUrl, caption = "", clientId }) => {
      try {
        const safeUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";
        const safeText = typeof caption === "string" ? caption.trim() : "";
        if (!userId || !safeUrl) return;

        const username = registeredUsers.get(userId)?.username;

        const payload = {
          from: userId,
          userId,
          username,
          message: safeText, // caption may be empty
          attachments: [{ type: "image", url: safeUrl }],
          clientId: clientId || undefined,
          ts: Date.now(),
        };

        io.to(`user:${userId}`).emit("new-message", payload);
        io.to("admins").emit("new-message", payload);

        // persist only for registered users
        if (!String(userId).toLowerCase().startsWith("guest")) {
          await addMessage({
            userId,
            from: "user",
            text: safeText,
            userName: username || undefined,
            clientId: clientId || undefined,
            attachments: [{ type: "image", url: safeUrl }],
          });
        }
      } catch (err) {
        console.error("Error in user-send-image:", err);
      }
    }
  );

  socket.on("admin:open-user", ({ userId }) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  socket.on("admin:request-users", () => {
    // Convert Map entries → array with user info
    const users = Array.from(registeredUsers.entries()).map(
      ([userId, { socketId, username }]) => ({
        userId,
        name: username || userId, // show username if available
        connected: true, // you can check if socket still connected
      })
    );

    socket.emit("admin:user-list", users);
  });

  // admin -> user (from admin dashboard)
  socket.on("admin-send-message", async ({ userId, text }) => {
    io.to(`user:${userId}`).emit("new-message", {
      from: "admin",
      userId,
      message: text,
      ts: Date.now(),
    });
    if (!userId.toLowerCase().startsWith("guest")) {
      try {
        const result = await addMessage({
          userId, // if guest -> skipped
          from: "admin",
          text,
        });
      } catch (error) {
        console.log("Error in admin-send-message:", error);
      }
    }
  });

  // Send an image to a user (admin -> user)
  socket.on("admin-send-image", async ({ userId, imageUrl, caption = "" }) => {
    const ts = Date.now();

    // Payload sent to both the user and the admin UI
    const payload = {
      from: "admin",
      userId,
      ts,
      imageUrl, // 👈 key field the client will detect
      message: caption, // optional text under the image
    };

    // deliver to that user's room
    io.to(`user:${userId}`).emit("new-message", payload);
    // (optional) reflect back to admin dashboards
    io.to("admins").emit("new-message", payload);

    // Persist only for registered users (you chose not to save guests)
    if (!String(userId).toLowerCase().startsWith("guest")) {
      try {
        await addMessage({
          userId,
          from: "admin",
          text: caption || "", // caption optional; preview will be "[image]" if empty
          attachments: [
            {
              type: "image",
              url: imageUrl,
            },
          ],
        });
      } catch (err) {
        console.error("Error in admin-send-image:", err);
      }
    }
  });

  socket.on("user:subscribe", ({ userId }) => {
    io.to("admins").emit("user:subscribed", { userId });
    io.to("admins").emit("admin:user-status", { userId, connected: true });
  });

  socket.on("disconnect", () => {
    guestUsers.delete(socket.id);
    for (const [userId, { socketId, username }] of registeredUsers.entries()) {
      if (socketId === socket.id) {
        registeredUsers.delete(userId);
        io.to("admins").emit("user:disconnected", userId);
        io.to("admins").emit("admin:user-status", { userId, connected: false });
        break;
      }
    }
  });
});

setInterval(() => {
  const now = Date.now();
  const cutoff = now - 30000;

  // Clean up expired guests
  for (const [id, timestamp] of guestUsers.entries()) {
    if (timestamp < cutoff) {
      guestUsers.delete(id);
    }
  }

  // Clean up expired registered users
  for (const [id, timestamp] of registeredUsers.entries()) {
    if (timestamp < cutoff) {
      registeredUsers.delete(id);
    }
  }

  // 🔄 Emit the active counts to dashboard room
  io.to("dashboard").emit("activeUsers", {
    activeUsers: guestUsers.size,
    registeredUsers: registeredUsers.size,
  });
}, 5000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Configure the cloudinary v2 SDK
const cloudinaryV2 = cloudinary.v2;

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "adminpanel", "design.html"));
});
app.use(express.static(path.join(__dirname, "adminpanel")));

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "adminpanel", "design.html"));
});

app.get("/chatbot", (req, res) => {
  res.sendFile(path.join(__dirname, "adminpanel", "chatbot.html"));
});

const MAX_ATTEMPTS = 10;
const BLOCK_TIME = 24 * 60 * 60 * 1000; // 1 day in milliseconds

// In-memory store for login attempts
const loginAttempts = {};

// Middleware to check if user is blocked
app.use((req, res, next) => {
  const ip = req.ip;

  const attempt = loginAttempts[ip];
  if (attempt && attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
    return res
      .status(403)
      .send(
        "<h2 style='color: red; text-align:center;'>You are temporarily blocked. Try again later.</h2>"
      );
  }

  next();
});
app.use(locationRoute);
app.post("/login", (req, res) => {
  const ip = req.ip;
  const { password } = req.body;

  if (
    loginAttempts[ip] &&
    loginAttempts[ip].blockedUntil &&
    Date.now() < loginAttempts[ip].blockedUntil
  ) {
    return res
      .status(403)
      .send(
        "<h2 style='color: red; text-align:center;'>You have been blocked for 24 hours.</h2>"
      );
  }

  // Initialize tracking
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { count: 0, blockedUntil: null };
  }

  if (password === "763421") {
    loginAttempts[ip] = { count: 0, blockedUntil: null }; // Reset on success
    res.cookie("admin_auth", "true", {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });
    return res.redirect("/admin");
  } else {
    loginAttempts[ip].count++;

    if (loginAttempts[ip].count >= MAX_ATTEMPTS) {
      loginAttempts[ip].blockedUntil = Date.now() + BLOCK_TIME;
      return res
        .status(403)
        .send(
          "<h2 style='color: red; text-align:center;'>You have been blocked for 24 hours.</h2>"
        );
    }

    const remaining = MAX_ATTEMPTS - loginAttempts[ip].count;
    return res.send(`<h2 style='color: red; text-align:center;'>Incorrect passcode.</h2>
                     <p style='text-align:center;'>${remaining} attempts left</p>
                     <p style='text-align:center;'><a href='/'>Try again</a></p>`);
  }
});

app.delete("/api/delete-image/*", async (req, res) => {
  try {
    const publicId = req.params[0]; // Extract Cloudinary public ID
    console.log(publicId);

    if (!publicId) {
      return res.status(400).json({ message: "Public ID is required" });
    }

    // Delete image from Cloudinary
    const result = await cloudinaryV2.uploader.destroy(publicId);
    console.log("Cloudinary response: ", result);

    if (result.result !== "ok") {
      return res.status(400).json({ message: "Failed to delete image" });
    }

    const product = await Product.findOne({
      "images.publicId": publicId,
    });

    if (!product) {
      return res.status(400).json({ message: "Not deleted on database" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      { $pull: { images: { publicId: publicId } } },
      { new: true }
    );

    return res
      .status(200)
      .json({ message: "Image deleted successfully", product: updatedProduct });
  } catch (error) {
    console.error("Error deleting image:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
});

app.delete("/api/delete-video/*", async (req, res) => {
  try {
    const publicId = req.params[0]; // Extract Cloudinary public ID
    console.log(publicId);

    if (!publicId) {
      return res.status(400).json({ message: "Public ID is required" });
    }

    // Delete video from Cloudinary
    const result = await cloudinaryV2.uploader.destroy(publicId, {
      resource_type: "video",
    });
    console.log("Cloudinary response: ", result);

    if (result.result !== "ok") {
      return res
        .status(400)
        .json({ message: "Failed to delete video from Cloudinary" });
    }

    const product = await Product.findOne({
      "video.publicId": publicId,
    });

    if (!product) {
      return res
        .status(400)
        .json({ message: "Product with video not found in database" });
    }

    // Remove video from product
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      { $unset: { video: "" } }, // Remove the entire video object
      { new: true }
    );

    return res
      .status(200)
      .json({ message: "Video deleted successfully", product: updatedProduct });
  } catch (error) {
    console.error("Error deleting video:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
});

app.get("/api/count", async (req, res) => {
  try {
    const categories = await Category.find({});
    const subcategories = await Subcategory.find({});
    const products = await Product.find({});
    const orders = await Order.find({ status: "processing" });
    const cancelled = await Order.find({ status: "cancelled" });
    const sales = await Order.find({ status: "delivered" });
    const users = await User.find({});

    return res.status(200).json({
      totalCategories: categories.length,
      totalSubcategories: subcategories.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalCancelled: cancelled.length,
      totalSales: sales,
      totalUsers: users,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
app.delete("/api/inquiry/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const inbox = await Inbox.findByIdAndDelete(id);
    if (!inbox) {
      return res.status(404).json({ message: "Inbox not found" });
    }
    return res.status(200).json({ message: "Inbox deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.use("/api/cart", cartRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", orderRouter);
app.use("/api/review", reviewRouter);
app.use("/api/predict", searchRouter);
app.use("/api/reco", recommendationRouter);
app.use("/api/phonemodels", phonemodelRouter);
app.use("/api", testimonialRouter);
app.use("/api", forgotpasswordRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api", employeeRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/subcategory", subcategoryRouter);
app.use("/api/chat", chatRouter);
app.use("/api/abishek", abishekRouter);

// app.get("/api/products/similar/:category", async (req, res) => {
//   const { category } = req.params;

//   try {
//     const products = await Product.find({ parentCategory: category });

//     if (!products || products.length === 0) {
//       return res.status(404).json({ message: "No similar products found" });
//     }

//     // Get 4 random products from the same category
//     products.sort(() => Math.random() - 0.5); // Shuffle the array

//     const modified = products.slice(0, 8);
//     const modified1 = modified.map((product) => {
//       const { costPrice, ...rest } = product.toObject();
//       return rest;
//     });
//     return res.status(200).json(modified1);
//   } catch (error) {
//     console.error("Error fetching similar products:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

app.get("/api/inquiryCount", async (req, res) => {
  try {
    const inquiry = await Inbox.find({});

    return res.status(200).json({ inquiries: inquiry });
  } catch (error) {
    console.error("Error fetching inquiry count:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/contactus", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "testproject7828@gmail.com",
        pass: "mcgb qwhr vxqu etmf", // Your App Password (safe)
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`, // customer info
      to: "testproject7828@gmail.com", // always your Gmail
      subject: `New Contact Us Message from ${name}`,
      text: `
        You received a new message from your website:

        Name: ${name}
        Email: ${email}
        Message: ${message}
      `,
    });

    const inbox = new Inbox({
      name,
      email,
      message,
    });

    await inbox.save();
    io.to("dashboard").emit("inquiries", {
      name,
      email,
      message,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Error sending email: ", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.post("/api/sendMail", async (req, res) => {
  const { to, subject, text, name, total, createdAt, shippingAddress, id } =
    req.body;

  const htmlCode = mailCode(name, total, createdAt, shippingAddress, id);

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "testproject7828@gmail.com",
        pass: "mcgb qwhr vxqu etmf",
      },
    });

    await transporter.sendMail({
      from: '"Online Clothing Store" <testproject7828@gmail.com>',
      to,
      subject,
      text,
      html: htmlCode,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.get("/api/testCookie", (req, res) => {
  try {
    res.cookie("test_cookie", "1", {
      httpOnly: true, // allow access from client-side JS
      secure: true,
      sameSite: "None",
    });

    return res.status(200).json({ message: "Cookie is enabled" });
  } catch (e) {
    res
      .status(400)
      .json({ message: "Cookies not enabled. It may affect your experience" });
  }
});

const uploadFile = multer({ dest: "uploads/" }); // saves file in "uploads/" temporarily

// POST /api/apply
app.post("/api/apply", uploadFile.single("resume"), async (req, res) => {
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

app.post("/api/review-rating/:id", async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(id);
    product.rating =
      (product.rating * product.ratingCount + rating) /
      (product.ratingCount + 1);
    product.ratingCount += 1;
    product.totalRating += rating;

    if (comment) {
      product.reviews += 1;
    }

    await product.save();
    return res.status(200).json({ message: "Rating updated successfully" });
  } catch (err) {
    console.error("Error while fetching product: ", err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/shippingaddress/:id", async (req, res) => {
  const { id } = req.params;
  const shippingAddress = req.body;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.shippingAddress = shippingAddress;
    await user.save();
    return res
      .status(200)
      .json({ message: "Shipping address updated successfully" });
  } catch (error) {
    console.log("Error while fetching product: ", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete specific color from product
app.delete("/api/delete-color/:productId/:colorIndex", async (req, res) => {
  try {
    const { productId, colorIndex } = req.params;

    // Find the product and update it by removing the color at the specified index
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the color index is valid
    if (colorIndex < 0 || colorIndex >= product.color.length) {
      return res.status(400).json({ message: "Invalid color index" });
    }

    // Remove the color at the specified index
    product.color.splice(colorIndex, 1);
    await product.save();

    res.status(200).json({ message: "Color deleted successfully" });
  } catch (error) {
    console.error("Error deleting color:", error);
    res.status(500).json({ message: "Error deleting color" });
  }
});

app.get("/api/active-users-count", async (req, res) => {
  try {
    const activeUser = await ActiveUsers.findOne();
    res.json({ activeUsers: activeUser.count, authUsers: activeUser.users });
  } catch (error) {
    console.error("Error while fetching active users: ", error);
    return res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/userinfo/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("-password -__v");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user info:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

server.listen(process.env.PORT, () => {
  console.log(`Listening at port: ${process.env.PORT}.`);
  connectDB();
});
