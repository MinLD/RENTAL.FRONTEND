import type { ReactNode } from "react";

type AuthLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <main className="flex min-h-screen flex-col">{children}</main>;
}
