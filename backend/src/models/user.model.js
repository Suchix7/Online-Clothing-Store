import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    phoneNumber: {
      type: Number,
    },
    profilePic: {
      type: String,
      default: "",
    },
    shippingAddress: {
      address: String,
      city: String,
      landmark: String,
      location: {
        lat: Number,
        lng: Number,
      },
      province: String,
      district: String,
      municipality: String,
    },
    isGoogle: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
