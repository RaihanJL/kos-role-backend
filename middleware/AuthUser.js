import User from "../models/UserModel.js";

export const verifyUser = async (req, res, next) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ message: "Anda harus login terlebih dahulu" });
  }

  // Ambil user berdasarkan UUID dari session
  const user = await User.findOne({
    where: { uuid: req.session.userId },
  });
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  req.userId = user.id; // id angka, untuk relasi FK (Payments, dsb)
  req.userUuid = user.uuid; // uuid, untuk pencarian user
  req.role = user.role;
  next();
};
 
export const adminOnly = async (req, res, next) => {
  const user = await User.findOne({
    where: {
      uuid: req.session.userId,
    },
  });
  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }
  if (user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Akses ditolak, hanya admin yang dapat mengakses" });
  }
  next(); // Proceed to the next middleware or route handler
};
