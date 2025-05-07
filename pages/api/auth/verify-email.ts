import { NextApiRequest, NextApiResponse } from "next";
import User from "../../../src/models/user";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Mã xác thực không hợp lệ" });
  }

  try {
    // Tìm người dùng với token xác thực
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Không tìm thấy người dùng với mã xác thực này" });
    }

    // Cập nhật trạng thái xác thực và xóa token
    user.isVerified = true;
    user.verificationToken = null; // Xóa token sau khi xác thực thành công
    await user.save();

    // Chuyển hướng đến trang login sau khi xác thực thành công
    return res.redirect(302, "/login");  // HTTP Redirect

  } catch (error) {
    console.error("Lỗi xác thực:", error);
    return res.status(500).json({ message: "Có lỗi xảy ra trong quá trình xác thực" });
  }
}
