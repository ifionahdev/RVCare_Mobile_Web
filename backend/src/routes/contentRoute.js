import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import * as content from "../controllers/contentController.js";

const router = Router();
router.use(authenticate, requireRole("admin"));

router.get("/publication-statuses", content.getPublicationStatuses);
router.get("/pet-care-categories", content.getPetCareCategories);
router.post("/pet-care-tips/createCategory", content.createPetCareCategory);
router.get("/pet-care-tips/icons", content.getPetCareIcons);
router.get("/pet-care-tips", content.getPetCareTips);
router.post("/pet-care-tips/createPetCare", content.createPetCareTip);
router.put("/pet-care-tips/updatePetCare/:tipId", content.updatePetCareTip);
router.delete("/pet-care-tips/deletePetCare/:tipId", content.deletePetCareTip);
router.get("/videos/videos/", content.getVideos);
router.post("/videos/create", content.createVideo);
router.put("/videos/update/:videoId", content.updateVideo);
router.delete("/videos/delete/:videoId", content.deleteVideo);
router.get("/videos/categories", content.getVideoCategories);
router.post("/videos/createCategory", content.createVideoCategory);

export default router;
