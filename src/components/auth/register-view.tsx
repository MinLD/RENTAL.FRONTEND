import { RegisterForm } from "@/components/auth/register-form";

export function RegisterView({ returnTo = "/" }: { returnTo?: string }) {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Đăng ký
      </h1>
      <RegisterForm returnTo={returnTo} />
    </>
  );
}
