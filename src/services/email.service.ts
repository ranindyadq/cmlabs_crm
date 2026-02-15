import nodemailer from "nodemailer";
import "dotenv/config";
import path from "path";

// Flag untuk cek apakah email sudah dikonfigurasi
const isEmailConfigured = () => {
  return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

// Lazy transporter - hanya dibuat saat pertama kali dibutuhkan
let transporter: nodemailer.Transporter | null = null;
let isVerified = false;

const getTransporter = () => {
  if (!transporter) {
    if (!isEmailConfigured()) {
      console.warn("⚠️ Email not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env");
      return null;
    }

    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "465"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify async (tidak blocking)
    if (!isVerified) {
      transporter.verify()
        .then(() => {
          isVerified = true;
          console.log("✅ Server SMTP siap mengirim email");
        })
        .catch((error) => {
          console.error("❌ SMTP Connection Error:", error.message);
        });
    }
  }
  return transporter;
};

/**
 * Fungsi kirim email umum (Invoice, Notifikasi, dll)
 */
export const sendEmail = async (
  to: string, 
  subject: string, 
  html: string, 
  cc?: string, 
  bcc?: string,
  attachmentUrl?: string | null
) => {
  const mailOptions: any = {
    from: `"CRM cmlabs" <${process.env.EMAIL_USER}>`,
    to,
    cc,
    bcc,
    subject,
    html,
  };

  // Logika Optional: Hanya masukkan properti jika nilainya ada
  if (cc) mailOptions.cc = cc;
  if (bcc) mailOptions.bcc = bcc;

  // LOGIKA ATTACHMENT
  if (attachmentUrl) {
    let filePath;

    // Cek apakah ini URL eksternal (http) atau file lokal (/uploads/...)
    if (attachmentUrl.startsWith("http")) {
        filePath = attachmentUrl; // Gunakan URL langsung
    } else {
        // Jika file lokal di folder public, kita butuh Full Path Harddisk
        // Contoh: C:/Users/Ranindya/cmlabs-crm/public/uploads/gambar.jpg
        filePath = path.join(process.cwd(), "public", attachmentUrl);
    }

    mailOptions.attachments = [
      {
        path: filePath // Nodemailer akan mengambil file dari path ini
      }
    ];
  }

  try {
    const emailTransporter = getTransporter();
    if (!emailTransporter) {
      throw new Error("Email service not configured");
    }
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to} (ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw new Error("Failed to send email.");
  }
};

/**
 * Function to send reset password email
 */
export const sendResetPasswordEmail = async (email: string, link: string) => {
  const mailOptions = {
    from: `"CRM System Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "CRM Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
        <h2 style="color: #000;">Reset Your Password</h2>
        <p>We received a request to reset your account password.</p>
        <p>Please click the link below (valid for 1 hour):</p>
        <div style="margin: 25px 0;">
          <a href="${link}"
             style="background-color: #5A4FB5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
             Set New Password
          </a>
        </div>
        <p>If this wasn't you, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const emailTransporter = getTransporter();
    if (!emailTransporter) {
      throw new Error("Email service not configured");
    }
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Reset email sent to ${email}`);
    return info;
  } catch (error) {
    console.error("❌ Failed to send reset password email:", error);
    throw error;
  }
};