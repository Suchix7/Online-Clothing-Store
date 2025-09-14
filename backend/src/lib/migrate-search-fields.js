// scripts/migrate-search-fields.js
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
import Product from "../models/product.model.js";
import { connectDB } from "./db.js"; // adjust path if needed

await connectDB(); // <-- actually call it

const cursor = Product.find().cursor();
for await (const p of cursor) {
  if (!p.brand) p.brand = "";
  p.category = p.category || p.parentCategory || "";
  p.subcategory = p.subcategory || p.parentSubcategory || "";
  if (!Array.isArray(p.tags)) p.tags = [];

  const cat = (p.parentSubcategory || p.parentCategory || "").toLowerCase();
  p.isAccessory = /(cover|case|protector|glass|cable|charger|adapter)/i.test(
    cat
  );

  await p.save();
}

console.log("Migration done");
process.exit(0);
