import { Router } from "express";
import {
  getUser,
  getRatings,
  loginUser,
  createUser,
  updateUser,
  deleteNotifications,
  deleteAllUsersJobNotifications,
  rateWorker,
  deleteUser,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/:id", getUser);
router.get("/ratings/:id", getRatings);
router.post("/login", loginUser);
router.post("/signup", createUser);
router.put("/:id", updateUser);
router.patch("/ratings/:id", rateWorker);
router.delete("/notifications/:id/:jobId", deleteNotifications);
router.delete("/notifications/:jobId", deleteAllUsersJobNotifications);
router.delete("/", deleteUser);

export default router;