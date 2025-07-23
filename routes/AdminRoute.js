import express from "express";
import { getAdminSummary } from "../controllers/Admin.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";
const router = express.Router();

router.get("/admin/summary", verifyUser, adminOnly, getAdminSummary);

export default router;