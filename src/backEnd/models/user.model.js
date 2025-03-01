import { Schema, model } from "mongoose";
const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  province: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  isWorker: {
    type: Boolean,
    default: false,
    required: false
  },
  skills: {
    type: Array,
    required: false
  },
  ratings: {
    type: {
      quality: {
        type: [Number], 
        required: true,
      },
      reliability: {
        type: [Number],
        required: true, 
      },
    },
    required: false,
  },
  notifications: {
    type: [String],
    required: false
  }
});

const User = model("User", userSchema);
export default User;
