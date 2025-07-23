import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";

const { DataTypes } = Sequelize;

const Payments = db.define(
  "payments",
  {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
        min: 1,
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "validated", "rejected"),
      defaultValue: "pending",
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    proof: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true, // ubah dari false ke true
    },
    penalty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    months: {
      type: DataTypes.JSON, // <--- Tambahkan ini
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
  }
);

User.hasMany(Payments);
Payments.belongsTo(User, {
  foreignKey: "userId",
  targetKey: "id",
});
User.hasMany(Payments, { foreignKey: "userId", as: "Payments" });
Payments.belongsTo(User, { foreignKey: "userId", targetKey: "id", as: "User" });

export default Payments;
