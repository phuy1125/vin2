import type { NextApiRequest, NextApiResponse } from "next";
import connectDb from "../../../src/lib/mongoose";
import User from "../../../src/models/user";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";

type SuccessResponse = {
  message: string;
  userId: string;
};

type ErrorResponse = {
  message: string;
  error?: unknown;
};

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail", // Hoặc bạn có thể sử dụng dịch vụ SMTP khác
  auth: {
    user: process.env.EMAIL_USER, // Đặt email của bạn ở đây
    pass: process.env.EMAIL_PASS, // Đặt mật khẩu hoặc app password
  },
});

const sendVerificationEmail = async (email: string, token: string) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000"; // fallback nếu không có BASE_URL
  const verificationLink = `${baseUrl}/api/auth/verify-email?token=${token}`;

  // Email HTML với CSS Inline
  const htmlContent = `
    <div style="background-color:#f4f8ff;padding:40px 0;font-family:Arial,sans-serif;">
      <div style="max-width:500px;margin:0 auto;background:#ffffff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
        <h2 style="color:#1e3a8a;font-size:24px;margin-bottom:16px">Chào mừng đến với VintelliTour!</h2>
        <p style="color:#334155;font-size:16px;margin-bottom:32px">
          Vui lòng nhấn nút bên dưới để xác thực tài khoản của bạn và bắt đầu hành trình du lịch tuyệt vời cùng chúng tôi.
        </p>
        <a href="${verificationLink}" 
          style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;
          text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold">
          Xác thực tài khoản
        </a>
      </div>
      <p style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px">
        © 2025 VintelliTour. Mọi quyền được bảo lưu.
      </p>
    </div>
  `;


  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Xác thực tài khoản của bạn",
    text: `Nhấn vào liên kết để xác thực tài khoản của bạn: ${verificationLink}`,
    html: htmlContent, // Include the HTML content here
  };

  await transporter.sendMail(mailOptions);
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Chỉ chấp nhận yêu cầu POST" });
  }

  const { username, email, password, confirmPassword } = req.body as {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  };

  // Kiểm tra nếu tên người dùng trống
  if (!username || username.trim() === "") {
    return res
      .status(400)
      .json({ message: "Tên người dùng không được để trống" });
  }

  // Kiểm tra nếu mật khẩu không khớp
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Mật khẩu không khớp" });
  }

  try {
    // Kết nối với cơ sở dữ liệu
    await connectDb();

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email này đã được đăng ký, vui lòng chọn email khác" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo mã xác thực (token)
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Tạo người dùng mới
    const newUser = await new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false,  // Người dùng mới chưa xác thực
      verificationToken,  // Gắn mã xác thực
    }).save();

    // Gửi email xác thực
    await sendVerificationEmail(newUser.email, verificationToken);

    // Trả về thông báo thành công và ID người dùng mới
    return res.status(201).json({
      message: "Đăng ký thành công, vui lòng kiểm tra email để xác thực tài khoản",
      userId: newUser._id.toString(),
    });
  } catch (error) {
    // Log lỗi và trả về lỗi 500
    console.error("Lỗi đăng ký:", error);
    return res.status(500).json({ message: "Có lỗi xảy ra", error });
  }
}
