import mongoose from "mongoose";

const SubcategorySchema = new mongoose.Schema({
  subcategoryName: {
    type: String,
    required: true,
    unique: true,
  },
  parentCategory: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
  },
  image: {
    type: String,
  },
});

const Subcategory = mongoose.model("subcategory", SubcategorySchema);

export default Subcategory;
