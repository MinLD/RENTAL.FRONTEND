import { RegisterForm } from "@/components/auth/register-form";

export function RegisterView({ returnTo = "/" }: { returnTo?: string }) {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Đăng ký
      </h1>
      {/* <p className="mt-2 text-sm text-muted-foreground">
        Tạo tài khoản để thuê thiết bị hoặc đăng bán thiết bị trên DPRENTAL.
      </p> */}

      <RegisterForm returnTo={returnTo} />
    </>
  );
}
