import express from "express";
import {
  createPayment,
  getUserPayments,
  getAllPayments,
  validatePayment,
  getCurrentMonthBill,
  payMultipleMonths,
  getUserArrears,
  upload,
} from "../controllers/Payment.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";
import Payments from "../models/PaymentModel.js";

const router = express.Router();

router.post("/payments", verifyUser, upload.single("proof"), createPayment);
router.get("/payments", verifyUser, getUserPayments);
router.get("/payments/admin", verifyUser, adminOnly, getAllPayments);
router.patch("/payments/:id", verifyUser, adminOnly, validatePayment);
router.get("/payments/current-month", verifyUser, getCurrentMonthBill);
router.get("/payments/arrears", verifyUser, getUserArrears);
router.post(
  "/payments/pay-multiple",
  verifyUser,
  upload.single("proof"),
  payMultipleMonths
);
router.get("/payments/me", verifyUser, async (req, res) => {
  const status = req.query.status || "pending";
  const payments = await Payments.findAll({
    where: {
      userId: req.userId,
      status: status,
    },
    order: [["dueDate", "DESC"]],
  });
  res.json(payments);
});

export default router;
