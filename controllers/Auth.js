import User from "../models/UserModel.js";
import argon2 from "argon2";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

export const login = async (req, res) => {
  const user = await User.findOne({
    where: {
      email: req.body.email,
    },
  });
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  // CEK STATUS SUSPEND
  if (user.status === "suspend") {
    return res
      .status(403)
      .json({ message: "Akun Anda disuspend. Hubungi admin." });
  }

  const match = await argon2.verify(user.password, req.body.password);
  if (!match) return res.status(400).json({ message: "Password salah" });

  req.session.userId = user.uuid;
  const uuid = user.uuid;
  const name = user.name;
  const email = user.email;
  const role = user.role;
  const roomType = user.roomType;
  const roomPrice = user.roomPrice;
  const roomNumber = user.roomNumber; // <-- tambahkan ini
  res.status(200).json({
    uuid,
    name,
    email,
    role,
    roomType,
    roomPrice,
    roomNumber, // <-- tambahkan ini
  });
};

export const Me = async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ message: "Anda harus login terlebih dahulu" });
  }
  const user = await User.findOne({
    attributes: [
      "uuid",
      "name",
      "email",
      "role",
      "roomType",
      "roomPrice",
      "phone", // tambahkan ini
      "address", // tambahkan ini
      "roomNumber",
    ],
    where: {
      uuid: req.session.userId,
    },
  });
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
  res.status(200).json(user);
};

export const logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(400).json({ message: err.message });
    res.status(200).json({ message: "Anda telah logout" });
  });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: "Email tidak ditemukan" });

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = token;
  user.resetTokenExpires = Date.now() + 1000 * 60 * 30; // 30 menit
  await user.save();

  const resetUrl = `http://localhost:3000/reset-password/${token}`;
  await sendEmail(
    user.email,
    "Reset Password Aplikasi Kos",
    `<p>Klik link berikut untuk reset password:</p>
   <a href="${resetUrl}">${resetUrl}</a>
   <p>Link berlaku 30 menit.</p>`
  );

  res.json({ message: "Link reset password telah dikirim ke email Anda." });
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confPassword } = req.body;
  const user = await User.findOne({ where: { resetToken: token } });
  if (!user || user.resetTokenExpires < Date.now()) {
    return res
      .status(400)
      .json({ message: "Token tidak valid atau kadaluarsa" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter" });
  }
  if (password !== confPassword) {
    return res.status(400).json({ message: "Konfirmasi password tidak cocok" });
  }
  // HASH password sebelum simpan!
  user.password = await argon2.hash(password);
  user.resetToken = null;
  user.resetTokenExpires = null;
  await user.save();
  res.json({ message: "Password berhasil direset. Silakan login." });
};
