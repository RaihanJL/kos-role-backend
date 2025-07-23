import express from "express";
import { login, logout, Me, forgotPassword, resetPassword } from "../controllers/Auth.js";

const router = express.Router();

router.get("/me", Me);
router.post("/login", login);
router.delete("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
