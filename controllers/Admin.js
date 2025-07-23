import User from "../models/UserModel.js";
import Payments from "../models/PaymentModel.js";
import { Op } from "sequelize";

export const getAdminSummary = async (req, res) => {
  try {
    const totalUsers = await User.count({ where: { role: "user" } });
    const totalRooms = await User.count({ col: "roomType", distinct: true }); // Ganti sesuai model Anda
    const occupiedRooms = await User.count({
      where: { roomType: { [Op.ne]: null } },
    });
    const pendingPayments = await Payments.count({
      where: { status: "pending" },
    });
    const tunggakan = await Payments.findAll({
      where: {
        status: { [Op.in]: ["pending", "rejected"] },
        dueDate: { [Op.lt]: new Date() },
      },
    });
    const totalTunggakan = tunggakan.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      totalUsers,
      totalRooms,
      occupiedRooms,
      pendingPayments,
      totalTunggakan,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
