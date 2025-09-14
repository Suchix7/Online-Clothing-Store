import express from "express";
import Product from "../models/product.model.js";
import multer from "multer";
import path from "path";
import { uploadImages, uploadVideo } from "../utils/upload.utils.js";
import {
  updateSheet,
  deleteProductFromSheet,
  updateProductInSheet,
} from "../utils/googlesheets.js";

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

router.post(
  "/",
  upload.any(), // Accepts any number of files
  async (req, res) => {
    console.log(req.body);
    try {
      const {
        modelName,
        name,
        costPrice,
        sellingPrice,
        parentCategory,
        parentSubcategory,
        extras,
        stock,
        sold,
        description,
        keyFeatures,
        models,
        processor,
        ram,
        storage,
        battery,
        display,
        camera,
        frontCamera,
        os,
        charging,
        connectivity,
        ipRating,
        mwarranty,
        model,
        chargeInput,
        chargeOutput,
        chargeType,
        connectorType,
        compatibility,
        cable,
        packageIncludes,
        warranty,
        lprocessor,
        lram,
        lstorage,
        lbattery,
        ldisplay,
        graphics,
        ports,
        los,
        build,
        lconnectivity,
        lwarranty,
        capacity,
        outputPort,
        inputPort,
        outputPower,
        inputPower,
        chargingTech,
        material,
        weight,
        pcompatibility,
        specialFeatures,
        pwarranty,
        bluetoothVersion,
        batteryLife,
        chargingTime,
        driverSize,
        microphone,
        noiseCancellation,
        touchControls,
        eiprating,
        ecompatibility,
        especialFeatures,
        ewarranty,
        wdisplay,
        resolution,
        wbatterylife,
        wos,
        wconnectivity,
        sensors,
        waterResistance,
        wcompatibility,
        healthFeatures,
        wspecialFeatures,
        wwarranty,
        smodel,
        speakerType,
        soutputPower,
        sconnectivity,
        sbluetoothRange,
        sbatteryLife,
        splaybackTime,
        schargingTime,
        swaterResistance,
        sfrequencyResponse,
        sdimensions,
        sweight,
        spackageIncludes,
        swarranty,
      } = req.body;

      if (
        !modelName?.trim() ||
        !name?.trim() ||
        !costPrice ||
        !sellingPrice ||
        !parentCategory?.trim() ||
        !parentSubcategory?.trim() ||
        !stock ||
        !description?.trim()
      ) {
        return res.status(400).json({
          message: "All fields are required",
          received: req.body,
        });
      }

      const existingProduct = await Product.findOne({ modelName });
      if (existingProduct) {
        return res.status(400).json({
          message: "Product with this model name already exists",
        });
      }

      // Separate files into images and video
      const imageFiles = req.files.filter((file) =>
        file.mimetype.startsWith("image/")
      );
      const videoFile = req.files.find((file) =>
        file.mimetype.startsWith("video/")
      );

      // Upload images using the new utility function
      const uploadedImages = await uploadImages(imageFiles);

      // Upload video using the new utility function
      let videoData = null;
      try {
        videoData = await uploadVideo(videoFile);
      } catch (error) {
        console.error("Video upload error:", error.message);
        return res.send(`
          <script>
            alert('${error.message}');
            window.location.href='/admin';
          </script>
        `);
      }

      // Rest of the existing image processing code...
      const productImages = uploadedImages
        .filter((img) => img.fieldname.startsWith("image"))
        .sort((a, b) =>
          a.fieldname.localeCompare(b.fieldname, undefined, { numeric: true })
        );

      const colorVariants = [];
      const colorKeys = Object.keys(req.body).filter((key) =>
        /^color\d+$/.test(key)
      );

      for (const colorKey of colorKeys) {
        const index = colorKey.replace("color", "");
        const colorName = req.body[colorKey];
        const imageData = uploadedImages.find(
          (img) => img.fieldname === `color-image${index}`
        );

        colorVariants.push({
          colorName,
          image: imageData?.url || null,
        });
      }
      // ---- Build sizes array like colors (size1, size2, ...) ----
      const sizeVariants = [];
      const sizeKeys = Object.keys(req.body)
        .filter((key) => /^size\d+$/.test(key))
        .sort(
          (a, b) =>
            parseInt(a.replace("size", "")) - parseInt(b.replace("size", ""))
        );

      for (const sizeKey of sizeKeys) {
        const sizeName = (req.body[sizeKey] || "").trim();
        if (!sizeName) continue;
        sizeVariants.push({ sizeName }); // or { label: sizeName } if your schema uses "label"
      }

      const variantArray = [];
      const variantKeys = Object.keys(req.body).filter((key) =>
        /^variant\d+$/.test(key)
      );

      for (const variantKey of variantKeys) {
        const index = variantKey.replace("variant", "");
        const searchName = req.body[`searchName${index}`]?.trim();
        const variantName = req.body[variantKey]?.trim();
        const variantCP = req.body[`cost-price${index}`];
        const variantSP = req.body[`selling-price${index}`];
        const variantStock = req.body[`stock${index}`];

        if (!variantName || !variantCP || !variantSP || !variantStock) continue;

        variantArray.push({
          searchName: searchName || "",
          variantName: variantName,
          variantCP: Number(variantCP),
          variantSP: Number(variantSP),
          variantStock: Number(variantStock),
        });
      }

      const modelArray = models;
      // const modelKeys = Object.keys(req.body).filter((key) =>
      //   /^model\d+$/.test(key)
      // );
      // for (const modelKey of modelKeys) {
      //   const modelName = req.body[modelKey]?.trim();
      //   if (!modelName) continue;
      //   modelArray.push(modelName);
      // }

      const bundleArray = [];
      const bundleKeys = Object.keys(req.body).filter((key) =>
        /^bundle\d+$/.test(key)
      );

      for (const bundleKey of bundleKeys) {
        const index = bundleKey.replace("bundle", "");
        const bundle = req.body[bundleKey]?.trim();
        const bundlePrice = req.body[`bundlePrice${index}`];

        if (!bundle || !bundlePrice) continue; // Skip if any field is missing

        if (bundle && bundlePrice) {
          bundleArray.push({
            bundle: bundle,
            bundlePrice: Number(bundlePrice),
          });
        }
      }

      // Create product with video data
      const newProductData = {
        modelName: modelName.trim(),
        name: name.trim(),
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        parentCategory: parentCategory.trim(),
        parentSubcategory: parentSubcategory.trim(),
        extras: extras.trim(),
        stock: Number(stock),
        sold: Number(sold),
        description: description.trim(),
        keyFeatures: keyFeatures.trim(),
        images: productImages.map((img) => ({
          fieldname: img.fieldname,
          url: img.url,
          publicId: img.publicId,
        })),
        video: videoData, // Add video data to the product
        size: sizeVariants,
        color: colorVariants,
        variant: variantArray,
        model: modelArray,

        // Add the correct specs based on category
        ...(parentCategory === "Phone" && {
          specs: {
            processor,
            ram,
            storage,
            battery,
            display,
            camera,
            frontCamera,
            os,
            charging,
            connectivity,
            ipRating,
            warranty: mwarranty,
          },
        }),
        ...(parentCategory === "Charger" && {
          chargerSpecs: {
            model,
            chargeInput,
            chargeOutput,
            chargeType,
            connectorType,
            compatibility,
            cable,
            packageIncludes,
            warranty,
          },
        }),
        ...(parentCategory === "Laptop" && {
          laptopSpecs: {
            processor: lprocessor,
            ram: lram,
            storage: lstorage,
            battery: lbattery,
            display: ldisplay,
            graphics,
            ports,
            os: los,
            build,
            connectivity: lconnectivity,
            warranty: lwarranty,
          },
        }),
        ...(parentCategory === "Powerbank" && {
          powerbankSpecs: {
            capacity,
            outputPort,
            inputPort,
            outputPower,
            inputPower,
            chargingTech,
            material,
            weight,
            compatibility: pcompatibility,
            specialFeatures,
            warranty: pwarranty,
          },
        }),
        ...(parentCategory === "Earbud" && {
          earbudSpecs: {
            bluetoothVersion,
            batteryLife,
            chargingTime,
            driverSize,
            microphone,
            noiseCancellation,
            touchControls,
            ipRating: eiprating,
            compatibility: ecompatibility,
            specialFeatures: especialFeatures,
            warranty: ewarranty,
          },
        }),
        ...(parentCategory === "Smartwatch" && {
          watchSpecs: {
            display: wdisplay,
            resolution,
            batteryLife: wbatterylife,
            os: wos,
            connectivity: wconnectivity,
            sensors,
            waterResistance,
            compatibility: wcompatibility,
            healthFeatures,
            specialFeatures: wspecialFeatures,
            warranty: wwarranty,
          },
        }),
        ...(parentCategory === "Speaker" && {
          speakerSpecs: {
            model: smodel,
            speakerType,
            outputPower: soutputPower,
            connectivity: sconnectivity,
            bluetoothRange: sbluetoothRange,
            batteryLife: sbatteryLife,
            playbackTime: splaybackTime,
            chargingTime: schargingTime,
            waterResistance: swaterResistance,
            frequencyResponse: sfrequencyResponse,
            dimensions: sdimensions,
            weight: sweight,
            packageIncludes: spackageIncludes,
            warranty: swarranty,
          },
        }),
        ...(parentCategory === "Screen Protector" && {
          bundle: bundleArray,
        }),
      };

      const newProduct = new Product(newProductData);
      await newProduct.save();
      await updateSheet([newProductData]); // Update Google Sheet with new product
      return res.send(
        "<script>alert('Product added successfully!'); window.location.href='/admin';</script>"
      );
    } catch (error) {
      console.error("Error creating product:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const products = await Product.find({});

    if (!products) {
      return res.status(400).json({ message: "No products found." });
    }

    return res.status(200).json(products);
  } catch (error) {
    console.log("Error while fetching products: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/category/:parentCategory", async (req, res) => {
  const { parentCategory } = req.params;
  try {
    const products = await Product.find({ parentCategory });

    return res.status(200).json(products);
  } catch (error) {
    console.log("Error while fetching products: ", error);
    return res
      .status(500)
      .json({ message: "Server error while fetching products." });
  }
});

router.get("/subcategory/:parentSubcategory", async (req, res) => {
  const { parentSubcategory } = req.params;

  try {
    const subcategories = await Product.find({
      parentSubcategory,
    });

    return res.status(200).json(subcategories);
  } catch (error) {
    console.error("Error while fetching subcategories: ", error);
    return res.status(500).json({ message: "Failed to fetch subcategories." });
  }
});

router.get("/id/:id", async (req, res) => {
  console.log("Fetching product with ID:", req.params.id);
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.log("Error while fetching product: ", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:modelName", async (req, res) => {
  const { modelName } = req.params;
  const modelname = modelName.replace(/-/g, " ");

  try {
    const product = await Product.findOne({ modelName: modelname.trim() });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    console.log("Error while fetching product by model name: ", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Product.findByIdAndDelete(id);

    if (!result) {
      return res.status(400).json({ message: "Error while deleting product" });
    }

    const productName = result.name;
    await deleteProductFromSheet(productName);

    console.log("Deleted Record: ", result);
    return res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    console.log("Error while deleting product: ", error);
  }
});

router.put("/", upload.any(), async (req, res) => {
  try {
    console.log("Update:", req.body);
    console.log(req.files);
    const {
      modelName,
      productId,
      name,
      costPrice,
      sellingPrice,
      parentCategory,
      parentSubcategory,
      extras,
      description,
      keyFeatures,
      stock,
      sold,
      models,
      processor,
      ram,
      storage,
      battery,
      display,
      camera,
      frontCamera,
      os,
      charging,
      connectivity,
      ipRating,
      mwarranty,
      model,
      chargeInput,
      chargeOutput,
      chargeType,
      connectorType,
      compatibility,
      cable,
      packageIncludes,
      warranty,
      lprocessor,
      lram,
      lstorage,
      lbattery,
      ldisplay,
      graphics,
      ports,
      los,
      build,
      lconnectivity,
      lwarranty,
      capacity,
      outputPort,
      inputPort,
      outputPower,
      inputPower,
      chargingTech,
      material,
      weight,
      pcompatibility,
      specialFeatures,
      pwarranty,
      bluetoothVersion,
      batteryLife,
      chargingTime,
      driverSize,
      microphone,
      noiseCancellation,
      touchControls,
      eiprating,
      ecompatibility,
      especialFeatures,
      ewarranty,
      wdisplay,
      resolution,
      wbatterylife,
      wos,
      wconnectivity,
      sensors,
      waterResistance,
      wcompatibility,
      healthFeatures,
      wspecialFeatures,
      wwarranty,
      smodel,
      speakerType,
      soutputPower,
      sconnectivity,
      sbluetoothRange,
      sbatteryLife,
      splaybackTime,
      schargingTime,
      swaterResistance,
      sfrequencyResponse,
      sdimensions,
      sweight,
      spackageIncludes,
      swarranty,
    } = req.body;

    const specs = {
      processor,
      ram,
      storage,
      battery,
      display,
      camera,
      frontCamera,
      os,
      charging,
      connectivity,
      ipRating,
      warranty: mwarranty,
    };

    const chargerSpecs = {
      model,
      chargeInput,
      chargeOutput,
      chargeType,
      connectorType,
      compatibility,
      cable,
      packageIncludes,
      warranty,
    };

    const laptopSpecs = {
      processor: lprocessor,
      ram: lram,
      storage: lstorage,
      battery: lbattery,
      display: ldisplay,
      graphics,
      ports,
      os: los,
      build,
      connectivity: lconnectivity,
      warranty: lwarranty,
    };

    const powerbankSpecs = {
      capacity,
      outputPort,
      inputPort,
      outputPower,
      inputPower,
      chargingTech,
      material,
      weight,
      compatibility: pcompatibility,
      specialFeatures,
      warranty: pwarranty,
    };

    const earbudSpecs = {
      bluetoothVersion,
      batteryLife,
      chargingTime,
      driverSize,
      microphone,
      noiseCancellation,
      touchControls,
      ipRating: eiprating,
      compatibility: ecompatibility,
      specialFeatures: especialFeatures,
      warranty: ewarranty,
    };

    const watchSpecs = {
      display: wdisplay,
      resolution,
      batteryLife: wbatterylife,
      os: wos,
      connectivity: wconnectivity,
      sensors,
      waterResistance,
      compatibility: wcompatibility,
      healthFeatures,
      specialFeatures: wspecialFeatures,
      warranty: wwarranty,
    };

    const speakerSpecs = {
      model: smodel,
      speakerType,
      outputPower: soutputPower,
      connectivity: sconnectivity,
      bluetoothRange: sbluetoothRange,
      batteryLife: sbatteryLife,
      playbackTime: splaybackTime,
      chargingTime: schargingTime,
      waterResistance: swaterResistance,
      frequencyResponse: sfrequencyResponse,
      dimensions: sdimensions,
      weight: sweight,
      packageIncludes: spackageIncludes,
      warranty: swarranty,
    };

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Upload and compress all images
    const imageFiles = req.files.filter((file) =>
      file.mimetype.startsWith("image/")
    );
    const videoFile = req.files.find((file) =>
      file.mimetype.startsWith("video/")
    );

    // Upload images using the new utility function
    const uploadedImages = await uploadImages(imageFiles);

    // Upload video using the new utility function
    let videoData = null;
    try {
      videoData = await uploadVideo(videoFile);
    } catch (error) {
      console.error("Video upload error:", error.message);
      return res.send(`
        <script>
          alert('${error.message}');
          window.location.href='/admin';
        </script>
      `);
    }

    // Rest of the existing image processing code...
    const productImages = uploadedImages
      .filter((img) => img.fieldname.startsWith("image"))
      .sort((a, b) =>
        a.fieldname.localeCompare(b.fieldname, undefined, { numeric: true })
      );

    // Separate color images (color-image1, color-image2, etc.)
    const colorVariants = [];
    const colorKeys = Object.keys(req.body).filter((key) =>
      /^colorName\d+$/.test(key)
    );

    for (const colorKey of colorKeys) {
      const index = colorKey.replace("colorName", "");
      const colorName = req.body[colorKey]?.trim();

      if (!colorName) continue; // Skip if no color name

      const imageData = uploadedImages.find(
        (img) => img.fieldname === `colorImage${index}`
      );

      colorVariants.push({
        colorName,
        image: imageData
          ? imageData.url
          : existingProduct.color[index - 1]?.image,
      });
    }
    // ---- Build size variants (sizeName1, sizeName2, etc.) ----
    const sizeVariants = [];
    const sizeKeys = Object.keys(req.body).filter((key) =>
      /^sizeName\d+$/.test(key)
    );

    for (const sizeKey of sizeKeys) {
      const index = sizeKey.replace("sizeName", "");
      const sizeName = req.body[sizeKey]?.trim();

      if (!sizeName) continue; // Skip if empty

      sizeVariants.push({
        sizeName,
      });
    }

    const variantArray = [];
    const variantKeys = Object.keys(req.body).filter((key) =>
      /^variant\d+$/.test(key)
    );

    for (const variantKey of variantKeys) {
      const index = variantKey.replace("variant", "");
      const searchName = req.body[`searchName${index}`]?.trim();
      if (!searchName) continue;
      const variantName = req.body[variantKey]?.trim();
      const variantCP = req.body[`cost-price${index}`];
      const variantSP = req.body[`selling-price${index}`];
      const variantStock = req.body[`stock${index}`];

      if (!variantName || !variantCP || !variantSP || !variantStock) continue; // Skip if any field is missing

      variantArray.push({
        searchName: searchName || "",
        variantName: variantName,
        variantCP: Number(variantCP),
        variantSP: Number(variantSP),
        variantStock: Number(variantStock),
      });
    }

    const modelArray = models;
    // const modelKeys = Object.keys(req.body).filter((key) =>
    //   /^model\d+$/.test(key)
    // );
    // for (const modelKey of modelKeys) {
    //   const modelName = req.body[modelKey]?.trim();
    //   if (!modelName) continue;
    //   modelArray.push(modelName);
    // }

    const bundleArray = [];
    const bundleKeys = Object.keys(req.body).filter((key) =>
      /^bundle\d+$/.test(key)
    );

    for (const bundleKey of bundleKeys) {
      const index = bundleKey.replace("bundle", "");
      const bundle = req.body[bundleKey]?.trim();
      const bundlePrice = req.body[`bundlePrice${index}`];

      if (!bundle || !bundlePrice) continue; // Skip if any field is missing

      if (bundle && bundlePrice) {
        bundleArray.push({
          bundle: bundle,
          bundlePrice: Number(bundlePrice),
        });
      }
    }

    // Update product fields
    existingProduct.modelName = modelName?.trim() || existingProduct.modelName;
    existingProduct.name = name?.trim() || existingProduct.name;
    existingProduct.costPrice = costPrice
      ? Number(costPrice)
      : existingProduct.costPrice;
    existingProduct.sellingPrice = sellingPrice
      ? Number(sellingPrice)
      : existingProduct.sellingPrice;
    existingProduct.parentCategory =
      parentCategory?.trim() || existingProduct.parentCategory;
    existingProduct.parentSubcategory =
      parentSubcategory?.trim() || existingProduct.parentSubcategory;
    existingProduct.extras = extras?.trim() || existingProduct.extras;
    existingProduct.description =
      description?.trim() || existingProduct.description;
    existingProduct.keyFeatures = keyFeatures || existingProduct.keyFeatures;
    existingProduct.stock = stock ? Number(stock) : existingProduct.stock;
    existingProduct.sold = sold ? Number(sold) : existingProduct.sold;
    existingProduct.color =
      colorVariants.length > 0 ? colorVariants : existingProduct.color;
    existingProduct.variant = variantArray || existingProduct.variant;
    existingProduct.model = modelArray || existingProduct.model;
    existingProduct.bundle = bundleArray || existingProduct.bundle;
    existingProduct.specs = specs || existingProduct.specs;
    existingProduct.chargerSpecs = chargerSpecs || existingProduct.chargerSpecs;
    existingProduct.laptopSpecs = laptopSpecs || existingProduct.laptopSpecs;
    existingProduct.powerbankSpecs =
      powerbankSpecs || existingProduct.powerbankSpecs;
    existingProduct.earbudSpecs = earbudSpecs || existingProduct.earbudSpecs;
    existingProduct.watchSpecs = watchSpecs || existingProduct.watchSpecs;
    existingProduct.speakerSpecs = speakerSpecs || existingProduct.speakerSpecs;
    // Append new general product images if any
    if (productImages.length > 0) {
      // Combine and sort by fieldname number
      const combinedImages = [...existingProduct.images, ...productImages].sort(
        (a, b) => {
          const numA = parseInt(a.fieldname?.replace("image", ""), 10);
          const numB = parseInt(b.fieldname?.replace("image", ""), 10);
          return numA - numB;
        }
      );

      // Overwrite with the sorted array
      existingProduct.images = combinedImages;
    }
    existingProduct.video = videoData ? videoData : existingProduct.video;

    await existingProduct.save();
    await updateProductInSheet(existingProduct);

    return res.status(200).json({
      message: "Product updated successfully",
      product: existingProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
});

export default router;
