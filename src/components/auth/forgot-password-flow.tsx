"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PasswordField } from "@/components/forms/password-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
  type RequestPasswordResetFormValues,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";
import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
} from "@/services/auth-service";
import { cn } from "@/utils/cn";
import { authPageHref } from "@/utils/auth-redirect";

const VERIFICATION_CODE_LENGTH = 6;
const IS_PASSWORD_RESET_TEMPORARILY_DISABLED = true;

type ForgotPasswordStep = "request-code" | "verify-code" | "reset-password";

export function ForgotPasswordFlow({ returnTo = "/" }: { returnTo?: string }) {
  const router = useRouter();
  const loginHref = authPageHref("/login", returnTo);
  const [step, setStep] = useState<ForgotPasswordStep>("request-code");
  const [identifier, setIdentifier] = useState("");
  const [maskedContact, setMaskedContact] = useState("");
  const [resetToken, setResetToken] = useState("");

  function handleCodeRequested(
    nextIdentifier: string,
    nextMaskedContact: string,
  ) {
    setIdentifier(nextIdentifier);
    setMaskedContact(nextMaskedContact);
    setStep("verify-code");
  }

  function handleCodeVerified(nextResetToken: string) {
    setResetToken(nextResetToken);
    setStep("reset-password");
  }

  function handleResetCompleted() {
    toast.success("Cập nhật mật khẩu thành công. Vui lòng đăng nhập lại.");
    router.replace(loginHref);
  }

  if (step === "verify-code") {
    return (
      <VerifyCodeStep
        identifier={identifier}
        maskedContact={maskedContact}
        onChangeIdentifier={() => setStep("request-code")}
        onVerified={handleCodeVerified}
      />
    );
  }

  if (step === "reset-password") {
    return (
      <ResetPasswordStep
        loginHref={loginHref}
        onCompleted={handleResetCompleted}
        resetToken={resetToken}
      />
    );
  }

  return <RequestCodeStep loginHref={loginHref} onRequested={handleCodeRequested} />;
}

type RequestCodeStepProps = {
  loginHref: string;
  onRequested: (identifier: string, maskedContact: string) => void;
};

function RequestCodeStep({ loginHref, onRequested }: RequestCodeStepProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RequestPasswordResetFormValues>({
    defaultValues: {
      identifier: "",
    },
    resolver: zodResolver(requestPasswordResetSchema),
  });

  async function onSubmit(values: RequestPasswordResetFormValues) {
    if (IS_PASSWORD_RESET_TEMPORARILY_DISABLED) {
      toast.info(
        "Chức năng quên mật khẩu đang trong quá trình hoàn thiện. Vui lòng liên hệ hỗ trợ nếu cần đặt lại mật khẩu.",
      );
      return;
    }

    try {
      const response = await requestPasswordReset({
        identifier: values.identifier,
      });

      toast.success("Đã gửi mã xác thực. Mã mock hiện tại là 123456.");
      onRequested(values.identifier, response.maskedContact);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể gửi mã xác thực. Vui lòng thử lại.",
      );
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">
        Quên mật khẩu
      </h1>
      {/* <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Nhập email hoặc số điện thoại đã đăng ký để nhận mã xác thực đặt lại mật
        khẩu.
      </p> */}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          autoComplete="email"
          error={errors.identifier?.message}
          id="identifier"
          label="Email / Số điện thoại"
          leftIcon={<UserRound size={18} />}
          placeholder="Nhập email hoặc số điện thoại"
          {...register("identifier")}
        />

        <Button
          className="h-12 w-full uppercase"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Đang gửi..." : "Gửi mã xác thực"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm font-semibold text-muted-foreground">
        Quay lại{" "}
        <Link className="text-primary hover:opacity-80" href={loginHref}>
          đăng nhập
        </Link>
      </p>
    </>
  );
}

type VerifyCodeStepProps = {
  identifier: string;
  maskedContact: string;
  onChangeIdentifier: () => void;
  onVerified: (resetToken: string) => void;
};

function VerifyCodeStep({
  identifier,
  maskedContact,
  onChangeIdentifier,
  onVerified,
}: VerifyCodeStepProps) {
  const [code, setCode] = useState<string[]>(
    Array.from({ length: VERIFICATION_CODE_LENGTH }, () => ""),
  );
  const [error, setError] = useState("");
  const [expiresInSeconds, setExpiresInSeconds] = useState(120);
  const [resendInSeconds, setResendInSeconds] = useState(45);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const codeValue = code.join("");

  useEffect(() => {
    const timerId = globalThis.setInterval(() => {
      setExpiresInSeconds((currentValue) => Math.max(currentValue - 1, 0));
      setResendInSeconds((currentValue) => Math.max(currentValue - 1, 0));
    }, 1000);

    return () => globalThis.clearInterval(timerId);
  }, []);

  async function handleSubmit() {
    setError("");

    if (codeValue.length < VERIFICATION_CODE_LENGTH) {
      setError("Vui lòng nhập đủ mã xác thực.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await verifyPasswordResetCode({
        code: codeValue,
        identifier,
      });
      onVerified(response.resetToken);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể xác thực mã. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    setIsResending(true);
    setError("");

    try {
      await requestPasswordReset({ identifier });
      setExpiresInSeconds(120);
      setResendInSeconds(45);
      setCode(Array.from({ length: VERIFICATION_CODE_LENGTH }, () => ""));
      inputRefs.current[0]?.focus();
      toast.success("Đã gửi lại mã xác thực. Mã mock hiện tại là 123456.");
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Không thể gửi lại mã xác thực.",
      );
    } finally {
      setIsResending(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const nextCode = [...code];
    nextCode[index] = nextValue;
    setCode(nextCode);
    setError("");

    if (nextValue && index < VERIFICATION_CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const pastedCode = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, VERIFICATION_CODE_LENGTH)
      .split("");

    if (!pastedCode.length) {
      return;
    }

    const nextCode = Array.from(
      { length: VERIFICATION_CODE_LENGTH },
      (_, index) => pastedCode[index] ?? "",
    );
    setCode(nextCode);
    setError("");
    inputRefs.current[
      Math.min(pastedCode.length, VERIFICATION_CODE_LENGTH) - 1
    ]?.focus();
  }

  return (
    <>
      <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">
        Xác thực mã
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Nhập mã xác thực đã được gửi đến thông tin liên hệ của bạn.
      </p>

      <div className="mt-8 flex items-center gap-3 rounded-lg bg-[#EEF3F9] p-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded bg-background text-blue-600">
          <Mail size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">
            Mã xác thực đã được gửi đến
          </p>
          <p className="truncate text-sm font-bold text-foreground">
            {maskedContact}
          </p>
        </div>
        <button
          className="shrink-0 cursor-pointer text-sm font-bold text-primary hover:opacity-80"
          onClick={onChangeIdentifier}
          type="button"
        >
          Thay đổi
        </button>
      </div>

      <div className="mt-8">
        <label className="block text-xs font-semibold uppercase text-foreground">
          Nhập mã xác thực
        </label>
        <div className="mt-3 grid grid-cols-6 gap-2 sm:gap-3">
          {code.map((digit, index) => (
            <input
              aria-label={`Ký tự mã xác thực ${index + 1}`}
              className={cn(
                "h-14 rounded-lg border border-input bg-background text-center text-2xl font-semibold text-foreground outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:h-16",
                error ? "border-error" : undefined,
              )}
              inputMode="numeric"
              key={index}
              maxLength={1}
              onChange={(event) => handleCodeChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              value={digit}
            />
          ))}
        </div>
        {error ? (
          <p className="mt-2 text-xs font-medium text-error">{error}</p>
        ) : null}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Mã xác thực còn hiệu lực trong{" "}
        <span className="font-bold text-primary">
          {formatDuration(expiresInSeconds)}
        </span>
      </p>

      <Button
        className="mt-8 h-12 w-full uppercase"
        disabled={isSubmitting || codeValue.length < VERIFICATION_CODE_LENGTH}
        onClick={handleSubmit}
        type="button"
      >
        {isSubmitting ? "Đang xác nhận..." : "Xác nhận"}
      </Button>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Chưa nhận được mã?{" "}
        <button
          className="cursor-pointer font-semibold text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
          disabled={resendInSeconds > 0 || isResending}
          onClick={handleResendCode}
          type="button"
        >
          {resendInSeconds > 0
            ? `Gửi lại mã sau ${resendInSeconds} giây`
            : isResending
              ? "Đang gửi..."
              : "Gửi lại mã"}
        </button>
      </p>

      <button
        className="mx-auto mt-8 flex cursor-pointer items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"
        onClick={onChangeIdentifier}
        type="button"
      >
        <ArrowLeft size={16} />
        Thay đổi email / số điện thoại
      </button>
    </>
  );
}

type ResetPasswordStepProps = {
  loginHref: string;
  onCompleted: () => void;
  resetToken: string;
};

function ResetPasswordStep({
  loginHref,
  onCompleted,
  resetToken,
}: ResetPasswordStepProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      confirmPassword: "",
      password: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    try {
      await resetPassword({
        confirmPassword: values.confirmPassword,
        password: values.password,
        resetToken,
      });
      onCompleted();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật mật khẩu. Vui lòng thử lại.",
      );
    }
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl">
          Đặt mật khẩu mới
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          Vui lòng tạo mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <PasswordField
          autoComplete="new-password"
          error={errors.password?.message}
          id="newPassword"
          label="Mật khẩu mới"
          leftIcon={<LockKeyhole size={18} />}
          placeholder="Nhập mật khẩu mới"
          {...register("password")}
        />

        <div>
          <PasswordField
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            id="confirmNewPassword"
            label="Xác nhận mật khẩu mới"
            leftIcon={<LockKeyhole size={18} />}
            placeholder="Nhập lại mật khẩu mới"
            {...register("confirmPassword")}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ và số.
          </p>
        </div>

        <Button
          className="h-12 w-full uppercase"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </Button>
      </form>

      <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <Link
          className="font-semibold transition-colors hover:text-primary"
          href={loginHref}
        >
          Quay lại <span className="text-primary">đăng nhập</span>
        </Link>
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}
