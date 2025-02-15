import { Router } from "express";
const router = Router();
import { getActiveJobs, getArchivedJobs, createJob, findChat, updateChat, updateJob, deleteJob, setOffer } from "../controllers/job.controller.js";

router.get("/", getActiveJobs);
router.get("/:id", findChat);
router.get("/:id/archived", getArchivedJobs)
router.post("/new", createJob);
router.post("/:id", updateChat);
router.put("/edit/:id", updateJob);
router.patch("/:id", setOffer);
router.delete("/:id", deleteJob);

export default router;