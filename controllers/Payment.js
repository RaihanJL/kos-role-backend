import Payments from "../models/PaymentModel.js";
import User from "../models/UserModel.js";
import multer from "multer";
import path from "path";
import { sendEmail } from "../utils/sendEmail.js";
import { Op } from "sequelize";

// User membuat pembayaran
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
export const upload = multer({ storage: storage });

export const createPayment = async (req, res) => {
  try {
    const { amount, description, dueDate } = req.body;
    let proof = null;
    if (req.file) {
      proof = req.file.filename;
    }
    let targetDueDate;
    if (dueDate) {
      targetDueDate = new Date(dueDate);
    } else {
      const now = new Date();
      targetDueDate =
        now.getDate() >= 1 && now.getDate() <= 5
          ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
          : new Date(now.getFullYear(), now.getMonth(), 5);
    }

    // Cek: sudah validated?
    const existingValidated = await Payments.findOne({
      where: {
        userId: req.userId,
        dueDate: targetDueDate,
        status: "validated",
      },
    });
    if (existingValidated) {
      return res.status(400).json({
        msg: "Pembayaran bulan ini sudah divalidasi, tidak bisa upload ulang.",
      });
    }

    // Cek: pending/rejected? Update saja
    const existingPending = await Payments.findOne({
      where: {
        userId: req.userId,
        dueDate: targetDueDate,
        status: { [Op.in]: ["pending", "rejected"] },
      },
    });
    if (existingPending) {
      await existingPending.update({
        amount,
        description,
        proof,
        status: "pending",
      });
      return res.json({ msg: "Bukti pembayaran berhasil diupdate." });
    }

    // Jika belum ada sama sekali, tolak (tagihan tunggakan harus sudah ada)
    return res.status(400).json({ msg: "Tagihan tidak ditemukan." });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// User melihat riwayat pembayaran miliknya
export const getUserPayments = async (req, res) => {
  try {
    const payments = await Payments.findAll({
      where: { userId: req.userId },
      include: [
        {
          model: User,
          attributes: ["roomNumber"], // tambahkan field lain jika perlu
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Admin melihat semua pembayaran
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payments.findAll({
      include: [
        {
          model: User,
          attributes: ["name", "email", "roomType", "roomPrice", "roomNumber"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Admin validasi pembayaran
export const validatePayment = async (req, res) => {
  try {
    const { status } = req.body; // "validated" atau "rejected"
    const payment = await Payments.findOne({ where: { uuid: req.params.id } });
    if (!payment)
      return res.status(404).json({ msg: "Pembayaran tidak ditemukan" });

    await Payments.update({ status }, { where: { uuid: req.params.id } });

    // Ambil user terkait
    const user = await User.findByPk(payment.userId);
    if (user && user.email) {
      await sendEmail(
        user.email,
        "Status Pembayaran Anda",
        `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2 style="color: #1976d2;">Status Pembayaran Kos Anda</h2>
          <p>Halo <b>${user.name}</b>,</p>
          <p>
            Kami ingin menginformasikan bahwa pembayaran Anda telah <b>${
              status === "validated" ? "divalidasi" : "ditolak"
            }</b> oleh admin.
          </p>
          <table style="margin: 16px 0; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 8px;">Status</td>
              <td style="padding: 4px 8px;">:</td>
              <td style="padding: 4px 8px;"><b style="color:${
                status === "validated" ? "#388e3c" : "#d32f2f"
              }">${status === "validated" ? "Tervalidasi" : "Ditolak"}</b></td>
            </tr>
            <tr>
              <td style="padding: 4px 8px;">Tanggal</td>
              <td style="padding: 4px 8px;">:</td>
              <td style="padding: 4px 8px;">${new Date().toLocaleString(
                "id-ID"
              )}</td>
            </tr>
          </table>
          <p>
            Silakan cek aplikasi untuk detail lebih lanjut.<br>
            Jika ada pertanyaan, silakan hubungi admin kos.
          </p>
          <p style="margin-top:24px; color:#888; font-size:13px;">
            Email ini dikirim otomatis oleh sistem Aplikasi Kos.
          </p>
        </div>
        `
      );
    }

    res.json({ msg: "Status pembayaran diperbarui & email dikirim" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getUserArrears = async (req, res) => {
  try {
    const arrears = await Payments.findAll({
      where: {
        userId: req.userId,
        status: { [Op.in]: ["pending", "rejected"] },
        dueDate: { [Op.lt]: new Date() },
      },
    });

    const arrearsAmount = arrears.reduce((sum, pay) => sum + pay.amount, 0);
    res.json({
      hasArrears: arrears.length > 0,
      arrearsAmount,
      arrears,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCurrentMonthBill = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    // Ambil semua tagihan bulan ini untuk user
    const bills = await Payments.findAll({
      where: {
        userId: req.userId,
        status: { [Op.in]: ["pending", "rejected"] },
      },
    });

    // Cari tagihan dengan dueDate di bulan & tahun ini
    const bill = bills.find((b) => {
      const d = new Date(b.dueDate);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    if (!bill) return res.json(null);

    // Kirim amount, penalty, dan total
    res.json({
      ...bill.dataValues,
      total: (bill.amount || 0) + (bill.penalty || 0),
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const payMultipleMonths = async (req, res) => {
  try {
    const { months, description } = req.body;
    let filename = null;
    if (req.file) filename = req.file.filename;

    let monthsArr = [];
    try {
      monthsArr = JSON.parse(months);
    } catch (err) {
      return res.status(400).json({ msg: "Format bulan tidak valid." });
    }
    if (!Array.isArray(monthsArr) || monthsArr.length === 0) {
      return res.status(400).json({ msg: "Pilih minimal satu tunggakan." });
    }

    // Pastikan userId tersedia dari session/JWT (atau req.userId)
    const userId = req.userId || req.body.userId;
    if (!userId) return res.status(400).json({ msg: "User tidak valid." });

    // Debug log setelah semua variabel sudah ada
    const bulanTunggakanStr = monthsArr
      .map((d) =>
        new Date(d).toLocaleString("id-ID", { month: "long", year: "numeric" })
      )
      .join(", ");

    // Gabungkan ke description
    const descWithMonths =
      (description || "Pembayaran tunggakan") + " (" + bulanTunggakanStr + ")";

    // Update pembayaran tunggakan
    const updated = await Payments.update(
      {
        proof: filename,
        status: "pending",
        description: descWithMonths, // <-- gunakan deskripsi baru
        months: monthsArr,
      },
      {
        where: {
          userId: userId,
          dueDate: { [Op.in]: monthsArr.map((d) => new Date(d)) },
          status: { [Op.in]: ["pending", "rejected"] },
        },
      }
    );

    if (updated[0] === 0) {
      return res
        .status(404)
        .json({ msg: "Tidak ada tunggakan yang bisa dibayar." });
    }

    res.json({ msg: "Pembayaran tunggakan berhasil diajukan!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: error.message });
  }
};
