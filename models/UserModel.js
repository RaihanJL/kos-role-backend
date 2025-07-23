import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const User = db.define(
  "users",
  {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      validate: { notEmpty: true },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true, len: [3, 100] },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true, isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true, isIn: [["admin", "user"]] },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "aktif",
      validate: { isIn: [["aktif", "suspend"]] },
    },
    roomType: {
      type: DataTypes.ENUM("kecil", "sedang", "besar"),
      allowNull: false,
    },
    roomPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    roomNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: { min: 1, max: 7 },
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  { freezeTableName: true }
);

export default User;
