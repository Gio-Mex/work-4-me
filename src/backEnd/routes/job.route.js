import { Router } from "express";
import authMiddleware from "../controllers/middlewares/authMiddleware.js";
import {
  getActiveJobs,
  getArchivedJobs,
  createJob,
  findChat,
  updateChat,
  updateJob,
  setOffer,
  deleteJob,
  deleteAllUserJobs,
} from "../controllers/job.controller.js";

const router = Router();

router.get("/", authMiddleware, getActiveJobs);
router.get("/:id", authMiddleware, findChat);
router.get("/archived", authMiddleware, getArchivedJobs);
router.post("/new", authMiddleware, createJob);
router.post("/:id", authMiddleware, updateChat);
router.put("/edit/:id", authMiddleware, updateJob);
router.patch("/:id", authMiddleware, setOffer);
router.delete("/:id", authMiddleware, deleteJob);
router.delete("/user", authMiddleware, deleteAllUserJobs);

export default router;