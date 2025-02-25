import mongoose, { Schema, model } from "mongoose";

const jobSchema = new Schema({
  category: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  offers: {
    type: Array,
    required: false
  },
  address: {
    type: String,
    required: false
  },
  city: {
    type: String,
    required: false
  },
  date: {
    type: Number,
    default: Date.now(),
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    required: true
  },
  notification: {
    type: Boolean,
    required: true,
    default: false
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  amount: {
    type: Number,
    required: false
  },
  evaluated: {
    type: Boolean,
    required: true,
    default: false
  }
});

export default model("Job", jobSchema);
