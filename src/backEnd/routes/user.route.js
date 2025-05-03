import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getUser,
  getRatings,
  loginUser,
  createUser,
  updateUser,
  deleteNotifications,
  rateWorker,
  deleteUser,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/:id", authMiddleware, getUser);
router.get("/ratings/:id", authMiddleware, getRatings);
router.post("/login", loginUser);
router.post("/signup", createUser);
router.put("/:id", authMiddleware, updateUser);
router.patch("/ratings/:id", rateWorker);
router.patch("/notifications/:id/:jobId", authMiddleware, deleteNotifications);
router.delete("/", authMiddleware, deleteUser);

export default router;