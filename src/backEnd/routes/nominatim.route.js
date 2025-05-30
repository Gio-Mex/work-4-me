import { Router } from "express";
import {
  searchCity,
  searchOnMap
} from "../controllers/nominatim.controller.js";

const router = Router();

router.get("/search", searchCity);
router.get("/geolocalize", searchOnMap);
export default router;