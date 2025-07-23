import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateStatus,
  updateMyProfile,
} from "../controllers/Users.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";
import { getUserArrears } from "../controllers/Payment.js";

const router = express.Router();

router.get("/users", verifyUser, adminOnly, getUsers);
router.patch("/users/me", verifyUser, updateMyProfile);
router.get("/users/:id", verifyUser, adminOnly, getUserById);
router.get("/users/:id/arrears", verifyUser, getUserArrears);
router.post("/users", createUser);
router.patch("/users/:id", verifyUser, adminOnly, updateUser);
router.delete("/users/:id", verifyUser, adminOnly, deleteUser);
router.patch("/users/:id/status", verifyUser, adminOnly, updateStatus);


export default router;
