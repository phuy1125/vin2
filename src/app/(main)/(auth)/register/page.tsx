"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RegisterFormSchema } from "@lib/rules"; // Import Zod schema

export default function Register() {
  const [username, setUsername] = useState<string>(""); // NEW
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    // Xác thực form bằng Zod
    const formData = { username, email, password, confirmPassword };
    const result = RegisterFormSchema.safeParse(formData);

    if (!result.success) {
      // Hiển thị lỗi xác thực
      const errorMessages = result.error.errors.map((err) => err.message).join(", ");
      setError(errorMessages);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
      } else {
        setSuccess(true);
        console.log("User registered successfully:", data);
        router.push("/login");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center sm:h-screen p-4">
      <div className="max-w-md w-full mx-auto border-4 border-slate-300 rounded-2xl p-8">
        <div className="text-center mb-8">
          <Image
            src="/img/Logo_merus.png"
            alt="Logo"
            width={160}
            height={40}
            className="w-40 inline-block"
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {error && (
              <div className="text-red-500 text-center mb-4">{error}</div>
            )}
            {success && (
              <div className="text-green-600 text-center mb-4">
                Đăng ký thành công!
              </div>
            )}

            <div>
              <label className="text-slate-800 text-sm font-medium mb-2 block">
                Tên người dùng
              </label>
              <input
                name="username"
                type="text"
                className="text-slate-800 bg-white border border-slate-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                placeholder="Nhập tên người dùng"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-slate-800 text-sm font-medium mb-2 block">
                Email
              </label>
              <input
                name="email"
                type="email"
                className="text-slate-800 bg-white border border-slate-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-slate-800 text-sm font-medium mb-2 block">
                Mật khẩu
              </label>
              <input
                name="password"
                type="password"
                className="text-slate-800 bg-white border border-slate-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-slate-800 text-sm font-medium mb-2 block">
                Xác nhận mật khẩu
              </label>
              <input
                name="cpassword"
                type="password"
                className="text-slate-800 bg-white border border-slate-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 shrink-0 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              />
              <label
                htmlFor="remember-me"
                className="text-slate-800 ml-3 block text-sm"
              >
                Tôi đồng ý với{" "}
                <a
                  href="javascript:void(0);"
                  className="text-blue-600 font-medium hover:underline ml-1"
                >
                  Điều khoản và Điều kiện
                </a>
              </label>
            </div>
          </div>

          <div className="mt-12">
            <button
              type="submit"
              disabled={loading || !isChecked}
              className="w-full py-3 px-4 text-sm tracking-wider font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              {loading ? "Đang xử lý..." : "Tạo tài khoản"}
            </button>
          </div>

          <p className="text-slate-800 text-sm mt-6 text-center">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="text-blue-600 font-medium hover:underline ml-1"
            >
              Đăng nhập tại đây
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
