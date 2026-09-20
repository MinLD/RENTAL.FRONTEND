import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export function RegisterView() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <AuthCard className="max-w-[520px]">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">
          Đăng ký
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tạo tài khoản để thuê thiết bị hoặc đăng bán thiết bị trên DPRENTAL.
        </p>

        <RegisterForm />
      </AuthCard>
    </div>
  );
}
