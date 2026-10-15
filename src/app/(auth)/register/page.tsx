import { RegisterView } from "@/components/auth/register-view";
import { getAuthPageOptions, type AuthSearchParams } from "@/utils/auth-redirect";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<AuthSearchParams> }) {
  const { returnTo } = getAuthPageOptions(await searchParams);
  return <RegisterView returnTo={returnTo} />;
}
