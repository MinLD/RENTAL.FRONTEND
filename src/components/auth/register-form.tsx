"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { PasswordField } from "@/components/forms/password-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FULL_NAME_MAX_LENGTH } from "@/config/profile";
import { useFirebaseGoogleLogin } from "@/hooks/use-firebase-google-login";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validations/auth";
import { register as registerAccount } from "@/services/auth-service";

export function RegisterForm() {
  const router = useRouter();
  const { handleFirebaseGoogleLogin, isSigningInWithGoogle } =
    useFirebaseGoogleLogin();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      acceptTerms: false,
      accountType: "customer",
      confirmPassword: "",
      email: "",
      name: "",
      password: "",
    },
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterFormValues) {
    try {
      await registerAccount(values);
      toast.success("Đăng ký tài khoản thành công. Vui lòng đăng nhập.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể đăng ký. Vui lòng thử lại.",
      );
    }
  }

  return (
    <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {errors.accountType?.message ? (
        <p className="text-xs font-medium text-error">
          {errors.accountType.message}
        </p>
      ) : null}

      <TextField
        autoComplete="name"
        error={errors.name?.message}
        id="name"
        label="Họ và tên / Tên doanh nghiệp"
        leftIcon={<UserRound size={16} />}
        maxLength={FULL_NAME_MAX_LENGTH}
        placeholder="Nhập họ và tên hoặc tên doanh nghiệp"
        {...register("name")}
      />

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
        autoComplete="new-password"
        error={errors.password?.message}
        id="password"
        label="Mật khẩu"
        leftIcon={<LockKeyhole size={16} />}
        placeholder="Nhập mật khẩu"
        {...register("password")}
      />

      <PasswordField
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        id="confirmPassword"
        label="Xác nhận mật khẩu"
        leftIcon={<LockKeyhole size={16} />}
        placeholder="Nhập lại mật khẩu"
        {...register("confirmPassword")}
      />

      <Controller
        control={control}
        name="acceptTerms"
        render={({ field }) => (
          <div className="space-y-1">
            <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-muted-foreground">
              <Checkbox
                checked={field.value}
                className="mt-0.5"
                name={field.name}
                onBlur={field.onBlur}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                ref={field.ref}
              />
              <span>
                Tôi đồng ý với{" "}
                <Link
                  className="font-semibold text-primary transition-opacity hover:opacity-80"
                  href="/terms"
                >
                  Điều khoản sử dụng
                </Link>{" "}
                và{" "}
                <Link
                  className="font-semibold text-primary transition-opacity hover:opacity-80"
                  href="/privacy"
                >
                  Chính sách bảo mật
                </Link>{" "}
                của DPRENTAL.
              </span>
            </label>
            {errors.acceptTerms?.message ? (
              <p className="text-xs font-medium text-error">
                {errors.acceptTerms.message}
              </p>
            ) : null}
          </div>
        )}
      />

      <Button
        className="w-full uppercase"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link
          className="font-semibold text-foreground transition-colors hover:text-primary"
          href="/login"
        >
          Đăng nhập ngay
        </Link>
      </p>

      <div className="flex items-center gap-4 text-xs uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        Hoặc
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        className="w-full cursor-pointer uppercase hover:bg-primary/5"
        disabled={isSubmitting || isSigningInWithGoogle}
        onClick={() => {
          void handleFirebaseGoogleLogin();
        }}
        type="button"
        variant="secondary"
      >
        <Image
          alt=""
          aria-hidden="true"
          height={16}
          src="/icons/google-logo.5462b711.svg"
          width={16}
        />
        {isSigningInWithGoogle ? "Đang đăng nhập Google..." : "Google"}
      </Button>
    </form>
  );
}
