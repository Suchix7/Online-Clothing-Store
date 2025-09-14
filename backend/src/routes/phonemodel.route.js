import express from "express";
import PhoneModels from "../models/phonemodels.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { brand, models } = req.body;
    if (!brand || !models) {
      return res.status(400).json({ message: "Invalid input data" });
    }
    const modelsArray = models.split(",").map((model) => model.trim());
    const existingBrand = await PhoneModels.findOne({ brand });
    if (existingBrand) {
      return res.status(400).json({ message: "Brand already exists" });
    }
    const newPhoneModel = new PhoneModels({
      brand,
      models: modelsArray,
    });
    await newPhoneModel.save();
    return res.send(
      "<script>alert('Phone models added successfully!'); window.location.href='/admin';</script>"
    );
  } catch (error) {
    console.error("Error adding phone model:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const phoneModels = await PhoneModels.find({});
    res.status(200).json(phoneModels);
  } catch (error) {
    console.error("Error fetching phone models:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const phoneModel = await PhoneModels.findById(id);
    if (!phoneModel) {
      return res.status(404).json({ message: "Phone model not found" });
    }
    res.status(200).json(phoneModel);
  } catch (error) {
    console.error("Error fetching phone model:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/brand/:brand", async (req, res) => {
  try {
    const { brand } = req.params;
    const phoneModels = await PhoneModels.findOne({ brand });
    res.status(200).json(phoneModels);
  } catch (error) {
    console.error("Error fetching phone models:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { brand, models } = req.body;
    if (!brand || !models) {
      return res.status(400).json({ message: "Invalid input data" });
    }
    const modelsArray = models.split(",").map((model) => model.trim());
    const updatedPhoneModel = await PhoneModels.findByIdAndUpdate(
      id,
      { brand, models: modelsArray },
      { new: true }
    );
    if (!updatedPhoneModel) {
      return res.status(404).json({ message: "Phone model not found" });
    }
    res.status(200).json({
      message: "Phone model updated successfully",
      phoneModel: updatedPhoneModel,
    });
  } catch (error) {
    console.error("Error updating phone model:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPhoneModel = await PhoneModels.findByIdAndDelete(id);
    if (!deletedPhoneModel) {
      return res.status(404).json({ message: "Phone model not found" });
    }
    res.status(200).json({ message: "Phone model deleted successfully" });
  } catch (error) {
    console.error("Error deleting phone model:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
