import express from 'express';
import { generateDescription, getRecommendations, calculateMatchScore, planVisit, auditBooth } from '../controllers/aiController.mjs';

const router = express.Router();

router.post('/generate-description', generateDescription);
router.post('/recommendations', getRecommendations);
router.post('/match-score', calculateMatchScore);
router.post('/plan-visit', planVisit);
router.post('/audit-booth', auditBooth);

export default router;
