import express from "express";
import { getRules, updateRules } from "../controllers/Rules.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";

const router = express.Router();

router.get("/rules", getRules);
router.put("/rules", verifyUser, adminOnly, updateRules);

export default router;