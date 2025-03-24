import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";
import { io } from "../index.js";
import { notifyUser } from "../index.js";
import { getUserSocketId } from "../index.js";

// Create job function
const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      address,
      city,
      date,
      userId,
      status,
      workerId,
    } = req.body;
    const newJob = new Job({
      title,
      description,
      price,
      category,
      address,
      city,
      date,
      userId,
      status,
      workerId,
    });
    await newJob.save();
    // Send notification to all workers with created job category
    const workers = await User.find({
      skills: { $in: category },
      _id: { $ne: userId },
    });
    notifyAllUsers(workers, newJob);
    res.status(201).json({ message: "Richiesta creata", newJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all active jobs (not evaluated) function. Use aggregate to get user, worker and chat details.
const getActiveJobs = async (req, res) => {
  try {
    const jobs = await Job.aggregate([
      { $match: { evaluated: { $ne: true } } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "users",
          localField: "workerId",
          foreignField: "_id",
          as: "workerDetails",
        },
      },
      {
        $unwind: { path: "$workerDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "chat",
          localField: "workerId",
          foreignField: "_id",
          as: "chat",
        },
      },
    ]);
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all archived jobs (evaluated). Use aggregate to get user, worker and chat details.
const getArchivedJobs = async (req, res) => {
  try {
    const jobs = await Job.aggregate([
      { $match: { evaluated: true } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "users",
          localField: "workerId",
          foreignField: "_id",
          as: "workerDetails",
        },
      },
      {
        $unwind: { path: "$workerDetails", preserveNullAndEmptyArrays: true },
      },
    ]);
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update job function
const updateJob = async (req, res) => {
  try {
    const { _id, ...props } = req.body;
    const updatedJob = await Job.findOneAndUpdate({ _id: _id }, props, {
      new: true,
    });

    if (!updatedJob) {
      return res.status(404).json({ message: "Lavoro non trovato" });
    }

    if (props.status === "Accettato") {
      // Emit a jobUpdated event via socket
      io.emit("jobUpdated", updatedJob);
      // Notify only the worker who made the offer
      notifySingleUser(updatedJob.workerId, updatedJob);

      // Clear unnecessary notifications for other workers
      await User.updateMany(
        { _id: { $ne: updatedJob.workerId } },
        { $pull: { notifications: updatedJob._id } }
      );

      // Emit a deleteNotifications event for other workers via socket
      io.emit("deleteNotifications", updatedJob);
    }

    if (
      props.status === "In corso" ||
      (props.status === "Chiuso" && updatedJob.evaluated === false)
    ) {
      // Notify the user
      notifySingleUser(updatedJob.userId, updatedJob);
    }
    res.status(200).json({ message: "Azione confermata", updatedJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Set offer function
const setOffer = async (req, res) => {
  try {
    const { _id, ...props } = req.body;
    const updatedJob = await Job.findById(_id);
    if (updatedJob.status === "Accettato") {
      return res
        .status(400)
        .json({ message: "Un'altra proposta è stata già accettata" });
    } else {
      updatedJob.status = props.status;
      const offer = props.offers[props.offers.length - 1];
      updatedJob.offers.push(offer);
      await updatedJob.save();
      console.log(offer);
      // Notify the user who made the offer via socket
      if (offer.worker.category !== updatedJob.category) {
        notifyUser(updatedJob.userId, updatedJob);
      }

      // Notify all other workers via socket
      const workers = await User.find({
        skills: { $in: updatedJob.category },
        _id: { $ne: offer.workerId },
      });
      notifyAllUsers(workers, updatedJob);
      res.status(200).json({ message: "Proposta inviata" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update chat function
const updateChat = async (req, res) => {
  try {
    const chat = {
      jobId: req.body.jobId,
      userId: req.body.userId,
      workerId: req.body.workerId,
      messages: req.body.messages,
    };
    const { jobId } = req.body;
    const existingChat = await Chat.findOne({ jobId });
    if (existingChat) {
      const updatedChat = await Chat.updateOne(
        { jobId: jobId },
        { $set: chat },
        { new: true }
      );
      res.status(200).json({ message: "Chat aggiornata", updatedChat });
    } else {
      // Create new chat
      const newChat = new Chat({
        jobId: req.body.jobId,
        userId: req.body.userId,
        workerId: req.body.workerId,
        messages: [],
      });
      await newChat.save();
      res.status(201).json({ message: "Chat creata", newChat });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Find chat function
const findChat = async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await Chat.findOne({ jobId: id });
    if (!chat) {
      return res.status(404).json({ message: "Chat non trovata" });
    }
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send notification to all users (workers) function
const notifyAllUsers = async (workers, job) => {
  // Notify all workers via socket
  workers.forEach((worker) => {
    notifyUser(worker._id, job);
    worker.notifications.push(job._id);
  });
  await Promise.all(workers.map((worker) => worker.save()));
  // Emit a jobUpdated event for workers via socket
  io.emit("jobUpdated", job);
};

// Send notification to a specific user function
const notifySingleUser = async (userId, job) => {
  const user = await User.findById(userId);
  // Notify the user via socket
  notifyUser(userId, job);
  user.notifications.push(job._id);
  await user.save();
  // Get the socketId of the user
  const socketUser = getUserSocketId(userId);
  // Emit a jobUpdated event for the user via socket
  io.to(socketUser).emit("jobUpdated", job);
};

// Delete job
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedJob = await Job.findOneAndDelete({ _id: id });
    if (!deletedJob) {
      return res.status(404).json({ message: "Lavoro non trovato" });
    }
    res.status(200).json({ message: "Lavoro eliminato", deletedJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createJob,
  getArchivedJobs,
  updateChat,
  findChat,
  getActiveJobs,
  updateJob,
  setOffer,
  deleteJob,
};
