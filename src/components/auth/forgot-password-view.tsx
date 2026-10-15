import { ForgotPasswordFlow } from "@/components/auth/forgot-password-flow";

export function ForgotPasswordView({ returnTo = "/" }: { returnTo?: string }) {
  return <ForgotPasswordFlow returnTo={returnTo} />;
}
