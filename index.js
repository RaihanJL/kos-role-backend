import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import db from "./config/Database.js";
import SequelizeStore from "connect-session-sequelize";
import UserRoute from "./routes/UserRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import PaymentRoute from "./routes/PaymentRoute.js";
import AdminRoute from "./routes/AdminRoute.js";
import "./scheduler/paymentReminder.js";
import rulesRoute from "./routes/RulesRoute.js";
import cron from "node-cron";
import { createMonthlyBills } from "./cron/createMonthlyBills.js";

dotenv.config();

const app = express();

const sessionStore = SequelizeStore(session.Store);
const store = new sessionStore({
  db: db,
});

db.sync({alter: true})

// (async () => {
//   await db.sync();
// })();

app.use(
  session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
      secure: true,
      sameSite: "none",
    },
  })
);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://192.168.185.29:3000",
      "https://kos-role-frontend.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.static("public"));
app.use(UserRoute);
app.use(AuthRoute);
app.use(PaymentRoute);
app.use(AdminRoute);
app.use(rulesRoute);
store.sync();

cron.schedule("0 0 1 * *", createMonthlyBills);
// createMonthlyBills();

app.listen(process.env.APP_PORT, () => {
  console.log(`Server is running...`);
});

app.use((err, req, res, next) => {
  console.error("DETAIL ERROR:", err);
  res.status(500).json({ message: err.message });
});

export default app;
