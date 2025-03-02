import { Router } from "express";
import {
  getActiveJobs,
  getArchivedJobs,
  createJob,
  findChat,
  updateChat,
  updateJob,
  setOffer,
  deleteNotifications,
  deleteJob,
} from "../controllers/job.controller.js";

const router = Router();

router.get("/", getActiveJobs);
router.get("/:id", findChat);
router.get("/:id/archived", getArchivedJobs);
router.post("/new", createJob);
router.post("/:id", updateChat);
router.put("/edit/:id", updateJob);
router.patch("/:id", setOffer);
router.patch("/", deleteNotifications);
router.delete("/:id", deleteJob);

export default router;