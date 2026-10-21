import { LoginForm } from "@/components/auth/login-form";

export function LoginView({ returnTo = "/", loginRequired = false }: { returnTo?: string; loginRequired?: boolean }) {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Đăng nhập hệ thống
      </h1>
      <LoginForm loginRequired={loginRequired} returnTo={returnTo} />
    </>
  );
}
