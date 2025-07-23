import User from "../models/UserModel.js";
import argon2 from "argon2";
import Payments from "../models/PaymentModel.js";

// Contoh di Express + Sequelize
export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        "uuid",
        "name",
        "email",
        "role",
        "roomType",
        "roomPrice",
        "status",
        "phone",
        "address",
        "roomNumber",
      ],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const response = await User.findOne({
      attributes: [
        "uuid",
        "name",
        "email",
        "role",
        "roomType",
        "roomPrice",
        "status",
        "phone",
        "address",
        "roomNumber",
      ],
      where: { uuid: req.params.id },
    });
    if (!response) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// tambahkan import ini jika belum
export const createUser = async (req, res) => {
  console.log(req.body);
  const {
    name,
    email,
    phone,
    address,
    password,
    confPassword,
    roomType,
    roomPrice,
    roomNumber,
  } = req.body;
  if (!name || !email || !phone || !address || !password || !confPassword) {
    return res.status(400).json({ message: "Semua field wajib diisi" });
  }

  if (name.trim().length < 3) {
    return res.status(400).json({ message: "Nama minimal 3 karakter" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Masukkan email yang valid" });
  }
  if (!/^\d{10,}$/.test(phone)) {
    return res
      .status(400)
      .json({ message: "Nomor handphone minimal 10 digit angka" });
  }
  if (address.trim().length < 8) {
    return res.status(400).json({ message: "Alamat minimal 8 karakter" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter" });
  }

  // === CEK EMAIL SUDAH TERDAFTAR ===
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: "Email sudah terdaftar" });
  }
  // === END CEK EMAIL ===

  // === CEK NOMOR KAMAR ===
  if (!roomNumber || isNaN(roomNumber) || roomNumber < 1 || roomNumber > 7) {
    return res.status(400).json({ message: "Nomor kamar wajib diisi (1-7)" });
  }
  const existingRoom = await User.findOne({ where: { roomNumber } });
  if (existingRoom) {
    return res.status(400).json({
      message:
        "Nomor kamar sudah dipilih oleh user lain. Silakan pilih nomor kamar lain yang masih tersedia.",
    });
  }
  // === END CEK NOMOR KAMAR ===

  // Validasi khusus user
  if (req.body.role !== "admin") {
    if (
      !roomType ||
      roomType === "-" ||
      roomPrice === undefined ||
      roomPrice === null ||
      roomPrice === "" ||
      Number(roomPrice) < 1000
    ) {
      return res
        .status(400)
        .json({ message: "Tipe dan harga kamar wajib diisi untuk user" });
    }
  }
  if (password !== confPassword) {
    return res
      .status(400)
      .json({ message: "Password dan Confirm Password tidak cocok" });
  }

  const hashPassword = await argon2.hash(password);
  try {
    const newUser = await User.create({
      name,
      email,
      phone,
      address,
      password: hashPassword,
      roomType: req.body.role === "admin" ? "-" : roomType,
      roomPrice: req.body.role === "admin" ? 0 : roomPrice,
      role: req.body.role || "user",
      status: "aktif",
      roomNumber,
    });

    if (newUser.role === "user") {
      const now = new Date();
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 5);
      const existingBill = await Payments.findOne({
        where: { userId: newUser.id, dueDate: dueDate },
      });
      if (!existingBill) {
        let amount = 0;
        if (roomType === "kecil") amount = 1600000;
        else if (roomType === "sedang") amount = 1800000;
        else if (roomType === "besar") amount = 1900000;

        await Payments.create({
          userId: newUser.id,
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
    // === END ===

    res.status(201).json({ message: "Register Berhasil!" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  const user = await User.findOne({
    where: {
      uuid: req.params.id,
    },
  });
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
  const { name, email, password, confPassword, role } = req.body;
  let hashPassword;
  if (password === "" || password === null) {
    hashPassword = user.password;
  } else {
    hashPassword = await argon2.hash(password);
  }
  if (password !== confPassword)
    return res
      .status(400)
      .json({ message: "Password dan Confirm Password tidak cocok" });
  try {
    await User.update(
      {
        name: name,
        email: email,
        password: hashPassword,
        role: role,
        roomType: req.body.roomType,
        roomPrice: req.body.roomPrice,
        phone: req.body.phone,
        address: req.body.address,
      },
      {
        where: {
          id: user.id,
        },
      }
    );
    res.status(200).json({ message: "User updated " });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    // Cari user berdasarkan UUID
    const user = await User.findOne({ where: { uuid: req.userUuid } });
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const { name, email, phone, address, password, confirmPassword } = req.body;
    if (password && password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Password dan Konfirmasi tidak cocok" });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (password) user.password = await argon2.hash(password);

    await user.save();
    res.json({ message: "Profil berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const user = await User.findOne({
    where: {
      uuid: req.params.id,
    },
  });
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
  try {
    await User.destroy({
      where: {
        id: user.id,
      },
    });
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  const user = await User.findOne({ where: { uuid: req.params.id } });
  if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
  user.status = req.body.status;
  await user.save();
  res.json({ msg: "Status user diperbarui" });
};
