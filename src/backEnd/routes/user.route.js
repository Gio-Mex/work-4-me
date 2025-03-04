import { Router } from "express";
import {
  getUser,
  loginUser,
  createUser,
  updateUser,
  deleteNotifications,
  rateWorker,
  deleteUser,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/:id", getUser);
router.post("/login", loginUser);
router.post("/signup", createUser);
router.put("/:id", updateUser);
router.patch("/ratings/:id", rateWorker);
router.delete("/notifications/:id/:jobId", deleteNotifications);
router.delete("/", deleteUser);

export default router;