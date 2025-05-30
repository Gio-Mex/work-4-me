import User from "../models/user.model.js";
import { io } from "../index.js";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import bcrypt from "bcrypt";

const saltRounds = 10;
config();

// Create user function
const createUser = async (req, res) => {
  try {
    const {
      name, lastName, address, city, province,
      email, password, avatar, isWorker, notifications
    } = req.body;

    let newUser = await User.findOne({ email });
    if (newUser) {
      return res.status(400).json({ message: "L'account esiste già" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userData = {
      name, lastName, address, city, province,
      email, password: hashedPassword, avatar, isWorker, notifications,
    };

    newUser = await User.create(userData);
    res.status(201).json(newUser);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login function
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "L'account non esiste" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Password non valida" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30m" });

    res.status(200).json({ message: `Ciao ${user.name}!`, user, token });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user data function
const getUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    res.status(200).json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user ratings function
const getRatings = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    res.status(200).json(user.ratings);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile function
const updateUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { ...props } = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, props, { new: true });
    if (!updatedUser) return res.status(404).json({ message: "Utente non trovato" });

    res.status(200).json({ message: "Utente aggiornato", updatedUser });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rate worker function
const rateWorker = async (req, res) => {
  try {
    const { workerId } = req.params;  
    const { ratings } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      workerId,
      {
        $push: {
          "ratings.quality": { $each: ratings.quality || [] },
          "ratings.reliability": { $each: ratings.reliability || [] },
        },
      },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "Worker non trovato" });

    res.status(200).json({ message: "Valutazioni inviate", data: updatedUser });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete job notifications from own profile
const deleteNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { jobId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { notifications: jobId } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    res.status(200).json({
      message: `Notifica ${jobId} eliminata`,
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all users job notifications
const deleteAllUsersJobNotifications = async (jobId) => {
  try {
    const users = await User.updateMany(
      { notifications: { $in: [jobId] } },
      { $pull: { notifications: jobId } }
    );
    console.log(`Notifiche eliminate per ${users.modifiedCount} utenti`);
  } catch (error) {
    console.error("Errore nell'eliminazione delle notifiche:", error.message);
    throw error;
  }
};

// Delete user function
const deleteUser = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(404).json({ message: "Utente non trovato" });
    
    const deletedUser = await User.findByIdAndDelete(userId);
    res.status(200).json({ message: `Utente ${deletedUser.name} ${deletedUser.lastName} eliminato con successo` });
    io.emit("deleteUser", deletedUser._id);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createUser,
  loginUser,
  getUser,
  getRatings,
  updateUser,
  rateWorker,
  deleteNotifications,
  deleteAllUsersJobNotifications,
  deleteUser,
};