import mongoose from "mongoose";

const activeUsersSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0,
  },
  users: Array,
});

const ActiveUsers = mongoose.model("ActiveUsers", activeUsersSchema);

export default ActiveUsers;
