import { Router } from "express";
const router = Router();
import {
  getUser,
  loginUser,
  createUser,
  updateUser,
  rateWorker,
  deleteUser,
} from "../controllers/user.controller.js";

router.get("/:id", getUser);
router.post("/login", loginUser);
router.post("/signup", createUser);
router.put("/:id", updateUser);
router.patch("/:id", rateWorker);
router.delete("/", deleteUser);

export default router;