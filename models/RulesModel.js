import { DataTypes } from "sequelize";
import db from "../config/Database.js";

const Rules = db.define("Rules", {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

export default Rules;