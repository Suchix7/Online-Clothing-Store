import mongoose from "mongoose";
import { type } from "os";

const inboxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Inbox = mongoose.model("Inbox", inboxSchema);
export default Inbox;
