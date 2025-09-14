import mongoose from "mongoose";

const googleusersSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  profilePic: {
    type: String,
    default: "",
  },
  shippingAddress: {
    address: String,
    city: String,
    landmark: String,
  },
  isGoogle: {
    type: Boolean,
    default: true,
  },
});

const GoogleUsers = mongoose.model("GoogleUser", googleusersSchema);

export default GoogleUsers;
