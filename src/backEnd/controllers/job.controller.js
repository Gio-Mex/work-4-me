import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";
import { io } from "../index.js";
import { notifyUser } from "../index.js";
import { getUserSocketId } from "../index.js";
import { deleteAllUsersJobNotifications } from "./user.controller.js";

// Create new job function
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
      status,
      workerId,
    } = req.body;

    const userId = req.userId;

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

    // Find workers who match the job category, excluding the job creator
    const workers = await User.find({
      skills: { $in: category },
      _id: { $ne: userId },
    });

    // Notify all matched workers
    notifyAllUsers(workers, newJob);
    res.status(201).json({ message: "Richiesta creata", newJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all active jobs (not yet evaluated)
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
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "workerId",
          foreignField: "_id",
          as: "workerDetails",
        },
      },
      { $unwind: { path: "$workerDetails", preserveNullAndEmptyArrays: true } },
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

// Get all archived jobs (evaluated)
const getArchivedJobs = async (req, res) => {
  console.log("✅ getArchivedJobs chiamato");
  console.log("Utente autenticato con ID:", req.userId);  
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
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "workerId",
          foreignField: "_id",
          as: "workerDetails",
        },
      },
      { $unwind: { path: "$workerDetails", preserveNullAndEmptyArrays: true } },
    ]);
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update job status and notify users based on status change
const updateJob = async (req, res) => {
  try {
    const { _id, ...props } = req.body;
    const updatedJob = await Job.findOneAndUpdate({ _id: _id }, props, {
      new: true,
    });

    if (!updatedJob) {
      return res.status(404).json({ message: "Richiesta non trovata" });
    }

    if (props.status === "Accettato") {
      acceptOffer(updatedJob);
    }

    if (
      props.status === "In corso" ||
      (props.status === "Chiuso" && updatedJob.evaluated === false)
    ) {
      notifySingleUser(updatedJob.userId, updatedJob);
    }
    res.status(200).json({ message: "Azione confermata", updatedJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit offer function
const setOffer = async (req, res) => {
  try {
    const { _id, ...props } = req.body;
    const updatedJob = await Job.findById(_id);
    if (updatedJob.status === "Accettato") {
      return res
        .status(400)
        .json({ message: "Un'altra offerta è già stata accettata" });
    } else {
      updatedJob.status = props.status;
      const offer = props.offers[props.offers.length - 1];
      updatedJob.offers.push(offer);
      await updatedJob.save();

      const user = await User.findById(updatedJob.userId);
      let workers = await User.find({
        skills: { $in: updatedJob.category },
        _id: { $ne: offer.workerId },
      });

      // Exclude the user from workers if their skill matches the job category
      if (
        user.skills.some(
          (skill) => skill.toLowerCase() === updatedJob.category.toLowerCase()
        )
      ) {
        workers = workers.filter(
          (worker) => worker._id.toString() !== user._id.toString()
        );
      }

      notifyAllUsers(workers, updatedJob);
      res.status(200).json({ message: "Offerta inviata" });
    }
  } catch (error) {
    if (error.message.includes("null")) {
      error.message = "Questa richiesta non è più disponibile";
    }
    res.status(500).json({ message: error.message });
  }
};

// Accept offer function (notify only the accepted worker, remove others)
const acceptOffer = async (updatedJob) => {
  await User.updateMany(
    { _id: { $ne: updatedJob.workerId } },
    { $pull: { notifications: updatedJob._id } }
  );
  io.emit("deleteNotifications", updatedJob);
  io.emit("jobUpdated", updatedJob);
  notifySingleUser(updatedJob.workerId, updatedJob);
};

// Update or create a chat for a job
const updateChat = async (req, res) => {
  try {
    const chat = {
      jobId: req.body.jobId,
      userId: req.userId,
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
      res.status(200).json({ message: "Messaggio inviato", updatedChat });
    } else {
      const newChat = new Chat({
        jobId: req.body.jobId,
        userId: req.userId,
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

// Retrieve chat by job ID
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

// Notify all workers function
const notifyAllUsers = async (workers, job) => {
  workers.forEach((worker) => {
    notifyUser(worker._id, job);
    worker.notifications.push(job._id);
  });
  if (!workers.some((worker) => worker._id === job.userId)) {
    if (job.status === "Offerta") {
      notifySingleUser(job.userId, job);
    }
  }
  await Promise.all(workers.map((worker) => worker.save()));
  io.emit("jobUpdated", job);
};

// Notify a single user function
const notifySingleUser = async (userId, job) => {
  const user = await User.findById(userId);
  notifyUser(userId, job);
  user.notifications.push(job._id);
  await user.save();
  const socketUser = getUserSocketId(userId);
  io.to(socketUser).emit("jobUpdated", job);
};

// Delete single job function
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedJob = await Job.findOneAndDelete({ _id: id });
    if (!deletedJob) {
      return res.status(404).json({ message: "Richiesta non trovata" });
    }
    res.status(200).json({ message: "Richiesta eliminata", deletedJob });
    deleteAllUsersJobNotifications(deletedJob._id);
    io.emit("deleteNotifications", deletedJob);
    io.emit("deleteJob", deletedJob._id);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all jobs created by a specific user
const deleteAllUserJobs = async (req, res) => {
  try {
    const userId = req.userId;
    const jobs = await Job.find({ userId: userId });
    if (jobs.length === 0) {
      console.log("Non ci sono lavori per questo utente");
      return res
        .status(200)
        .json({ message: "Non ci sono lavori per questo utente" });
    }
    jobs.forEach((job) => {
      io.emit("deleteNotifications", job);
      deleteAllUsersJobNotifications(job._id);
    });
    await Job.deleteMany({ userId: userId });
    console.log("Lavori utente eliminati");
    res
      .status(200)
      .json({ message: "Lavori utente eliminati", deletedJobs: jobs });
  } catch (error) {
    console.error("Errore durante l'eliminazione dei lavori:", error.message);
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
  deleteAllUserJobs,
};
