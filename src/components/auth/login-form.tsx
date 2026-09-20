"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { PasswordField } from "@/components/forms/password-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { login } from "@/services/auth-service";

export function LoginForm() {
  const router = useRouter();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values);
      toast.success("Đăng nhập thành công.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể đăng nhập. Vui lòng thử lại.",
      );
    }
  }

  return (
    <form className="mt-5 space-y-3.5" onSubmit={handleSubmit(onSubmit)}>
      <TextField
        autoComplete="email"
        error={errors.email?.message}
        id="email"
        label="Email"
        leftIcon={<Mail size={16} />}
        placeholder="Nhập email"
        type="email"
        {...register("email")}
      />

      <PasswordField
        autoComplete="current-password"
        error={errors.password?.message}
        id="password"
        label="Mật khẩu"
        leftIcon={<LockKeyhole size={16} />}
        placeholder="Nhập mật khẩu"
        {...register("password")}
      />

      <div className="flex items-center justify-between gap-4">
        <Controller
          control={control}
          name="rememberMe"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={field.value}
                name={field.name}
                onBlur={field.onBlur}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                ref={field.ref}
              />
              Ghi nhớ đăng nhập
            </label>
          )}
        />

        <Link
          className="text-xs font-semibold text-primary transition-opacity hover:opacity-80"
          href="/forgot-password"
        >
          Quên mật khẩu?
        </Link>
      </div>

      <Button
        className="w-full uppercase"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link
          className="font-semibold text-foreground transition-colors hover:text-primary"
          href="/register"
        >
          Đăng ký ngay
        </Link>
      </p>

      <div className="flex items-center gap-4 text-xs uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        Hoặc
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button className="w-full uppercase" type="button" variant="secondary">
        <Image
          alt=""
          aria-hidden="true"
          height={16}
          src="/icons/google-logo.5462b711.svg"
          width={16}
        />
        Google
      </Button>
    </form>
  );
}
