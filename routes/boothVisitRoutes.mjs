import express from "express";
import auth from "../middleware/middleware.mjs";
import { boothVisit } from "../controllers/boothVisitController.mjs";


const router = express.Router();
// routes/boothvisit.mjs
router.post("/:expoId/:boothId", auth, boothVisit)

    
export default router;
