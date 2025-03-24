import User from "../models/user.model.js";
import bcrypt from "bcrypt";
const saltRounds = 10;
import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

// Create user function
const createUser = async (req, res) => {
  try {
    const {
      name,
      lastName,
      address,
      city,
      province,
      email,
      password,
      avatar,
      isWorker,
      notifications,
    } = req.body;
    let newUser = await User.findOne({ email: email });
    if (newUser) {
      return res.status(400).json({ message: "L'account esiste già" });
    } else {
      // Generate hash password
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const userData = {
        name,
        lastName,
        address,
        city,
        province,
        email,
        password: hashedPassword,
        avatar,
        isWorker,
        notifications,
      };
      newUser = await User.create(userData);
      res.status(201).json(newUser);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login function
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "L'account non esiste" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password non valida" });
    }
    // Generate token
    const token = jwt.sign({ userId: user._id }, "secret", {
      expiresIn: "30m",
    });
    console.log("Generated token:", token);
    res.status(200).json({ message: `Ciao ${user.name}!`, user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by id function
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get ratings function
const getRatings = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }
    res.status(200).json(user.ratings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user function
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { ...props } = req.body;
    const updatedUser = await User.findOneAndUpdate({ _id: id }, props, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "Utente non trovato" });
    }
    res.status(200).json({ message: "Utente aggiornato", updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rate worker function
const rateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { ratings } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $push: {
          "ratings.quality": { $each: ratings.quality || [] },
          "ratings.reliability": { $each: ratings.reliability || [] },
        },
      },
      {
        new: true,
      }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "Utente non trovato" });
    }
    res.status(200).json({
      message: "Valutazioni inviate",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento delle valutazioni:", error);
    res.status(500).json({ message: "Errore del server" });
  }
};

// Delete notifications of a specific user
const deleteNotifications = async (req, res) => {
  try {
    const { id, jobId } = req.params;
    const user = await User.findOneAndUpdate(
      { _id: id },
      { $pull: { notifications: jobId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    res.status(200).json({
      message: `Notifica ${jobId} eliminata per l'utente ${id}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { _id } = req.query;
    const deletedUser = await User.findOneAndDelete({ _id });
    if (!deletedUser) {
      return res.status(404).json({ message: "Utente non trovato" });
    }
    res.status(200).json({
      message: `Utente ${deletedUser.name} ${deletedUser.lastName} eliminato con successo`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createUser,
  getUser,
  getRatings,
  loginUser,
  updateUser,
  rateWorker,
  deleteNotifications,
  deleteUser,
};
