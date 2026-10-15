import { LoginView } from "@/components/auth/login-view";
import { getAuthPageOptions, type AuthSearchParams } from "@/utils/auth-redirect";

export default async function LoginPage({ searchParams }: { searchParams: Promise<AuthSearchParams> }) {
  return <LoginView {...getAuthPageOptions(await searchParams)} />;
}
