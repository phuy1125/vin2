import { authMiddleware } from "./src/middleware/authMiddleware";

export default authMiddleware;

// Cấu hình middleware chỉ chạy cho các đường dẫn cụ thể (tùy chọn)
export const config = {
  matcher: [
	// "/share-space",
  "/schedules/:path*",
  "/admin/:path*",
  "/admin"
    // "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};