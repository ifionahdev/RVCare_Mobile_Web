import { Router } from "express";
import { getPublishedPetCareContent } from "../controllers/contentController.js";

const router = Router();

router.get("/content", getPublishedPetCareContent);

export default router;
