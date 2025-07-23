import cron from "node-cron";
import Payments from "../models/PaymentModel.js";
import Users from "../models/UserModel.js";
import { sendEmail } from "../utils/sendEmail.js";

// Fungsi untuk mengirim email pengingat dan sanksi
const sendReminders = async () => {
  console.log("[REMINDER] Scheduler berjalan:", new Date().toISOString());
  const today = new Date();
  const payments = await Payments.findAll({
    where: { status: "pending" },
    include: [{ model: Users, as: "User" }],
  });

  for (const payment of payments) {
    const dueDate = new Date(payment.dueDate);
    const user = payment.User;
    if (!user) continue;

    // Hitung selisih hari
    const diffTime = today - dueDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const beforeDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    // Pengingat sebelum jatuh tempo (H-10, H-5, H-1, H0)
    for (const h of [10, 5, 1, 0]) {
      if (beforeDue === h && payment.status === "pending") {
        let subject = "Pengingat Jatuh Tempo Pembayaran Kos Anda";
        let greeting = `Yth. ${user.name},`;
        let body = `
  <p>${greeting}</p>
  <p>
    Kami ingin mengingatkan Anda bahwa pembayaran kos Anda akan <b>jatuh tempo pada ${dueDate.toLocaleDateString(
      "id-ID"
    )}</b>.
  </p>
  <p>
    Mohon pastikan pembayaran dilakukan sebelum tanggal tersebut untuk menjaga kelancaran layanan dan menghindari sanksi atau denda.
  </p>
  <p>
    Jika Anda telah melakukan pembayaran, abaikan email ini.
  </p>
  <br>
  <p>
    Apabila Anda memerlukan bantuan atau memiliki pertanyaan, silakan hubungi tim layanan pelanggan kami.
  </p>
  <br>
  <p>
    Terima kasih atas kepercayaan dan kerjasama Anda.
  </p>
  <p>
    Hormat kami,<br>
    <b>Manajemen Kos</b>
  </p>
`;
        await sendEmail(user.email, subject, body);
      }
    }

    // Pengingat keterlambatan (H+1, H+5, H+10, H+15, H+20)
    if ([1, 5, 10, 15, 20].includes(diffDays)) {
      let sanksi = "";
      let sanksiHtml = "";
      if (diffDays === 1) {
        sanksi = "Surat Peringatan 1 (SP1)";
        sanksiHtml = "<li>Anda menerima SP1 sebagai peringatan pertama.</li>";
      }
      if (diffDays === 5) {
        sanksi = "Surat Peringatan 2 (SP2)";
        sanksiHtml = "<li>Anda menerima SP2 sebagai peringatan kedua.</li>";
      }
      if (diffDays === 10) {
        sanksi = "Surat Peringatan 3 (SP3)";
        sanksiHtml = "<li>Anda menerima SP3 sebagai peringatan ketiga.</li>";
      }
      if (diffDays === 15) {
        sanksi = "Surat Peringatan 4 (SP4) + Denda Rp100.000";
        sanksiHtml =
          "<li>Anda menerima SP4 dan dikenakan denda sebesar <b>Rp100.000</b>.</li>";
        payment.penalty = 100000;
        await payment.save();
      }
      if (diffDays >= 20 && user.status !== "suspend") {
        sanksi = "Akun Anda akan disuspend";
        sanksiHtml =
          "<li>Akun Anda akan <b>disuspend</b> dan akses ke layanan kos akan dibatasi.</li>";
        try {
          user.status = "suspend";
          await user.save();
          console.log("Status user setelah save:", user.status);
          console.log(
            `[SUSPEND] User ${user.name} (${user.email}) disuspend karena telat ${diffDays} hari.`
          );
        } catch (err) {
          console.error("Gagal update status user:", err);
        }
      }

      let subject = "Pemberitahuan Keterlambatan Pembayaran Kos";
      let greeting = `Yth. ${user.name},`;
      let body = `
  <p>${greeting}</p>
  <p>
    Kami ingin memberitahukan bahwa pembayaran kos Anda telah <b>terlambat ${diffDays} hari</b> dari tanggal jatuh tempo <b>${dueDate.toLocaleDateString(
        "id-ID"
      )}</b>.
  </p>
  <p>
    Untuk menjaga kelancaran layanan dan menghindari sanksi lebih lanjut, kami mohon agar Anda segera melakukan pembayaran.
  </p>
  <ul>
    ${sanksiHtml}
  </ul>
  <p>
    Jika Anda telah melakukan pembayaran, abaikan email ini.
  </p>
  <br>
  <p>
    Apabila Anda memerlukan bantuan atau memiliki pertanyaan terkait pembayaran, silakan menghubungi tim layanan pelanggan kami.
  </p>
  <br>
  <p>
    Terima kasih atas perhatian dan kerjasama Anda.
  </p>
  <p>
    Hormat kami,<br>
    <b>Manajemen Kos</b>
  </p>
`;

      await sendEmail(user.email, subject, body);
    }
  }
};

cron.schedule("0 7 * * *", sendReminders); // Setiap menit untuk testing, ubah ke "0 7 * * *" untuk produksi
