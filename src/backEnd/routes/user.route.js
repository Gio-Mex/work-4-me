import { Router } from "express";
import authMiddleware from "../controllers/middlewares/authMiddleware.js";
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

router.get("/", authMiddleware, getUser);
router.get("/ratings/", authMiddleware, getRatings);
router.post("/login", loginUser);
router.post("/signup", createUser);
router.put("/", authMiddleware, updateUser);
router.patch("/ratings", rateWorker);
router.patch("/notifications/:jobId", authMiddleware, deleteNotifications);
router.delete("/", authMiddleware, deleteUser);

export default router;