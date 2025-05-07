import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../../../src/models/user";
import connectDb from "../../../src/lib/mongoose";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Chỉ chấp nhận POST" });

  const { email } = req.body;
  await connectDb();

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Email không tồn tại trong hệ thống" });

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.verificationToken = resetToken;
  await user.save();

  const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const htmlContent = `
    <div style="background-color:#f4f8ff;padding:40px 0;font-family:Arial,sans-serif;">
        <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
        <h2 style="color:#1e3a8a;font-size:24px;margin-bottom:16px">Khôi phục mật khẩu của bạn</h2>
        <p style="color:#334155;font-size:16px;margin-bottom:32px">
            Bạn đã yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để tiếp tục.
        </p>
        <a href="${resetLink}" 
            style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#fff;
            text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold">
            Đặt lại mật khẩu
        </a>
        <p style="color:#64748b;font-size:14px;margin-top:32px">
            Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
        </p>
        </div>
        <p style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px">
        © 2025 VintelliTour. All rights reserved.
        </p>
    </div>
    `;


  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Đặt lại mật khẩu - VintelliTour",
    html: htmlContent,
  });

  return res.status(200).json({ message: "Liên kết đặt lại mật khẩu đã được gửi vào email của bạn." });
}
