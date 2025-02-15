import mongoose, { Schema, model } from "mongoose";

const chatSchema = new Schema({
  jobId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  workerId: {
    type: String,
    required: true
  },
  messages: {
    type: [{
      jobId: String,
      senderId: String,
      content: String,
      date: Number,
    }],
    required: true
  }
});

export default model("Chat", chatSchema);