import nodemailer from "nodemailer";
import "dotenv/config";

// Konfigurasi Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "465"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verifikasi koneksi
transporter.verify((error: Error | null) => {
  if (error) {
    console.error("❌ SMTP Connection Error:", error);
  } else {
    console.log("✅ Server SMTP siap mengirim email");
  }
});

/**
 * Fungsi kirim email umum (Invoice, Notifikasi, dll)
 */
export const sendEmail = async (
  to: string, 
  subject: string, 
  html: string, 
  cc?: string, 
  bcc?: string
) => {
  const mailOptions = {
    from: `"CRM cmlabs" <${process.env.EMAIL_USER}>`,
    to,
    cc,
    bcc,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to} (ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error("❌ Gagal mengirim email:", error);
    throw new Error("Gagal mengirim email.");
  }
};

/**
 * Fungsi kirim email reset password
 */
export const sendResetPasswordEmail = async (email: string, link: string) => {
  const mailOptions = {
    from: `"CRM System Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Permintaan Reset Kata Sandi CRM",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
        <h2 style="color: #000;">Reset Kata Sandi Anda</h2>
        <p>Kami menerima permintaan untuk mereset kata sandi akun Anda.</p>
        <p>Silakan klik tautan di bawah ini (berlaku 1 jam):</p>
        <div style="margin: 25px 0;">
          <a href="${link}"
             style="background-color: #5A4FB5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
             Atur Kata Sandi Baru
          </a>
        </div>
        <p>Jika bukan Anda, abaikan email ini.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Reset email sent to ${email}`);
    return info;
  } catch (error) {
    console.error("❌ Gagal kirim reset password:", error);
    throw error;
  }
};