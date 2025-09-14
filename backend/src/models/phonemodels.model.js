import mongoose from "mongoose";

const phonemodelsSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
  },
  models: {
    type: [String],
    required: true,
  },
});

const PhoneModels = mongoose.model("Phonemodel", phonemodelsSchema);
export default PhoneModels;
