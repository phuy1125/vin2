import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import connectDb from "../../../src/lib/mongoose";
import User from "../../../src/models/user";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Chỉ chấp nhận POST" });

  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Thiếu token hoặc mật khẩu" });
  }

  try {
    await connectDb();

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "Mật khẩu mới không được trùng mật khẩu cũ." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.verificationToken = null;
    await user.save();

    return res.status(200).json({ message: "Đặt lại mật khẩu thành công. Hãy đăng nhập lại." });
  } catch (error) {
    console.error("Lỗi reset password:", error);
    return res.status(500).json({ message: "Có lỗi xảy ra, vui lòng thử lại sau." });
  }
}
