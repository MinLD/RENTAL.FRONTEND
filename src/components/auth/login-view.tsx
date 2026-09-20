import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export function LoginView() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <AuthCard>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">
          Đăng nhập
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đăng nhập để tiếp tục sử dụng DPRENTAL.
        </p>

        <LoginForm />
      </AuthCard>
    </div>
  );
}
