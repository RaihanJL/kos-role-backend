import nodemailer from "nodemailer"; // Tambahkan ini!

export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Aplikasi Kos" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
};
