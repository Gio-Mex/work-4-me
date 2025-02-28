import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";
import { io } from "../index.js";
import { notifyUser } from "../index.js";

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

const getJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const job = await Job.findOne({ _id: jobId });
    if (!job) {
      return res.status(404).json({ message: "Lavoro non trovato" });
    }
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      // Notificare solo il worker che ha fatto l'offerta
      notifySingleUser(updatedJob.workerId, updatedJob);
    }

    if (props.status === "In lavorazione" || props.status === "Chiuso") {
      // Notificare l'utente
      notifySingleUser(updatedJob.userId, updatedJob);
    }
    res.status(200).json({ message: "Azione confermata", updatedJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      //notifyUser(updatedJob.userId, updatedJob);
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
      console.log(existingChat);
      const updatedChat = await Chat.updateOne(
        { jobId: jobId },
        { $set: chat },
        { new: true }
      );
      res.status(200).json({ message: "Chat aggiornata", updatedChat });
    } else {
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

const notifyAllUsers = async (workers, job) => {
  workers.forEach((worker) => {
    notifyUser(worker._id, job);
    worker.notifications.push(job._id);
  });
  await Promise.all(workers.map((worker) => worker.save()));
  io.emit("jobUpdated", job);
};

const notifySingleUser = async (userId, job) => {
  const user = await User.findById(userId);
  notifyUser(userId, job);
  user.notifications.push(job._id);
  await user.save();
  io.emit("jobUpdated", job);
};

export {
  createJob,
  getArchivedJobs,
  updateChat,
  findChat,
  getActiveJobs,
  getJob,
  updateJob,
  setOffer,
  deleteJob,
};
