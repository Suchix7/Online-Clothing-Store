import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  comment: {
    type: String,
  },
  date: {
    type: String,
  },
  user: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: `https://i.pravatar.cc/150?u=${Date.now()}`,
  },
  medias: {
    type: Array,
  },
});

const Review = mongoose.model("review", reviewSchema);

export default Review;
