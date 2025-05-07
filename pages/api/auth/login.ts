import type { NextApiRequest, NextApiResponse } from "next";
import connectDb from "../../../src/lib/mongoose";
import User from "../../../src/models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { serialize } from "cookie";
type SuccessResponse = {
  message: string;
  token: string;
  userId: string; 
};

type ErrorResponse = {
  message: string;
  error?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Chỉ chấp nhận yêu cầu POST" });
  }

  const { email, password } = req.body as {
    email: string;
    password: string;
  };

  try {
    await connectDb();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ" });
    }

    // Kiểm tra xem người dùng đã xác thực chưa
    if (!user.isVerified) {
      return res.status(400).json({ message: "Tài khoản chưa được xác thực. Vui lòng kiểm tra email của bạn." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ" });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET không được định nghĩa trong biến môi trường");
    }
     // Ép kiểu user._id thành string (dùng toString())
    const userId = (user._id as ObjectId).toString();
    const token = jwt.sign({ userId, email: user.email, name:user.username }, secret, { expiresIn: "1h" });
// Lưu token vào cookie
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 60 * 60 * 1000, // 1 giờ
  path: "/",
};

// Serialize cookie
const tokenCookie = serialize("auth_token", token, cookieOptions);

// Đặt cookie trong response header
res.setHeader("Set-Cookie", tokenCookie);
    return res.status(200).json({ message: "Login successful", token, userId });

  } catch (error) {
    if (error instanceof Error) {
      console.error("Lỗi đăng nhập:", error.message);
      return res.status(500).json({ message: "Có lỗi xảy ra", error: error.message });
    }
  
    console.error("Lỗi không xác định:", error);
    return res.status(500).json({ message: "Có lỗi xảy ra", error });
  }
}
