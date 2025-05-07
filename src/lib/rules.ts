import { z } from "zod";

// Schema xác thực form đăng ký
export const RegisterFormSchema = z
  .object({
    email: z.string().email({ message: "Vui lòng nhập một email hợp lệ." }).trim(),
    password: z
      .string()
      .min(1, { message: "Không được để trống" })
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
      .regex(/[a-zA-Z]/, { message: "Mật khẩu phải chứa ít nhất một chữ cái." })
      .regex(/[0-9]/, { message: "Mật khẩu phải chứa ít nhất một số." })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Mật khẩu phải chứa ít nhất một ký tự đặc biệt.",
      })
      .trim(),
    confirmPassword: z.string().trim(),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mật khẩu và xác nhận mật khẩu không khớp.",
        path: ["confirmPassword"],
      });
    }
  });

// Type tương ứng với dữ liệu hợp lệ sau khi validate
export type RegisterFormFields = z.infer<typeof RegisterFormSchema>;
