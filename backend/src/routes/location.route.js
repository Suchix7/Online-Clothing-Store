import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// For ES Modules: resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct path to location.json
const filePath = path.join(__dirname, "../data/location.json");

router.get("/api/location", (req, res) => {
  try {
    const jsonData = fs.readFileSync(filePath, "utf-8");
    const locationData = JSON.parse(jsonData);
    res.json(locationData);
  } catch (err) {
    console.error("Failed to load location.json:", err);
    res.status(500).json({ error: "Could not load location data" });
  }
});

export default router;
