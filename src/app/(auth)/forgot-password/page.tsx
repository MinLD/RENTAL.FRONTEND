import { ForgotPasswordView } from "@/components/auth/forgot-password-view";
import { getAuthPageOptions, type AuthSearchParams } from "@/utils/auth-redirect";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<AuthSearchParams> }) {
  const { returnTo } = getAuthPageOptions(await searchParams);
  return <ForgotPasswordView returnTo={returnTo} />;
}
