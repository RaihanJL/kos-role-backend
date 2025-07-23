import Payments from "../models/PaymentModel.js";
import User from "../models/UserModel.js";

export const createMonthlyBills = async () => {
  const users = await User.findAll({
    where: { status: "aktif", role: "user" },
  });
  const now = new Date();

  // === SET JATUH TEMPO MANUAL UNTUK TESTING ===
  // Setelah testing, hapus/comment baris ini
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 5); // default
  // const TEST_DUE_DATE = "2025-07-22"; 
  // const dueDate = TEST_DUE_DATE
  //   ? new Date(TEST_DUE_DATE)
  //   : new Date(now.getFullYear(), now.getMonth(), 5);
  for (const user of users) {
    const existing = await Payments.findOne({
      where: { userId: user.id, dueDate: dueDate },
    });
    if (!existing) {
      let amount = 0;
      if (user.roomType === "kecil") amount = 1600000;
      else if (user.roomType === "sedang") amount = 1800000;
      else if (user.roomType === "besar") amount = 1900000;

      await Payments.create({
        userId: user.id,
        amount,
        description: `Pembayaran bulan ${dueDate.toLocaleString("id-ID", {
          month: "long",
          year: "numeric",
        })}`,
        dueDate,
        status: "pending",
      });
    }
  }
};
