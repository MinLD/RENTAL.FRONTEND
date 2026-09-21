import { LoginForm } from "@/components/auth/login-form";

export function LoginView() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Đăng nhập hệ thống
      </h1>
      {/* <p className="mt-2 text-sm text-muted-foreground">
        Đăng nhập để tiếp tục quản lý tài khoản DPRENTAL.
      </p> */}

      <LoginForm />
    </>
  );
}
