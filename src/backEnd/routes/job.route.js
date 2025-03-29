import { Router } from "express";
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

router.get("/", getActiveJobs);
router.get("/:id", findChat);
router.get("/archived/:id", getArchivedJobs);
router.post("/new", createJob);
router.post("/:id", updateChat);
router.put("/edit/:id", updateJob);
router.patch("/:id", setOffer);
router.delete("/:id", deleteJob);
router.delete("/user/:userId", deleteAllUserJobs);

export default router;