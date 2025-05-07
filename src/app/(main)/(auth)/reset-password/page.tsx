"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RegisterFormSchema } from "@lib/rules";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false); // Thêm trạng thái để phân biệt

  useEffect(() => {
    const t = searchParams?.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = RegisterFormSchema.safeParse({
      email: "dummy@example.com", // chỉ để pass qua validate
      password,
      confirmPassword,
    });

    if (!result.success) {
      const errorMessages = result.error.errors.map((e) => e.message).join(", ");
      setMessage(errorMessages);
      setIsSuccess(false);
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setMessage(data.message);
    setIsSuccess(res.ok); // ✅ Phân biệt thành công hay lỗi

    if (res.ok) {
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Đặt lại mật khẩu</h2>
      <form onSubmit={handleReset} className="space-y-4">
        <input
          type="password"
          placeholder="Mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          Đổi mật khẩu
        </button>
      </form>

      {message && (
        <p className={`mt-4 text-center ${isSuccess ? "text-green-600" : "text-red-500"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
